import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'
import admin from 'firebase-admin'

// POST /api/notifications/broadcast-channel - Use dedicated broadcast channel
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (bypass auth for scheduled notifications)
    const cronSecret = request.headers.get('x-cron-secret')
    const isCronJob = cronSecret === process.env.CRON_SECRET

    // Use admin client for database operations (works for both cron and user requests)
    const supabase = createAdminClient()
    
    let user: any = null
    let profile: any = null
    
    if (!isCronJob) {
      // Normal user authentication
      const cookieStore = cookies()
      const userSupabase = createClient(cookieStore)
      
      const { data: { user: authUser }, error: authError } = await userSupabase.auth.getUser()
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      user = authUser

      // Check if user is coordinator/admin
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (profileError || !userProfile || !['coordinator', 'admin'].includes(userProfile.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      
      profile = userProfile
    }

    const body = await request.json()
    const { title, message, target_audience } = body

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message' 
      }, { status: 400 })
    }

    // Map frontend values to database values
    const audienceMap: Record<string, string> = {
      'all': 'both',
      'students': 'student',
      'coaches': 'coach'
    }
    const dbTargetAudience = audienceMap[target_audience] || target_audience

    // Initialize Stream Chat
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )

    // Get target users (use mapped value for database query)
    let query = supabase.from('user_profiles').select('id, full_name, email, role')
    
    if (dbTargetAudience === 'student') {
      query = query.eq('role', 'student')
    } else if (dbTargetAudience === 'coach') {
      query = query.eq('role', 'coach')
    } else {
      query = query.in('role', ['student', 'coach'])
    }

    const { data: users, error: usersError } = await query

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    // 🧪 TEST MODE: Only send to Ozan and Ensar during development
    const TEST_MODE = true
    const TEST_EMAILS = ['ozan@yasam.com', 'ensar@yasam.com']
    
    let filteredUsers = users
    if (TEST_MODE) {
      filteredUsers = users.filter(u => TEST_EMAILS.includes(u.email || ''))
      console.log(`🧪 TEST MODE: Filtered ${users.length} users to ${filteredUsers.length} test users`)
    }

    if (filteredUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No test users found',
        message: 'Test mode is enabled. Only Ozan and Ensar will receive notifications.'
      }, { status: 400 })
    }

    console.log(`📢 Broadcasting to ${filteredUsers.length} users (${target_audience})${TEST_MODE ? ' [TEST MODE]' : ''}`)

    // Upsert all users in Stream (without role field - Stream doesn't support custom roles)
    const streamUsers = filteredUsers.map(u => ({
      id: u.id,
      name: u.full_name
    }))

    // Add sender to Stream users if not cron job
    const allStreamUsers = isCronJob 
      ? streamUsers 
      : [{ id: user?.id || 'system', name: profile?.full_name || 'Koordinatör' }, ...streamUsers]
    
    await serverClient.upsertUsers(allStreamUsers)

    // Create or get broadcast channel for this audience
    const channelId = `broadcast_${target_audience}_${Date.now()}`
    const memberIds = isCronJob 
      ? filteredUsers.map(u => u.id)
      : [user?.id || 'system', ...filteredUsers.map(u => u.id)]

    const channel = serverClient.channel('messaging', channelId, {
      name: `📢 Koordinatör Bildirimi - ${target_audience === 'student' ? 'Öğrenciler' : target_audience === 'coach' ? 'Koçlar' : 'Herkes'}`,
      members: memberIds,
      created_by_id: user.id,
      // Disable replies to keep it announcement-only
      disabled: false,
      // Custom data
      broadcast: true,
      notification_type: 'coordinator_announcement'
    })

    await channel.create()

    // Send broadcast message
    const messageResult = await channel.sendMessage({
      text: `🔔 **${title}**\n\n${message}\n\n_Koordinatör: ${profile.full_name}_`,
      user_id: user.id,
      custom: {
        notification_type: 'coordinator_announcement',
        title: title,
        priority: 'high',
        is_broadcast: true
      }
    })

    console.log(`✅ Broadcast message sent: ${messageResult.message.id}`)

    // Send REAL push notifications using FCM Admin SDK
    let pushSuccessCount = 0
    let pushFailureCount = 0

    // Initialize Firebase Admin
    let firebaseAdmin: typeof admin | null = null
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.GOOGLE_SERVICES_JSON
      if (serviceAccount) {
        try {
          const serviceAccountKey = JSON.parse(serviceAccount)
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
          })
          firebaseAdmin = admin
        } catch (error) {
          console.error('❌ Error initializing Firebase Admin:', error)
        }
      }
    } else {
      firebaseAdmin = admin
    }

    if (firebaseAdmin) {
      // Use admin client to bypass RLS for reading tokens
      const adminSupabase = createAdminClient()
      
      for (const targetUser of filteredUsers) {
        try {
          console.log(`🔍 Looking for tokens for user: ${targetUser.full_name} (${targetUser.id})`)
          
          // Get user's tokens using admin client (bypasses RLS)
          // Support both Android (FCM) and iOS (APNs)
          const { data: tokens, error: tokenError } = await adminSupabase
            .from('notification_tokens')
            .select('*')
            .eq('user_id', targetUser.id)
            .eq('is_active', true)
            .in('platform', ['android', 'ios'])

          if (tokenError) {
            console.error(`❌ Error fetching tokens for ${targetUser.full_name}:`, tokenError)
            pushFailureCount++
            continue
          }

          if (!tokens || tokens.length === 0) {
            console.log(`⚠️ No active mobile tokens for ${targetUser.full_name} (${targetUser.id})`)
            pushFailureCount++
            continue
          }

          console.log(`✅ Found ${tokens.length} token(s) for ${targetUser.full_name}`)

          // Send to each token
          for (const tokenRecord of tokens) {
            try {
              // Handle APNs tokens (iOS) separately
              if (tokenRecord.token_type === 'apns') {
                console.log(`📱 Sending APNs notification to ${targetUser.full_name}`)
                
                // Import APNs function from video invite service
                const { sendAPNSNotification } = await import('@/lib/notifications/video-invite-service')
                
                const apnsResult = await sendAPNSNotification(
                  tokenRecord.token,
                  `🔔 ${title}`,
                  message,
                  {
                    notification_type: 'coordinator_announcement',
                    title: title,
                    message: message,
                    sender_id: user.id,
                    channel_id: channelId,
                  }
                )
                
                if (apnsResult.success) {
                  pushSuccessCount++
                  console.log(`✅ APNs push sent to ${targetUser.full_name}`)
                } else {
                  pushFailureCount++
                  console.error(`❌ APNs push failed for ${targetUser.full_name}:`, apnsResult.error)
                }
                continue
              }

              // Use data-only approach like video invite (app handles notification display)
              const fcmMessage = {
                token: tokenRecord.token,
                data: {
                  type: 'coordinator_announcement',
                  notification_type: 'coordinator_announcement',
                  title: `🔔 ${title}`,
                  body: message,
                  // Critical: These fields must be used by the app to create proper notifications
                  notificationTitle: `🔔 ${title}`,
                  notificationBody: message,
                  showNotification: 'true',
                  sound: 'default',
                  vibrate: 'true',
                  priority: 'high',
                  sender_id: user.id,
                  channel_id: channelId,
                  channelId: 'chat', // Use existing chat channel
                },
                android: {
                  priority: 'high' as const,
                  ttl: 3600,
                },
                apns: {
                  payload: {
                    aps: {
                      alert: { title: `🔔 ${title}`, body: message },
                      sound: 'default',
                      badge: 1,
                    },
                  },
                },
              }

              await firebaseAdmin.messaging().send(fcmMessage)
              pushSuccessCount++
              console.log(`✅ Push sent to ${targetUser.full_name}`)
            } catch (tokenError) {
              console.error(`❌ Token error for ${targetUser.id}:`, tokenError)
              pushFailureCount++
            }
          }
        } catch (error) {
          console.error(`❌ Push notification failed for user ${targetUser.id}:`, error)
          pushFailureCount++
        }
      }
    } else {
      console.error('❌ Firebase Admin not initialized')
      pushFailureCount = filteredUsers.length
    }

    console.log(`📱 Push notifications: ${pushSuccessCount} success, ${pushFailureCount} failures`)

    // Hide channel from coordinator's view (optional)
    await channel.hide(user.id)

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Broadcast - ${title}${TEST_MODE ? ' [TEST]' : ''}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: filteredUsers.length,
        successful_sends: pushSuccessCount,
        failed_sends: pushFailureCount,
        sent_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      campaign,
      testMode: TEST_MODE,
      stats: {
        total_recipients: filteredUsers.length,
        successful_sends: pushSuccessCount,
        failed_sends: pushFailureCount,
        channel_id: channelId,
        message_id: messageResult.message.id,
        push_notifications: {
          success: pushSuccessCount,
          failures: pushFailureCount
        }
      }
    })

  } catch (error) {
    console.error('Error in broadcast-channel:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
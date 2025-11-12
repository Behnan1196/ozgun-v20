import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { initializeFirebaseAdmin } from '@/lib/firebase-admin'

// POST /api/notifications/fcm-direct - Send direct FCM notifications
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, target_audience } = body

    // Get target users (FCM tokens table might not exist yet)
    let query = supabase
      .from('user_profiles')
      .select('id, full_name, role')

    if (target_audience === 'student' || target_audience === 'coach') {
      query = query.eq('role', target_audience)
    } else {
      query = query.in('role', ['student', 'coach'])
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get FCM tokens from notification_tokens table (used by mobile app)
    const userIds = users?.map(u => u.id) || []
    const { data: tokenData, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('user_id, token, platform, token_type')
      .in('user_id', userIds)
      .eq('is_active', true)
      .in('token_type', ['fcm', 'apns']) // Accept both FCM and APNs tokens

    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError)
      return NextResponse.json({ 
        error: 'FCM tokens table not found or error: ' + tokenError.message 
      }, { status: 500 })
    }

    const fcmTokens = tokenData?.map(t => t.token) || []
    const userTokenMap: { [key: string]: string[] } = {}

    // Group tokens by user
    tokenData?.forEach(token => {
      if (!userTokenMap[token.user_id]) {
        userTokenMap[token.user_id] = []
      }
      userTokenMap[token.user_id].push(token.token)
    })

    if (fcmTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No FCM tokens found. Users need to enable push notifications in mobile app.',
        stats: {
          total_recipients: users?.length || 0,
          fcm_tokens_found: 0,
          notifications_sent: 0
        }
      })
    }

    console.log(`📱 Found ${fcmTokens.length} FCM tokens for ${Object.keys(userTokenMap).length} users`)

    // Initialize Firebase Admin and send real FCM
    try {
      const messaging = initializeFirebaseAdmin()

      const fcmMessage = {
        notification: {
          title: `🔔 ${title}`,
          body: message
        },
        data: {
          type: 'coordinator_announcement',
          title: title,
          message: message
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high' as const
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        tokens: fcmTokens
      }

      console.log('📤 Sending real FCM notifications...')
      const response = await messaging.sendEachForMulticast(fcmMessage)

      console.log(`✅ FCM sent: ${response.successCount} success, ${response.failureCount} failures`)

      // Log failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`❌ FCM failed for token ${idx}:`, resp.error)
          }
        })
      }

      // Log the campaign
      const { data: campaign } = await supabase
        .from('notification_campaigns')
        .insert({
          name: `FCM Direct - ${title}`,
          title,
          body: message,
          target_audience,
          status: 'sent',
          total_recipients: users?.length || 0,
          successful_sends: response.successCount,
          failed_sends: response.failureCount,
          sent_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        campaign,
        stats: {
          total_recipients: users?.length || 0,
          fcm_tokens_found: fcmTokens.length,
          notifications_sent: response.successCount,
          failures: response.failureCount
        }
      })

    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError)
      return NextResponse.json({ 
        error: 'Firebase sending failed: ' + (firebaseError as Error).message 
      }, { status: 500 })
    }



  } catch (error) {
    console.error('Error in fcm-direct:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
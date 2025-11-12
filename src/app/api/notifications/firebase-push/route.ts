import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { initializeFirebaseAdmin } from '@/lib/firebase-admin'

// POST /api/notifications/firebase-push - Send FCM push notifications
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coordinator/admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['coordinator', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, target_audience } = body

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message' 
      }, { status: 400 })
    }

    // Get target users
    let query = supabase.from('user_profiles').select('id, full_name, role')
    
    if (target_audience === 'student' || target_audience === 'coach') {
      query = query.eq('role', target_audience)
    } else {
      query = query.in('role', ['student', 'coach'])
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    // Get FCM tokens for these users
    const userIds = users.map(u => u.id)
    const { data: tokens, error: tokensError } = await supabase
      .from('push_notification_tokens')
      .select('user_id, token, platform')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (tokensError) {
      console.log('⚠️ FCM tokens table not found, creating mock response')
      
      // Return success but indicate FCM setup needed
      return NextResponse.json({
        success: true,
        message: 'FCM tokens table not found. Mobile app needs to register push tokens.',
        stats: {
          total_recipients: users.length,
          fcm_tokens_found: 0,
          notifications_sent: 0
        }
      })
    }

    const fcmTokens = tokens?.map(t => t.token) || []

    if (fcmTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No FCM tokens found. Users need to enable push notifications in mobile app.',
        stats: {
          total_recipients: users.length,
          fcm_tokens_found: 0,
          notifications_sent: 0
        }
      })
    }

    // Initialize Firebase Admin
    const messaging = initializeFirebaseAdmin()

    // Prepare FCM message
    const fcmMessage = {
      notification: {
        title: `🔔 ${title}`,
        body: message
      },
      data: {
        type: 'coordinator_announcement',
        title: title,
        message: message,
        sender: profile.full_name || 'Koordinatör'
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

    // Send FCM notifications
    console.log(`📱 Sending FCM to ${fcmTokens.length} tokens`)
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
        name: `FCM Push - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: users.length,
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
        total_recipients: users.length,
        fcm_tokens_found: fcmTokens.length,
        notifications_sent: response.successCount,
        failures: response.failureCount
      }
    })

  } catch (error) {
    console.error('Error in firebase-push:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST /api/notifications/send-push - Process notification queue and send push notifications
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret or user auth
    const cronSecret = request.headers.get('x-cron-secret')
    const isCronJob = cronSecret === process.env.CRON_SECRET

    let supabase
    if (isCronJob) {
      // Use admin client for cron jobs
      const { createAdminClient } = await import('@/lib/supabase/server')
      supabase = createAdminClient()
    } else {
      // Require user authentication
      const cookieStore = cookies()
      supabase = (await import('@/lib/supabase/server')).createClient(cookieStore)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // Get pending notifications from queue
    const { data: pendingNotifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3)
      .order('priority')
      .order('created_at')
      .limit(50)

    if (error) {
      console.error('Error fetching pending notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications', processed: 0 })
    }

    let successCount = 0
    let failureCount = 0

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'processing', 
            attempts: notification.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        // Send real push notification via FCM
        console.log(`📱 Sending push notification to user ${notification.user_id}:`)
        console.log(`   Title: ${notification.title}`)
        console.log(`   Body: ${notification.body}`)
        console.log(`   Type: ${notification.notification_type}`)
        
        // Initialize Firebase Admin if not already
        let firebaseAdmin: any = null
        const admin = await import('firebase-admin')
        if (admin.default.apps.length === 0) {
          const serviceAccount = process.env.GOOGLE_SERVICES_JSON
          if (serviceAccount) {
            try {
              const serviceAccountKey = JSON.parse(serviceAccount)
              admin.default.initializeApp({
                credential: admin.default.credential.cert(serviceAccountKey),
              })
              firebaseAdmin = admin.default
            } catch (error) {
              console.error('❌ Error initializing Firebase Admin:', error)
            }
          }
        } else {
          firebaseAdmin = admin.default
        }

        let pushSent = false
        if (firebaseAdmin) {
          // Get user's tokens
          const { data: tokens, error: tokenError } = await supabase
            .from('notification_tokens')
            .select('*')
            .eq('user_id', notification.user_id)
            .eq('is_active', true)
            .in('platform', ['android', 'ios'])

          if (!tokenError && tokens && tokens.length > 0) {
            console.log(`✅ Found ${tokens.length} token(s) for user`)

            for (const tokenRecord of tokens) {
              try {
                // Handle APNs tokens (iOS)
                if (tokenRecord.token_type === 'apns') {
                  console.log(`📱 Sending APNs notification`)
                  const { sendAPNSNotification } = await import('@/lib/notifications/video-invite-service')
                  
                  const apnsResult = await sendAPNSNotification(
                    tokenRecord.token,
                    notification.title,
                    notification.body,
                    {
                      notification_type: notification.notification_type,
                      title: notification.title,
                      message: notification.body,
                    }
                  )
                  
                  if (apnsResult.success) {
                    pushSent = true
                    console.log(`✅ APNs push sent`)
                  } else {
                    console.error(`❌ APNs push failed:`, apnsResult.error)
                  }
                  continue
                }

                // Handle FCM tokens (Android)
                const fcmMessage = {
                  token: tokenRecord.token,
                  data: {
                    type: notification.notification_type,
                    notification_type: notification.notification_type,
                    title: notification.title,
                    body: notification.body,
                    notificationTitle: notification.title,
                    notificationBody: notification.body,
                    showNotification: 'true',
                    sound: 'default',
                    vibrate: 'true',
                    priority: 'high',
                  },
                  android: {
                    priority: 'high' as const,
                    ttl: 3600,
                  },
                }

                await firebaseAdmin.messaging().send(fcmMessage)
                pushSent = true
                console.log(`✅ FCM push sent`)
              } catch (tokenError: any) {
                console.error(`❌ Token error:`, tokenError)
                
                // If token is invalid, mark it as inactive
                if (tokenError?.errorInfo?.code === 'messaging/registration-token-not-registered') {
                  await supabase
                    .from('notification_tokens')
                    .update({ is_active: false })
                    .eq('id', tokenRecord.id)
                }
              }
            }
          } else {
            console.log(`⚠️ No active tokens found for user`)
          }
        } else {
          console.error('❌ Firebase Admin not initialized')
        }
        
        // Mark as sent or failed
        if (pushSent) {
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          successCount++
        } else {
          // Mark as failed if no push was sent
          await supabase
            .from('notification_queue')
            .update({ 
              status: notification.attempts >= 2 ? 'failed' : 'pending',
              error_message: 'No push notification sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          failureCount++
        }
        
      } catch (notificationError) {
        console.error(`Error processing notification ${notification.id}:`, notificationError)
        
        // Mark as failed
        await supabase
          .from('notification_queue')
          .update({ 
            status: notification.attempts >= 2 ? 'failed' : 'pending',
            error_message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        failureCount++
      }
    }

    return NextResponse.json({ 
      message: 'Notifications processed',
      processed: pendingNotifications.length,
      successful: successCount,
      failed: failureCount
    })

  } catch (error) {
    console.error('Error in send-push:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/notifications/send-push - Get queue status
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: queueStats } = await supabase
      .from('notification_queue')
      .select('status')
    
    const stats = queueStats?.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({ 
      queue_stats: stats,
      total: queueStats?.length || 0
    })

  } catch (error) {
    console.error('Error getting queue stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
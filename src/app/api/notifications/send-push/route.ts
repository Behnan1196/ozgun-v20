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

        // Here you would integrate with your push notification service
        // For now, we'll simulate sending and mark as sent
        
        // Simulate push notification sending
        console.log(`📱 Sending push notification to ${notification.user_profiles?.full_name}:`)
        console.log(`   Title: ${notification.title}`)
        console.log(`   Body: ${notification.body}`)
        console.log(`   Type: ${notification.notification_type}`)
        
        // In a real implementation, you would:
        // 1. Get user's FCM token from user_profiles or device_tokens table
        // 2. Send via Firebase Cloud Messaging, OneSignal, or similar service
        // 3. Handle delivery status
        
        // For demo purposes, we'll mark as sent
        await supabase
          .from('notification_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        successCount++
        
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
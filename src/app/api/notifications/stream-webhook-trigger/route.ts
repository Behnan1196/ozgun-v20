import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/stream-webhook-trigger - Trigger Stream Chat webhook notifications
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

    // Initialize Stream Chat
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )

    // Ensure coordinator exists in Stream
    await serverClient.upsertUsers([{
      id: user.id,
      name: profile.full_name || 'Koordinatör'
    }])

    // Get target users
    let query = supabase.from('user_profiles').select('id, full_name, role')
    
    if (target_audience === 'student' || target_audience === 'coach') {
      query = query.eq('role', target_audience)
    } else {
      query = query.in('role', ['student', 'coach'])
    }

    const { data: users, error: usersError } = await query

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    console.log(`📤 Sending to ${users.length} users via Stream Chat webhook system`)

    // Ensure all target users exist in Stream
    await serverClient.upsertUsers(
      users.map(u => ({
        id: u.id,
        name: u.full_name || `${u.role} User`
      }))
    )

    let successCount = 0
    let failureCount = 0

    // Send individual messages to trigger webhook notifications
    for (const targetUser of users) {
      try {
        // Create unique channel for each notification
        const channelId = `coord_notif_${targetUser.id}_${Date.now()}`
        const channel = serverClient.channel('messaging', channelId, {
          members: [user.id, targetUser.id],
          created_by_id: user.id,
          name: `Koordinatör → ${targetUser.full_name}`
        })

        await channel.create()

        // Send message that will trigger webhook push notification
        const messageResult = await channel.sendMessage({
          text: `🔔 **${title}**\n\n${message}\n\n_Koordinatör: ${profile.full_name}_`,
          user_id: user.id,
          custom: {
            notification_type: 'coordinator_announcement',
            title: title,
            priority: 'high'
          },
          // This will trigger Stream's webhook system for push notifications
          push_notification: {
            title: `🔔 ${title}`,
            body: message,
            sound: 'default'
          }
        })

        console.log(`✅ Webhook message sent to ${targetUser.full_name}: ${messageResult.message.id}`)
        successCount++

        // Optional: Hide the channel after sending (so it doesn't clutter chat list)
        await channel.hide(user.id)

      } catch (error) {
        console.error(`❌ Failed to send to ${targetUser.full_name}:`, error)
        failureCount++
      }
    }

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Stream Webhook - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: users.length,
        successful_sends: successCount,
        failed_sends: failureCount,
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
        successful_sends: successCount,
        failed_sends: failureCount
      },
      message: `Stream Chat webhook notifications sent to ${successCount} users`
    })

  } catch (error) {
    console.error('Error in stream-webhook-trigger:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
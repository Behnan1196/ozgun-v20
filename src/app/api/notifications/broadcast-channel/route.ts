import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/broadcast-channel - Use dedicated broadcast channel
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

    // Get target users
    let query = supabase.from('user_profiles').select('id, full_name, role')
    
    if (target_audience === 'student') {
      query = query.eq('role', 'student')
    } else if (target_audience === 'coach') {
      query = query.eq('role', 'coach')
    } else {
      query = query.in('role', ['student', 'coach'])
    }

    const { data: users, error: usersError } = await query

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    console.log(`📢 Broadcasting to ${users.length} users (${target_audience})`)

    // Upsert all users in Stream
    const streamUsers = users.map(u => ({
      id: u.id,
      name: u.full_name,
      role: u.role
    }))

    await serverClient.upsertUsers([
      { id: user.id, name: profile.full_name || 'Koordinatör', role: 'coordinator' },
      ...streamUsers
    ])

    // Create or get broadcast channel for this audience
    const channelId = `broadcast_${target_audience}_${Date.now()}`
    const memberIds = [user.id, ...users.map(u => u.id)]

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

    // Send broadcast message with push notification
    const messageResult = await channel.sendMessage({
      text: `🔔 **${title}**\n\n${message}\n\n_Koordinatör: ${profile.full_name}_`,
      user_id: user.id,
      custom: {
        notification_type: 'coordinator_announcement',
        title: title,
        priority: 'high',
        is_broadcast: true
      },
      // Critical: This triggers Stream's push notification system
      push_notification: {
        title: `🔔 ${title}`,
        body: message,
        sound: 'default'
      }
    })

    console.log(`✅ Broadcast message sent: ${messageResult.message.id}`)

    // Hide channel from coordinator's view (optional)
    await channel.hide(user.id)

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Broadcast - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: users.length,
        successful_sends: users.length,
        failed_sends: 0,
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
        successful_sends: users.length,
        failed_sends: 0,
        channel_id: channelId,
        message_id: messageResult.message.id
      }
    })

  } catch (error) {
    console.error('Error in broadcast-channel:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
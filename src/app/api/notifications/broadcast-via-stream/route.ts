import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/broadcast-via-stream - Broadcast to all users via single channel
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coordinator/admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile || !['coordinator', 'admin'].includes(profile.role)) {
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
    console.log('🔑 Initializing Stream Chat for broadcast')
    
    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.error('❌ Missing Stream Chat credentials')
      return NextResponse.json({ error: 'Stream Chat not configured' }, { status: 500 })
    }
    
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )
    
    console.log('✅ Stream Chat client initialized for broadcast')

    // Get target users (mobile users only)
    let targetUsers: string[] = []
    
    if (target_audience === 'both' || target_audience === 'all') {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .in('role', ['student', 'coach'])
      
      targetUsers = users?.map((u: any) => u.id) || []
    } else if (target_audience === 'student' || target_audience === 'coach') {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .eq('role', target_audience)
      
      targetUsers = users?.map((u: any) => u.id) || []
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    console.log(`📢 Broadcasting to ${targetUsers.length} users`)

    try {
      // Create or get the broadcast channel
      const broadcastChannelId = 'system_announcements'
      const channel = serverClient.channel('messaging', broadcastChannelId, {
        name: 'Sistem Duyuruları',
        members: [...targetUsers, user.id],
        created_by_id: user.id,
        is_broadcast: true,
        system_channel: true
      })

      console.log('🔗 Creating/updating broadcast channel')
      await channel.create()

      // Add any missing members
      const existingMembers = Object.keys(channel.state.members || {})
      const missingMembers = targetUsers.filter(userId => !existingMembers.includes(userId))
      
      if (missingMembers.length > 0) {
        console.log(`➕ Adding ${missingMembers.length} missing members`)
        await channel.addMembers(missingMembers)
      }

      // Send the broadcast message
      console.log('📤 Sending broadcast message')
      const messageResult = await channel.sendMessage({
        text: `🔔 **${title}**\n\n${message}`,
        user_id: user.id,
        custom: {
          notification_type: 'system_broadcast',
          title: title,
          priority: 'normal',
          sender_role: profile.role
        },
        push_notification: {
          title: `🔔 ${title}`,
          body: message,
          sound: 'default'
        }
      })

      console.log('✅ Broadcast message sent successfully:', messageResult.message.id)

      // Log the campaign in our database
      const { data: campaign } = await supabase
        .from('notification_campaigns')
        .insert({
          name: `Broadcast - ${title}`,
          title,
          body: message,
          target_audience,
          status: 'sent',
          total_recipients: targetUsers.length,
          successful_sends: 1, // One broadcast message
          failed_sends: 0,
          sent_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single()

      return NextResponse.json({ 
        success: true,
        campaign,
        broadcast_channel: broadcastChannelId,
        message_id: messageResult.message.id,
        stats: {
          total_recipients: targetUsers.length,
          successful_sends: 1,
          failed_sends: 0
        }
      })

    } catch (streamError) {
      console.error('❌ Stream Chat broadcast error:', streamError)
      return NextResponse.json({ 
        error: 'Failed to send broadcast: ' + (streamError as Error).message 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in broadcast-via-stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
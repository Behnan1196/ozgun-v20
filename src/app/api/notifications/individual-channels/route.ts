import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/individual-channels - Send via individual 1:1 channels
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

    // Get target users (mobile users only)
    let targetUsers: any[] = []
    
    if (target_audience === 'both' || target_audience === 'all') {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .in('role', ['student', 'coach'])
      
      targetUsers = users || []
    } else if (target_audience === 'student' || target_audience === 'coach') {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .eq('role', target_audience)
      
      targetUsers = users || []
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 })
    }

    console.log(`📤 Sending individual messages to ${targetUsers.length} users`)

    // Ensure coordinator exists in Stream (use 'admin' role)
    await serverClient.upsertUsers([{
      id: user.id,
      name: profile.full_name || 'Koordinatör'
      // Don't set role - let Stream use default
    }])

    let successCount = 0
    let failureCount = 0

    // Send individual messages to each user
    for (const targetUser of targetUsers) {
      try {
        console.log(`📨 Sending to ${targetUser.full_name} (${targetUser.role})`)

        // Ensure target user exists in Stream
        await serverClient.upsertUsers([{
          id: targetUser.id,
          name: targetUser.full_name || `${targetUser.role} User`
          // Don't set role - let Stream use default
        }])

        // Create 1:1 channel with shorter ID
        const channelId = `coord_${targetUser.id.substring(0, 20)}`
        const channel = serverClient.channel('messaging', channelId, {
          members: [user.id, targetUser.id],
          created_by_id: user.id,
          name: `${profile.full_name} - ${targetUser.full_name}`
        })

        await channel.create()

        // Send message
        const messageResult = await channel.sendMessage({
          text: `🔔 **${title}**\n\n${message}\n\n_Koordinatör: ${profile.full_name}_`,
          user_id: user.id,
          custom: {
            notification_type: 'coordinator_announcement',
            title: title,
            priority: 'normal'
          },
          push_notification: {
            title: `🔔 ${title}`,
            body: message,
            sound: 'default'
          }
        })

        console.log(`✅ Message sent to ${targetUser.full_name}: ${messageResult.message.id}`)
        successCount++

      } catch (error) {
        console.error(`❌ Failed to send to ${targetUser.full_name}:`, error)
        failureCount++
      }
    }

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Individual Messages - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: targetUsers.length,
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
        total_recipients: targetUsers.length,
        successful_sends: successCount,
        failed_sends: failureCount
      }
    })

  } catch (error) {
    console.error('Error in individual-channels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
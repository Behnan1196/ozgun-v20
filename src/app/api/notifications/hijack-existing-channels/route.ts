import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/hijack-existing-channels - Use existing coach-student channels
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

    // Initialize Stream Chat
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )

    // Get existing coach-student assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('coach_student_assignments')
      .select(`
        coach_id,
        student_id,
        coach:user_profiles!coach_student_assignments_coach_id_fkey(id, full_name, role),
        student:user_profiles!coach_student_assignments_student_id_fkey(id, full_name, role)
      `)
      .eq('is_active', true)

    if (assignmentsError) {
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Filter based on target audience
    let targetAssignments = assignments || []
    if (target_audience === 'student') {
      // Send to students via their coach channels
      targetAssignments = assignments?.filter(a => a.student.role === 'student') || []
    } else if (target_audience === 'coach') {
      // Send to coaches via their student channels  
      targetAssignments = assignments?.filter(a => a.coach.role === 'coach') || []
    }

    if (targetAssignments.length === 0) {
      return NextResponse.json({ error: 'No active coach-student assignments found' }, { status: 400 })
    }

    // Get coordinator profile
    const { data: coordinatorProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Ensure coordinator exists in Stream Chat
    await serverClient.upsertUsers([{
      id: user.id,
      name: coordinatorProfile?.full_name || 'Koordinatör'
    }])

    console.log(`📤 Using ${targetAssignments.length} existing coach-student channels`)

    let successCount = 0
    let failureCount = 0

    // Send messages to existing channels
    for (const assignment of targetAssignments) {
      try {
        // Find existing channel between coach and student
        const channels = await serverClient.queryChannels({
          type: 'messaging',
          members: { $in: [assignment.coach_id, assignment.student_id] }
        })

        if (channels.length === 0) {
          console.log(`❌ No channel found between ${assignment.coach.full_name} and ${assignment.student.full_name}`)
          failureCount++
          continue
        }

        const channel = channels[0]
        console.log(`📨 Sending to channel: ${assignment.coach.full_name} ↔ ${assignment.student.full_name}`)

        // Send coordinator message to the existing channel
        const messageResult = await channel.sendMessage({
          text: `🔔 **Koordinatör Duyurusu**\n\n**${title}**\n\n${message}\n\n_Bu mesaj tüm koç ve öğrencilere gönderilmiştir._`,
          user_id: user.id,
          custom: {
            notification_type: 'coordinator_announcement',
            title: title,
            priority: 'high',
            is_system_message: true
          },
          push_notification: {
            title: `🔔 Koordinatör: ${title}`,
            body: message,
            sound: 'default'
          }
        })

        console.log(`✅ Message sent to ${assignment.coach.full_name} ↔ ${assignment.student.full_name}`)
        successCount++

      } catch (error) {
        console.error(`❌ Failed to send to ${assignment.coach.full_name} ↔ ${assignment.student.full_name}:`, error)
        failureCount++
      }
    }

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Existing Channels - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: targetAssignments.length,
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
        total_recipients: targetAssignments.length,
        successful_sends: successCount,
        failed_sends: failureCount
      }
    })

  } catch (error) {
    console.error('Error in hijack-existing-channels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
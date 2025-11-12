import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

// POST /api/notifications/send-via-stream - Send notifications via Stream Chat
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
    const { title, message, target_audience, target_user_ids } = body

    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message' 
      }, { status: 400 })
    }

    // Initialize Stream Chat
    console.log('🔑 Initializing Stream Chat with API key:', process.env.NEXT_PUBLIC_STREAM_API_KEY?.substring(0, 8) + '...')
    
    if (!process.env.NEXT_PUBLIC_STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      console.error('❌ Missing Stream Chat credentials')
      console.log('Available env vars:', {
        api_key: !!process.env.NEXT_PUBLIC_STREAM_API_KEY,
        secret: !!process.env.STREAM_API_SECRET,
        webhook_secret: !!process.env.STREAM_WEBHOOK_SECRET
      })
      return NextResponse.json({ error: 'Stream Chat not configured' }, { status: 500 })
    }
    
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )
    
    console.log('✅ Stream Chat client initialized')

    // Get target users
    let targetUsers: string[] = []
    
    if (target_audience === 'custom' && target_user_ids) {
      targetUsers = target_user_ids
    } else if (target_audience === 'both') {
      // Send to both students and coaches (mobile app users)
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .in('role', ['student', 'coach'])
      
      console.log(`📊 Found ${users?.length || 0} mobile users (students + coaches):`, users)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Error fetching users: ' + usersError.message }, { status: 500 })
      }
      
      targetUsers = users?.map((u: any) => u.id) || []
    } else if (target_audience === 'all') {
      // Only send to mobile app users (students and coaches)
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, role')
        .in('role', ['student', 'coach'])
      
      console.log(`📊 Found ${users?.length || 0} mobile users for 'all':`, users)
      targetUsers = users?.map((u: any) => u.id) || []
    } else {
      // Single role: student, coach
      let role = target_audience
      if (role.endsWith('s')) {
        role = role.slice(0, -1) // Remove 's' from plural
      }
      
      // Only allow student and coach roles for mobile notifications
      if (!['student', 'coach'].includes(role)) {
        return NextResponse.json({ 
          error: `Role "${role}" not supported for mobile notifications. Use "student", "coach", or "both"` 
        }, { status: 400 })
      }
      
      console.log(`🔍 Looking for users with role: "${role}" from target_audience: "${target_audience}"`)
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, role, full_name')
        .eq('role', role)
      
      console.log(`📊 Found ${users?.length || 0} users:`, users)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Error fetching users: ' + usersError.message }, { status: 500 })
      }
      
      targetUsers = users?.map((u: any) => u.id) || []
    }

    console.log(`🎯 Target users count: ${targetUsers.length}`)

    if (targetUsers.length === 0) {
      // Let's also check what users exist in the database
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('role')
        .limit(10)
      
      console.log('📈 All users in database:', allUsers)
      
      return NextResponse.json({ 
        error: `No mobile users found for "${target_audience}". Mobile notifications only work for students and coaches. Available users: ${JSON.stringify(allUsers)}` 
      }, { status: 400 })
    }

    let successCount = 0
    let failureCount = 0

    // Send notifications via Stream Chat
    console.log(`📤 Attempting to send notifications to ${targetUsers.length} users`)
    
    for (const userId of targetUsers) {
      try {
        console.log(`📨 Sending notification to user: ${userId}`)
        
        // Create a notification channel for the user
        const channel = serverClient.channel('messaging', `notification_${userId}_${Date.now()}`, {
          name: 'System Notification',
          members: [userId, user.id],
          created_by_id: user.id,
          is_notification: true
        })

        console.log(`🔗 Creating channel for user ${userId}`)
        await channel.create()

        // Send the notification message
        console.log(`💬 Sending message to user ${userId}`)
        const messageResult = await channel.sendMessage({
          text: `**${title}**\n\n${message}`,
          user_id: user.id,
          custom: {
            notification_type: 'system_announcement',
            title: title,
            priority: 'normal'
          }
        }, {
          push_notification: {
            title: title,
            body: message,
            sound: 'default',
            badge: 1
          },
          skip_push: false
        })

        console.log(`✅ Message sent successfully to user ${userId}:`, messageResult)
        successCount++
        
      } catch (error) {
        console.error(`❌ Error sending notification to user ${userId}:`, error)
        failureCount++
      }
    }

    // Log the campaign in our database
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Stream Notification - ${title}`,
        title,
        body: message,
        target_audience,
        target_user_ids: target_audience === 'custom' ? target_user_ids : null,
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
    console.error('Error in send-via-stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
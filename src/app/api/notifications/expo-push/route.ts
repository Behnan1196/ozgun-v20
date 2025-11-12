import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendExpoPushNotifications } from '@/lib/expo-push'

// POST /api/notifications/expo-push - Send Expo push notifications
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

    // Get Expo push tokens for these users
    const userIds = users.map(u => u.id)
    
    // Try both table names for compatibility
    let tokens: any[] = []
    let tokensError: any = null

    // First try push_notification_tokens table
    const { data: tokens1, error: error1 } = await supabase
      .from('push_notification_tokens')
      .select('user_id, token, platform, token_type')
      .in('user_id', userIds)
      .eq('is_active', true)
      .eq('token_type', 'expo') // Only get Expo tokens

    if (!error1 && tokens1) {
      tokens = tokens1
    } else {
      // Try notification_tokens table as fallback
      const { data: tokens2, error: error2 } = await supabase
        .from('notification_tokens')
        .select('user_id, token, platform, type')
        .in('user_id', userIds)
        .eq('is_active', true)
        .eq('type', 'expo') // Only get Expo tokens

      if (!error2 && tokens2) {
        tokens = tokens2.map(t => ({ ...t, token_type: t.type }))
      } else {
        tokensError = error2 || error1
      }
    }

    if (tokensError) {
      console.log('⚠️ Push tokens table not found:', tokensError)
      
      return NextResponse.json({
        success: true,
        message: 'Push tokens table not found. Mobile app needs to register push tokens.',
        stats: {
          total_recipients: users.length,
          expo_tokens_found: 0,
          notifications_sent: 0
        }
      })
    }

    const expoTokens = tokens?.map(t => t.token) || []

    if (expoTokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Expo push tokens found. Users need to enable push notifications in mobile app.',
        stats: {
          total_recipients: users.length,
          expo_tokens_found: 0,
          notifications_sent: 0
        }
      })
    }

    console.log(`📱 Found ${expoTokens.length} Expo push tokens for ${users.length} users`)

    // Send Expo push notifications
    const result = await sendExpoPushNotifications(expoTokens, {
      title: `🔔 ${title}`,
      body: message,
      data: {
        type: 'coordinator_announcement',
        title: title,
        message: message,
        sender: profile.full_name || 'Koordinatör'
      },
      sound: 'default',
      priority: 'high',
      channelId: 'announcements'
    })

    console.log(`✅ Expo Push Results: ${result.successCount} success, ${result.failureCount} failures`)

    // Log errors if any
    if (result.errors.length > 0) {
      console.error('❌ Expo Push Errors:', result.errors)
    }

    // Log the campaign
    const { data: campaign } = await supabase
      .from('notification_campaigns')
      .insert({
        name: `Expo Push - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'sent',
        total_recipients: users.length,
        successful_sends: result.successCount,
        failed_sends: result.failureCount,
        sent_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    return NextResponse.json({
      success: result.success,
      campaign,
      stats: {
        total_recipients: users.length,
        expo_tokens_found: expoTokens.length,
        notifications_sent: result.successCount,
        failures: result.failureCount
      },
      errors: result.errors
    })

  } catch (error) {
    console.error('Error in expo-push:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
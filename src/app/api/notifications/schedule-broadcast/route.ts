import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST /api/notifications/schedule-broadcast - Schedule a broadcast notification
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coordinator/admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['coordinator', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, target_audience, scheduled_date, scheduled_time } = body

    if (!title || !message || !scheduled_date || !scheduled_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message, scheduled_date, scheduled_time' 
      }, { status: 400 })
    }

    // Parse as Turkey time (UTC+3) and convert to UTC
    const turkeyDateTimeStr = `${scheduled_date}T${scheduled_time}:00+03:00`
    const scheduledDateTime = new Date(turkeyDateTimeStr)
    
    console.log(`📅 Scheduling: Turkey input=${scheduled_date} ${scheduled_time}, UTC=${scheduledDateTime.toISOString()}`)
    
    // Check if date is in the future (compare in UTC)
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json({ 
        error: 'Scheduled time must be in the future' 
      }, { status: 400 })
    }

    // Save to notification_campaigns table with scheduled status (use admin client to bypass RLS)
    const adminSupabase = createAdminClient()
    const { data: campaign, error: campaignError } = await adminSupabase
      .from('notification_campaigns')
      .insert({
        name: `Scheduled - ${title}`,
        title,
        body: message,
        target_audience,
        status: 'scheduled',
        scheduled_for: scheduledDateTime.toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating scheduled campaign:', campaignError)
      return NextResponse.json({ 
        error: 'Failed to schedule notification',
        details: campaignError.message,
        code: campaignError.code
      }, { status: 500 })
    }

    console.log(`📅 Notification scheduled for ${scheduledDateTime.toISOString()}`)

    return NextResponse.json({
      success: true,
      campaign,
      scheduled_for: scheduledDateTime.toISOString(),
      message: `Bildirim ${scheduled_date} ${scheduled_time} için programlandı`
    })

  } catch (error) {
    console.error('Error in schedule-broadcast:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

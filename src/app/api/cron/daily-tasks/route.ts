import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/cron/daily-tasks - Check daily tasks and send notifications
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get task check settings
    const { data: settingsData } = await supabase
      .from('notification_settings')
      .select('setting_value')
      .eq('setting_key', 'task_check')
      .single()

    if (!settingsData || !settingsData.setting_value.enabled) {
      return NextResponse.json({ message: 'Task check is disabled' })
    }

    const settings = settingsData.setting_value

    // Check if current time matches check_time (Turkey timezone)
    const now = new Date()
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
    const currentHour = turkeyTime.getHours()
    const currentMinute = turkeyTime.getMinutes()
    
    // Parse check_time (format: "HH:MM")
    const [checkHour, checkMinute] = settings.check_time.split(':').map(Number)
    
    // Check if we're in the right hour and within 5 minutes of the target time
    // This allows for cron job timing variations
    if (currentHour !== checkHour || Math.abs(currentMinute - checkMinute) > 5) {
      return NextResponse.json({ 
        message: 'Not the right time yet',
        current_time: `${currentHour}:${currentMinute}`,
        check_time: settings.check_time
      })
    }

    // Call process-automated API with task check rule
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

    const response = await fetch(`${baseUrl}/api/notifications/process-automated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || ''
      },
      body: JSON.stringify({
        rule_type: 'daily_task_reminder',
        force: true,
        custom_messages: {
          thank_you: settings.thank_you_message,
          reminder: settings.reminder_message
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      return NextResponse.json({
        success: true,
        message: 'Daily task check completed',
        result
      })
    } else {
      const error = await response.text()
      return NextResponse.json({ 
        error: 'Failed to process daily tasks',
        details: error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in daily-tasks cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

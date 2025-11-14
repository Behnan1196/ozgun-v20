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
    
    // TEST: Skip time check for now
    console.log(`⏰ Time check: Current=${currentHour}:${currentMinute}, Target=${checkHour}:${checkMinute}`)
    
    // Check if we're in the right hour and within 5 minutes of the target time
    // This allows for cron job timing variations
    // TEMPORARILY DISABLED FOR TESTING
    /*
    if (currentHour !== checkHour || Math.abs(currentMinute - checkMinute) > 5) {
      return NextResponse.json({ 
        message: 'Not the right time yet',
        current_time: `${currentHour}:${currentMinute}`,
        check_time: settings.check_time
      })
    }
    */

    // Get today's date in Turkey timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) // YYYY-MM-DD
    console.log(`📅 Checking tasks for date: ${today}`)

    // Get all students (TEST: only Ozan for now)
    const { data: students, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('role', 'student')
      .eq('email', 'ozan@yasam.com') // TEST: Remove this line for production
    
    console.log(`👥 Found ${students?.length || 0} students for task check`)

    if (studentsError || !students) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const results = []

    for (const student of students) {
      // Get student's tasks for today
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, scheduled_date')
        .eq('assigned_to', student.id)
        .eq('scheduled_date', today)

      console.log(`📝 ${student.full_name}: Found ${tasks?.length || 0} tasks for ${today}`)

      if (!tasks || tasks.length === 0) {
        continue // No tasks for today
      }

      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      const allCompleted = completedTasks === totalTasks

      // Determine message
      const message = allCompleted ? settings.thank_you_message : settings.reminder_message
      const title = allCompleted ? '🎉 Tebrikler!' : '⏰ Görev Hatırlatması'

      // Send notification via broadcast-channel
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

      const response = await fetch(`${baseUrl}/api/notifications/broadcast-channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET || ''
        },
        body: JSON.stringify({
          title,
          message: `${message}\n\n📊 Bugün: ${completedTasks}/${totalTasks} görev tamamlandı`,
          target_audience: 'student',
          target_user_ids: [student.id]
        })
      })

      results.push({
        student: student.full_name,
        tasks: `${completedTasks}/${totalTasks}`,
        all_completed: allCompleted,
        notification_sent: response.ok
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Daily task check completed',
      checked_students: students.length,
      results
    })

  } catch (error) {
    console.error('Error in daily-tasks cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

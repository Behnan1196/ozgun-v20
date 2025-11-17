import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// TEST MODE: Only send to this user ID
const TEST_USER_ID = '9e48fc98-3064-4eca-a99c-4696a058c357' // Senin user ID'n

// POST /api/notifications/process-automated - Process automated notification rules
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // This endpoint should be called by a cron job or background worker
    // For security, you might want to add API key authentication here
    
    const body = await request.json()
    const { rule_type, force = false, test_mode = true } = body

    console.log('🤖 Processing automated notifications:', { rule_type, force, test_mode })

    // Get active automated rules
    let query = supabase
      .from('automated_notification_rules')
      .select('*')
      .eq('is_active', true)

    if (rule_type) {
      query = query.eq('rule_type', rule_type)
    }

    const { data: rules, error: rulesError } = await query

    if (rulesError) {
      console.error('Error fetching automated rules:', rulesError)
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
    }

    const results = []

    for (const rule of rules || []) {
      try {
        const result = await processAutomatedRule(supabase, rule, force, test_mode)
        results.push(result)
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error)
        results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return NextResponse.json({ 
      processed_rules: results.length,
      results 
    })
  } catch (error) {
    console.error('Error in process-automated POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processAutomatedRule(supabase: any, rule: any, force: boolean = false, test_mode: boolean = true) {
  const now = new Date()
  const conditions = rule.trigger_conditions

  console.log(`📋 Processing rule: ${rule.name} (${rule.rule_type})`, test_mode ? '🧪 TEST MODE' : '')

  // Check if rule should run based on conditions and last execution
  if (!force && !shouldRuleRun(rule, conditions, now)) {
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      success: true,
      skipped: true,
      reason: 'Not scheduled to run now'
    }
  }

  let targetUsers: any[] = []
  let notificationsCreated = 0

  // Process different rule types
  switch (rule.rule_type) {
    case 'daily_task_reminder':
      targetUsers = await getDailyTaskReminderTargets(supabase)
      break
    
    case 'task_completion_thanks':
      targetUsers = await getTaskCompletionTargets(supabase)
      break
    
    case 'weekly_summary':
      targetUsers = await getWeeklySummaryTargets(supabase)
      break
    
    case 'exam_reminder':
      targetUsers = await getExamReminderTargets(supabase)
      break
    
    default:
      console.log(`⚠️ Unknown rule type: ${rule.rule_type}`)
      return {
        rule_id: rule.id,
        rule_name: rule.name,
        success: false,
        error: 'Unknown rule type'
      }
  }

  // Create notifications for target users
  if (targetUsers.length > 0) {
    let notifications = targetUsers.map(user => ({
      user_id: user.id,
      title: interpolateTemplate(rule.title_template, user),
      body: interpolateTemplate(rule.body_template, user),
      notification_type: rule.rule_type,
      source_type: 'automated_rule',
      source_id: rule.id,
      priority: rule.rule_type === 'exam_reminder' ? 2 : 5,
      include_sound: true,
      custom_data: { rule_name: rule.name } as any
    }))

    // TEST MODE: Only send to test user
    if (test_mode) {
      console.log(`🧪 TEST MODE: Filtering ${notifications.length} notifications to only test user`)
      notifications = notifications.filter(n => n.user_id === TEST_USER_ID)
      
      // If test user not in target list, create a test notification anyway
      if (notifications.length === 0) {
        notifications = [{
          user_id: TEST_USER_ID,
          title: `[TEST] ${rule.title_template}`,
          body: `[TEST] ${rule.body_template} (${targetUsers.length} hedef kullanıcı bulundu)`,
          notification_type: rule.rule_type,
          source_type: 'automated_rule',
          source_id: rule.id,
          priority: rule.rule_type === 'exam_reminder' ? 2 : 5,
          include_sound: true,
          custom_data: { rule_name: rule.name, test_mode: true, original_target_count: targetUsers.length } as any
        }]
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notification_queue')
        .insert(notifications)

      if (insertError) {
        console.error('Error inserting notifications:', insertError)
        throw new Error('Failed to create notifications')
      }

      notificationsCreated = notifications.length
    }
  }

  // Update rule's last execution time
  await supabase
    .from('automated_notification_rules')
    .update({ last_executed_at: now.toISOString() })
    .eq('id', rule.id)

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    success: true,
    notifications_created: notificationsCreated,
    target_users: targetUsers.length
  }
}

function shouldRuleRun(rule: any, conditions: any, now: Date): boolean {
  // Check if rule was executed recently
  if (rule.last_executed_at) {
    const lastExecution = new Date(rule.last_executed_at)
    const hoursSinceLastExecution = (now.getTime() - lastExecution.getTime()) / (1000 * 60 * 60)
    
    // For daily rules, don't run more than once per 23 hours
    // For weekly rules, don't run more than once per 7 days
    const minHoursBetweenRuns = rule.rule_type === 'weekly_summary' ? 168 : 23
    
    if (hoursSinceLastExecution < minHoursBetweenRuns) {
      console.log(`⏳ Rule ${rule.name} last ran ${hoursSinceLastExecution.toFixed(1)}h ago, needs ${minHoursBetweenRuns}h`)
      return false
    }
  }

  // Check time-based conditions
  if (conditions.time) {
    const [hours, minutes] = conditions.time.split(':').map(Number)
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Only run if we're within 5 minutes of scheduled time
    const scheduledTime = hours * 60 + minutes
    const currentTime = currentHour * 60 + currentMinute
    const timeDiff = Math.abs(currentTime - scheduledTime)
    
    console.log(`⏰ Time check for ${rule.name}:`)
    console.log(`   Scheduled: ${conditions.time} (${scheduledTime} minutes)`)
    console.log(`   Current UTC: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTime} minutes)`)
    console.log(`   Difference: ${timeDiff} minutes (max 5)`)
    
    if (timeDiff > 5) {
      console.log(`   ❌ Outside time window`)
      return false
    }
    
    console.log(`   ✅ Within time window`)
  }

  // Check day-based conditions
  if (conditions.days) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    
    if (!conditions.days.includes(currentDay)) {
      console.log(`📅 Rule ${rule.name} not scheduled for ${currentDay}`)
      return false
    }
  }

  return true
}

async function getDailyTaskReminderTargets(supabase: any) {
  // Get students with incomplete tasks for today
  const today = new Date().toISOString().split('T')[0]
  
  const { data: students } = await supabase
    .from('user_profiles')
    .select(`
      id, full_name,
      tasks:tasks!tasks_assigned_to_fkey(id, status)
    `)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('tasks.scheduled_date', today)

  return (students || [])
    .map((student: any) => {
      const incompleteTasks = student.tasks?.filter((task: any) => task.status !== 'completed') || []
      return {
        ...student,
        incomplete_task_count: incompleteTasks.length
      }
    })
    .filter((student: any) => student.incomplete_task_count > 0)
}

async function getTaskCompletionTargets(supabase: any) {
  // Get students who completed all tasks today
  const today = new Date().toISOString().split('T')[0]
  
  const { data: students } = await supabase
    .from('user_profiles')
    .select(`
      id, full_name,
      tasks:tasks!tasks_assigned_to_fkey(id, status)
    `)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('tasks.scheduled_date', today)

  return (students || [])
    .filter((student: any) => {
      const tasks = student.tasks || []
      return tasks.length > 0 && tasks.every((task: any) => task.status === 'completed')
    })
}

async function getWeeklySummaryTargets(supabase: any) {
  // Get all active students for weekly summary
  const { data: students } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .eq('is_active', true)

  // TODO: Add weekly stats calculation
  return (students || []).map((student: any) => ({
    ...student,
    completed_tasks: 0, // Calculate from tasks
    study_hours: 0 // Calculate from activity logs
  }))
}

async function getExamReminderTargets(supabase: any) {
  // Get students with upcoming exams
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: students } = await supabase
    .from('user_profiles')
    .select(`
      id, full_name,
      tasks:tasks!tasks_assigned_to_fkey(id, title, scheduled_date)
    `)
    .eq('role', 'student')
    .eq('is_active', true)
    .eq('tasks.task_type', 'exam')
    .eq('tasks.scheduled_date', tomorrowStr)

  return (students || []).filter((student: any) => student.tasks?.length > 0)
}

function interpolateTemplate(template: string, data: any): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match
  })
}
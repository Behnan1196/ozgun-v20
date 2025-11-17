import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// TEST MODE: Only send to this user ID
const TEST_USER_ID = '9e48fc98-3064-4eca-a99c-4696a058c357' // Senin user ID'n

// POST /api/notifications/process-automated - Process automated notification rules
export async function POST(request: NextRequest) {
  try {
    // Use admin client to bypass RLS (this endpoint is called by cron jobs)
    const supabase = createAdminClient()
    
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

    console.log('📋 Fetching rules with query:', { rule_type, is_active: true })

    const { data: rules, error: rulesError } = await query

    console.log('📊 Query result:', { 
      rulesCount: rules?.length || 0, 
      hasError: !!rulesError,
      error: rulesError 
    })

    if (rulesError) {
      console.error('❌ Error fetching automated rules:', rulesError)
      return NextResponse.json({ 
        error: 'Failed to fetch rules',
        details: rulesError 
      }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      console.log('⚠️ No active rules found')
      return NextResponse.json({ 
        processed_rules: 0,
        results: [],
        message: 'No active rules found'
      })
    }

    console.log(`✅ Found ${rules.length} active rule(s)`)

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

    // Add debug info
    const debugInfo = {
      totalRules: rules?.length || 0,
      processedRules: results.length,
      results,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(debugInfo)
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

  // Send notifications directly via broadcast-channel
  if (targetUsers.length > 0) {
    let usersToNotify = targetUsers

    // TEST MODE: Only send to test user
    if (test_mode) {
      console.log(`🧪 TEST MODE: Filtering ${targetUsers.length} users to only test user`)
      usersToNotify = targetUsers.filter(u => u.id === TEST_USER_ID)
      
      if (usersToNotify.length === 0) {
        console.log(`⚠️ Test user not in target list, skipping`)
      }
    }

    // Send notification to each user via broadcast-channel
    for (const user of usersToNotify) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
          || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

        const title = interpolateTemplate(rule.title_template, user)
        const body = interpolateTemplate(rule.body_template, user)

        const response = await fetch(`${baseUrl}/api/notifications/broadcast-channel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || ''
          },
          body: JSON.stringify({
            title,
            message: body,
            target_audience: 'custom',
            test_mode: true, // Use test mode to send only to specific user
            target_user_id: user.id
          })
        })

        if (response.ok) {
          notificationsCreated++
        } else {
          console.error(`Failed to send notification to ${user.full_name}`)
        }
      } catch (error) {
        console.error(`Error sending notification to ${user.full_name}:`, error)
      }
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
  
  console.log(`📅 Checking tasks for date: ${today}`)
  
  // Try direct query first
  const { data: allStudents, error: studentsError } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('role', 'student')
  
  console.log(`👥 Found ${allStudents?.length || 0} students total`)
  if (studentsError) console.error('Students error:', studentsError)
  
  const { data: todayTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, assigned_to, status, scheduled_date, title')
    .eq('scheduled_date', today)
  
  console.log(`📋 Found ${todayTasks?.length || 0} tasks for today`)
  if (tasksError) console.error('Tasks error:', tasksError)
  
  // Manual join
  const studentsWithTasks = (allStudents || []).map((student: any) => {
    const studentTasks = (todayTasks || []).filter((task: any) => task.assigned_to === student.id)
    const incompleteTasks = studentTasks.filter((task: any) => task.status !== 'completed')
    
    if (incompleteTasks.length > 0) {
      console.log(`   ✅ ${student.full_name}: ${incompleteTasks.length} incomplete tasks`)
    }
    
    return {
      ...student,
      tasks: studentTasks,
      incomplete_task_count: incompleteTasks.length
    }
  }).filter((student: any) => student.incomplete_task_count > 0)

  console.log(`🎯 Final result: ${studentsWithTasks.length} students with incomplete tasks`)

  return studentsWithTasks
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
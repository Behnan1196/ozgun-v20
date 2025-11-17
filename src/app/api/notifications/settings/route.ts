import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// GET /api/notifications/settings?key=task_check
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const settingKey = searchParams.get('key') || 'task_check'

    const { data: setting, error } = await supabase
      .from('notification_settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: setting.setting_value })

  } catch (error) {
    console.error('Error in GET /api/notifications/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

// POST /api/notifications/settings - Update settings
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
    const { setting_key, setting_value } = body

    if (!setting_key || !setting_value) {
      return NextResponse.json({ 
        error: 'Missing required fields: setting_key, setting_value' 
      }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()
    
    // First, try to get existing setting
    const { data: existing } = await adminSupabase
      .from('notification_settings')
      .select('id')
      .eq('setting_key', setting_key)
      .single()

    let data, error

    if (existing) {
      // Update existing
      const result = await adminSupabase
        .from('notification_settings')
        .update({
          setting_value,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', setting_key)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new
      const result = await adminSupabase
        .from('notification_settings')
        .insert({
          setting_key,
          setting_value,
          updated_by: user.id
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    // If task_check settings, also update/create automated_notification_rules
    if (setting_key === 'task_check' && setting_value.check_time) {
      const checkTime = setting_value.check_time // e.g., "20:00"
      
      // Check if rule exists
      const { data: existingRule } = await adminSupabase
        .from('automated_notification_rules')
        .select('id')
        .eq('rule_type', 'daily_task_reminder')
        .single()

      const ruleData = {
        trigger_conditions: {
          time: checkTime,
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        is_active: setting_value.enabled || false,
        body_template: setting_value.reminder_message || 'Henüz tamamlanmamış görevlerin var. Lütfen kontrol et!',
        updated_at: new Date().toISOString()
      }

      if (existingRule) {
        // Update existing rule
        await adminSupabase
          .from('automated_notification_rules')
          .update(ruleData)
          .eq('rule_type', 'daily_task_reminder')
        
        console.log(`✅ Updated automated_notification_rules with time: ${checkTime}`)
      } else {
        // Create new rule
        await adminSupabase
          .from('automated_notification_rules')
          .insert({
            ...ruleData,
            name: 'Günlük Görev Hatırlatıcısı',
            description: 'Öğrencilere günlük görevlerini hatırlatır',
            rule_type: 'daily_task_reminder',
            title_template: 'Günlük Görevlerin',
            target_audience: 'students',
            created_by: user.id
          })
        
        console.log(`✅ Created automated_notification_rules with time: ${checkTime}`)
      }
    }

    return NextResponse.json({ success: true, settings: data })

  } catch (error) {
    console.error('Error in POST /api/notifications/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

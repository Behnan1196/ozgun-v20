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
    const { data, error } = await adminSupabase
      .from('notification_settings')
      .upsert({
        setting_key,
        setting_value,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })

  } catch (error) {
    console.error('Error in POST /api/notifications/settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

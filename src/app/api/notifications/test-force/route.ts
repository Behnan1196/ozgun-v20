import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/test-force - Force send notification to Ozan
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const TEST_USER_ID = '9e48fc98-3064-4eca-a99c-4696a058c357' // Ozan

    // Create notification directly
    const { data: notification, error } = await supabase
      .from('notification_queue')
      .insert({
        user_id: TEST_USER_ID,
        title: 'Test Bildirim',
        body: 'Bu bir test bildirimidir. Eğer bunu görüyorsan sistem çalışıyor! 🎉',
        notification_type: 'daily_task_reminder',
        source_type: 'manual',
        priority: 5,
        include_sound: true,
        custom_data: { test: true }
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification created in queue',
      notification
    })

  } catch (error) {
    console.error('Error in test-force:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

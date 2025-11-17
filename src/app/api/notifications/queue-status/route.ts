import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/queue-status - Check notification queue status
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all notifications in queue
    const { data: allNotifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by status
    const stats = allNotifications?.reduce((acc: any, notif: any) => {
      acc[notif.status] = (acc[notif.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      total: allNotifications?.length || 0,
      stats,
      notifications: allNotifications?.map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        body: n.body,
        status: n.status,
        notification_type: n.notification_type,
        created_at: n.created_at,
        scheduled_for: n.scheduled_for,
        attempts: n.attempts
      }))
    })
  } catch (error) {
    console.error('Error checking queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/queue-status - Clear queue
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const url = new URL(request.url)
    const status = url.searchParams.get('status') // optional: only delete specific status
    
    let query = supabase.from('notification_queue').delete()
    
    if (status) {
      query = query.eq('status', status)
    } else {
      // Delete all
      query = query.neq('id', '00000000-0000-0000-0000-000000000000') // dummy condition to delete all
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Queue cleared' })
  } catch (error) {
    console.error('Error clearing queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

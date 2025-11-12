import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST /api/notifications/announcements/[id]/view - Mark announcement as viewed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcementId = params.id

    // Check if announcement exists and is active
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('id, view_count')
      .eq('id', announcementId)
      .eq('is_active', true)
      .single()

    if (announcementError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Insert or update view record (upsert)
    const { error: viewError } = await supabase
      .from('announcement_views')
      .upsert({
        announcement_id: announcementId,
        user_id: user.id,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'announcement_id,user_id'
      })

    if (viewError) {
      console.error('Error recording announcement view:', viewError)
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('announcements')
      .update({ 
        view_count: (announcement.view_count || 0) + 1 
      })
      .eq('id', announcementId)

    if (updateError) {
      console.error('Error updating view count:', updateError)
      // Don't fail the request for this
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in announcement view POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
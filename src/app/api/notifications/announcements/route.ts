import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// GET /api/notifications/announcements - List announcements
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeViewed = searchParams.get('include_viewed') === 'true'

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Build query based on user role and target audience
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`target_audience.eq.all,target_audience.eq.${profile.role}s`)
      .lte('starts_at', new Date().toISOString())
      .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())

    const { data: announcements, error } = await query
      .order('is_pinned', { ascending: false })
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Error in announcements GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
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
    const {
      title,
      content,
      announcement_type,
      target_audience,
      priority,
      starts_at,
      ends_at,
      is_pinned,
      show_on_login
    } = body

    // Validate required fields
    if (!title || !content || !announcement_type || !target_audience) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, content, announcement_type, target_audience' 
      }, { status: 400 })
    }

    // Create announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        announcement_type,
        target_audience,
        priority: priority || 'normal',
        starts_at: starts_at || new Date().toISOString(),
        ends_at: ends_at || null,
        is_pinned: is_pinned || false,
        show_on_login: show_on_login || false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error in announcements POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// GET /api/notifications/campaigns - List notification campaigns
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coordinator/admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile || !['coordinator', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get campaigns
    const { data: campaigns, error } = await supabase
      .from('notification_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error in campaigns GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications/campaigns - Create new campaign
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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile || !['coordinator', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      title,
      body: messageBody,
      target_audience,
      target_user_ids,
      scheduled_for,
      is_urgent,
      include_sound,
      custom_data
    } = body

    // Validate required fields
    if (!name || !title || !messageBody || !target_audience) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, title, body, target_audience' 
      }, { status: 400 })
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('notification_campaigns')
      .insert({
        name,
        title,
        body: messageBody,
        target_audience,
        target_user_ids: target_user_ids || null,
        scheduled_for: scheduled_for || new Date().toISOString(),
        is_urgent: is_urgent || false,
        include_sound: include_sound !== false,
        custom_data: custom_data || {},
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // If scheduled for now, trigger immediate processing
    if (!scheduled_for || new Date(scheduled_for) <= new Date()) {
      // Queue notifications for target users
      await queueNotificationsForCampaign(supabase, campaign)
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error in campaigns POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to queue notifications for a campaign
async function queueNotificationsForCampaign(supabase: any, campaign: any) {
  try {
    let targetUserIds: string[] = []

    // Determine target users based on audience
    if (campaign.target_audience === 'all') {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
      
      targetUserIds = users?.map((u: any) => u.id) || []
    } else if (campaign.target_audience === 'custom') {
      targetUserIds = campaign.target_user_ids || []
    } else {
      // students, coaches, coordinators
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', campaign.target_audience.slice(0, -1)) // Remove 's' from plural
      
      targetUserIds = users?.map((u: any) => u.id) || []
    }

    // Create notification queue items
    const queueItems = targetUserIds.map(userId => ({
      user_id: userId,
      title: campaign.title,
      body: campaign.body,
      notification_type: 'custom',
      source_type: 'campaign',
      source_id: campaign.id,
      scheduled_for: campaign.scheduled_for,
      priority: campaign.is_urgent ? 1 : 5,
      include_sound: campaign.include_sound,
      custom_data: campaign.custom_data
    }))

    if (queueItems.length > 0) {
      const { error } = await supabase
        .from('notification_queue')
        .insert(queueItems)

      if (error) {
        console.error('Error queuing notifications:', error)
      } else {
        // Update campaign stats
        await supabase
          .from('notification_campaigns')
          .update({
            status: 'scheduled',
            total_recipients: queueItems.length
          })
          .eq('id', campaign.id)
      }
    }
  } catch (error) {
    console.error('Error in queueNotificationsForCampaign:', error)
  }
}
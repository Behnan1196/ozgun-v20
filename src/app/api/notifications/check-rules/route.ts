import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/check-rules - Check if automated rules exist
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get all automated rules
    const { data: rules, error } = await supabase
      .from('automated_notification_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch rules',
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: rules?.length || 0,
      rules: rules || []
    })

  } catch (error) {
    console.error('Error in check-rules:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

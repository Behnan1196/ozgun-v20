import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/check-rules - Check if automated rules exist
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Debug: Check if service role key is set
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🔑 Service role key exists:', hasServiceKey)

    // Get all automated rules
    const { data: rules, error } = await supabase
      .from('automated_notification_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching rules:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch rules',
        details: error,
        hasServiceKey 
      }, { status: 500 })
    }

    console.log(`✅ Found ${rules?.length || 0} rules`)

    return NextResponse.json({
      success: true,
      count: rules?.length || 0,
      rules: rules || [],
      debug: {
        hasServiceKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }
    })

  } catch (error) {
    console.error('Error in check-rules:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

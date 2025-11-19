import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/get-rule - Get automated rule by type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleType = searchParams.get('rule_type')

    if (!ruleType) {
      return NextResponse.json({ 
        error: 'Missing rule_type parameter' 
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: rule, error } = await supabase
      .from('automated_notification_rules')
      .select('*')
      .eq('rule_type', ruleType)
      .single()

    if (error) {
      console.error('Error fetching rule:', error)
      return NextResponse.json({ 
        error: 'Rule not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      rule
    })

  } catch (error) {
    console.error('Error in get-rule:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/notifications/update-rule-schedule - Update automated rule schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { rule_type, check_time, enabled } = body

    if (!rule_type || !check_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: rule_type, check_time' 
      }, { status: 400 })
    }

    // Get current rule
    const { data: rule, error: fetchError } = await supabase
      .from('automated_notification_rules')
      .select('trigger_conditions')
      .eq('rule_type', rule_type)
      .single()

    if (fetchError || !rule) {
      return NextResponse.json({ 
        error: 'Rule not found' 
      }, { status: 404 })
    }

    // Update trigger_conditions with new time
    const updatedConditions = {
      ...rule.trigger_conditions,
      time: check_time
    }

    // Update rule
    const { error: updateError } = await supabase
      .from('automated_notification_rules')
      .update({ 
        trigger_conditions: updatedConditions,
        is_active: enabled
      })
      .eq('rule_type', rule_type)

    if (updateError) {
      console.error('Error updating rule:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update rule' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Rule schedule updated'
    })

  } catch (error) {
    console.error('Error in update-rule-schedule:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

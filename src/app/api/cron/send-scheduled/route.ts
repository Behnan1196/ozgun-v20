import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// This endpoint will be called by Vercel Cron every minute
// GET /api/cron/send-scheduled
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Get all scheduled campaigns that should be sent now
    const { data: campaigns, error: fetchError } = await supabase
      .from('notification_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })

    if (fetchError) {
      console.error('Error fetching scheduled campaigns:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('✅ No scheduled campaigns to send')
      return NextResponse.json({ message: 'No campaigns to send', count: 0 })
    }

    console.log(`📅 Found ${campaigns.length} scheduled campaign(s) to send`)

    const results = []

    for (const campaign of campaigns) {
      try {
        // Get base URL dynamically - prefer production URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
          || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

        // Call broadcast-channel API to send the notification
        const response = await fetch(`${baseUrl}/api/notifications/broadcast-channel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET || ''
          },
          body: JSON.stringify({
            title: campaign.title,
            message: campaign.body,
            target_audience: campaign.target_audience,
            campaign_id: campaign.id // Pass campaign ID to update it
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          // Update campaign status to 'sent'
          await supabase
            .from('notification_campaigns')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              successful_sends: result.stats?.successful_sends || 0,
              failed_sends: result.stats?.failed_sends || 0
            })
            .eq('id', campaign.id)

          results.push({ id: campaign.id, success: true })
        } else {
          const responseText = await response.text()
          console.error(`Failed to send campaign ${campaign.id}:`, response.status)
          
          // Update campaign status to 'failed'
          await supabase
            .from('notification_campaigns')
            .update({
              status: 'failed',
              sent_at: new Date().toISOString()
            })
            .eq('id', campaign.id)

          results.push({ id: campaign.id, success: false, error: responseText.substring(0, 100) })
        }
      } catch (error) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, error)
        results.push({ id: campaign.id, success: false, error: (error as Error).message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Also check automated notification rules
    let automatedResults = null
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

      const automatedResponse = await fetch(`${baseUrl}/api/notifications/process-automated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rule_type: 'daily_task_reminder',
          force: false,
          test_mode: true
        })
      })

      if (automatedResponse.ok) {
        automatedResults = await automatedResponse.json()
        console.log('✅ Automated notifications processed:', automatedResults)
      } else {
        console.error('❌ Failed to process automated notifications')
      }
    } catch (error) {
      console.error('❌ Error processing automated notifications:', error)
    }

    return NextResponse.json({
      message: `Processed ${campaigns.length} campaign(s)`,
      success: successCount,
      failed: failureCount,
      results,
      automated: automatedResults
    })

  } catch (error) {
    console.error('Error in send-scheduled cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

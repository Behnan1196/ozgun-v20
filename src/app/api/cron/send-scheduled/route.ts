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
        console.log(`📤 Sending campaign: ${campaign.name} (${campaign.id})`)

        // Get base URL dynamically
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

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

          console.log(`✅ Campaign sent: ${campaign.name}`)
          results.push({ id: campaign.id, success: true })
        } else {
          const error = await response.json()
          console.error(`❌ Failed to send campaign ${campaign.name}:`, error)
          
          // Update campaign status to 'failed'
          await supabase
            .from('notification_campaigns')
            .update({
              status: 'failed',
              sent_at: new Date().toISOString()
            })
            .eq('id', campaign.id)

          results.push({ id: campaign.id, success: false, error: error.error })
        }
      } catch (error) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, error)
        results.push({ id: campaign.id, success: false, error: (error as Error).message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Processed ${campaigns.length} campaign(s)`,
      success: successCount,
      failed: failureCount,
      results
    })

  } catch (error) {
    console.error('Error in send-scheduled cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/check-daily-tasks - Cron job to check daily tasks
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

    // Call process-automated API with test mode enabled
    const response = await fetch(`${baseUrl}/api/notifications/process-automated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rule_type: 'daily_task_reminder',
        force: false,
        test_mode: true // TEST MODE: Only send to Ozan
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to process automated notifications:', data)
      return NextResponse.json({ 
        error: 'Failed to process notifications',
        details: data 
      }, { status: 500 })
    }

    console.log('✅ Daily task check completed:', data)
    return NextResponse.json({
      success: true,
      message: 'Daily task check completed',
      ...data
    })

  } catch (error) {
    console.error('❌ Error in check-daily-tasks cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

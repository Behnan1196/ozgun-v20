import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications/test-automated - Test automated notifications manually
export async function GET(request: NextRequest) {
  try {
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

    // Call process-automated API with force=true to bypass time checks
    const response = await fetch(`${baseUrl}/api/notifications/process-automated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rule_type: 'daily_task_reminder',
        force: true, // Force execution regardless of time
        test_mode: true
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to test automated notifications',
        details: data 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test completed',
      ...data
    })

  } catch (error) {
    console.error('Error in test-automated:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

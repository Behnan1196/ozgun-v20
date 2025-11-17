import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/test-force - Force send notification to Ozan
export async function GET(request: NextRequest) {
  try {
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

    // Call broadcast-channel with test mode
    const response = await fetch(`${baseUrl}/api/notifications/broadcast-channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || ''
      },
      body: JSON.stringify({
        title: 'Test Bildirim - Otomatik Hatırlatıcı',
        message: 'Bu bir test bildirimidir. Eğer bunu görüyorsan otomatik bildirim sistemi çalışıyor! 🎉',
        target_audience: 'all',
        test_mode: true // Only send to Ozan
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        success: false,
        error: data.error || 'Failed to send notification'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent via broadcast-channel',
      result: data
    })

  } catch (error) {
    console.error('Error in test-force:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

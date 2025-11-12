import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/debug/push-tokens - Check push notification tokens
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if push_notification_tokens table exists
    const { data: tokens, error: tokensError } = await supabase
      .from('push_notification_tokens')
      .select('*')
      .limit(10)

    if (tokensError) {
      console.log('Push notification tokens table error:', tokensError)
      return NextResponse.json({ 
        error: 'Push notification tokens table not found',
        details: tokensError.message,
        suggestion: 'Mobile app may not have registered any push tokens yet'
      })
    }

    // Get token stats by platform
    const { data: tokenStats } = await supabase
      .from('push_notification_tokens')
      .select('platform, is_active')

    const stats = tokenStats?.reduce((acc: any, token: any) => {
      const key = `${token.platform}_${token.is_active ? 'active' : 'inactive'}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({ 
      tokens: tokens || [],
      token_stats: stats,
      total_tokens: tokens?.length || 0,
      message: tokens?.length === 0 ? 'No push tokens registered. Mobile app needs to register FCM tokens.' : 'Push tokens found'
    })

  } catch (error) {
    console.error('Error in debug push tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
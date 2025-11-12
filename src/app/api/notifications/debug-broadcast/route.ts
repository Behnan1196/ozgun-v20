import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// GET /api/notifications/debug-broadcast - Debug broadcast notification system
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coordinator/admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['coordinator', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all coaches
    const { data: coaches } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('role', 'coach')

    // Get tokens for each coach
    const coachesWithTokens = await Promise.all(
      (coaches || []).map(async (coach) => {
        const { data: tokens } = await supabase
          .from('notification_tokens')
          .select('*')
          .eq('user_id', coach.id)
          .eq('is_active', true)

        const mobileTokens = tokens?.filter(t => ['ios', 'android'].includes(t.platform)) || []

        return {
          ...coach,
          total_tokens: tokens?.length || 0,
          mobile_tokens: mobileTokens.length,
          tokens: mobileTokens.map(t => ({
            platform: t.platform,
            token_type: t.token_type,
            token_preview: t.token.substring(0, 20) + '...',
            created_at: t.created_at
          }))
        }
      })
    )

    // Check Firebase Admin config
    const hasFirebaseConfig = !!process.env.GOOGLE_SERVICES_JSON

    return NextResponse.json({
      firebase_configured: hasFirebaseConfig,
      total_coaches: coaches?.length || 0,
      coaches_with_mobile_tokens: coachesWithTokens.filter(c => c.mobile_tokens > 0).length,
      coaches: coachesWithTokens
    })

  } catch (error) {
    console.error('Error in debug-broadcast:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}

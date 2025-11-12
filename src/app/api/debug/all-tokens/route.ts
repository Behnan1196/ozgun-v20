import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/debug/all-tokens - Check all possible token tables
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: any = {}

    // Check notification_tokens table
    try {
      // Get ALL tokens (active and inactive)
      const { data: allTokens, error: allError } = await supabase
        .from('notification_tokens')
        .select('token, token_type, platform, user_id, is_active, created_at')

      // Get only active tokens
      const { data: tokens1, error: error1 } = await supabase
        .from('notification_tokens')
        .select('token, token_type, platform, user_id, is_active, created_at')
        .eq('is_active', true)

      if (!error1) {
        const tokenTypes = tokens1?.reduce((acc: any, token: any) => {
          acc[token.token_type] = (acc[token.token_type] || 0) + 1
          return acc
        }, {}) || {}

        const expoLikeTokens = tokens1?.filter(t => 
          t.token_type === 'expo' || 
          t.token?.startsWith('ExponentPushToken[') || 
          t.token?.startsWith('ExpoPushToken[')
        ).length || 0

        // Get user info for tokens
        const userIds = Array.from(new Set(tokens1?.map(t => t.user_id) || []))
        const { data: tokenUsers } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, role')
          .in('id', userIds)

        const userMap = new Map(tokenUsers?.map(u => [u.id, u]) || [])

        results.notification_tokens = {
          exists: true,
          count: allTokens?.length || 0,
          active_tokens: tokens1?.length || 0,
          inactive_tokens: (allTokens?.length || 0) - (tokens1?.length || 0),
          sample: tokens1?.slice(0, 10).map(t => ({
            token_type: t.token_type,
            platform: t.platform,
            token_preview: t.token?.substring(0, 30) + '...',
            user: userMap.get(t.user_id) ? {
              name: userMap.get(t.user_id)?.full_name,
              email: userMap.get(t.user_id)?.email,
              role: userMap.get(t.user_id)?.role
            } : 'Unknown',
            created_at: t.created_at
          })) || [],
          token_types: tokenTypes,
          expo_tokens: tokens1?.filter(t => t.token_type === 'expo').length || 0,
          expo_like_tokens: expoLikeTokens,
          users_with_tokens: userIds.length,
          tokens_by_role: {
            student: tokens1?.filter(t => userMap.get(t.user_id)?.role === 'student').length || 0,
            coach: tokens1?.filter(t => userMap.get(t.user_id)?.role === 'coach').length || 0,
            coordinator: tokens1?.filter(t => userMap.get(t.user_id)?.role === 'coordinator').length || 0
          }
        }
      } else {
        results.notification_tokens = {
          exists: false,
          error: error1.message
        }
      }
    } catch (e) {
      results.notification_tokens = {
        exists: false,
        error: 'Table access failed'
      }
    }

    // Check push_notification_tokens table
    try {
      const { data: tokens2, error: error2 } = await supabase
        .from('push_notification_tokens')
        .select('*')
        .limit(10)

      if (!error2) {
        results.push_notification_tokens = {
          exists: true,
          count: tokens2?.length || 0,
          sample: tokens2?.slice(0, 3) || [],
          expo_tokens: tokens2?.filter(t => t.token_type === 'expo').length || 0
        }
      } else {
        results.push_notification_tokens = {
          exists: false,
          error: error2.message
        }
      }
    } catch (e) {
      results.push_notification_tokens = {
        exists: false,
        error: 'Table access failed'
      }
    }

    // Check device_tokens table (alternative name)
    try {
      const { data: tokens3, error: error3 } = await supabase
        .from('device_tokens')
        .select('*')
        .limit(10)

      if (!error3) {
        results.device_tokens = {
          exists: true,
          count: tokens3?.length || 0,
          sample: tokens3?.slice(0, 3) || []
        }
      } else {
        results.device_tokens = {
          exists: false,
          error: error3.message
        }
      }
    } catch (e) {
      results.device_tokens = {
        exists: false,
        error: 'Table access failed'
      }
    }

    // Get user count for reference
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .in('role', ['student', 'coach'])

    results.users = {
      total_mobile_users: users?.length || 0,
      students: users?.filter(u => u.role === 'student').length || 0,
      coaches: users?.filter(u => u.role === 'coach').length || 0
    }

    return NextResponse.json({ 
      debug_info: results,
      message: 'Token table analysis complete'
    })

  } catch (error) {
    console.error('Error in debug all-tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
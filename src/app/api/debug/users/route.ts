import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/debug/users - Debug user roles and counts
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with their roles
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, email')
      .order('role')
      .order('full_name')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Group by role
    const roleStats = users?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({ 
      users: users || [],
      role_stats: roleStats,
      total_users: users?.length || 0
    })

  } catch (error) {
    console.error('Error in debug users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
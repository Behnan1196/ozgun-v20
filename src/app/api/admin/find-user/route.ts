import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/find-user?name=Ozan - Find user by name
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'name parameter required' },
        { status: 400 }
      )
    }

    // Search for user by name
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .ilike('full_name', `%${name}%`)
      .limit(10)

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: users || [],
      count: users?.length || 0
    })
  } catch (error) {
    console.error('Error in find-user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

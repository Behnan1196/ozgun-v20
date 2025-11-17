import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/admin/reset-password - Reset user password (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { user_id, new_password } = body

    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: 'user_id ve new_password gerekli' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Update user password using admin client
    const { data, error } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (error) {
      console.error('Error resetting password:', error)
      return NextResponse.json(
        { error: 'Şifre sıfırlanamadı: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${profile.full_name} için şifre başarıyla sıfırlandı`,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email
      }
    })
  } catch (error) {
    console.error('Error in reset-password:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

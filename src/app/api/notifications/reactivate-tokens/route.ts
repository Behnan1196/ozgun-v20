import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Reactivating mobile tokens:', new Date().toISOString());
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
    // Reactivate all mobile tokens for the user
    const { data, error } = await supabase
      .from('notification_tokens')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('platform', ['ios', 'android'])
      .select();
    
    if (error) {
      console.error('❌ Error reactivating tokens:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reactivate tokens',
        details: error 
      }, { status: 500 });
    }
    
    console.log(`✅ Reactivated ${data?.length || 0} mobile tokens for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: `Reactivated ${data?.length || 0} mobile tokens`,
      reactivatedTokens: data
    });
    
  } catch (error) {
    console.error('❌ Reactivation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Token reactivation endpoint',
    usage: 'POST with { userId: "user-id" }'
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Force mobile token registration test:', new Date().toISOString());
    const { userId, testToken } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
    // Create a test mobile token
    const token = testToken || `ExponentPushToken[test-${Date.now()}]`;
    
    const { data, error } = await supabase
      .from('notification_tokens')
      .insert({
        user_id: userId,
        token,
        token_type: 'expo',
        platform: 'android',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating test token:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test token',
        details: error 
      }, { status: 500 });
    }
    
    console.log('✅ Test mobile token created:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Test mobile token created successfully',
      token: data
    });
    
  } catch (error) {
    console.error('❌ Force registration error:', error);
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
    message: 'Force mobile token registration endpoint',
    usage: 'POST with { userId: "user-id", testToken?: "optional-token" }'
  });
}

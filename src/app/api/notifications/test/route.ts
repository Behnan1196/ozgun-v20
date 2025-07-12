import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId, platform } = body;
    
    if (!fromUserId || !toUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'fromUserId and toUserId are required' 
      }, { status: 400 });
    }

    // Create admin Supabase client
    const supabase = createAdminClient();
    
    // Get sender info
    const { data: fromUser } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', fromUserId)
      .single();

    // Get receiver info and tokens
    const { data: toUser } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', toUserId)
      .single();

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', toUserId);

    // Send test notification
    const testResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: toUserId,
        title: '🧪 Cross-Platform Test',
        body: `Test message from ${fromUser?.full_name || 'Unknown'} (${platform || 'unknown platform'})`,
        data: {
          type: 'test_cross_platform',
          fromUserId,
          fromUserName: fromUser?.full_name,
          testPlatform: platform,
          timestamp: new Date().toISOString()
        }
      })
    });

    const testResult = await testResponse.json();

    return NextResponse.json({
      success: true,
      test: {
        fromUser: fromUser?.full_name,
        toUser: toUser?.full_name,
        availableTokens: tokens?.length || 0,
        platforms: tokens?.map(t => t.platform) || [],
        notificationResult: testResult,
        testTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in notification test:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check notification tokens for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get all tokens for the user
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    // Get recent notification logs for the user
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const summary = {
      userId,
      totalTokens: tokens?.length || 0,
      activeTokens: tokens?.filter(t => t.is_active).length || 0,
      platforms: {
        ios: tokens?.filter(t => t.platform === 'ios').length || 0,
        android: tokens?.filter(t => t.platform === 'android').length || 0,
      },
      tokenTypes: {
        expo: tokens?.filter(t => t.token_type === 'expo').length || 0,
        fcm: tokens?.filter(t => t.token_type === 'fcm').length || 0,
        apns: tokens?.filter(t => t.token_type === 'apns').length || 0,
      },
      recentNotifications: logs?.length || 0
    };

    return NextResponse.json({
      success: true,
      summary,
      tokens: tokens || [],
      recentLogs: logs || []
    });

  } catch (error) {
    console.error('❌ Error in debug tokens endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

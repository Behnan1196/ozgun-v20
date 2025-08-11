import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get ALL notification tokens (not just active ones)
    const { data: allTokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    // Group by platform and status
    const tokensByPlatform = allTokens?.reduce((acc: any, token: any) => {
      const key = `${token.platform}-${token.is_active ? 'active' : 'inactive'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(token);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        allTokens: allTokens || [],
        tokensByPlatform: tokensByPlatform || {},
        summary: {
          totalTokens: allTokens?.length || 0,
          activeTokens: allTokens?.filter(t => t.is_active).length || 0,
          inactiveTokens: allTokens?.filter(t => !t.is_active).length || 0,
          mobileTokens: allTokens?.filter(t => ['ios', 'android'].includes(t.platform)).length || 0,
          webTokens: allTokens?.filter(t => t.platform === 'web').length || 0,
          expoTokens: allTokens?.filter(t => t.token_type === 'expo').length || 0,
          fcmTokens: allTokens?.filter(t => t.token_type === 'fcm').length || 0,
          apnsTokens: allTokens?.filter(t => t.token_type === 'apns').length || 0,
        }
      }
    });

  } catch (error) {
    console.error('Debug all tokens error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

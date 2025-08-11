import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get all mobile notification tokens
    const { data: mobileTokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .in('platform', ['ios', 'android'])
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mobile tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch mobile tokens' }, { status: 500 });
    }

    // Get recent notification logs for mobile users
    const { data: mobileLogs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .in('user_id', mobileTokens?.map(t => t.user_id) || [])
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Error fetching mobile logs:', logsError);
    }

    // Get webhook call logs (if any)
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('notification_type', 'chat_message')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        mobileTokens: mobileTokens || [],
        recentMobileLogs: mobileLogs || [],
        recentWebhookLogs: webhookLogs || [],
        summary: {
          totalMobileTokens: mobileTokens?.length || 0,
          iosTokens: mobileTokens?.filter(t => t.platform === 'ios').length || 0,
          androidTokens: mobileTokens?.filter(t => t.platform === 'android').length || 0,
          expoTokens: mobileTokens?.filter(t => t.token_type === 'expo').length || 0,
          fcmTokens: mobileTokens?.filter(t => t.token_type === 'fcm').length || 0,
          apnsTokens: mobileTokens?.filter(t => t.token_type === 'apns').length || 0,
          recentFailures: mobileLogs?.filter(log => log.status === 'failed').length || 0,
          recentSuccess: mobileLogs?.filter(log => log.status === 'sent').length || 0,
          webhookCalls: webhookLogs?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Mobile debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

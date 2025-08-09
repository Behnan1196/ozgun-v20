import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get Chrome-specific notification tokens
    const { data: chromeTokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('platform', 'web')
      .eq('browser', 'chrome')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Chrome tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch Chrome tokens' }, { status: 500 });
    }

    // Get recent notification logs for Chrome users
    const { data: chromeLogs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .in('user_id', chromeTokens?.map(t => t.user_id) || [])
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Error fetching Chrome logs:', logsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        chromeTokens: chromeTokens || [],
        recentLogs: chromeLogs || [],
        summary: {
          totalChromeTokens: chromeTokens?.length || 0,
          recentFailures: chromeLogs?.filter(log => log.status === 'failed').length || 0,
          recentSuccess: chromeLogs?.filter(log => log.status === 'sent').length || 0
        }
      }
    });

  } catch (error) {
    console.error('Chrome debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();
    const supabase = createClient();
    
    if (action === 'refresh_token') {
      // Delete existing Chrome tokens for user to force re-registration
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('platform', 'web')
        .eq('browser', 'chrome');

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Chrome tokens cleared. User should re-register on next visit.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Chrome debug POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

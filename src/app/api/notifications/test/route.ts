import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Send test notification via Expo Push API
async function sendTestExpoPushNotification(token: string, userRole: string) {
  const message = {
    to: token,
    sound: 'default',
    title: '🧪 Test Notification',
    body: `Hello ${userRole}! Push notifications are working correctly.`,
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
      testData: 'This is test data'
    },
    channelId: 'chat',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

export async function POST() {
  try {
    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get user's active notification tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching notification tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch notification tokens' },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active notification tokens found. Please ensure notifications are enabled in the app.',
        tokenCount: 0
      });
    }

    console.log(`📤 Sending test notifications to ${tokens.length} tokens for user ${user.id}`);

    const results = [];

    // Send test notification to each token
    for (const tokenRecord of tokens) {
      try {
        let result;
        
        if (tokenRecord.token_type === 'expo') {
          result = await sendTestExpoPushNotification(tokenRecord.token, profile.role);
        } else {
          // For FCM/APNs tokens, you would implement direct FCM API calls here
          result = { 
            success: false, 
            error: `Direct ${tokenRecord.token_type} notifications not implemented yet` 
          };
        }

        results.push({
          tokenId: tokenRecord.id,
          platform: tokenRecord.platform,
          tokenType: tokenRecord.token_type,
          result: result
        });

        console.log(`✅ Test notification sent to ${tokenRecord.platform} (${tokenRecord.token_type})`);
      } catch (error) {
        console.error(`❌ Error sending test notification to token ${tokenRecord.id}:`, error);
        results.push({
          tokenId: tokenRecord.id,
          platform: tokenRecord.platform,
          tokenType: tokenRecord.token_type,
          result: { success: false, error: error instanceof Error ? error.message : String(error) }
        });
      }
    }

    // Count successful sends
    const successCount = results.filter(r => r.result.success !== false).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Test notifications sent to ${successCount}/${tokens.length} tokens`,
      tokenCount: tokens.length,
      successCount,
      results: results
    });

  } catch (error) {
    console.error('API error in test notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check notification status
export async function GET() {
  try {
    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification tokens and recent logs
    const [tokensResult, logsResult] = await Promise.all([
      supabase
        .from('notification_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      
      supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return NextResponse.json({
      success: true,
      tokens: tokensResult.data || [],
      recentLogs: logsResult.data || [],
      activeTokenCount: (tokensResult.data || []).filter(t => t.is_active).length
    });

  } catch (error) {
    console.error('API error in notification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

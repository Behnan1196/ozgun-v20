import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Create Supabase admin client for testing
    const supabase = createAdminClient();

    // Get user's tokens (bypassing RLS for testing)
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    console.log(`🧪 Testing notifications for user ${userId}`);
    console.log(`📱 Found ${tokens.length} active tokens`);

    const results = [];

    for (const tokenData of tokens) {
      try {
        if (tokenData.token_type === 'expo') {
          // Send Expo push notification
          const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: tokenData.token,
              title: '🧪 Test Notification',
              body: 'This is a test notification from your coaching app!',
              data: {
                type: 'test',
                timestamp: new Date().toISOString()
              },
              sound: 'default',
              priority: 'high'
            }),
          });

          const expoResult = await expoPushResponse.json();
          results.push({
            platform: tokenData.platform,
            tokenType: tokenData.token_type,
            success: expoResult.data?.[0]?.status === 'ok',
            result: expoResult
          });

          console.log(`📤 Expo notification sent to ${tokenData.platform}:`, expoResult);

        } else if (tokenData.token_type === 'fcm') {
          // For FCM tokens, we'd need the Firebase Admin SDK
          // For now, just log that we found the token
          results.push({
            platform: tokenData.platform,
            tokenType: tokenData.token_type,
            success: false,
            result: 'FCM sending not implemented in test endpoint'
          });

          console.log(`📤 FCM token found for ${tokenData.platform}: ${tokenData.token.substring(0, 20)}...`);
        }

      } catch (error) {
        console.error(`❌ Error sending to ${tokenData.platform}:`, error);
        results.push({
          platform: tokenData.platform,
          tokenType: tokenData.token_type,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test notifications sent to ${tokens.length} tokens`,
      results,
      tokens: tokens.map(t => ({
        platform: t.platform,
        tokenType: t.token_type,
        tokenPreview: t.token.substring(0, 20) + '...'
      }))
    });

  } catch (error) {
    console.error('Test send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Send POST request with {"userId": "user-id-here"} to test notifications'
  });
}

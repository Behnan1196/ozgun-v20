import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, tokenType, platform, deviceInfo } = await request.json();

    // Validate required fields
    if (!userId || !token || !tokenType || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, token, tokenType, platform' },
        { status: 400 }
      );
    }

    // Validate token type
    if (!['expo', 'fcm', 'apns'].includes(tokenType)) {
      return NextResponse.json(
        { error: 'Invalid token type. Must be: expo, fcm, or apns' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: ios, android, or web' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the userId matches the authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Disable web notifications - only allow mobile platforms
    if (platform === 'web') {
      console.log('⚠️ Web notification registration blocked - mobile-only system');
      return NextResponse.json(
        { error: 'Web notifications are disabled. Mobile-only notification system.' },
        { status: 400 }
      );
    }

    console.log(`📱 Registering ${platform} ${tokenType} token for user ${userId}`);

    // First, deactivate any existing tokens for this user/platform combination
    await supabase
      .from('notification_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('platform', platform);

    // Insert or update the new token
    const { data, error } = await supabase
      .from('notification_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          token_type: tokenType,
          platform,
          device_info: deviceInfo || {},
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token,platform',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving notification token:', error);
      return NextResponse.json(
        { error: 'Failed to save notification token' },
        { status: 500 }
      );
    }

    console.log(`✅ ${platform} ${tokenType} token registered successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `${platform} ${tokenType} token registered successfully`,
      tokenId: data.id
    });

  } catch (error) {
    console.error('❌ Error in token registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check token status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's active tokens
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    const summary = {
      totalTokens: tokens?.length || 0,
      platforms: {
        ios: tokens?.filter(t => t.platform === 'ios').length || 0,
        android: tokens?.filter(t => t.platform === 'android').length || 0,
      },
      tokenTypes: {
        expo: tokens?.filter(t => t.token_type === 'expo').length || 0,
        fcm: tokens?.filter(t => t.token_type === 'fcm').length || 0,
        apns: tokens?.filter(t => t.token_type === 'apns').length || 0,
      }
    };

    return NextResponse.json({
      success: true,
      userId: user.id,
      tokens: tokens || [],
      summary
    });

  } catch (error) {
    console.error('❌ Error checking token status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
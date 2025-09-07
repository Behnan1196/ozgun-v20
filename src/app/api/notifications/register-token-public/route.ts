import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Public endpoint for mobile apps to register notification tokens
 * This endpoint uses admin client to bypass RLS for mobile app registration
 */
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
    if (!['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: ios or android (mobile-only)' },
        { status: 400 }
      );
    }

    console.log(`📱 Public registration: ${platform} ${tokenType} token for user ${userId}`);

    const supabase = createAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      console.error('❌ User verification failed:', userError);
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // First, deactivate any existing tokens for this user/platform combination
    const { error: deactivateError } = await supabase
      .from('notification_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (deactivateError) {
      console.error('❌ Error deactivating old tokens:', deactivateError);
      // Continue anyway - this is not critical
    }

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

    console.log(`✅ Public registration successful: ${platform} ${tokenType} token for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `${platform} ${tokenType} token registered successfully`,
      tokenId: data.id
    });

  } catch (error) {
    console.error('❌ Error in public token registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
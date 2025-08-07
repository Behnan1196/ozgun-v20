import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, tokenType, platform, browser } = await request.json();

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
        { error: 'Invalid token type. Must be expo, fcm, or apns' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be ios, android, or web' },
        { status: 400 }
      );
    }

    // Create Supabase client for public access
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // First, try to update existing token
    const { data: existingToken } = await supabase
      .from('notification_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('token_type', tokenType)
      .single();

    let data, error;
    
    if (existingToken) {
      // Update existing token
      const result = await supabase
        .from('notification_tokens')
        .update({
          token,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new token
      const result = await supabase
        .from('notification_tokens')
        .insert({
          user_id: userId,
          token,
          token_type: tokenType,
          platform,
          is_active: true
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving notification token:', error);
      return NextResponse.json(
        { error: 'Failed to save notification token', details: error },
        { status: 500 }
      );
    }

    console.log(`✅ Notification token registered for user ${userId} on ${platform} (${tokenType})`);

    return NextResponse.json({
      success: true,
      message: 'Notification token registered successfully',
      tokenId: data.id
    });

  } catch (error) {
    console.error('API error in register-token-public:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

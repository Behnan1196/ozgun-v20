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

    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user can only register tokens for themselves
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden: Can only register tokens for yourself' }, { status: 403 });
    }

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
        { error: 'Failed to save notification token' },
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
    console.error('API error in register-token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification tokens
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notification tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notification tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens: tokens || []
    });

  } catch (error) {
    console.error('API error in get tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const platform = searchParams.get('platform');

    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('notification_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (tokenId) {
      query = query.eq('id', tokenId);
    } else if (platform) {
      query = query.eq('platform', platform);
    } else {
      // Deactivate all tokens for the user
    }

    const { error } = await query;

    if (error) {
      console.error('Error deactivating notification token:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate notification token' },
        { status: 500 }
      );
    }

    console.log(`✅ Notification token(s) deactivated for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Notification token(s) deactivated successfully'
    });

  } catch (error) {
    console.error('API error in delete token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

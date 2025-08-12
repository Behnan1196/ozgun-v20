import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 User Activity API called:', new Date().toISOString());
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Auth check result:', { hasUser: !!user, error: userError?.message });
    
    if (userError || !user) {
      console.log('❌ Authentication failed for user activity API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, isActive, platform } = body;

    if (!channelId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'channelId and isActive are required' }, { status: 400 });
    }

    // Store user activity in a simple table for tracking
    const activityData = {
      user_id: user.id,
      channel_id: channelId,
      is_active: isActive,
      platform: platform || 'web',
      last_activity: new Date().toISOString()
    };

    if (isActive) {
      // User is now active in this channel
      const { error } = await supabase
        .from('user_activity')
        .upsert(activityData, {
          onConflict: 'user_id,channel_id'
        });

      if (error) {
        console.error('Error updating user activity:', error);
        return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
      }
    } else {
      // User is no longer active in this channel
      const { error } = await supabase
        .from('user_activity')
        .delete()
        .eq('user_id', user.id)
        .eq('channel_id', channelId);

      if (error) {
        console.error('Error removing user activity:', error);
        return NextResponse.json({ error: 'Failed to remove activity' }, { status: 500 });
      }
    }

    console.log(`👤 User ${user.id} is ${isActive ? 'active' : 'inactive'} in channel ${channelId} (${platform})`);
    console.log(`📊 Activity data:`, { user_id: user.id, channel_id: channelId, is_active: isActive, platform, timestamp: new Date().toISOString() });

    return NextResponse.json({ 
      success: true, 
      message: `Activity ${isActive ? 'started' : 'stopped'} for channel ${channelId}` 
    });

  } catch (error) {
    console.error('Error in user activity API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');

    if (channelId) {
      // Get activity for specific channel
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching channel activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
      }

      return NextResponse.json({ activeUsers: data || [] });
    } else {
      // Get all user's active channels
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
      }

      return NextResponse.json({ activeChannels: data || [] });
    }

  } catch (error) {
    console.error('Error in user activity GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

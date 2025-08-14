import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, channelId } = await request.json();
    
    if (!userId || !channelId) {
      return NextResponse.json({ error: 'userId and channelId required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Check user activity for specific channel
    const { data: userActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('channel_id', channelId)
      .eq('is_active', true);

    if (activityError) {
      return NextResponse.json({ error: activityError.message }, { status: 500 });
    }

    // Also get all activity for this user
    const { data: allActivity, error: allError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        specificChannelActivity: userActivity,
        isActivelyViewingChannel: userActivity && userActivity.length > 0,
        allRecentActivity: allActivity || []
      }
    });

  } catch (error) {
    console.error('Error checking activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


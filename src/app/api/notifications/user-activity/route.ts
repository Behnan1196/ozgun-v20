import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// POST /api/notifications/user-activity - Update user activity for chat notifications
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, activityType } = body;

    // Update user activity
    const { error } = await supabase
      .from('user_activity')
      .upsert({
        user_id: user.id,
        current_screen: channelId ? 'chat' : null,
        last_activity_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating activity:', error);
      return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in user-activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

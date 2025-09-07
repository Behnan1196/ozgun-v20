import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVideoInviteNotification } from '@/lib/notifications/video-invite-service';

/**
 * Send video call invite notification
 * This endpoint creates a video invite record and sends push notification
 */
export async function POST(request: NextRequest) {
  try {
    const { toUserId, message, expiresInMinutes = 5 } = await request.json();

    // Validate required fields
    if (!toUserId) {
      return NextResponse.json(
        { error: 'Missing required field: toUserId' },
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

    const fromUserId = user.id;

    // Don't allow sending invite to yourself
    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'Cannot send video invite to yourself' },
        { status: 400 }
      );
    }

    console.log(`📹 Creating video invite from ${fromUserId} to ${toUserId}`);

    // Get user names for the invite
    const { data: fromUserData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', fromUserId)
      .single();

    const { data: toUserData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', toUserId)
      .single();

    const fromUserName = fromUserData?.full_name || 'Someone';
    const toUserName = toUserData?.full_name || 'Someone';

    // Create video call invite record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const { data: invite, error: inviteError } = await supabase
      .from('video_call_invites')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        from_user_name: fromUserName,
        to_user_name: toUserName,
        message: message || null,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('❌ Error creating video invite:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create video invite' },
        { status: 500 }
      );
    }

    console.log(`✅ Video invite created with ID: ${invite.id}`);

    // Send push notification
    try {
      const notificationResult = await sendVideoInviteNotification({
        inviteId: invite.id,
        fromUserId,
        toUserId,
        fromUserName,
        toUserName,
        message
      });

      if (!notificationResult.success) {
        console.error('❌ Failed to send video invite notification:', notificationResult.error);
        // Don't fail the entire request if notification fails
        return NextResponse.json({
          success: true,
          inviteId: invite.id,
          message: 'Video invite created but notification failed to send',
          notificationError: notificationResult.error
        });
      }

      console.log(`✅ Video invite notification sent successfully`);

      return NextResponse.json({
        success: true,
        inviteId: invite.id,
        message: 'Video invite created and notification sent',
        notificationsSent: notificationResult.notificationsSent
      });

    } catch (notificationError) {
      console.error('❌ Error sending video invite notification:', notificationError);
      return NextResponse.json({
        success: true,
        inviteId: invite.id,
        message: 'Video invite created but notification failed to send',
        notificationError: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
    }

  } catch (error) {
    console.error('❌ Error in video invite endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get pending video invites for the current user
 */
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

    // Get pending invites received by this user
    const { data: receivedInvites, error: receivedError } = await supabase
      .from('video_call_invites')
      .select('*')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (receivedError) {
      console.error('❌ Error fetching received invites:', receivedError);
      return NextResponse.json(
        { error: 'Failed to fetch received invites' },
        { status: 500 }
      );
    }

    // Get pending invites sent by this user
    const { data: sentInvites, error: sentError } = await supabase
      .from('video_call_invites')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('❌ Error fetching sent invites:', sentError);
      return NextResponse.json(
        { error: 'Failed to fetch sent invites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      receivedInvites: receivedInvites || [],
      sentInvites: sentInvites || [],
      totalReceived: receivedInvites?.length || 0,
      totalSent: sentInvites?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching video invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

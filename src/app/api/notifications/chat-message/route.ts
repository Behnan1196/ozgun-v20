import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { sendChatMessageNotification } from '@/lib/notifications/chat-message-service';

/**
 * Send chat message notification
 * This endpoint sends push notification for chat messages
 * Similar to video-invite endpoint but for chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recipientId, messageText, channelId } = body;

    // Validate required fields
    if (!recipientId || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, messageText' },
        { status: 400 }
      );
    }

    // Get sender's profile
    const { data: senderProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !senderProfile) {
      console.error('❌ Error fetching sender profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch sender profile' },
        { status: 500 }
      );
    }

    const senderName = senderProfile.full_name || 'Bilinmeyen';

    console.log(`💬 Chat message notification request from ${senderName} to ${recipientId}`);

    // Send push notification
    try {
      const notificationResult = await sendChatMessageNotification({
        senderId: user.id,
        senderName,
        recipientId,
        messageText,
        channelId: channelId || 'unknown',
      });

      if (!notificationResult.success && notificationResult.notificationsSent === 0) {
        console.error('❌ Failed to send chat notification:', notificationResult.error);
        
        // Don't fail the entire request if notification fails
        return NextResponse.json({
          success: true,
          message: 'Message sent but notification failed to send',
          notificationError: notificationResult.error
        });
      }

      console.log(`✅ Chat notification sent successfully (${notificationResult.notificationsSent} device(s))`);

      return NextResponse.json({
        success: true,
        message: 'Chat notification sent',
        notificationsSent: notificationResult.notificationsSent
      });

    } catch (notificationError) {
      console.error('❌ Error sending chat notification:', notificationError);
      return NextResponse.json({
        success: true,
        message: 'Message sent but notification failed to send',
        notificationError: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
    }

  } catch (error) {
    console.error('❌ Chat message notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Chat message notification endpoint is accessible',
    timestamp: new Date().toISOString()
  });
}

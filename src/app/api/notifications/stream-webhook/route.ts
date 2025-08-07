import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Stream Chat webhook signature verification
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Send push notification via FCM
async function sendFCMNotification(token: string, title: string, body: string, data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    // For Expo tokens, use Expo Push API
    if (token.startsWith('ExponentPushToken')) {
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          type: 'chat_message'
        },
        channelId: 'chat',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return await response.json();
    }

    // For FCM tokens (web/native), use FCM API
    // You'll need to implement FCM v1 API call here
    // This requires service account credentials
    console.log('FCM notification not implemented yet for token:', token);
    return { success: false, error: 'FCM not implemented' };
    
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Log notification attempt
async function logNotification(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  type: string,
  title: string,
  body: string,
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  status: string,
  errorMessage?: string
) {
  try {
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        body,
        data,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    
    // Verify webhook signature (temporarily disabled for testing)
    const webhookSecret = process.env.STREAM_WEBHOOK_SECRET;
    if (false && webhookSecret && signature) { // Temporarily disabled
      if (!verifyWebhookSignature(body, signature as string, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    console.log('🔓 Webhook signature verification disabled for testing');

    const event = JSON.parse(body);
    console.log('📨 Stream webhook received:', event.type);

    // Only handle message.new events
    if (event.type !== 'message.new') {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const message = event.message;
    const channel = event.channel;
    const sender = event.user;

    // Don't send notifications for system messages or messages from bots
    if (!message || !sender || sender.id === 'system' || sender.role === 'admin') {
      return NextResponse.json({ success: true, message: 'System message ignored' });
    }

    console.log(`💬 New message from ${sender.name} in channel ${channel.id}`);

    // Get channel members
    const memberIds = Object.keys(channel.members || {});
    
    // Find offline members (everyone except the sender)
    const offlineMembers = memberIds.filter(memberId => 
      memberId !== sender.id && 
      !channel.members[memberId]?.online
    );

    if (offlineMembers.length === 0) {
      console.log('✅ All members are online, no notifications needed');
      return NextResponse.json({ success: true, message: 'All members online' });
    }

    console.log(`📤 Sending notifications to ${offlineMembers.length} offline members`);

    // Get admin supabase client
    const supabase = createAdminClient();

    // Send notifications to offline members
    for (const memberId of offlineMembers) {
      try {
        // Get user's notification tokens
        const { data: tokens, error: tokensError } = await supabase
          .from('notification_tokens')
          .select('*')
          .eq('user_id', memberId)
          .eq('is_active', true);

        if (tokensError) {
          console.error(`Error fetching tokens for user ${memberId}:`, tokensError);
          continue;
        }

        if (!tokens || tokens.length === 0) {
          console.log(`⚠️ No notification tokens found for user ${memberId}`);
          await logNotification(
            supabase,
            memberId,
            'chat_message',
            'New Message',
            message.text || 'You have a new message',
            { channelId: channel.id, messageId: message.id },
            'failed',
            'No notification tokens found'
          );
          continue;
        }

        // Prepare notification content
        const title = `💬 ${sender.name || 'Someone'}`;
        const body = message.text || 'Sent you a message';
        const notificationData = {
          type: 'chat_message',
          channelId: channel.id,
          messageId: message.id,
          senderId: sender.id,
          senderName: sender.name,
          chatUrl: `/chat/${channel.id}`,
          url: `/chat/${channel.id}`
        };

        // Send notification to each token
        for (const tokenRecord of tokens) {
          try {
            const result = await sendFCMNotification(
              tokenRecord.token,
              title,
              body,
              notificationData
            );

            const status = result.success !== false ? 'sent' : 'failed';
            const errorMessage = result.error || null;

            await logNotification(
              supabase,
              memberId,
              'chat_message',
              title,
              body,
              notificationData,
              status,
              errorMessage
            );

            console.log(`📱 Notification ${status} to ${memberId} (${tokenRecord.platform})`);
          } catch (error) {
            console.error(`Error sending notification to token ${tokenRecord.id}:`, error);
            await logNotification(
              supabase,
              memberId,
              'chat_message',
              title,
              body,
              notificationData,
              'failed',
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      } catch (error) {
        console.error(`Error processing notifications for user ${memberId}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notifications sent to ${offlineMembers.length} offline members` 
    });

  } catch (error) {
    console.error('Stream webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

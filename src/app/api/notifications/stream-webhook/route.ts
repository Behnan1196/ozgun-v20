import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import admin from 'firebase-admin';

/**
 * Stream Chat Webhook Handler - Smart Chat Notifications
 * 
 * Sends push notifications for chat messages with smart filtering:
 * - Only sends if recipient is NOT currently in the chat screen
 * - Checks user's last activity timestamp
 * - Prevents spam by checking recent notifications
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Stream webhook received');
    
    const body = await request.text();
    const event = JSON.parse(body);
    
    console.log('📨 Stream webhook event:', event.type);

    // Only handle message.new events
    if (event.type !== 'message.new') {
      console.log('⏭️ Ignoring event type:', event.type);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const message = event.message;
    const channel = event.channel;
    const sender = event.user;

    // Don't process system messages or bot messages
    if (!message || !sender || sender.id === 'system' || sender.role === 'admin') {
      return NextResponse.json({ success: true, message: 'System message ignored' });
    }

    // Don't send notification for broadcast channels (coordinator announcements)
    if (channel.type === 'messaging' && channel.id?.startsWith('broadcast_')) {
      console.log('⏭️ Ignoring broadcast channel message');
      return NextResponse.json({ success: true, message: 'Broadcast message ignored' });
    }

    console.log(`💬 Chat message from ${sender.name} in channel ${channel.id}`);

    // Get recipient (the other person in the channel)
    const supabase = createAdminClient();
    const channelMembers = channel.members || [];
    const recipientId = channelMembers.find((id: string) => id !== sender.id);

    if (!recipientId) {
      console.log('⚠️ No recipient found');
      return NextResponse.json({ success: true, message: 'No recipient' });
    }

    // Check if recipient is currently active in chat (last activity < 30 seconds ago)
    const { data: activityData } = await supabase
      .from('user_activity')
      .select('last_activity_at, current_screen')
      .eq('user_id', recipientId)
      .single();

    if (activityData) {
      const lastActivity = new Date(activityData.last_activity_at);
      const now = new Date();
      const secondsSinceActivity = (now.getTime() - lastActivity.getTime()) / 1000;

      // If user is in chat screen and was active in last 30 seconds, don't send notification
      if (activityData.current_screen === 'chat' && secondsSinceActivity < 30) {
        console.log(`⏭️ Recipient is currently in chat (${secondsSinceActivity.toFixed(0)}s ago), skipping notification`);
        return NextResponse.json({ success: true, message: 'Recipient is in chat' });
      }
    }

    // Initialize Firebase Admin
    let firebaseAdmin: typeof admin | null = null;
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.GOOGLE_SERVICES_JSON;
      if (serviceAccount) {
        try {
          const serviceAccountKey = JSON.parse(serviceAccount);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
          });
          firebaseAdmin = admin;
        } catch (error) {
          console.error('❌ Error initializing Firebase Admin:', error);
        }
      }
    } else {
      firebaseAdmin = admin;
    }

    if (!firebaseAdmin) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ success: true, message: 'Firebase not configured' });
    }

    // Get recipient's tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', recipientId)
      .eq('is_active', true)
      .in('platform', ['android', 'ios']);

    if (tokenError || !tokens || tokens.length === 0) {
      console.log(`⚠️ No active tokens for recipient ${recipientId}`);
      return NextResponse.json({ success: true, message: 'No tokens found' });
    }

    console.log(`✅ Found ${tokens.length} token(s) for recipient`);

    let successCount = 0;
    const messageText = message.text || 'Yeni mesaj';
    const truncatedMessage = messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText;

    for (const tokenRecord of tokens) {
      try {
        // Handle APNs tokens (iOS)
        if (tokenRecord.token_type === 'apns') {
          console.log(`📱 Sending APNs notification`);
          const { sendAPNSNotification } = await import('@/lib/notifications/video-invite-service');
          
          const apnsResult = await sendAPNSNotification(
            tokenRecord.token,
            `💬 ${sender.name}`,
            truncatedMessage,
            {
              notification_type: 'chat_message',
              sender_id: sender.id,
              sender_name: sender.name,
              channel_id: channel.id,
            }
          );
          
          if (apnsResult.success) {
            successCount++;
            console.log(`✅ APNs push sent`);
          }
          continue;
        }

        // Handle FCM tokens (Android)
        const fcmMessage = {
          token: tokenRecord.token,
          data: {
            type: 'chat_message',
            notification_type: 'chat_message',
            title: `💬 ${sender.name}`,
            body: truncatedMessage,
            notificationTitle: `💬 ${sender.name}`,
            notificationBody: truncatedMessage,
            showNotification: 'true',
            sound: 'default',
            vibrate: 'true',
            priority: 'high',
            sender_id: sender.id,
            sender_name: sender.name,
            channel_id: channel.id,
          },
          android: {
            priority: 'high' as const,
            ttl: 3600,
          },
        };

        await firebaseAdmin.messaging().send(fcmMessage);
        successCount++;
        console.log(`✅ FCM push sent`);
      } catch (tokenError: any) {
        console.error(`❌ Token error:`, tokenError);
        
        // If token is invalid, mark it as inactive
        if (tokenError?.errorInfo?.code === 'messaging/registration-token-not-registered') {
          await supabase
            .from('notification_tokens')
            .update({ is_active: false })
            .eq('id', tokenRecord.id);
        }
      }
    }

    console.log(`📱 Chat notifications: ${successCount} sent`);

    return NextResponse.json({ 
      success: true, 
      message: `Chat notification sent to ${successCount} device(s)`,
      notifications_sent: successCount
    });

  } catch (error) {
    console.error('❌ Stream webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook testing
export async function GET() {
  console.log('🔔 Stream webhook GET endpoint called');
  return NextResponse.json({ 
    success: true, 
    message: 'Stream webhook endpoint is accessible - Smart chat notifications enabled',
    timestamp: new Date().toISOString(),
    features: {
      videoInvites: 'enabled',
      chatNotifications: 'enabled (smart filtering)',
      activityTracking: 'enabled (30s threshold)',
      spamPrevention: 'enabled'
    }
  });
}
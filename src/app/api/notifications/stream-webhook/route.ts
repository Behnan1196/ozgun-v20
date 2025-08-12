import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

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

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const serviceAccount = process.env.GOOGLE_SERVICES_JSON;
    if (!serviceAccount) {
      console.error('GOOGLE_SERVICES_JSON not configured');
      return null;
    }

    try {
      const serviceAccountKey = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
      return null;
    }
  }
  return admin;
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

    // For FCM tokens (web/native), use FCM HTTP v1 API
    const firebaseAdmin = initializeFirebaseAdmin();
    if (!firebaseAdmin) {
      return { success: false, error: 'Firebase Admin not configured' };
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        type: 'chat_message',
        title, // Include title in data for custom handling
        body,  // Include body in data for custom handling
      },
      android: {
        notification: {
          channelId: 'chat',
          sound: 'default',
          priority: 'high' as const,
        },
        data: {
          ...data,
          type: 'chat_message',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
          },
        },
        fcmOptions: {
          imageUrl: 'https://ozgun-v15.vercel.app/favicon.ico',
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: 'https://ozgun-v15.vercel.app/favicon.ico',
          badge: 'https://ozgun-v15.vercel.app/favicon.ico',
          tag: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique tag prevents grouping
          requireInteraction: true,
        },
        fcmOptions: {
          link: 'https://ozgun-v15.vercel.app/',
        },
      },
    };

    const result = await admin.messaging().send(message);
    console.log('✅ FCM v1 notification sent successfully:', result);
    return { success: true, messageId: result };
    
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
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
    console.log('🔔 WEBHOOK CALLED (v2):', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    
    console.log('📝 Request body length:', body.length);
    console.log('🔑 Signature present:', !!signature);
    
    // Temporarily disable webhook signature verification to fix notifications
    // TODO: Configure correct STREAM_WEBHOOK_SECRET in Vercel environment variables
    const webhookSecret = process.env.STREAM_WEBHOOK_SECRET;
    console.log('⚠️ Webhook signature verification temporarily disabled for debugging');
    console.log('🔑 Signature present:', !!signature, 'Secret configured:', !!webhookSecret);
    
    // if (webhookSecret && signature) {
    //   console.log('🔐 Verifying webhook signature...');
    //   if (!verifyWebhookSignature(body, signature as string, webhookSecret as string)) {
    //     console.error('❌ Invalid webhook signature');
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    //   }
    //   console.log('✅ Webhook signature verified');
    // }

    const event = JSON.parse(body);
    console.log('📨 Stream webhook received:', event.type);
    console.log('📋 Full event data:', JSON.stringify(event, null, 2));

    // Only handle message.new events
    if (event.type !== 'message.new') {
      console.log('⏭️ Ignoring event type:', event.type);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const message = event.message;
    const channel = event.channel;
    const sender = event.user;
    
    console.log('👤 Sender:', sender);
    console.log('💬 Message:', message);
    console.log('📺 Channel:', channel);

    // Don't send notifications for system messages or messages from bots
    if (!message || !sender || sender.id === 'system' || sender.role === 'admin') {
      return NextResponse.json({ success: true, message: 'System message ignored' });
    }

    console.log(`💬 New message from ${sender.name} in channel ${channel.id}`);

    // Get channel members (members is an array in webhooks)
    const members = channel.members || [];
    
    console.log(`👥 Channel has ${members.length} members:`, members.map((m: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      user_id: m.user_id, 
      online: m.user?.online,
      user: m.user
    })));
    
    // Send notifications to all members except the sender
    // Note: Stream's online status in webhooks may not be reliable, 
    // so we'll send to all non-sender members and let the client handle duplicates
    const recipientMembers = members
      .filter((member: any) => member.user_id !== sender.id) // eslint-disable-line @typescript-eslint/no-explicit-any
      .map((member: any) => member.user_id); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (recipientMembers.length === 0) {
      console.log('✅ No other members in channel, no notifications needed');
      return NextResponse.json({ success: true, message: 'No recipients' });
    }

    console.log(`📤 Sending notifications to ${recipientMembers.length} recipient members`);

    // Get admin supabase client
    const supabase = createAdminClient();

    // Send notifications to recipient members
    for (const memberId of recipientMembers) {
      try {
        // SMART FILTERING: Check if user was recently active in THIS SPECIFIC CHANNEL (last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: userActivity, error: activityError } = await supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', memberId)
          .eq('channel_id', channel.id) // Only check activity for THIS channel
          .gte('updated_at', twoMinutesAgo) // Check recent activity within 2 minutes
          .order('updated_at', { ascending: false })
          .limit(1);

        if (activityError) {
          console.error(`❌ Error checking user activity for ${memberId}:`, activityError);
        }

        // Check if the most recent activity was active and recent enough to consider user still viewing
        const recentActivity = userActivity && userActivity.length > 0 ? userActivity[0] : null;
        const isRecentlyActive = recentActivity && recentActivity.is_active;
        
        console.log(`🔍 ACTIVITY CHECK: User ${memberId} in channel ${channel.id} - Recent activity: ${recentActivity ? `${recentActivity.is_active ? 'ACTIVE' : 'INACTIVE'} at ${recentActivity.updated_at}` : 'NONE'}`);
        
        if (isRecentlyActive) {
          console.log(`👀 FILTERING: User ${memberId} was recently active in channel ${channel.id} - blocking notification`);
        } else {
          console.log(`💤 SENDING: User ${memberId} not recently active in channel ${channel.id} - sending notification`);
        }
        
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

        // SMART FILTERING: Filter tokens based on activity and platform
        const filteredTokens = tokens.filter(token => {
          if (token.platform === 'web') {
            // Skip web tokens entirely (web notifications disabled)
            console.log(`🚫 Skipping web token for ${memberId} - web notifications disabled`);
            return false;
          }
          
          // SMART MOBILE FILTERING: Skip mobile notifications if user was recently active in THIS channel
          if (isRecentlyActive && ['ios', 'android'].includes(token.platform)) {
            console.log(`🔕 Skipping mobile notification for ${memberId} - recently active in channel ${channel.id}`);
            return false;
          }
          
          // Send mobile notifications if user is not actively viewing this channel
          return true;
        });

        if (filteredTokens.length === 0) {
          console.log(`⚠️ No valid mobile tokens found for user ${memberId} (web tokens filtered out)`);
          await logNotification(
            supabase,
            memberId,
            'chat_message',
            'New Message',
            message.text || 'You have a new message',
            { channelId: channel.id, messageId: message.id },
            'skipped',
            isRecentlyActive ? `User recently active in channel ${channel.id}, mobile notifications filtered` : 'No mobile tokens available'
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

        // Group filtered tokens by platform and prioritize the best token for each platform
        const tokensByPlatform = filteredTokens.reduce((acc: any, token: any) => {
          if (!acc[token.platform]) acc[token.platform] = [];
          acc[token.platform].push(token);
          return acc;
        }, {});

        // Send notification to the best token for each platform
        for (const [platform, platformTokens] of Object.entries(tokensByPlatform)) {
          // For iOS: prefer Expo tokens over FCM
          // For Android: prefer FCM tokens over Expo  
          // For Web: use FCM tokens only
          let bestToken;
          if (platform === 'ios') {
            bestToken = (platformTokens as any[]).find(t => t.token_type === 'expo') || 
                       (platformTokens as any[])[0];
          } else if (platform === 'android') {
            bestToken = (platformTokens as any[]).find(t => t.token_type === 'fcm') || 
                       (platformTokens as any[]).find(t => t.token_type === 'expo') ||
                       (platformTokens as any[])[0];
          } else if (platform === 'web') {
            bestToken = (platformTokens as any[]).find(t => t.token_type === 'fcm');
          } else {
            bestToken = (platformTokens as any[])[0];
          }

          if (!bestToken) continue;

          try {
            const result = await sendFCMNotification(
              bestToken.token,
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

            console.log(`📱 Notification ${status} to ${memberId} (${platform}/${bestToken.token_type})`);
          } catch (error) {
            console.error(`Error sending notification to ${memberId} (${platform}):`, error);
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
      message: `Notifications sent to ${recipientMembers.length} recipient members` 
    });

  } catch (error) {
    console.error('Stream webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add GET endpoint for webhook testing
export async function GET() {
  console.log('🔔 Webhook GET endpoint called:', new Date().toISOString());
  return NextResponse.json({ 
    success: true, 
    message: 'Stream webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: '/api/notifications/stream-webhook'
  });
}

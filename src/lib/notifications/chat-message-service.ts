/**
 * Chat Message Notification Service
 * Handles sending push notifications for chat messages
 * Similar to video-invite-service.ts but for chat messages
 */

import { createAdminClient } from '@/lib/supabase/server';
import admin from 'firebase-admin';
import { sendAPNSNotification } from './video-invite-service';

// Initialize Firebase Admin SDK (reuse from video-invite-service)
let firebaseAdmin: typeof admin | null = null;

function initializeFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  if (admin.apps.length === 0) {
    const serviceAccount = process.env.GOOGLE_SERVICES_JSON;
    if (!serviceAccount) {
      console.error('❌ GOOGLE_SERVICES_JSON not configured');
      return null;
    }

    try {
      const serviceAccountKey = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
      console.log('✅ Firebase Admin initialized for chat messages');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
      return null;
    }
  }

  firebaseAdmin = admin;
  return firebaseAdmin;
}

// Send FCM notification for chat message
async function sendFCMChatNotification(
  token: string,
  senderName: string,
  messageText: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const firebaseAdmin = initializeFirebaseAdmin();
    if (!firebaseAdmin) {
      return { success: false, error: 'Firebase Admin not configured' };
    }

    // Truncate message to prevent 16KB limit on Android
    const truncatedMessage = messageText.length > 80 
      ? messageText.substring(0, 80) + '...' 
      : messageText;

    // Use data-only approach like video invite (minimal payload for 16KB limit)
    const message = {
      token,
      data: {
        type: 'chat_message',
        title: `💬 ${senderName}`,
        body: truncatedMessage,
        showNotification: 'true',
        sound: 'default',
        priority: 'high',
        sender_id: data.sender_id,
        channel_id: data.channel_id,
      },
      android: {
        priority: 'high' as const,
        ttl: 3600,
      },
      apns: {
        payload: {
          aps: {
            alert: { 
              title: `💬 ${senderName}`, 
              body: truncatedMessage 
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const result = await admin.messaging().send(message);
    console.log('✅ FCM chat notification sent:', result);
    return { success: true, messageId: result };
    
  } catch (error) {
    console.error('❌ Error sending FCM chat notification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Log notification attempt
async function logNotification(
  userId: string,
  senderName: string,
  messageText: string,
  data: Record<string, any>,
  platform: string,
  tokenType: string,
  status: string,
  errorMessage?: string
) {
  try {
    const supabase = createAdminClient();
    
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: 'chat_message',
        title: `💬 ${senderName}`,
        body: messageText.substring(0, 100),
        data,
        platform,
        token_type: tokenType,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('❌ Error logging chat notification:', error);
  }
}

// Main function to send chat message notification
export interface ChatMessageNotificationData {
  senderId: string;
  senderName: string;
  recipientId: string;
  messageText: string;
  channelId: string;
}

export async function sendChatMessageNotification(
  data: ChatMessageNotificationData
): Promise<{ success: boolean; error?: string; notificationsSent: number }> {
  const { senderId, senderName, recipientId, messageText, channelId } = data;

  console.log(`💬 Sending chat notification from ${senderName} to ${recipientId}`);

  try {
    const supabase = createAdminClient();

    // Check if recipient is currently active in chat (last activity < 30 seconds ago)
    const { data: activityData, error: activityError } = await supabase
      .from('user_activity')
      .select('last_activity_at, current_screen')
      .eq('user_id', recipientId)
      .maybeSingle(); // Use maybeSingle() to handle 0 or 1 rows

    console.log('📊 Activity check:', {
      recipientId,
      hasData: !!activityData,
      error: activityError?.message,
      currentScreen: activityData?.current_screen,
      lastActivity: activityData?.last_activity_at
    });

    if (activityData && activityData.last_activity_at) {
      const lastActivity = new Date(activityData.last_activity_at);
      const now = new Date();
      const secondsSinceActivity = (now.getTime() - lastActivity.getTime()) / 1000;

      console.log(`📊 Activity details: screen=${activityData.current_screen}, seconds=${secondsSinceActivity.toFixed(0)}`);

      // If user is in chat screen and was active in last 30 seconds, don't send notification
      if (activityData.current_screen === 'chat' && secondsSinceActivity < 30) {
        console.log(`⏭️ Recipient is currently in chat (${secondsSinceActivity.toFixed(0)}s ago), skipping notification`);
        return { success: true, notificationsSent: 0 };
      }
    } else {
      console.log('⚠️ No activity data found or missing last_activity_at');
    }

    // Get recipient's notification tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', recipientId)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ Error fetching notification tokens:', tokensError);
      return { success: false, error: 'Failed to fetch notification tokens', notificationsSent: 0 };
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No notification tokens found for user:', recipientId);
      return { success: false, error: 'No notification tokens found', notificationsSent: 0 };
    }

    // Filter for mobile platforms only
    const mobileTokens = tokens.filter(token => ['ios', 'android'].includes(token.platform));

    if (mobileTokens.length === 0) {
      console.log('⚠️ No mobile notification tokens found for user:', recipientId);
      return { success: false, error: 'No mobile notification tokens found', notificationsSent: 0 };
    }

    const notificationData = {
      type: 'chat_message',
      notification_type: 'chat_message',
      sender_id: senderId,
      sender_name: senderName,
      channel_id: channelId,
    };

    let notificationsSent = 0;
    let lastError: string | undefined;

    // Group tokens by platform
    const tokensByPlatform = mobileTokens.reduce((acc: Record<string, any[]>, token) => {
      if (!acc[token.platform]) acc[token.platform] = [];
      acc[token.platform].push(token);
      return acc;
    }, {});

    for (const [platform, platformTokens] of Object.entries(tokensByPlatform)) {
      // Choose the best token for each platform
      let bestToken;
      if (platform === 'ios') {
        bestToken = platformTokens.find(t => t.token_type === 'apns') ||
                   platformTokens.find(t => t.token_type === 'expo') || 
                   platformTokens[0];
      } else if (platform === 'android') {
        bestToken = platformTokens.find(t => t.token_type === 'fcm') || 
                   platformTokens.find(t => t.token_type === 'expo') ||
                   platformTokens[0];
      } else {
        bestToken = platformTokens[0];
      }

      if (!bestToken) continue;

      try {
        let result;
        
        // Use appropriate notification method based on platform and token type
        if (platform === 'ios' && bestToken.token_type === 'apns') {
          result = await sendAPNSNotification(
            bestToken.token, 
            `💬 ${senderName}`, 
            messageText.substring(0, 100), 
            notificationData
          );
        } else {
          result = await sendFCMChatNotification(
            bestToken.token, 
            senderName, 
            messageText, 
            notificationData
          );
        }

        const status = result.success ? 'sent' : 'failed';
        lastError = result.error;

        await logNotification(
          recipientId,
          senderName,
          messageText,
          notificationData,
          platform,
          bestToken.token_type,
          status,
          result.error
        );

        if (result.success) {
          notificationsSent++;
          console.log(`✅ Chat notification sent to ${recipientId} (${platform}/${bestToken.token_type})`);
        } else {
          console.error(`❌ Chat notification failed for ${recipientId} (${platform}/${bestToken.token_type}):`, result.error);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error sending chat notification to ${recipientId} (${platform}):`, error);
        
        await logNotification(
          recipientId,
          senderName,
          messageText,
          notificationData,
          platform,
          bestToken.token_type,
          'failed',
          errorMessage
        );
        
        lastError = errorMessage;
      }
    }

    if (notificationsSent > 0) {
      return { success: true, notificationsSent };
    } else {
      return { 
        success: false, 
        error: lastError || 'Failed to send notifications to any platform',
        notificationsSent: 0 
      };
    }

  } catch (error) {
    console.error('❌ Error in sendChatMessageNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      notificationsSent: 0 
    };
  }
}

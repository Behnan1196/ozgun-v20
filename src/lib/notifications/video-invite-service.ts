/**
 * Video Invite Notification Service
 * Handles sending push notifications for video call invites
 * Supports FCM, APNs Legacy, and Expo Push API
 */

import { createAdminClient } from '@/lib/supabase/server';
import admin from 'firebase-admin';
import apn from 'apn';
import forge from 'node-forge';

// Initialize Firebase Admin SDK
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
      console.log('✅ Firebase Admin initialized for video invites');
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
      return null;
    }
  }

  firebaseAdmin = admin;
  return firebaseAdmin;
}

// Initialize APNs Provider
let apnProvider: apn.Provider | null = null;

function initializeAPNProvider() {
  if (apnProvider) return apnProvider;

  const apnsCertData = process.env.APNS_CERT_DATA;
  const apnsPassphrase = process.env.APNS_PASSPHRASE;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!apnsCertData || !apnsPassphrase) {
    console.error('❌ APNs configuration missing (APNS_CERT_DATA or APNS_PASSPHRASE)');
    return null;
  }

  try {
    // Decode the base64 certificate data
    const certBuffer = Buffer.from(apnsCertData, 'base64');
    
    // Convert PKCS#12 to PEM format using node-forge
    const p12Asn1 = forge.asn1.fromDer(certBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, apnsPassphrase);
    
    // Extract certificate and private key
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag]?.[0];
    
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    
    if (!certBag?.cert || !keyBag?.key) {
      throw new Error('Could not extract certificate or key from PKCS#12');
    }
    
    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(certBag.cert);
    const keyPem = forge.pki.privateKeyToPem(keyBag.key);
    
    console.log('✅ Successfully converted PKCS#12 to PEM format');
    
    const options: apn.ProviderOptions = {
      cert: certPem,
      key: keyPem,
      production: isProduction
    };

    apnProvider = new apn.Provider(options);
    console.log(`✅ APNs Provider initialized for video invites (${isProduction ? 'production' : 'sandbox'})`);
    return apnProvider;
  } catch (error) {
    console.error('❌ Error initializing APNs Provider:', error);
    console.error('❌ Certificate conversion failed - check APNS_CERT_DATA format and passphrase');
    return null;
  }
}

// Send APNs notification
export async function sendAPNSNotification(
  deviceToken: string, 
  title: string, 
  body: string, 
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const provider = initializeAPNProvider();
    if (!provider) {
      return { success: false, error: 'APNs provider not configured' };
    }

    const notification = new apn.Notification({
      alert: { title, body },
      sound: 'default',
      badge: 1,
      topic: 'com.behnan.coachingmobile', // Your app's bundle identifier
      payload: {
        ...data,
        type: 'video_invite'
      },
      pushType: 'alert',
      priority: 10 // High priority for immediate delivery
    });

    const result = await provider.send(notification, deviceToken);
    
    if (result.sent.length > 0) {
      console.log('✅ APNs video invite notification sent:', result.sent[0].device);
      return { success: true, messageId: result.sent[0].device };
    } else if (result.failed.length > 0) {
      const failure = result.failed[0];
      console.error('❌ APNs video invite notification failed:', failure.error);
      return { success: false, error: failure.error?.toString() || 'APNs delivery failed' };
    } else {
      return { success: false, error: 'No delivery result from APNs' };
    }
  } catch (error) {
    console.error('❌ Error sending APNs video invite notification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Send FCM notification
async function sendFCMNotification(
  token: string, 
  title: string, 
  body: string, 
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Skip Expo tokens to avoid FCM server key issues
    if (token.startsWith('ExponentPushToken')) {
      console.log('⚠️ Skipping Expo token - using direct FCM/APNs only');
      return { success: false, error: 'Expo tokens disabled - using direct push only' };
    }

    // For Expo tokens (legacy handling - should not reach here)
    if (false && token.startsWith('ExponentPushToken')) {
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          type: 'video_invite'
        },
        channelId: 'video_invites',
        priority: 'high'
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

      const result = await response.json();
      
      if (result.data && result.data[0] && result.data[0].status === 'ok') {
        console.log('✅ Expo video invite notification sent:', result.data[0].id);
        return { success: true, messageId: result.data[0].id };
      } else {
        console.error('❌ Expo video invite notification failed:', result);
        return { success: false, error: result.data?.[0]?.message || 'Expo delivery failed' };
      }
    }

    // For FCM tokens, use Firebase Admin SDK
    const firebaseAdmin = initializeFirebaseAdmin();
    if (!firebaseAdmin) {
      return { success: false, error: 'Firebase Admin not configured' };
    }

    // Back to data-only approach - this was showing notifications, just need to fix title+body
    // Remove notification object to force app-side handling
    const message = {
      token,
      data: {
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        type: 'video_invite',
        title: `Özgün Koçluk - Video Görüşme Daveti - ${data.fromUserName || 'Bilinmeyen'}`,
        body,
        // Critical: These fields must be used by the app to create proper notifications
        notificationTitle: `Özgün Koçluk - Video Görüşme Daveti - ${data.fromUserName || 'Bilinmeyen'}`,
        notificationBody: body,
        showNotification: 'true',
        sound: 'default',
        vibrate: 'true',
        priority: 'high',
        category: 'video_invite',
        channelId: 'video_invites',
      },
      android: {
        priority: 'high' as const, // High priority for immediate delivery
        ttl: 3600, // 1 hour TTL
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const result = await admin.messaging().send(message);
    console.log('✅ FCM video invite notification sent:', result);
    return { success: true, messageId: result };
    
  } catch (error) {
    console.error('❌ Error sending FCM video invite notification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Log notification attempt
async function logNotification(
  userId: string,
  title: string,
  body: string,
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
        notification_type: 'video_invite',
        title,
        body,
        data,
        platform,
        token_type: tokenType,
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      });
  } catch (error) {
    console.error('❌ Error logging video invite notification:', error);
  }
}

// Main function to send video invite notification
export interface VideoInviteNotificationData {
  inviteId: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  message?: string;
}

export async function sendVideoInviteNotification(
  data: VideoInviteNotificationData
): Promise<{ success: boolean; error?: string; notificationsSent: number }> {
  const { inviteId, fromUserId, toUserId, fromUserName, toUserName, message } = data;

  console.log(`📹 Sending video invite notification from ${fromUserName} to ${toUserName}`);

  try {
    const supabase = createAdminClient();

    // Get recipient's notification tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', toUserId)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ Error fetching notification tokens:', tokensError);
      return { success: false, error: 'Failed to fetch notification tokens', notificationsSent: 0 };
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No notification tokens found for user:', toUserId);
      return { success: false, error: 'No notification tokens found', notificationsSent: 0 };
    }

    // Filter for mobile platforms only (no web notifications)
    const mobileTokens = tokens.filter(token => ['ios', 'android'].includes(token.platform));

    if (mobileTokens.length === 0) {
      console.log('⚠️ No mobile notification tokens found for user:', toUserId);
      return { success: false, error: 'No mobile notification tokens found', notificationsSent: 0 };
    }

    // Prepare notification content
    const title = `📹 Video Görüşme Daveti`;
    const body = message 
      ? `${fromUserName}: ${message}` 
      : `${fromUserName} size video görüşme daveti gönderdi`;

    const notificationData = {
      type: 'video_invite',
      inviteId,
      fromUserId,
      fromUserName,
      message: message || '',
      action: 'open_video_call'
    };

    let notificationsSent = 0;
    let lastError: string | undefined;

    // Group tokens by platform and send to the best token for each platform
    const tokensByPlatform = mobileTokens.reduce((acc: Record<string, any[]>, token) => {
      if (!acc[token.platform]) acc[token.platform] = [];
      acc[token.platform].push(token);
      return acc;
    }, {});

    for (const [platform, platformTokens] of Object.entries(tokensByPlatform)) {
      // Choose the best token for each platform
      let bestToken;
      if (platform === 'ios') {
        // For iOS: prefer APNs tokens for legacy certificate support, then Expo as fallback
        bestToken = platformTokens.find(t => t.token_type === 'apns') ||
                   platformTokens.find(t => t.token_type === 'expo') || 
                   platformTokens[0];
      } else if (platform === 'android') {
        // For Android: prefer FCM tokens over Expo
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
          result = await sendAPNSNotification(bestToken.token, title, body, notificationData);
        } else {
          result = await sendFCMNotification(bestToken.token, title, body, notificationData);
        }

        const status = result.success ? 'sent' : 'failed';
        lastError = result.error;

        await logNotification(
          toUserId,
          title,
          body,
          notificationData,
          platform,
          bestToken.token_type,
          status,
          result.error
        );

        if (result.success) {
          notificationsSent++;
          console.log(`✅ Video invite notification sent to ${toUserId} (${platform}/${bestToken.token_type})`);
        } else {
          console.error(`❌ Video invite notification failed for ${toUserId} (${platform}/${bestToken.token_type}):`, result.error);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error sending video invite notification to ${toUserId} (${platform}):`, error);
        
        await logNotification(
          toUserId,
          title,
          body,
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
    console.error('❌ Error in sendVideoInviteNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      notificationsSent: 0 
    };
  }
}

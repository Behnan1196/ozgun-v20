import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface NotificationResults {
  mobile: { sent: boolean; error: string | null };
  web: { sent: boolean; error: string | null };
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Universal push notification API called');
    
    // Get the request body
    const body = await request.json();
    const { userId, title, body: messageBody, data = {} } = body;
    
    if (!userId || !title || !messageBody) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'userId, title, and body are required' 
      }, { status: 400 });
    }

    // Create admin Supabase client (bypasses RLS)
    const supabase = createAdminClient();
    
    const results: NotificationResults = {
      mobile: { sent: false, error: null },
      web: { sent: false, error: null }
    };

    // Get mobile device tokens
    console.log('📱 Looking up mobile device tokens for user:', userId);
    const { data: mobileTokens, error: mobileError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Get web push subscriptions
    console.log('🌐 Looking up web push subscriptions for user:', userId);
    const { data: webSubscriptions, error: webError } = await supabase
      .from('web_push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Send to mobile devices (Expo Push Service)
    if (mobileTokens && mobileTokens.length > 0) {
      console.log(`📱 Found ${mobileTokens.length} mobile device(s) for user ${userId}`);
      
      for (const tokenData of mobileTokens) {
        try {
          const pushMessage = {
            to: tokenData.token,
            sound: 'default',
            title,
            body: messageBody,
            data: {
              ...data,
              platform: tokenData.platform,
              timestamp: new Date().toISOString(),
            },
            priority: 'high',
            channelId: 'default',
          };

          console.log('📡 Sending mobile push notification...');
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pushMessage),
          });

          const result = await response.json();
          
          if (response.ok) {
            const ticketData = Array.isArray(result.data) ? result.data[0] : result.data;
            if (ticketData?.status === 'ok') {
              console.log('✅ Mobile push notification sent successfully');
              results.mobile.sent = true;
            } else {
              console.error('❌ Mobile push notification failed:', ticketData);
              results.mobile.error = ticketData?.message || 'Mobile push failed';
            }
          } else {
            console.error('❌ HTTP error from Expo Push API:', response.status, result);
            results.mobile.error = `HTTP ${response.status}: ${result.message || 'Push service error'}`;
          }
        } catch (error) {
          console.error('❌ Error sending mobile push notification:', error);
          results.mobile.error = error instanceof Error ? error.message : 'Unknown mobile push error';
        }
      }
    } else {
      console.log('📱 No mobile device tokens found for user:', userId);
      if (mobileError) {
        console.log('📱 Mobile token error:', mobileError);
      }
    }

    // Handle web push subscriptions (real-time + fallback notifications)
    if (webSubscriptions && webSubscriptions.length > 0) {
      console.log(`🌐 Found ${webSubscriptions.length} web subscription(s) for user ${userId}`);
      
      try {
        // Send real-time notification via Supabase broadcast
        const notificationPayload = {
          type: 'notification',
          userId: userId,
          title: title,
          body: messageBody,
          data: data,
          timestamp: new Date().toISOString()
        };

        console.log('📡 Sending real-time web notification...');
        
        // Create and subscribe to the channel first
        const channel = supabase.channel(`user-${userId}`);
        
        // Subscribe to the channel with timeout
        const subscription = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('⏰ [API] Channel subscription timed out after 3 seconds');
            resolve('TIMED_OUT');
          }, 3000); // 3 second timeout

          channel.subscribe((status) => {
            console.log('📡 [API] Channel subscription status:', status);
            clearTimeout(timeout);
            resolve(status);
          });
        });

        if (subscription === 'SUBSCRIBED') {
          // Now send the broadcast
          const broadcastResponse = await channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload: notificationPayload
          });

          console.log('📡 [API] Broadcast response:', broadcastResponse);

          if (broadcastResponse === 'ok') {
            console.log('✅ Real-time web notification sent successfully');
            results.web.sent = true;
          } else {
            console.error('❌ Failed to send real-time notification:', broadcastResponse);
            results.web.error = 'Failed to send real-time notification';
          }
          
          // Clean up the channel
          supabase.removeChannel(channel);
        } else {
          console.error('❌ Failed to subscribe to notification channel:', subscription);
          results.web.error = 'Failed to subscribe to notification channel';
        }
        
        // TODO: Add actual web push service when VAPID keys are configured
        // For now, using real-time notifications for immediate delivery
        
      } catch (error) {
        console.error('❌ Error handling web notification:', error);
        results.web.error = error instanceof Error ? error.message : 'Unknown web notification error';
      }
    } else {
      console.log('🌐 No web push subscriptions found for user:', userId);
      if (webError) {
        console.log('🌐 Web subscription error:', webError);
      }
    }

    // Determine overall success
    const overallSuccess = results.mobile.sent || results.web.sent;
    const hasAnyTargets = (mobileTokens && mobileTokens.length > 0) || (webSubscriptions && webSubscriptions.length > 0);

    if (!hasAnyTargets) {
      return NextResponse.json({ 
        success: false, 
        error: 'No notification targets found. User needs to open the mobile app or enable web notifications.',
        results,
        debug: {
          mobileTokenCount: mobileTokens?.length || 0,
          webSubscriptionCount: webSubscriptions?.length || 0,
          mobileError: mobileError?.message,
          webError: webError?.message
        }
      }, { status: 404 });
    }

    if (overallSuccess) {
      return NextResponse.json({ 
        success: true,
        message: 'Notification sent successfully',
        results,
        summary: {
          mobileSent: results.mobile.sent,
          webSent: results.web.sent,
          totalTargets: (mobileTokens?.length || 0) + (webSubscriptions?.length || 0)
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send notifications to any platform',
        results
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error in universal push notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
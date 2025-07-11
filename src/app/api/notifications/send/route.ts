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

    // Get web push subscriptions (for future use)
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

    // Web push notifications will be implemented after package installation
    if (webSubscriptions && webSubscriptions.length > 0) {
      console.log(`🌐 Found ${webSubscriptions.length} web subscription(s) for user ${userId} - Web push will be implemented after package installation`);
      results.web.error = 'Web push implementation pending package installation';
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
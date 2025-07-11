import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Push notification API called');
    
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
    
    // Get user's device token from database
    console.log('🔍 Looking up device token for user:', userId);
    const { data: tokenData, error: tokenError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData?.token) {
      console.log('❌ No device token found for user:', userId, 'Error:', tokenError);
      console.log('📊 Token data received:', tokenData);
      
      // Check if there are any tokens for this user (for debugging)
      const { data: allTokens } = await supabase
        .from('device_tokens')
        .select('token, platform, updated_at')
        .eq('user_id', userId);
      
      console.log('📊 All tokens for user:', allTokens);
      
      return NextResponse.json({ 
        success: false, 
        error: 'No device token found for user. User needs to open the mobile app to register their device token.',
        debug: {
          tokenError: tokenError?.message,
          allTokensCount: allTokens?.length || 0
        }
      }, { status: 404 });
    }

    console.log('✅ Device token found:', tokenData.token.substring(0, 20) + '...');

    // Prepare push notification message
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

    // Send push notification via Expo Push Service
    console.log('📡 Sending push notification...');
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
    console.log('📡 Expo Push API response:', result);

    // Check HTTP response status first
    if (!response.ok) {
      console.error('❌ HTTP error from Expo Push API:', response.status, result);
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}: ${result.message || 'Push service error'}`,
        expoPushResult: result
      }, { status: 500 });
    }

    // Check if notification was sent successfully
    // Handle both single message and array responses
    const ticketData = Array.isArray(result.data) ? result.data[0] : result.data;
    
    if (ticketData?.status === 'ok') {
      console.log('✅ Push notification sent successfully');
      return NextResponse.json({ 
        success: true,
        message: 'Notification sent successfully',
        expoPushResult: ticketData
      });
    } else {
      console.error('❌ Push notification failed:', ticketData);
      return NextResponse.json({ 
        success: false, 
        error: ticketData?.message || ticketData?.details?.error || 'Push notification failed',
        expoPushResult: ticketData
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
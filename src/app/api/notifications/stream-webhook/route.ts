import { NextRequest, NextResponse } from 'next/server';

/**
 * Stream Chat Webhook Handler - DISABLED
 * 
 * This webhook has been disabled in favor of direct push notifications
 * via message listeners in StreamContext (both web and mobile).
 * 
 * The new system is more reliable and works even when the app is in background.
 * Kept for backward compatibility with Stream.io webhook configuration.
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Stream webhook received');
    
    // DISABLED: We now use direct push notifications via message listener in StreamContext
    // This webhook is kept for backward compatibility but does not send notifications
    console.log('⏭️ Webhook disabled - using direct push notification system');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook disabled - using direct push notifications',
      note: 'Chat notifications are now sent via StreamContext message listeners'
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
    message: 'Stream webhook endpoint is accessible',
    status: 'disabled',
    reason: 'Using direct push notifications via StreamContext',
    timestamp: new Date().toISOString(),
    features: {
      videoInvites: 'enabled (via /api/notifications/video-invite)',
      chatNotifications: 'enabled (via StreamContext message listeners)',
      directPushNotifications: 'enabled',
      webhookNotifications: 'disabled'
    }
  });
}

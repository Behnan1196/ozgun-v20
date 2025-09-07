import { NextRequest, NextResponse } from 'next/server';

/**
 * Stream Chat Webhook Handler - DISABLED FOR LEVEL 1
 * 
 * This webhook is currently disabled as we focus on Level 1: Video Invite Notifications
 * Level 2 will re-enable chat message notifications using the same robust system
 * 
 * For now, this endpoint just acknowledges webhook calls without sending notifications
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Stream webhook received (Level 1: Chat notifications disabled)');
    
    const body = await request.text();
    const event = JSON.parse(body);
    
    console.log('📨 Stream webhook event:', event.type);

    // Only handle message.new events (but don't send notifications yet)
    if (event.type !== 'message.new') {
      console.log('⏭️ Ignoring event type:', event.type);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const message = event.message;
    const channel = event.channel;
    const sender = event.user;

    // Don't process system messages
    if (!message || !sender || sender.id === 'system' || sender.role === 'admin') {
      return NextResponse.json({ success: true, message: 'System message ignored' });
    }

    console.log(`💬 Chat message from ${sender.name} in channel ${channel.id} - NOT sending notifications (Level 1 focus)`);
    console.log('📱 Chat notifications will be implemented in Level 2');

    // For Level 1, we acknowledge the webhook but don't send any notifications
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook acknowledged - Chat notifications disabled for Level 1 (Video invites only)' 
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
    message: 'Stream webhook endpoint is accessible (Level 1: Video invites only)',
    timestamp: new Date().toISOString(),
    level: 1,
    features: {
      videoInvites: 'enabled',
      chatNotifications: 'disabled (Level 2)',
      webNotifications: 'disabled (Level 3)'
    }
  });
}
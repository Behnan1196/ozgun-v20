import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Stream token API called');
    
    // Get the request body
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      console.log('❌ No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get Stream.io credentials from environment
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.log('❌ Stream.io credentials not configured');
      return NextResponse.json({ error: 'Stream.io not configured' }, { status: 500 });
    }

    console.log('🔧 Generating token for user:', userId);
    
    // Initialize Stream Chat server client
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    
    // Generate token
    const token = serverClient.createToken(userId);
    
    console.log('✅ Token generated successfully');
    
    return NextResponse.json({ success: true, token });
    
  } catch (error) {
    console.error('❌ Error generating Stream token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' }, 
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { UserRole } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Stream upsert-partner API called');

    const body = await request.json();
    const { id, name, username, email, role } = body;

    if (!id || !name || !email || !role) {
      console.log('❌ Missing required fields for partner upsert');
      return NextResponse.json({ error: 'Missing required user fields' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.log('❌ Stream.io credentials not configured for upsert-partner');
      return NextResponse.json({ error: 'Stream.io not configured' }, { status: 500 });
    }

    console.log('🔧 Upserting partner user in Stream.io:', id, 'with role:', role);

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    await serverClient.upsertUser({
      id,
      name,
      username,
      email,
      role,
    });

    console.log('✅ Partner user upserted successfully in Stream.io');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error upserting partner user in Stream.io:', error);
    return NextResponse.json(
      { error: 'Failed to upsert partner user' },
      { status: 500 }
    );
  }
}

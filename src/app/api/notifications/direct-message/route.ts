import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { StreamChat } from 'stream-chat'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { target_user_id, message } = body

    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )

    // Ensure users exist
    await serverClient.upsertUsers([
      { id: user.id, name: 'Coordinator' },
      { id: target_user_id, name: 'Target User' }
    ])

    // Create direct channel
    const channel = serverClient.channel('messaging', `direct_${user.id}_${target_user_id}`, {
      members: [user.id, target_user_id],
      created_by_id: user.id
    })

    await channel.create()

    // Send message
    const result = await channel.sendMessage({
      text: `🔔 Test: ${message}`,
      user_id: user.id,
      push_notification: {
        title: 'Test Notification',
        body: message,
        sound: 'default'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message_id: result.message.id,
      channel_id: channel.id
    })

  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 })
  }
}
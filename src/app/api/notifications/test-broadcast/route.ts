import { NextRequest, NextResponse } from 'next/server'
import { StreamChat } from 'stream-chat'

export async function GET() {
  try {
    console.log('🧪 Testing Stream Chat connection...')
    
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    )
    
    // Test channel listing
    const channels = await serverClient.queryChannels({
      type: 'messaging',
      id: 'system_announcements'
    })
    
    console.log('📋 Found channels:', channels.length)
    
    if (channels.length > 0) {
      const channel = channels[0]
      console.log('🔗 Channel members:', Object.keys(channel.state.members || {}))
      console.log('📨 Recent messages:', channel.state.messages?.length || 0)
    }
    
    return NextResponse.json({
      success: true,
      channels_found: channels.length,
      channel_info: channels.length > 0 ? {
        id: channels[0].id,
        member_count: Object.keys(channels[0].state.members || {}).length,
        message_count: channels[0].state.messages?.length || 0
      } : null
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 })
  }
}
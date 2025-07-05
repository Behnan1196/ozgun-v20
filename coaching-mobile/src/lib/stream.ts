import { StreamChat } from 'stream-chat'

// Stream.io configuration - matching web app
export const STREAM_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_STREAM_API_KEY || 'demo_key',
}

// Create Stream Chat client
export const createStreamChatClient = () => {
  return StreamChat.getInstance(STREAM_CONFIG.API_KEY)
}

// Generate user token by calling the web app's API
export const generateUserToken = async (userId: string): Promise<string> => {
  // First check if we're in demo mode
  if (StreamUtils.isDemoMode()) {
    console.warn('⚠️ Using demo Stream.io setup. Configure API keys for production.')
    return `demo_token_${userId}_${Date.now()}`
  }

  // Try different endpoints for token generation
  const endpoints = [
    'https://ozgun-v13.vercel.app/api/stream/token',  // Production Vercel app
    'http://localhost:3000/api/stream/token',  // Local development
    'http://192.168.1.15:3000/api/stream/token', // Local network (adjust IP as needed)
    'http://10.0.2.2:3000/api/stream/token',   // Android emulator
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Trying token endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        console.log(`❌ Endpoint ${endpoint} failed: ${response.status}`)
        continue
      }
      
      const data = await response.json()
      
      if (!data.success || !data.token) {
        console.log(`❌ Endpoint ${endpoint} returned invalid response`)
        continue
      }
      
      console.log(`✅ Token generated successfully from ${endpoint}`)
      return data.token
      
    } catch (error: any) {
      console.log(`❌ Endpoint ${endpoint} error:`, error.message || error)
      continue
    }
  }
  
  // If all endpoints fail, throw error with helpful message
  throw new Error(
    'Failed to generate authentication token. Please ensure:\n' +
    '1. Web app is running (npm run dev in v13-21 folder)\n' +
    '2. Check your network connection\n' +
    '3. For physical devices, update the IP address in stream.ts'
  )
}

// Helper function to create a chat channel between coach and student
export const createCoachStudentChannel = (chatClient: StreamChat, coachId: string, studentId: string) => {
  // Create a unique but short channel ID for the coach-student pair
  const shortCoachId = coachId.substring(0, 8)
  const shortStudentId = studentId.substring(0, 8)
  const channelId = `cs-${[shortCoachId, shortStudentId].sort().join('-')}`
  
  return chatClient.channel('messaging', channelId, {
    members: [coachId, studentId],
    created_by_id: coachId,
  })
}

// Stream.io utility functions
export const StreamUtils = {
  // Format user for Stream.io
  formatStreamUser: (user: { id: string; full_name?: string; email: string }) => ({
    id: user.id,
    name: user.full_name || user.email.split('@')[0],
    email: user.email,
    role: 'user',
  }),
  
  // Check if Stream.io is properly configured
  isConfigured: () => {
    return STREAM_CONFIG.API_KEY && STREAM_CONFIG.API_KEY !== 'demo_key'
  },
  
  // Get demo mode status
  isDemoMode: () => {
    return STREAM_CONFIG.API_KEY === 'demo_key'
  }
}

export default {
  STREAM_CONFIG,
  createStreamChatClient,
  generateUserToken,
  createCoachStudentChannel,
  StreamUtils,
} 
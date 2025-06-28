// =====================================================
// Stream.io Configuration
// Chat and Video Integration for Coach-Student Communication
// =====================================================

import { StreamChat } from 'stream-chat'
import { StreamVideoClient } from '@stream-io/video-react-sdk'

// Stream.io configuration
export const STREAM_CONFIG = {
  // Demo API key (replace with your actual API key)
  API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY || 'mmhfdzb5evj2',
  
  // Demo secret (only for development - never expose in production)
  API_SECRET: process.env.STREAM_API_SECRET || 'your_secret_here',
  
  // App configuration
  APP_ID: process.env.NEXT_PUBLIC_STREAM_APP_ID || 'your_app_id',
}

// Create Stream Chat client
export const createStreamChatClient = () => {
  return StreamChat.getInstance(STREAM_CONFIG.API_KEY)
}

// Store video client instance to prevent duplicates
let videoClientInstance: StreamVideoClient | null = null
let currentUserId: string | null = null

// Create Stream Video client
export const createStreamVideoClient = (user: { id: string; name: string }, token: string) => {
  // If a client already exists for this user, return it
  if (videoClientInstance && currentUserId === user.id) {
    console.log('🔄 Reusing existing StreamVideoClient for user:', user.id)
    return videoClientInstance
  }
  
  // Clean up previous instance if it exists
  if (videoClientInstance) {
    console.log('🧹 Cleaning up previous StreamVideoClient instance')
    try {
      videoClientInstance.disconnectUser()
    } catch (error) {
      console.warn('⚠️ Error cleaning up previous video client:', error)
    }
    videoClientInstance = null
    currentUserId = null
  }
  
  // Create new instance
  console.log('🆕 Creating new StreamVideoClient for user:', user.id)
  videoClientInstance = new StreamVideoClient({
    apiKey: STREAM_CONFIG.API_KEY,
    user,
    token,
  })
  currentUserId = user.id
  
  return videoClientInstance
}

// Generate user token
export const generateUserToken = async (userId: string): Promise<string> => {
  // Check if we're in demo mode (no real API keys configured)
  if (!StreamUtils.isConfigured()) {
    // For demo purposes, we'll use a development token
    console.warn('⚠️ Using demo Stream.io setup. Configure API keys for production.')
    
    // This is a demo token generation approach
    // In real apps, generate tokens on your backend
    return `demo_token_${userId}`
  }
  
  // Production mode - call our backend to generate a secure token
  try {
    console.log('🔑 Generating real Stream.io token for user:', userId)
    
    const response = await fetch('/api/stream/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    
    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success || !data.token) {
      throw new Error('Invalid token response')
    }
    
    console.log('✅ Stream.io token generated successfully')
    return data.token
    
  } catch (error) {
    console.error('❌ Failed to generate Stream token:', error)
    throw new Error('Failed to generate authentication token')
  }
}

// Helper function to create a chat channel between coach and student
export const createCoachStudentChannel = (chatClient: StreamChat, coachId: string, studentId: string) => {
  // Create a unique but short channel ID for the coach-student pair
  // Use first 8 chars of each UUID to keep under 64 char limit
  const shortCoachId = coachId.substring(0, 8)
  const shortStudentId = studentId.substring(0, 8)
  const channelId = `cs-${[shortCoachId, shortStudentId].sort().join('-')}`
  
  return chatClient.channel('messaging', channelId, {
    members: [coachId, studentId],
    created_by_id: coachId,
  })
}

// Helper function to create a video call between coach and student
export const createVideoCall = (videoClient: StreamVideoClient, coachId: string, studentId: string) => {
  // Create a unique but short call ID for the coach-student pair
  // Use first 8 chars of each UUID to keep under 64 char limit
  const shortCoachId = coachId.substring(0, 8)
  const shortStudentId = studentId.substring(0, 8)
  const callId = `call-${[shortCoachId, shortStudentId].sort().join('-')}`
  
  return videoClient.call('default', callId)
}

// Stream.io utility functions
export const StreamUtils = {
  // Format user for Stream.io
  formatStreamUser: (user: { id: string; username: string; full_name?: string; email: string }) => ({
    id: user.id,
    name: user.full_name || user.username,
    username: user.username,
    email: user.email,
    role: 'user',
  }),
  
  // Check if Stream.io is properly configured (client-side)
  isConfigured: () => {
    const hasApiKey = STREAM_CONFIG.API_KEY && STREAM_CONFIG.API_KEY !== 'mmhfdzb5evj2'
    
    // Note: We can't check secret on client-side for security reasons
    // The secret is only available on the server-side for token generation
    console.log('🔧 Stream.io config check:', {
      hasApiKey: !!hasApiKey,
      apiKey: STREAM_CONFIG.API_KEY?.substring(0, 8) + '...',
      isConfigured: !!hasApiKey
    })
    
    return !!hasApiKey
  },
  
  // Get demo mode status
  isDemoMode: () => {
    return !StreamUtils.isConfigured()
  }
}

export default {
  STREAM_CONFIG,
  createStreamChatClient,
  createStreamVideoClient,
  generateUserToken,
  createCoachStudentChannel,
  createVideoCall,
  StreamUtils,
} 
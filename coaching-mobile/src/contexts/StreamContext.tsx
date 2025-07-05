import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StreamChat, Channel, User as StreamUser } from 'stream-chat'
import { supabase } from '../lib/supabase'
import { 
  createStreamChatClient, 
  generateUserToken, 
  createCoachStudentChannel,
  StreamUtils 
} from '../lib/stream'
import { useAuth } from './AuthContext'

interface StreamContextType {
  // Chat
  chatClient: StreamChat | null
  chatChannel: Channel | null
  chatLoading: boolean
  chatError: string | null
  
  // Actions
  initializeChat: (coachId: string) => Promise<void>
  
  // Status
  isStreamReady: boolean
  isDemoMode: boolean
}

const StreamContext = createContext<StreamContextType | undefined>(undefined)

interface StreamProviderProps {
  children: ReactNode
}

export function StreamProvider({ children }: StreamProviderProps) {
  const { user, profile } = useAuth()
  
  // Chat state
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [chatChannel, setChatChannel] = useState<Channel | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  
  // General state
  const [isStreamReady, setIsStreamReady] = useState(false)
  const isDemoMode = StreamUtils.isDemoMode()

  // Initialize Stream client when user is authenticated
  useEffect(() => {
    const initializeStreamClient = async () => {
      if (!user || !profile) {
        setIsStreamReady(false)
        return
      }

      if (profile.role !== 'student') {
        setIsStreamReady(false)
        return
      }

      try {
        console.log('🔄 Initializing Stream client for student:', user.id)
        
        const client = createStreamChatClient()
        
        // Generate token from web app
        const token = await generateUserToken(user.id)
        
        // Format user for Stream
        const streamUser = StreamUtils.formatStreamUser({
          id: user.id,
          full_name: profile.full_name,
          email: user.email || ''
        })
        
        // Connect user to Stream
        await client.connectUser(streamUser, token)
        
        setChatClient(client)
        setIsStreamReady(true)
        console.log('✅ Stream client initialized successfully')
        
      } catch (error) {
        console.error('❌ Failed to initialize Stream client:', error)
        setChatError('Chat servisi başlatılamadı')
        setIsStreamReady(false)
      }
    }

    initializeStreamClient()

    // Cleanup function
    return () => {
      if (chatClient) {
        chatClient.disconnectUser()
        setChatClient(null)
        setIsStreamReady(false)
      }
    }
  }, [user, profile])

  const initializeChat = async (coachId: string) => {
    if (!chatClient || !user) {
      throw new Error('Stream client not initialized')
    }

    setChatLoading(true)
    setChatError(null)

    try {
      console.log('🔄 Initializing chat with coach:', coachId)
      
      const channel = createCoachStudentChannel(chatClient, coachId, user.id)
      await channel.watch()
      
      setChatChannel(channel)
      console.log('✅ Chat channel initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize chat:', error)
      setChatError('Chat kanalı başlatılamadı')
      throw error
    } finally {
      setChatLoading(false)
    }
  }

  const value: StreamContextType = {
    chatClient,
    chatChannel,
    chatLoading,
    chatError,
    initializeChat,
    isStreamReady,
    isDemoMode,
  }

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  const context = useContext(StreamContext)
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return context
} 
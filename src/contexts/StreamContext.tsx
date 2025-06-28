'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StreamChat, Channel, User as StreamUser } from 'stream-chat'
import { 
  StreamVideo,
  StreamVideoClient, 
  Call,
  useCalls,
  StreamCall,
  RingingCall,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'
import { createClient } from '@/lib/supabase/client'
import { 
  createStreamChatClient, 
  createStreamVideoClient, 
  generateUserToken, 
  createCoachStudentChannel,
  createVideoCall,
  StreamUtils 
} from '@/lib/stream'

interface StreamContextType {
  // Chat
  chatClient: StreamChat | null
  chatChannel: Channel | null
  chatLoading: boolean
  chatError: string | null
  
  // Video
  videoClient: StreamVideoClient | null
  videoCall: Call | null
  videoLoading: boolean
  videoError: string | null
  
  // Actions
  initializeChat: (partnerId: string) => Promise<void>
  initializeVideo: (partnerId: string) => Promise<void>
  startVideoCall: () => Promise<void>
  endVideoCall: () => Promise<void>
  isVideoInitialized: (partnerId: string) => boolean
  
  // Status
  isStreamReady: boolean
  isDemoMode: boolean
}

const StreamContext = createContext<StreamContextType | undefined>(undefined)

interface StreamProviderProps {
  children: ReactNode
}

const RingingNotification = () => {
  const calls = useCalls();

  return (
    <>
      {calls.map((call) => (
        <StreamCall call={call} key={call.cid}>
          <IncomingCallUI />
        </StreamCall>
      ))}
    </>
  );
};

const IncomingCallUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.RINGING) return null;

  return <RingingCall />;
};

export function StreamProvider({ children }: StreamProviderProps) {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  
  // Chat state
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [chatChannel, setChatChannel] = useState<Channel | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  
  // Video state
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [videoCall, setVideoCall] = useState<Call | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [initializedVideoPartners, setInitializedVideoPartners] = useState<Set<string>>(new Set())
  
  // General state
  const [isStreamReady, setIsStreamReady] = useState(false)
  const isDemoMode = StreamUtils.isDemoMode()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            username: profile.email?.split('@')[0] || 'user',
            full_name: profile.full_name
          })
        }
      }
    }
    getUser()
  }, [])

  // Initialize Stream clients when user logs in
  useEffect(() => {
    const initializeStreamClients = async () => {
      if (!user) {
        // Clean up if user logs out
        if (chatClient) {
          await chatClient.disconnectUser()
          setChatClient(null)
        }
        if (videoClient) {
          await videoClient.disconnectUser()
          setVideoClient(null)
        }
        setIsStreamReady(false)
        return
      }

      // Skip if already initialized for this user
      if (chatClient && videoClient && isStreamReady) {
        console.log('🔄 Stream clients already initialized for user:', user.id)
        return
      }

      // Clean up existing clients if they exist for a different user
      if (chatClient || videoClient) {
        console.log('🧹 Cleaning up existing Stream clients...')
        try {
          if (chatClient) {
            await chatClient.disconnectUser()
            setChatClient(null)
          }
          if (videoClient) {
            await videoClient.disconnectUser()
            setVideoClient(null)
          }
        } catch (error) {
          console.warn('⚠️ Error cleaning up existing clients:', error)
        }
        setIsStreamReady(false)
      }

      try {
        console.log('🌊 Initializing Stream.io clients for user:', user.id)
        
        // Format user for Stream.io
        const streamUser = StreamUtils.formatStreamUser(user)
        console.log('👤 Stream user formatted:', streamUser)
        
        // Generate token
        const token = await generateUserToken(user.id)
        console.log('🔑 Token generated, length:', token.length)
        
        // Initialize Chat Client
        const chat = createStreamChatClient()
        console.log('💬 Connecting to Stream Chat with user:', streamUser.id)
        
        await chat.connectUser(streamUser as StreamUser, token)
        setChatClient(chat)
        console.log('💬 Stream Chat client initialized successfully')
        
        // Initialize Video Client
        const video = createStreamVideoClient({ 
          id: user.id, 
          name: user.full_name || user.username 
        }, token)
        setVideoClient(video)
        console.log('📹 Stream Video client initialized successfully')
        
        setIsStreamReady(true)
        console.log('✅ Stream.io clients ready')
        
      } catch (error) {
        console.error('❌ Failed to initialize Stream.io clients:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          user: user.id,
          isDemoMode: StreamUtils.isDemoMode()
        })
        setChatError(`Failed to initialize chat: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setVideoError(`Failed to initialize video: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    initializeStreamClients()
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Don't cleanup immediately, but mark for cleanup if component unmounts
    }
  }, [user?.id]) // Only depend on user.id to prevent unnecessary re-renders

  // Initialize chat channel
  const initializeChat = async (partnerId: string) => {
    if (!chatClient || !user) {
      setChatError('Chat client not ready')
      return
    }

    // Check if trying to chat with self
    if (user.id === partnerId) {
      setChatError('Cannot start a chat with yourself')
      return
    }

    setChatLoading(true)
    setChatError(null)

    try {
      console.log('💬 Initializing chat channel with partner:', partnerId)
      
      // First, ensure the partner user exists in Stream.io
      try {
        console.log('👤 Creating/updating partner user in Stream.io:', partnerId)
        
        // Get partner info from Supabase
        const supabase = createClient()
        const { data: partnerProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        
        if (partnerProfile) {
          // Create/update partner user in Stream.io
          const partnerStreamUser = StreamUtils.formatStreamUser({
            id: partnerProfile.id,
            email: partnerProfile.email,
            full_name: partnerProfile.full_name,
            username: partnerProfile.email?.split('@')[0] || 'user'
          })
          
          console.log('👤 Partner user formatted:', partnerStreamUser)
          
          // Upsert partner user in Stream.io
          await chatClient.upsertUser(partnerStreamUser as StreamUser)
          console.log('✅ Partner user created/updated in Stream.io')
        }
      } catch (userError) {
        console.warn('⚠️ Could not create partner user, continuing anyway:', userError)
      }
      
      const channel = createCoachStudentChannel(chatClient, user.id, partnerId)
      await channel.create()
      await channel.watch()
      
      setChatChannel(channel)
      console.log('✅ Chat channel ready')
      
    } catch (error) {
      console.error('❌ Failed to initialize chat channel:', error)
      setChatError('Failed to initialize chat channel')
    } finally {
      setChatLoading(false)
    }
  }

  // Initialize video call
  const initializeVideo = async (partnerId: string) => {
    if (!videoClient || !user) {
      setVideoError('Video client or user not ready')
      return
    }

    if (initializedVideoPartners.has(partnerId)) {
      console.log('📹 Video already initialized for partner:', partnerId)
      return
    }

    setVideoLoading(true)
    setVideoError(null)

    try {
      console.log('📹 Initializing video call with partner:', partnerId)
      
      // Ensure partner exists
      console.log('👤 Ensuring partner user exists for video call:', partnerId)
      const { data: partnerProfile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', partnerId)
        .single()
      
      if (!partnerProfile) {
        throw new Error('Partner profile not found')
      }
      console.log('✅ Partner profile found for video call')
      
      const call = await createVideoCall(videoClient, user.id, partnerId)
      setVideoCall(call)
      
      setInitializedVideoPartners(prev => new Set(prev).add(partnerId))
      console.log('✅ Video call ready')
      
    } catch (error) {
      console.error('❌ Failed to initialize video call:', error)
      setVideoError(`Failed to initialize video call: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setVideoLoading(false)
    }
  }

  // Start video call
  const startVideoCall = async () => {
    if (!videoCall) {
      setVideoError('Video call not initialized')
      return
    }

    try {
      console.log('📞 Starting video call...')
      
      // First, check if camera is available
      try {
        const devices = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        // Release the test stream immediately
        devices.getTracks().forEach(track => track.stop())
        console.log('✅ Camera and microphone are available')
      } catch (deviceError: any) {
        console.error('❌ Media device error:', deviceError)
        
        if (deviceError.name === 'NotReadableError') {
          setVideoError('Camera is already in use by another application. Please close other video apps and try again.')
          return
        } else if (deviceError.name === 'NotAllowedError') {
          setVideoError('Camera permission denied. Please allow camera access and try again.')
          return
        } else if (deviceError.name === 'NotFoundError') {
          setVideoError('No camera found. Please connect a camera and try again.')
          return
        } else {
          setVideoError(`Camera error: ${deviceError.message}`)
          return
        }
      }
      
      // Join the video call
      await videoCall.join()
      console.log('✅ Video call started')
      
    } catch (error: any) {
      console.error('❌ Failed to start video call:', error)
      
      // Provide specific error messages
      if (error.message?.includes('Device in use')) {
        setVideoError('Camera is in use by another application. Please close other video apps and try again.')
      } else if (error.message?.includes('Permission denied')) {
        setVideoError('Camera permission denied. Please allow camera access in your browser.')
      } else {
        setVideoError(`Failed to start video call: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // End video call
  const endVideoCall = async () => {
    if (!videoCall) return

    try {
      console.log('📞 Ending video call...')
      await videoCall.leave()
      console.log('✅ Video call ended')
      
    } catch (error) {
      console.error('❌ Failed to end video call:', error)
      setVideoError('Failed to end video call')
    }
  }

  const isVideoInitialized = (partnerId: string) => {
    return initializedVideoPartners.has(partnerId)
  }

  const value: StreamContextType = {
    // Chat
    chatClient,
    chatChannel,
    chatLoading,
    chatError,
    
    // Video
    videoClient,
    videoCall,
    videoLoading,
    videoError,
    
    // Actions
    initializeChat,
    initializeVideo,
    startVideoCall,
    endVideoCall,
    isVideoInitialized,
    
    // Status
    isStreamReady,
    isDemoMode,
  }

  return (
    <StreamContext.Provider value={value}>
      {videoClient ? (
        <StreamVideo client={videoClient}>
          {children}
          {isStreamReady && <RingingNotification />}
        </StreamVideo>
      ) : (
        children
      )}
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

export default StreamProvider 
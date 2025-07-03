'use client'

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
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

const RingingNotification = ({ ringingCall }: { ringingCall: Call | null }) => {
  if (!ringingCall) return null;

  return (
    <StreamCall call={ringingCall}>
      <RingingCall />
    </StreamCall>
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
  const initializationInProgress = useRef(false)
  const isBrowser = typeof window !== 'undefined'
  const isMounted = useRef(false)
  const hasInitialized = useRef(false)
  const initializationPromise = useRef<Promise<void> | null>(null)
  
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
  const [ringingCall, setRingingCall] = useState<Call | null>(null);
  
  // General state
  const [isStreamReady, setIsStreamReady] = useState(false)
  const isDemoMode = isBrowser ? StreamUtils.isDemoMode() : false

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize Stream clients when component mounts
  useEffect(() => {
    if (!isBrowser) return;
    
    let isSubscribed = true;
    isMounted.current = true;
    
    // Track initialization state
    let initializationAttempt = 0;
    const MAX_ATTEMPTS = 3;
    let initializationTimeout: NodeJS.Timeout | null = null;
    
    const initializeStreamClients = async (source: 'auth' | 'session') => {
      // Clear any pending initialization timeout
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        initializationTimeout = null;
      }

      // If initialization is already in progress, wait for it
      if (initializationPromise.current) {
        console.log(`⏳ [${source}] Waiting for existing initialization to complete...`)
        try {
          await initializationPromise.current
          return
        } catch (error) {
          if (!isMounted.current) {
            console.log(`⏭️ [${source}] Previous initialization failed, but component unmounted`)
            return;
          }
          console.log(`⚠️ [${source}] Previous initialization failed, proceeding with new attempt`)
        }
      }

      if (!isMounted.current) {
        console.log(`⏭️ [${source}] Skipping initialization - component not mounted`)
        return;
      }

      if (initializationInProgress.current || hasInitialized.current) {
        console.log(`⏭️ [${source}] Skipping initialization:`, {
          inProgress: initializationInProgress.current,
          hasInitialized: hasInitialized.current
        })
        return;
      }

      // Create a new initialization promise
      initializationPromise.current = (async () => {
        try {
          // Set in-progress flag before any async operations
          initializationInProgress.current = true;

          // Check for existing session first
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (!isMounted.current) {
            console.log(`⏭️ [${source}] Canceling initialization - component unmounted during session check`)
            return;
          }
          if (sessionError) {
            console.log(`⏭️ [${source}] No auth session yet, skipping Stream initialization`)
            return;
          }
          if (!session) {
            console.log(`⏭️ [${source}] No active session, skipping Stream initialization`)
            return;
          }

          console.log(`🔄 [${source}] Starting Stream initialization...`)
          
          // Get current user
          console.log('🔑 Fetching auth user...')
          let authResponse;
          try {
            authResponse = await supabase.auth.getUser()
            console.log('📝 Auth response:', {
              hasData: !!authResponse.data,
              hasUser: !!authResponse.data?.user,
              error: authResponse.error
            })
          } catch (authError) {
            console.error('❌ Auth call failed:', authError)
            throw new Error(`Auth call failed: ${authError}`)
          }

          const { data: { user: authUser }, error: authError } = authResponse
          if (authError) {
            console.error('❌ Auth error:', authError)
            throw new Error(`Auth error: ${authError.message}`)
          }
          if (!authUser) {
            console.error('❌ No auth user found')
            throw new Error('No authenticated user found')
          }
          if (!authUser.email) {
            console.error('❌ Auth user has no email:', authUser)
            throw new Error('Auth user has no email')
          }
          if (!isSubscribed || !isMounted.current) {
            console.error('❌ Component unmounted during auth')
            throw new Error('Component unmounted during auth')
          }
          console.log('✅ Auth user found:', authUser.id)
          
          // Get user profile
          console.log('👤 Fetching user profile...')
          let profileResponse;
          try {
            profileResponse = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', authUser.id)
              .single()
            console.log('📝 Profile response:', {
              hasData: !!profileResponse.data,
              error: profileResponse.error
            })
          } catch (profileError) {
            console.error('❌ Profile query failed:', profileError)
            throw new Error(`Profile query failed: ${profileError}`)
          }

          const { data: profile, error: profileError } = profileResponse
          if (profileError) {
            console.error('❌ Profile error:', profileError)
            throw new Error(`Profile error: ${profileError.message}`)
          }
          if (!profile) {
            console.error('❌ No user profile found')
            throw new Error('No user profile found')
          }
          if (!isSubscribed || !isMounted.current) {
            console.error('❌ Component unmounted during profile fetch')
            throw new Error('Component unmounted during profile fetch')
          }
          console.log('✅ User profile found:', profile.id)
          
          const currentUser = {
            id: authUser.id,
            email: authUser.email,
            username: profile.email?.split('@')[0] || 'user',
            full_name: profile.full_name
          }
          console.log('👤 Current user:', currentUser)
          
          setUser(currentUser)
          
          // Skip if already initialized for this user
          if (chatClient?.userID === currentUser.id && isStreamReady) {
            console.log('⏭️ Stream already initialized for user:', currentUser.id)
            return;
          }

          console.log('🌊 Initializing Stream.io clients for user:', currentUser.id)
          
          // Format user for Stream.io
          const streamUser = StreamUtils.formatStreamUser(currentUser)
          console.log('👤 Stream user formatted:', streamUser)
          
          // Generate token
          console.log('🔑 Generating token...')
          const token = await generateUserToken(currentUser.id)
          if (!isSubscribed || !isMounted.current) {
            console.error('❌ Component unmounted during token generation')
            return;
          }
          console.log('🔑 Token generated, length:', token.length)
          
          // Clean up existing clients if they exist
          if (chatClient) {
            console.log('🧹 Cleaning up existing chat client...')
            await chatClient.disconnectUser()
          }
          if (videoClient) {
            console.log('🧹 Cleaning up existing video client...')
            await videoClient.disconnectUser()
          }
          
          // Initialize Chat Client
          const chat = createStreamChatClient()
          console.log('💬 Connecting to Stream Chat with user:', streamUser.id)
          
          await chat.connectUser(streamUser as StreamUser, token)
          if (!isSubscribed || !isMounted.current) {
            console.error('❌ Component unmounted during chat connection')
            await chat.disconnectUser()
            return;
          }
          setChatClient(chat)
          console.log('💬 Stream Chat client initialized successfully')
          
          // Initialize Video Client
          const video = createStreamVideoClient({ 
            id: currentUser.id, 
            name: currentUser.full_name || currentUser.username 
          }, token)
          if (!isSubscribed || !isMounted.current) {
            console.error('❌ Component unmounted during video setup')
            await chat.disconnectUser()
            return;
          }
          setVideoClient(video)
          console.log('📹 Stream Video client initialized successfully')
          
          setIsStreamReady(true)
          hasInitialized.current = true
          console.log('✅ Stream.io clients ready')
          
        } catch (error) {
          if (!isSubscribed || !isMounted.current) return;
          console.error('❌ Failed to initialize Stream.io clients:', error)
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            isDemoMode: StreamUtils.isDemoMode()
          })
          setChatError(`Failed to initialize chat: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setVideoError(`Failed to initialize video: ${error instanceof Error ? error.message : 'Unknown error'}`)
          // Reset initialization flags so we can try again
          hasInitialized.current = false
          setIsStreamReady(false)
          throw error // Re-throw to mark the promise as failed
        } finally {
          initializationInProgress.current = false;
          initializationPromise.current = null;
        }
      })()

      // Wait for initialization to complete
      try {
        await initializationPromise.current
      } catch (error) {
        console.error('❌ Initialization failed:', error)
      }
    }

    // Set up auth state listener
    let authTimeout: NodeJS.Timeout | null = null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear any pending timeouts
      if (authTimeout) {
        clearTimeout(authTimeout)
      }
      if (initializationTimeout) {
        clearTimeout(initializationTimeout)
      }

      // Handle auth state changes
      if (event === 'SIGNED_IN' && session) {
        console.log('🔐 Auth state changed: SIGNED_IN')
        
        // Wait briefly to allow any route changes to complete
        authTimeout = setTimeout(() => {
          if (isMounted.current && !hasInitialized.current) {
            initializeStreamClients('auth')
          }
        }, 100)
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 Auth state changed: SIGNED_OUT')
        // Reset initialization state
        initializationAttempt = 0;
        // Clean up Stream clients
        if (chatClient) {
          chatClient.disconnectUser()
        }
        if (videoClient) {
          videoClient.disconnectUser()
        }
        setChatClient(null)
        setVideoClient(null)
        setIsStreamReady(false)
        hasInitialized.current = false
        initializationPromise.current = null
      }
    })

    // Initial check for existing session
    const checkSession = async () => {
      if (!isMounted.current) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && !hasInitialized.current && isMounted.current) {
          console.log('✅ Found existing session, starting initialization')
          // Wait briefly to ensure component is stable
          initializationTimeout = setTimeout(() => {
            if (isMounted.current && !hasInitialized.current) {
              initializeStreamClients('session')
            }
          }, 100)
        } else {
          console.log('⏭️ No active session or already initialized')
        }
      } catch (error) {
        console.error('❌ Error checking session:', error)
      }
    }
    
    // Start initial session check
    checkSession()

    return () => {
      console.log('🧹 Starting cleanup...')
      
      // Immediately mark as unmounted to prevent new operations
      isMounted.current = false
      isSubscribed = false
      
      // Clear any pending timeouts
      if (authTimeout) {
        console.log('🧹 Clearing auth timeout')
        clearTimeout(authTimeout)
      }
      if (initializationTimeout) {
        console.log('🧹 Clearing initialization timeout')
        clearTimeout(initializationTimeout)
      }
      
      // Clean up auth subscription
      if (subscription) {
        console.log('🧹 Cleaning up auth subscription')
        subscription.unsubscribe()
      }
      
      // Cancel any ongoing initialization
      if (initializationPromise.current || initializationInProgress.current) {
        console.log('🧹 Canceling pending initialization')
        initializationInProgress.current = false
        initializationPromise.current = null
      }
      
      // Reset all state
      hasInitialized.current = false
      setIsStreamReady(false)
      setChatClient(null)
      setVideoClient(null)
      
      // Clean up Stream clients
      const cleanup = async () => {
        try {
          if (chatClient) {
            console.log('🧹 Disconnecting chat client...')
            await chatClient.disconnectUser()
          }
          if (videoClient) {
            console.log('🧹 Disconnecting video client...')
            await videoClient.disconnectUser()
          }
        } catch (error) {
          console.warn('⚠️ Error during cleanup:', error)
        }
      }
      
      // Run cleanup synchronously to ensure it happens before unmount
      cleanup().catch(error => {
        console.warn('⚠️ Error during final cleanup:', error)
      })
      
      console.log('🧹 Cleanup complete')
    }
  }, [])

  useEffect(() => {
    if (!videoClient) return;

    const handleRinging = async (event: any) => {
      console.log(`📞 Incoming call event...`, event);
      if (event.call_cid) {
        const ringingCall = videoClient.call('default', event.call_cid.split(':')[1]);
        await ringingCall.get();
        setRingingCall(ringingCall);
      }
    };

    videoClient.on('call.ring', handleRinging);

    return () => {
      videoClient.off('call.ring', handleRinging);
    };
  }, [videoClient]);

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
      await videoCall.join({ create: true })
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
          <RingingNotification ringingCall={ringingCall} />
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
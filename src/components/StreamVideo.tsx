'use client'

import React, { useEffect, useState } from 'react'
import { 
  StreamVideo, 
  StreamCall, 
  CallControls, 
  StreamTheme, 
  CallingState,
  useCallStateHooks,
  ParticipantView,
  useCall,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk'
import { useStream } from '@/contexts/StreamContext'
import { createClient } from '@/lib/supabase/client'

const VerticalLayout = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  return (
    <div className="flex flex-col h-full w-full gap-2 p-2">
      {participants.map((p: StreamVideoParticipant) => (
        <div key={p.sessionId} className="flex-1 rounded-lg overflow-hidden">
          <ParticipantView participant={p} />
        </div>
      ))}
    </div>
  );
};

interface StreamVideoCallProps {
  partnerId: string
  partnerName: string
  className?: string
}

const CallUI = ({
  partnerName,
  partnerId,
  onStartCall,
  onInviteUser,
}: {
  partnerName: string;
  partnerId: string;
  onStartCall: () => void;
  onInviteUser: () => void;
}) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const call = useCall();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-6xl">📹</div>
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Video Görüşme
            </h3>
            <p className="text-gray-600">
              {partnerName} ile video görüşme başlatın
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={onStartCall}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 block mx-auto"
            >
              📞 Görüşmeyi Başlat
            </button>
            <button
              onClick={onInviteUser}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 block mx-auto"
            >
              📨 {partnerName}i Davet Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <VerticalLayout />
        </div>
        <div className="p-4 bg-gray-50 border-t responsive-controls">
          <div className="flex items-center justify-between">
            <button
              onClick={onInviteUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>📨</span>
              <span>Davet Et</span>
            </button>
            <CallControls onLeave={() => call?.leave()} />
          </div>
        </div>
      </div>
    </StreamTheme>
  );
};

export function StreamVideoCall({ partnerId, partnerName, className = '' }: StreamVideoCallProps) {
  const {
    videoClient,
    videoCall,
    videoLoading,
    videoError,
    initializeVideo,
    startVideoCall,
    isVideoInitialized,
    isStreamReady,
    isDemoMode
  } = useStream()
  
  // Initialize video when component mounts, but only if it hasn't been initialized before.
  useEffect(() => {
    const init = async () => {
      if (isStreamReady && partnerId && !isVideoInitialized(partnerId)) {
        await initializeVideo(partnerId)
      }
    }
    
    init()
  }, [isStreamReady, partnerId, isVideoInitialized, initializeVideo])

  // When the component re-mounts (e.g., switching tabs), re-fetch the call state
  // to ensure the UI is in sync with the server.
  useEffect(() => {
    if (videoCall) {
      videoCall.get().catch(err => {
        console.error('Failed to re-sync call state on mount:', err);
      });
    }
  }, [videoCall]);

  const handleStartCall = async () => {
    try {
      await startVideoCall()
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const handleInviteUser = async () => {
    if (!videoCall) {
      console.error('No video call available to send invite for')
      return
    }

    try {
      // Get current user data from supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      // Get user's profile to get their name
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        
      const callerName = userProfile?.full_name || 'Someone'
      const callId = videoCall.id

      // Send notification to the partner
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: partnerId,
          title: '📞 Video Call Invitation',
          body: `${callerName} is inviting you to join a video call. Tap to join!`,
          data: {
            type: 'video_call_join',
            callId: callId,
            callerName: callerName,
            callerId: user.id,
            action: 'join_call'
          }
        })
      })

      if (response.ok) {
        console.log('✅ Video call invitation sent successfully')
        // You could show a success message here
      } else {
        console.error('❌ Failed to send video call invitation')
      }
      
    } catch (error) {
      console.error('❌ Error sending video call invitation:', error)
    }
  }

  // Camera troubleshooting tips
  const renderTroubleshootingTips = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h4 className="font-semibold text-yellow-800 mb-2">📹 Video Call Troubleshooting:</h4>
      <ul className="text-sm text-yellow-700 space-y-1">
        <li>• Close other video apps (Zoom, Teams, Skype, etc.)</li>
        <li>• Close other browser tabs using the camera</li>
        <li>• Allow camera permissions in your browser</li>
        <li>• Check if your camera is working in other apps</li>
        <li>• Try refreshing the page</li>
        <li>• Restart your browser if needed</li>
      </ul>
    </div>
  )

  // Loading state
  if (videoLoading || !videoClient) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">
            Video yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (videoError) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">❌ Video Call Error</h3>
            <p className="text-red-700 mb-3">{videoError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          {videoError.includes('Camera') && renderTroubleshootingTips()}
        </div>
      </div>
    )
  }

  // Demo mode
  if (isDemoMode) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Modu
              </h3>
              <p className="text-sm text-yellow-700">
                Stream.io API anahtarları yapılandırılmamış. Gerçek video görüşme için API anahtarlarını ekleyin.
              </p>
            </div>
          </div>
        </div>
        
        {/* Demo Video Interface */}
        <div className="flex-1 p-4">
          <div className="bg-gray-900 rounded-lg h-full flex flex-col relative">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-xl font-medium mb-2">Demo Video Görüşme</h3>
                <p className="text-gray-300">
                  {partnerName} ile video görüşme
                </p>
              </div>
            </div>
            
            {/* Demo Controls */}
            <div className="p-4 flex justify-center space-x-4">
              <button 
                disabled
                className="p-3 bg-gray-600 text-white rounded-full cursor-not-allowed"
                title="Mikrofon"
              >
                🎤
              </button>
              <button 
                disabled
                className="p-3 bg-gray-600 text-white rounded-full cursor-not-allowed"
                title="Kamera"
              >
                📷
              </button>
              <button 
                disabled
                className="p-3 bg-red-500 text-white rounded-full cursor-not-allowed"
                title="Görüşmeyi Sonlandır"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Call not initialized
  if (!videoCall) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-3">
          <div className="text-4xl">📹</div>
          <p className="text-sm text-gray-500">
            Video görüşme hazırlanıyor...
          </p>
        </div>
      </div>
    )
  }

  // Always render the providers, and let the inner CallUI component
  // decide what to show based on the real-time call state.
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <StreamVideo client={videoClient}>
        <StreamCall call={videoCall}>
          <CallUI 
            partnerName={partnerName} 
            partnerId={partnerId}
            onStartCall={handleStartCall} 
            onInviteUser={handleInviteUser}
          />
        </StreamCall>
      </StreamVideo>
    </div>
  )
}

export default StreamVideoCall 
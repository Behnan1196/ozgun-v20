'use client'

import React, { useEffect, useState } from 'react'
import { 
  StreamVideo, 
  StreamCall, 
  CallControls, 
  SpeakerLayout, 
  CallParticipantsList,
  PaginatedGridLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'
import { useStream } from '@/contexts/StreamContext'

interface StreamVideoCallProps {
  partnerId: string
  partnerName: string
  className?: string
}

const CallUI = ({
  partnerName,
  onStartCall,
}: {
  partnerName: string;
  onStartCall: () => void;
}) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

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
          <button
            onClick={onStartCall}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            📞 Görüşmeyi Başlat
          </button>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <PaginatedGridLayout />
        </div>
        <div className="p-4 bg-gray-50 border-t">
          <CallControls onLeave={() => console.log('Call ended')} />
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
    isStreamReady,
    isDemoMode
  } = useStream()
  
  const [initialized, setInitialized] = useState(false)

  // Initialize video when component mounts
  useEffect(() => {
    const init = async () => {
      if (isStreamReady && !initialized && partnerId) {
        await initializeVideo(partnerId)
        setInitialized(true)
      }
    }
    
    init()
  }, [isStreamReady, partnerId, initialized, initializeVideo])

  const handleStartCall = async () => {
    try {
      await startVideoCall()
    } catch (error) {
      console.error('Failed to start call:', error)
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
          <CallUI partnerName={partnerName} onStartCall={handleStartCall} />
        </StreamCall>
      </StreamVideo>
    </div>
  )
}

export default StreamVideoCall 
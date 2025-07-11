'use client'

import React from 'react'
import { Video, Phone, X } from 'lucide-react'

interface VideoCallNotificationProps {
  callInvite: {
    callId: string
    callerName: string
    callerId: string
    expiresAt: number
  }
  onJoin: (callId: string) => void
  onDecline: () => void
}

export default function VideoCallNotification({ 
  callInvite, 
  onJoin, 
  onDecline 
}: VideoCallNotificationProps) {
  const [timeLeft, setTimeLeft] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, callInvite.expiresAt - Date.now())
      setTimeLeft(Math.ceil(remaining / 1000))
      
      if (remaining <= 0) {
        onDecline()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [callInvite.expiresAt, onDecline])

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-right">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Video className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            📞 Video Call Invitation
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {callInvite.callerName} started a video call
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Expires in {timeLeft}s
          </p>
        </div>
        
        <button
          onClick={onDecline}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => onJoin(callInvite.callId)}
          className="flex-1 bg-green-600 text-white text-sm px-3 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
        >
          <Phone className="w-4 h-4" />
          <span>Join Call</span>
        </button>
        
        <button
          onClick={onDecline}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
} 
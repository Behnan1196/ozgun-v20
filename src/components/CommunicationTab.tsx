'use client'

import React, { useState } from 'react'
import { MessageCircle, Video } from 'lucide-react'
import StreamChat from './StreamChat'
import StreamVideo from './StreamVideo'
import { VideoCallInvite } from './VideoCallInvite'

interface CommunicationTabProps {
  userRole: 'coach' | 'student' | 'coordinator' | null
  selectedStudent?: {
    id: string
    full_name: string
  } | null
  assignedCoach?: {
    id: string
    full_name: string
  } | null
}

export function CommunicationTab({
  userRole,
  selectedStudent,
  assignedCoach
}: CommunicationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'video'>('chat')

  // Handle null or invalid user roles
  if (!userRole) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-sm text-gray-500">
          Kullanıcı rolü yükleniyor...
        </p>
      </div>
    )
  }

  // Don't render for coordinators
  if (userRole === 'coordinator') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          💬 Koordinatör olarak doğrudan iletişim özellikleri kullanılamaz.
        </p>
      </div>
    )
  }

  // Determine communication partner
  const partner = userRole === 'coach' ? selectedStudent : assignedCoach
  
  if (!partner) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-sm text-gray-500">
          {userRole === 'coach' 
            ? 'İletişim için bir öğrenci seçin.'
            : 'Henüz bir koç ataması yapılmamış.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tab headers */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
              activeSubTab === 'chat'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Mesajlaşma</span>
          </button>
          <button
            onClick={() => setActiveSubTab('video')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
              activeSubTab === 'video'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video Görüşme</span>
          </button>
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        {/* Chat Tab - Always mounted, but hidden when not active */}
        <div className={`h-full ${activeSubTab === 'chat' ? 'block' : 'hidden'}`}>
          <StreamChat 
            partnerId={partner.id}
            partnerName={partner.full_name}
          />
        </div>

        {/* Video Tab - Always mounted, but hidden when not active */}
        <div className={`h-full ${activeSubTab === 'video' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col space-y-4 p-4">
            {/* Video Call Invite System */}
            <VideoCallInvite
              userRole={userRole}
              partnerId={partner.id}
              partnerName={partner.full_name}
              onCallStart={() => {
                console.log('Starting video call with:', partner.full_name);
              }}
            />
            
            {/* Video Call Interface */}
            <div className="flex-1">
              <StreamVideo 
                partnerId={partner.id}
                partnerName={partner.full_name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
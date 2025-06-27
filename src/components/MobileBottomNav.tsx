'use client'

import { 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Settings,
  Users,
  UserCircle,
  Video,
  Target
} from 'lucide-react'

interface MobileBottomNavProps {
  role: 'student' | 'coach' | 'admin'
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export default function MobileBottomNav({ role, activeTab, onTabChange }: MobileBottomNavProps) {
  // Student tabs match the existing right panel tabs + plan
  const studentTabs = [
    { id: 'statistics', label: 'Gelişimim', icon: BarChart3 },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'goals', label: 'Hedefler', icon: Target },
    { id: 'profile', label: 'Profil', icon: UserCircle },
    { id: 'tools', label: 'Araçlar', icon: Settings }
  ]

  // Coach tabs match the existing right panel tabs + plan
  const coachTabs = [
    { id: 'statistics', label: 'Özet', icon: BarChart3 },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'goals', label: 'Hedefler', icon: Target },
    { id: 'tools', label: 'Araçlar', icon: Settings }
  ]

  // Admin doesn't need mobile nav (desktop only)
  if (role === 'admin') {
    return null
  }

  const tabs = role === 'student' ? studentTabs : coachTabs

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`mobile-tab-button ${active ? 'active' : ''}`}
          >
            <Icon className={`h-5 w-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  BarChart3, 
  Settings,
  Users,
  UserCircle,
  Video,
  Target,
  BookOpen
} from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<any>
  mobileLabel: string
}

interface MobileResponsiveLayoutProps {
  children: React.ReactNode
  role: 'student' | 'coach'
  activeTab: string
  setActiveTab: (tab: string) => void
  weeklyPlanContent: React.ReactNode
  tabContent: React.ReactNode
  header: React.ReactNode
}

export default function MobileResponsiveLayout({
  children,
  role,
  activeTab,
  setActiveTab,
  weeklyPlanContent,
  tabContent,
  header
}: MobileResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Define tabs based on role
  const getTabs = (): Tab[] => {
    if (role === 'student') {
      return [
        { id: 'dashboard', label: 'Gelişimim', icon: BarChart3, mobileLabel: 'Ana Sayfa' },
        { id: 'plan', label: 'Haftalık Plan', icon: Calendar, mobileLabel: 'Plan' },
        { id: 'chat', label: 'Chat', icon: MessageCircle, mobileLabel: 'Chat' },
        { id: 'video', label: 'Video', icon: Video, mobileLabel: 'Video' },
        { id: 'goals', label: 'Hedefler', icon: Target, mobileLabel: 'Hedefler' },
        { id: 'profile', label: 'Bilgilerim', icon: UserCircle, mobileLabel: 'Profil' },
        { id: 'tools', label: 'Araçlar', icon: Settings, mobileLabel: 'Ayarlar' }
      ]
    } else {
      return [
        { id: 'dashboard', label: 'Özet', icon: BarChart3, mobileLabel: 'Ana Sayfa' },
        { id: 'plan', label: 'Haftalık Plan', icon: Calendar, mobileLabel: 'Plan' },
        { id: 'students', label: 'Öğrenciler', icon: Users, mobileLabel: 'Öğrenciler' },
        { id: 'chat', label: 'Chat', icon: MessageCircle, mobileLabel: 'Chat' },
        { id: 'video', label: 'Video', icon: Video, mobileLabel: 'Video' },
        { id: 'goals', label: 'Hedefler', icon: Target, mobileLabel: 'Hedefler' },
        { id: 'tools', label: 'Araçlar', icon: Settings, mobileLabel: 'Ayarlar' }
      ]
    }
  }

  const tabs = getTabs()

  // Map activeTab from desktop tabs to mobile tabs
  const getMobileActiveTab = () => {
    // If it's the plan tab or we're showing weekly plan content
    if (activeTab === 'plan' || !tabs.find(t => t.id === activeTab)) {
      return 'plan'
    }
    
    // Map desktop tab names to mobile tab names
    const tabMap: { [key: string]: string } = {
      'statistics': 'dashboard',
      'profile': 'profile',
      'chat': 'chat',
      'video': 'video',
      'goals': 'goals',
      'tools': 'tools'
    }
    
    return tabMap[activeTab] || 'dashboard'
  }

  const mobileActiveTab = getMobileActiveTab()

  // Handle tab change for mobile
  const handleMobileTabChange = (tabId: string) => {
    if (tabId === 'plan') {
      // For plan tab, we don't need to change the desktop activeTab
      // We'll show the weekly plan content
      return
    }
    
    // Map mobile tab back to desktop tab
    const reverseTabMap: { [key: string]: string } = {
      'dashboard': 'statistics',
      'profile': 'profile', 
      'chat': 'chat',
      'video': 'video',
      'goals': 'goals',
      'tools': 'tools'
    }
    
    const desktopTab = reverseTabMap[tabId] || 'statistics'
    setActiveTab(desktopTab)
  }

  if (!isMobile) {
    // Desktop layout - render children as-is
    return <>{children}</>
  }

  // Mobile layout
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="mobile-header">
        {header}
      </div>

      {/* Mobile Content */}
      <div className="mobile-content flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {mobileActiveTab === 'plan' ? (
            // Show weekly plan content
            <div className="p-4">
              {weeklyPlanContent}
            </div>
          ) : (
            // Show tab content
            <div className="p-4">
              {tabContent}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = mobileActiveTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleMobileTabChange(tab.id)}
              className={`mobile-tab-button ${active ? 'active' : ''}`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.mobileLabel}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
} 
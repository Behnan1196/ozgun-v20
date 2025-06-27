'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  BarChart3, 
  Settings,
  Users,
  UserCircle,
  BookOpen,
  Bell
} from 'lucide-react'

interface NavItem {
  icon: React.ComponentType<any>
  label: string
  href: string
  activePattern: RegExp
}

interface MobileBottomNavProps {
  role: 'student' | 'coach' | 'admin'
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'student':
        return [
          { icon: Home, label: 'Ana Sayfa', href: '/student', activePattern: /^\/student$/ },
          { icon: Calendar, label: 'Plan', href: '/student?tab=plan', activePattern: /\/student.*tab=plan/ },
          { icon: MessageCircle, label: 'Chat', href: '/student?tab=chat', activePattern: /\/student.*tab=chat/ },
          { icon: BarChart3, label: 'İlerleme', href: '/student?tab=progress', activePattern: /\/student.*tab=progress/ },
          { icon: Settings, label: 'Ayarlar', href: '/student?tab=settings', activePattern: /\/student.*tab=settings/ }
        ]
      case 'coach':
        return [
          { icon: Home, label: 'Ana Sayfa', href: '/coach', activePattern: /^\/coach$/ },
          { icon: Users, label: 'Öğrenciler', href: '/coach/students', activePattern: /\/coach\/students/ },
          { icon: MessageCircle, label: 'Mesajlar', href: '/coach?tab=messages', activePattern: /\/coach.*tab=messages/ },
          { icon: BarChart3, label: 'Analiz', href: '/coach?tab=analytics', activePattern: /\/coach.*tab=analytics/ },
          { icon: Settings, label: 'Ayarlar', href: '/coach?tab=settings', activePattern: /\/coach.*tab=settings/ }
        ]
      case 'admin':
        return [
          { icon: Home, label: 'Ana Sayfa', href: '/admin', activePattern: /^\/admin$/ },
          { icon: Users, label: 'Kullanıcılar', href: '/admin/users', activePattern: /\/admin\/users/ },
          { icon: Bell, label: 'Duyurular', href: '/admin/announcements', activePattern: /\/admin\/announcements/ },
          { icon: BookOpen, label: 'Kaynaklar', href: '/admin/resources', activePattern: /\/admin\/resources/ },
          { icon: Settings, label: 'Ayarlar', href: '/admin/settings', activePattern: /\/admin\/settings/ }
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const isActive = (item: NavItem) => {
    return item.activePattern.test(pathname + (typeof window !== 'undefined' ? window.location.search : ''))
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <nav className="mobile-bottom-nav md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        
        return (
          <button
            key={item.href}
            onClick={() => handleNavigation(item.href)}
            className={`mobile-tab-button ${active ? 'active' : ''}`}
          >
            <Icon className={`h-5 w-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
} 
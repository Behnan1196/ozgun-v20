'use client'

import { useState, useEffect } from 'react'

interface MobileResponsiveLayoutProps {
  children: React.ReactNode
  role: 'student' | 'coach'
  header: React.ReactNode
}

export default function MobileResponsiveLayout({
  children,
  role,
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
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 
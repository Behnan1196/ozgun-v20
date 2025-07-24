'use client'

import React, { useState, useEffect, useRef } from 'react'
import { StreamProvider } from '@/contexts/StreamContext'

interface StableStreamProviderProps {
  children: React.ReactNode
}

export function StableStreamProvider({ children }: StableStreamProviderProps) {
  const [isStable, setIsStable] = useState(false)
  const mountedRef = useRef(false)
  const stabilityTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('🔧 StableStreamProvider MOUNTED - waiting for stability')
    mountedRef.current = true
    
    // Wait longer for component tree to stabilize before mounting StreamProvider
    stabilityTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        console.log('🏗️ Component tree stable, mounting StreamProvider')
        setIsStable(true)
      }
    }, 500) // Longer delay to ensure maximum stability

    return () => {
      console.log('🔧 StableStreamProvider UNMOUNTED')
      mountedRef.current = false
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current)
      }
    }
  }, [])

  // Don't render StreamProvider until component tree is stable
  if (!isStable) {
    return <>{children}</>
  }

  return (
    <StreamProvider>
      {children}
    </StreamProvider>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { WifiOff, Wifi } from 'lucide-react'
import { ClientOnly } from './client-only'

function OfflineIndicatorInner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (!online) {
        setShowIndicator(true)
      } else {
        // Hide indicator after 3 seconds when back online
        setTimeout(() => setShowIndicator(false), 3000)
      }
    }

    // Set initial status
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className={`${
        isOnline 
          ? 'bg-green-50 border-green-200' 
          : 'bg-orange-50 border-orange-200'
      } shadow-lg`}>
        <CardContent className="flex items-center space-x-2 py-2 px-4">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Back online
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Working offline
              </span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function OfflineIndicator() {
  return (
    <ClientOnly>
      <OfflineIndicatorInner />
    </ClientOnly>
  )
}

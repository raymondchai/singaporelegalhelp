'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone } from 'lucide-react'
import { ClientOnly } from './client-only'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

function PWAInstallPromptInner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install prompt after a delay (better UX)
      setTimeout(() => {
        if (!standalone) {
          setShowInstallPrompt(true)
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const now = new Date()
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24)
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  // Don't show if already installed or user is not on mobile
  if (isStandalone || (!deferredPrompt && !isIOS) || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-semibold text-blue-900">
                Install Singapore Legal Help
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs text-blue-700">
            {isIOS 
              ? 'Add to your home screen for quick access to legal help'
              : 'Install our app for offline access and faster performance'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isIOS ? (
            <div className="text-xs text-blue-700">
              <p className="mb-2">To install:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the Share button in Safari</li>
                <li>Select "Add to Home Screen"</li>
                <li>Tap "Add" to install</li>
              </ol>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function PWAInstallPrompt() {
  return (
    <ClientOnly>
      <PWAInstallPromptInner />
    </ClientOnly>
  )
}

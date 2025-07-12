'use client'

import { useState, useEffect } from 'react'
import { pwaAnalytics, PWAMetrics } from '@/lib/pwa-analytics'

export function usePWAAnalytics() {
  const [metrics, setMetrics] = useState<PWAMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial metrics
    const loadMetrics = () => {
      try {
        const currentMetrics = pwaAnalytics.getMetrics()
        setMetrics(currentMetrics)
      } catch (error) {
        console.error('Failed to load PWA metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000)

    return () => clearInterval(interval)
  }, [])

  const trackEvent = (type: string, action: string, data?: any) => {
    pwaAnalytics.trackEvent(type as any, action, data)
    // Refresh metrics after tracking
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackOfflinePageView = (page: string) => {
    pwaAnalytics.trackOfflinePageView(page)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackOfflineFeatureUsage = (feature: string) => {
    pwaAnalytics.trackOfflineFeatureUsage(feature)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackNotificationSent = (type: string) => {
    pwaAnalytics.trackNotificationSent(type)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackNotificationClicked = (type: string) => {
    pwaAnalytics.trackNotificationClicked(type)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackNotificationDismissed = (type: string) => {
    pwaAnalytics.trackNotificationDismissed(type)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackSyncAttempt = () => {
    pwaAnalytics.trackSyncAttempt()
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackSyncSuccess = (duration: number) => {
    pwaAnalytics.trackSyncSuccess(duration)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const trackSyncFailure = (error: string) => {
    pwaAnalytics.trackSyncFailure(error)
    setMetrics(pwaAnalytics.getMetrics())
  }

  const getEngagementMetrics = () => {
    return pwaAnalytics.getEngagementMetrics()
  }

  const exportData = () => {
    return pwaAnalytics.exportData()
  }

  const clearData = () => {
    pwaAnalytics.clearData()
    setMetrics(pwaAnalytics.getMetrics())
  }

  return {
    metrics,
    isLoading,
    trackEvent,
    trackOfflinePageView,
    trackOfflineFeatureUsage,
    trackNotificationSent,
    trackNotificationClicked,
    trackNotificationDismissed,
    trackSyncAttempt,
    trackSyncSuccess,
    trackSyncFailure,
    getEngagementMetrics,
    exportData,
    clearData
  }
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkInstalled()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      pwaAnalytics.trackEvent('install_prompt', 'available')
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      pwaAnalytics.trackEvent('app_installed', 'success')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    try {
      pwaAnalytics.trackEvent('install_prompt', 'triggered')
      
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        pwaAnalytics.trackEvent('install_prompt', 'accepted')
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      } else {
        pwaAnalytics.trackEvent('install_prompt', 'dismissed')
        return false
      }
    } catch (error) {
      console.error('Error prompting install:', error)
      pwaAnalytics.trackEvent('install_prompt', 'error', { error: String(error) })
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall
  }
}

// Hook for PWA performance monitoring
export function usePWAPerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    serviceWorkerStatus: 'unknown'
  })

  useEffect(() => {
    // Measure page load performance
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          const renderTime = navigation.domContentLoadedEventEnd - navigation.fetchStart
          
          setPerformanceMetrics(prev => ({
            ...prev,
            loadTime,
            renderTime
          }))

          pwaAnalytics.trackEvent('performance', 'page_load', {
            loadTime,
            renderTime
          })
        }
      }
    }

    // Check service worker status
    const checkServiceWorkerStatus = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          const status = registration ? 'active' : 'not_registered'
          
          setPerformanceMetrics(prev => ({
            ...prev,
            serviceWorkerStatus: status
          }))

          pwaAnalytics.trackEvent('performance', 'service_worker_status', { status })
        } catch (error) {
          setPerformanceMetrics(prev => ({
            ...prev,
            serviceWorkerStatus: 'error'
          }))
        }
      } else {
        setPerformanceMetrics(prev => ({
          ...prev,
          serviceWorkerStatus: 'not_supported'
        }))
      }
    }

    // Run measurements after page load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
    }

    checkServiceWorkerStatus()

    return () => {
      window.removeEventListener('load', measurePerformance)
    }
  }, [])

  const measureCustomMetric = (name: string, value: number) => {
    pwaAnalytics.trackEvent('performance', 'custom_metric', { name, value })
  }

  return {
    performanceMetrics,
    measureCustomMetric
  }
}

// Hook for offline usage tracking
export function useOfflineTracking() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [offlineStartTime, setOfflineStartTime] = useState<number | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      
      if (offlineStartTime) {
        const offlineDuration = Date.now() - offlineStartTime
        pwaAnalytics.trackEvent('offline_usage', 'session_end', { duration: offlineDuration })
        setOfflineStartTime(null)
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      setOfflineStartTime(Date.now())
      pwaAnalytics.trackEvent('offline_usage', 'session_start')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Track initial offline state
    if (isOffline && !offlineStartTime) {
      setOfflineStartTime(Date.now())
      pwaAnalytics.trackEvent('offline_usage', 'session_start')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOffline, offlineStartTime])

  const trackOfflineAction = (action: string, data?: any) => {
    if (isOffline) {
      pwaAnalytics.trackEvent('offline_usage', action, data)
    }
  }

  return {
    isOffline,
    trackOfflineAction
  }
}

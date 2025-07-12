// PWA Analytics and Monitoring System
// Tracks PWA-specific metrics, offline usage, and performance

export interface PWAMetrics {
  // Installation metrics
  installPromptShown: number
  installPromptAccepted: number
  installPromptDismissed: number
  appInstalled: number
  
  // Usage metrics
  sessionCount: number
  offlineSessionCount: number
  averageSessionDuration: number
  pagesViewedOffline: number
  
  // Notification metrics
  notificationsSent: number
  notificationsClicked: number
  notificationsDismissed: number
  notificationPermissionRequests: number
  notificationPermissionGranted: number
  
  // Sync metrics
  syncAttempts: number
  syncSuccesses: number
  syncFailures: number
  averageSyncTime: number
  
  // Performance metrics
  serviceWorkerInstallTime: number
  cacheHitRate: number
  offlinePageLoads: number
  
  // User engagement
  returnVisits: number
  daysActive: number
  featuresUsedOffline: string[]
}

export interface PWAEvent {
  type: 'install_prompt' | 'app_installed' | 'offline_usage' | 'notification' | 'sync' | 'performance'
  action: string
  data?: any
  timestamp: number
  sessionId: string
  userId?: string
}

class PWAAnalyticsService {
  private sessionId: string
  private sessionStart: number
  private isOffline: boolean = false
  private metrics: PWAMetrics
  private events: PWAEvent[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStart = Date.now()
    this.metrics = this.loadMetrics()
    this.initializeTracking()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private loadMetrics(): PWAMetrics {
    try {
      const stored = localStorage.getItem('pwa-metrics')
      if (stored) {
        return { ...this.getDefaultMetrics(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load PWA metrics:', error)
    }
    return this.getDefaultMetrics()
  }

  private getDefaultMetrics(): PWAMetrics {
    return {
      installPromptShown: 0,
      installPromptAccepted: 0,
      installPromptDismissed: 0,
      appInstalled: 0,
      sessionCount: 0,
      offlineSessionCount: 0,
      averageSessionDuration: 0,
      pagesViewedOffline: 0,
      notificationsSent: 0,
      notificationsClicked: 0,
      notificationsDismissed: 0,
      notificationPermissionRequests: 0,
      notificationPermissionGranted: 0,
      syncAttempts: 0,
      syncSuccesses: 0,
      syncFailures: 0,
      averageSyncTime: 0,
      serviceWorkerInstallTime: 0,
      cacheHitRate: 0,
      offlinePageLoads: 0,
      returnVisits: 0,
      daysActive: 0,
      featuresUsedOffline: []
    }
  }

  private saveMetrics() {
    try {
      localStorage.setItem('pwa-metrics', JSON.stringify(this.metrics))
    } catch (error) {
      console.error('Failed to save PWA metrics:', error)
    }
  }

  private initializeTracking() {
    // Track session start
    this.trackEvent('performance', 'session_start')
    this.metrics.sessionCount++

    // Track online/offline status
    this.isOffline = !navigator.onLine
    if (this.isOffline) {
      this.metrics.offlineSessionCount++
    }

    window.addEventListener('online', () => {
      this.isOffline = false
      this.trackEvent('performance', 'online')
    })

    window.addEventListener('offline', () => {
      this.isOffline = true
      this.trackEvent('performance', 'offline')
    })

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('performance', 'page_hidden')
      } else {
        this.trackEvent('performance', 'page_visible')
      }
    })

    // Track beforeunload for session duration
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd()
    })

    // Track PWA install events
    this.trackInstallEvents()

    // Track service worker events
    this.trackServiceWorkerEvents()

    // Save metrics periodically
    setInterval(() => {
      this.saveMetrics()
    }, 30000) // Every 30 seconds
  }

  private trackInstallEvents() {
    // Track install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      this.trackEvent('install_prompt', 'shown')
      this.metrics.installPromptShown++
      
      // Store the event for later use
      const deferredPrompt = e as any
      
      // Track user choice
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          this.trackEvent('install_prompt', 'accepted')
          this.metrics.installPromptAccepted++
        } else {
          this.trackEvent('install_prompt', 'dismissed')
          this.metrics.installPromptDismissed++
        }
      })
    })

    // Track app installation
    window.addEventListener('appinstalled', () => {
      this.trackEvent('app_installed', 'success')
      this.metrics.appInstalled++
    })
  }

  private trackServiceWorkerEvents() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const installStart = performance.now()
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                const installTime = performance.now() - installStart
                this.metrics.serviceWorkerInstallTime = installTime
                this.trackEvent('performance', 'service_worker_installed', { installTime })
              }
            })
          }
        })
      })
    }
  }

  private trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStart
    this.trackEvent('performance', 'session_end', { duration: sessionDuration })
    
    // Update average session duration
    const totalSessions = this.metrics.sessionCount
    const currentAverage = this.metrics.averageSessionDuration
    this.metrics.averageSessionDuration = 
      (currentAverage * (totalSessions - 1) + sessionDuration) / totalSessions
    
    this.saveMetrics()
  }

  // Public tracking methods
  trackEvent(type: PWAEvent['type'], action: string, data?: any) {
    const event: PWAEvent = {
      type,
      action,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId()
    }

    this.events.push(event)
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }

    // Send to analytics service if online
    if (navigator.onLine) {
      this.sendEventToAnalytics(event)
    }
  }

  trackOfflinePageView(page: string) {
    this.metrics.pagesViewedOffline++
    this.trackEvent('offline_usage', 'page_view', { page })
  }

  trackOfflineFeatureUsage(feature: string) {
    if (!this.metrics.featuresUsedOffline.includes(feature)) {
      this.metrics.featuresUsedOffline.push(feature)
    }
    this.trackEvent('offline_usage', 'feature_used', { feature })
  }

  trackNotificationSent(type: string) {
    this.metrics.notificationsSent++
    this.trackEvent('notification', 'sent', { type })
  }

  trackNotificationClicked(type: string) {
    this.metrics.notificationsClicked++
    this.trackEvent('notification', 'clicked', { type })
  }

  trackNotificationDismissed(type: string) {
    this.metrics.notificationsDismissed++
    this.trackEvent('notification', 'dismissed', { type })
  }

  trackNotificationPermissionRequest() {
    this.metrics.notificationPermissionRequests++
    this.trackEvent('notification', 'permission_requested')
  }

  trackNotificationPermissionGranted() {
    this.metrics.notificationPermissionGranted++
    this.trackEvent('notification', 'permission_granted')
  }

  trackSyncAttempt() {
    this.metrics.syncAttempts++
    this.trackEvent('sync', 'attempt')
  }

  trackSyncSuccess(duration: number) {
    this.metrics.syncSuccesses++
    
    // Update average sync time
    const totalSyncs = this.metrics.syncSuccesses
    const currentAverage = this.metrics.averageSyncTime
    this.metrics.averageSyncTime = 
      (currentAverage * (totalSyncs - 1) + duration) / totalSyncs
    
    this.trackEvent('sync', 'success', { duration })
  }

  trackSyncFailure(error: string) {
    this.metrics.syncFailures++
    this.trackEvent('sync', 'failure', { error })
  }

  trackCacheHit() {
    // This would be called from service worker
    this.trackEvent('performance', 'cache_hit')
  }

  trackCacheMiss() {
    // This would be called from service worker
    this.trackEvent('performance', 'cache_miss')
  }

  // Analytics reporting
  getMetrics(): PWAMetrics {
    return { ...this.metrics }
  }

  getEngagementMetrics() {
    const totalSessions = this.metrics.sessionCount
    const offlineUsageRate = totalSessions > 0 ? 
      (this.metrics.offlineSessionCount / totalSessions) * 100 : 0
    
    const notificationEngagementRate = this.metrics.notificationsSent > 0 ?
      (this.metrics.notificationsClicked / this.metrics.notificationsSent) * 100 : 0
    
    const syncSuccessRate = this.metrics.syncAttempts > 0 ?
      (this.metrics.syncSuccesses / this.metrics.syncAttempts) * 100 : 0

    return {
      totalSessions,
      offlineUsageRate,
      averageSessionDuration: this.metrics.averageSessionDuration,
      notificationEngagementRate,
      syncSuccessRate,
      featuresUsedOffline: this.metrics.featuresUsedOffline.length,
      installConversionRate: this.metrics.installPromptShown > 0 ?
        (this.metrics.installPromptAccepted / this.metrics.installPromptShown) * 100 : 0
    }
  }

  private getUserId(): string | undefined {
    // Get user ID from auth system
    try {
      const authData = localStorage.getItem('supabase.auth.token')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed.user?.id
      }
    } catch (error) {
      // Silent error
    }
    return undefined
  }

  private async sendEventToAnalytics(event: PWAEvent) {
    try {
      await fetch('/api/analytics/pwa-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      // Queue for later if offline
      console.error('Failed to send analytics event:', error)
    }
  }

  // Export data for analysis
  exportData() {
    return {
      metrics: this.metrics,
      events: this.events,
      sessionInfo: {
        sessionId: this.sessionId,
        sessionStart: this.sessionStart,
        isOffline: this.isOffline
      }
    }
  }

  // Clear all data
  clearData() {
    this.metrics = this.getDefaultMetrics()
    this.events = []
    localStorage.removeItem('pwa-metrics')
  }
}

// Singleton instance
export const pwaAnalytics = new PWAAnalyticsService()

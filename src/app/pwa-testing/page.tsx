'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff,
  Bell,
  Download,
  Smartphone,
  Database,
  BarChart3,
  TestTube
} from 'lucide-react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = false

// Dynamically import hooks that use browser APIs
const PWAHooksWrapper = dynamic(() => Promise.resolve(PWAHooksComponent), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading PWA functionality...</div>
})

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message: string
  details?: any
}

// Component that uses PWA hooks - only loads on client
function PWAHooksComponent({ onTestResults }: { onTestResults: (results: TestResult[]) => void }) {
  // Import hooks only when component mounts (client-side)
  const [hooks, setHooks] = useState<any>(null)
  
  useEffect(() => {
    const loadHooks = async () => {
      try {
        const [
          { useOfflineStorage },
          { useBackgroundSync },
          { usePushNotifications },
          { usePWAAnalytics, usePWAInstall, usePWAPerformance }
        ] = await Promise.all([
          import('@/hooks/use-offline-storage'),
          import('@/hooks/use-background-sync'),
          import('@/hooks/use-push-notifications'),
          import('@/hooks/use-pwa-analytics')
        ])

        setHooks({
          useOfflineStorage,
          useBackgroundSync,
          usePushNotifications,
          usePWAAnalytics,
          usePWAInstall,
          usePWAPerformance
        })
      } catch (error) {
        console.error('Failed to load PWA hooks:', error)
        // Set fallback hooks
        setHooks({
          useOfflineStorage: () => ({ isSupported: false, isInitialized: false, syncPendingActions: () => {} }),
          useBackgroundSync: () => ({ isOnline: true, syncStats: {}, triggerSync: () => Promise.resolve() }),
          usePushNotifications: () => ({ isSupported: false, permission: 'default', requestPermission: () => {} }),
          usePWAAnalytics: () => ({ metrics: null, getEngagementMetrics: () => ({}) }),
          usePWAInstall: () => ({ isInstallable: false, isInstalled: false, promptInstall: () => {} }),
          usePWAPerformance: () => ({ performanceMetrics: { loadTime: 0, renderTime: 0, serviceWorkerStatus: 'unknown' } })
        })
      }
    }

    loadHooks()
  }, [])

  // Use hooks only after they're loaded
  const offlineStorage = hooks?.useOfflineStorage() || { isSupported: false, isInitialized: false, syncPendingActions: () => {} }
  const backgroundSync = hooks?.useBackgroundSync() || { isOnline: true, syncStats: {}, triggerSync: () => Promise.resolve() }
  const pushNotifications = hooks?.usePushNotifications() || { isSupported: false, permission: 'default', requestPermission: () => {} }
  const analytics = hooks?.usePWAAnalytics() || { metrics: null, getEngagementMetrics: () => ({}) }
  const install = hooks?.usePWAInstall() || { isInstallable: false, isInstalled: false, promptInstall: () => {} }
  const performance = hooks?.usePWAPerformance() || { performanceMetrics: { loadTime: 0, renderTime: 0, serviceWorkerStatus: 'unknown' } }

  const runComprehensiveTests = async () => {
    if (!hooks) {
      onTestResults([{
        name: 'PWA Hooks',
        status: 'fail',
        message: 'PWA hooks not loaded yet. Please wait and try again.'
      }])
      return
    }

    const results: TestResult[] = []

    // Browser environment check
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      results.push({
        name: 'Browser Environment',
        status: 'fail',
        message: 'Not running in browser environment'
      })
      onTestResults(results)
      return
    }

    // Test 1: PWA Manifest
    try {
      const response = await fetch('/manifest.json')
      if (response.ok) {
        const manifest = await response.json()
        results.push({
          name: 'PWA Manifest',
          status: 'pass',
          message: `Manifest loaded successfully. App name: ${manifest.name}`,
          details: manifest
        })
      } else {
        results.push({
          name: 'PWA Manifest',
          status: 'fail',
          message: 'Failed to load manifest.json'
        })
      }
    } catch (error) {
      results.push({
        name: 'PWA Manifest',
        status: 'fail',
        message: `Manifest error: ${error}`
      })
    }

    // Test 2: Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          results.push({
            name: 'Service Worker',
            status: 'pass',
            message: `Service worker active. Scope: ${registration.scope}`,
            details: { scope: registration.scope, state: registration.active?.state }
          })
        } else {
          results.push({
            name: 'Service Worker',
            status: 'warning',
            message: 'Service worker not registered'
          })
        }
      } catch (error) {
        results.push({
          name: 'Service Worker',
          status: 'fail',
          message: `Service worker error: ${error}`
        })
      }
    } else {
      results.push({
        name: 'Service Worker',
        status: 'fail',
        message: 'Service workers not supported'
      })
    }

    // Test 3: Offline Storage
    if (offlineStorage.isSupported && offlineStorage.isInitialized) {
      results.push({
        name: 'Offline Storage',
        status: 'pass',
        message: 'IndexedDB storage working correctly',
        details: { supported: offlineStorage.isSupported, initialized: offlineStorage.isInitialized }
      })
    } else {
      results.push({
        name: 'Offline Storage',
        status: 'fail',
        message: 'Offline storage not supported or not initialized'
      })
    }

    // Test 4: Background Sync
    try {
      await backgroundSync.triggerSync()
      results.push({
        name: 'Background Sync',
        status: 'pass',
        message: 'Background sync functionality working',
        details: backgroundSync.syncStats
      })
    } catch (error) {
      results.push({
        name: 'Background Sync',
        status: 'fail',
        message: `Background sync failed: ${error}`
      })
    }

    // Test 5: Push Notifications
    if (pushNotifications.isSupported) {
      results.push({
        name: 'Push Notifications',
        status: pushNotifications.permission === 'granted' ? 'pass' : pushNotifications.permission === 'denied' ? 'fail' : 'warning',
        message: `Notifications supported. Permission: ${pushNotifications.permission}`,
        details: { supported: pushNotifications.isSupported, permission: pushNotifications.permission }
      })
    } else {
      results.push({
        name: 'Push Notifications',
        status: 'fail',
        message: 'Push notifications not supported'
      })
    }

    // Test 6: PWA Installation
    if (install.isInstalled) {
      results.push({
        name: 'PWA Installation',
        status: 'pass',
        message: 'App is installed as PWA'
      })
    } else if (install.isInstallable) {
      results.push({
        name: 'PWA Installation',
        status: 'warning',
        message: 'App is installable but not installed'
      })
    } else {
      results.push({
        name: 'PWA Installation',
        status: 'warning',
        message: 'App installation not available'
      })
    }

    // Test 7: Network Status Detection
    const networkTest = navigator.onLine
    results.push({
      name: 'Network Detection',
      status: 'pass',
      message: `Network status detection working. Currently: ${networkTest ? 'Online' : 'Offline'}`,
      details: { online: networkTest }
    })

    // Test 8: Cache API
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        results.push({
          name: 'Cache API',
          status: 'pass',
          message: `Cache API working. ${cacheNames.length} caches found`,
          details: { cacheNames }
        })
      } catch (error) {
        results.push({
          name: 'Cache API',
          status: 'fail',
          message: `Cache API error: ${error}`
        })
      }
    } else {
      results.push({
        name: 'Cache API',
        status: 'fail',
        message: 'Cache API not supported'
      })
    }

    // Test 9: Performance Metrics
    if (performance.performanceMetrics.loadTime > 0) {
      const loadTimeStatus = performance.performanceMetrics.loadTime < 3000 ? 'pass' : 
                           performance.performanceMetrics.loadTime < 5000 ? 'warning' : 'fail'
      results.push({
        name: 'Performance',
        status: loadTimeStatus,
        message: `Load time: ${performance.performanceMetrics.loadTime}ms, Render time: ${performance.performanceMetrics.renderTime}ms`,
        details: performance.performanceMetrics
      })
    } else {
      results.push({
        name: 'Performance',
        status: 'warning',
        message: 'Performance metrics not available'
      })
    }

    // Test 10: Analytics Tracking
    if (analytics.metrics) {
      results.push({
        name: 'Analytics Tracking',
        status: 'pass',
        message: `Analytics working. ${analytics.metrics.sessionCount} sessions tracked`,
        details: analytics.getEngagementMetrics()
      })
    } else {
      results.push({
        name: 'Analytics Tracking',
        status: 'warning',
        message: 'Analytics not initialized'
      })
    }

    onTestResults(results)
  }

  return (
    <Button 
      onClick={runComprehensiveTests}
      disabled={!hooks}
      className="flex items-center space-x-2"
    >
      <TestTube className="h-4 w-4" />
      <span>{!hooks ? 'Loading PWA Hooks...' : 'Run All Tests'}</span>
    </Button>
  )
}

export default function PWATestingPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleTestResults = (results: TestResult[]) => {
    setTestResults(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const testStats = {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'pass').length,
    failed: testResults.filter(r => r.status === 'fail').length,
    warnings: testResults.filter(r => r.status === 'warning').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">PWA Testing Suite</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive testing for Progressive Web App functionality, offline capabilities, 
            and performance metrics.
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run comprehensive tests to validate PWA functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <PWAHooksWrapper onTestResults={handleTestResults} />

              {testResults.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {testStats.passed}/{testStats.total} tests passed
                  </div>
                  <div className="flex space-x-2">
                    <Badge className="bg-green-100 text-green-800">{testStats.passed} Pass</Badge>
                    <Badge variant="destructive">{testStats.failed} Fail</Badge>
                    <Badge variant="secondary">{testStats.warnings} Warning</Badge>
                  </div>
                </div>
              )}
            </div>

            {isRunning && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Running tests...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  {result.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
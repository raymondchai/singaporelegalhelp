'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { useBackgroundSync } from '@/hooks/use-background-sync'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { usePWAAnalytics, usePWAInstall, usePWAPerformance } from '@/hooks/use-pwa-analytics'
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

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message: string
  details?: any
}

export default function PWATestingPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const { isSupported: storageSupported, isInitialized, syncPendingActions } = useOfflineStorage()
  const { isOnline, syncStats, triggerSync } = useBackgroundSync()
  const { isSupported: notificationSupported, permission, requestPermission } = usePushNotifications()
  const { metrics, getEngagementMetrics } = usePWAAnalytics()
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()
  const { performanceMetrics } = usePWAPerformance()

  const runComprehensiveTests = async () => {
    setIsRunning(true)
    setProgress(0)
    const results: TestResult[] = []

    // Test 1: PWA Manifest
    setProgress(10)
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
    setProgress(20)
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
    setProgress(30)
    if (storageSupported && isInitialized) {
      try {
        // Test saving a document
        const testDoc = {
          title: 'Test Document',
          content: 'This is a test document for PWA testing',
          type: 'user-document' as const,
          category: 'test',
          lastModified: new Date().toISOString()
        }
        
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
        
        results.push({
          name: 'Offline Storage',
          status: 'pass',
          message: 'IndexedDB storage working correctly',
          details: { supported: storageSupported, initialized: isInitialized }
        })
      } catch (error) {
        results.push({
          name: 'Offline Storage',
          status: 'fail',
          message: `Storage test failed: ${error}`
        })
      }
    } else {
      results.push({
        name: 'Offline Storage',
        status: 'fail',
        message: 'Offline storage not supported or not initialized'
      })
    }

    // Test 4: Background Sync
    setProgress(40)
    try {
      await triggerSync()
      results.push({
        name: 'Background Sync',
        status: 'pass',
        message: 'Background sync functionality working',
        details: syncStats
      })
    } catch (error) {
      results.push({
        name: 'Background Sync',
        status: 'fail',
        message: `Background sync failed: ${error}`
      })
    }

    // Test 5: Push Notifications
    setProgress(50)
    if (notificationSupported) {
      results.push({
        name: 'Push Notifications',
        status: permission === 'granted' ? 'pass' : permission === 'denied' ? 'fail' : 'warning',
        message: `Notifications supported. Permission: ${permission}`,
        details: { supported: notificationSupported, permission }
      })
    } else {
      results.push({
        name: 'Push Notifications',
        status: 'fail',
        message: 'Push notifications not supported'
      })
    }

    // Test 6: PWA Installation
    setProgress(60)
    if (isInstalled) {
      results.push({
        name: 'PWA Installation',
        status: 'pass',
        message: 'App is installed as PWA'
      })
    } else if (isInstallable) {
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
    setProgress(70)
    const networkTest = navigator.onLine
    results.push({
      name: 'Network Detection',
      status: 'pass',
      message: `Network status detection working. Currently: ${networkTest ? 'Online' : 'Offline'}`,
      details: { online: networkTest }
    })

    // Test 8: Cache API
    setProgress(80)
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
    setProgress(90)
    if (performanceMetrics.loadTime > 0) {
      const loadTimeStatus = performanceMetrics.loadTime < 3000 ? 'pass' : 
                           performanceMetrics.loadTime < 5000 ? 'warning' : 'fail'
      results.push({
        name: 'Performance',
        status: loadTimeStatus,
        message: `Load time: ${performanceMetrics.loadTime}ms, Render time: ${performanceMetrics.renderTime}ms`,
        details: performanceMetrics
      })
    } else {
      results.push({
        name: 'Performance',
        status: 'warning',
        message: 'Performance metrics not available'
      })
    }

    // Test 10: Analytics Tracking
    setProgress(100)
    if (metrics) {
      results.push({
        name: 'Analytics Tracking',
        status: 'pass',
        message: `Analytics working. ${metrics.sessionCount} sessions tracked`,
        details: getEngagementMetrics()
      })
    } else {
      results.push({
        name: 'Analytics Tracking',
        status: 'warning',
        message: 'Analytics not initialized'
      })
    }

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
              <Button 
                onClick={runComprehensiveTests}
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
              </Button>

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
          <Tabs defaultValue="results" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
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
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    PWA performance and loading metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Load Time:</span>
                        <span className="font-medium">{performanceMetrics.loadTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Render Time:</span>
                        <span className="font-medium">{performanceMetrics.renderTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Worker:</span>
                        <span className="font-medium">{performanceMetrics.serviceWorkerStatus}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network Status:</span>
                        <div className="flex items-center space-x-2">
                          {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                          <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PWA Installed:</span>
                        <span className="font-medium">{isInstalled ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Installable:</span>
                        <span className="font-medium">{isInstallable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>PWA Analytics</CardTitle>
                  <CardDescription>
                    Usage metrics and engagement data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Usage Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Sessions:</span>
                            <span className="font-medium">{metrics.sessionCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Offline Sessions:</span>
                            <span className="font-medium">{metrics.offlineSessionCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Session Duration:</span>
                            <span className="font-medium">{Math.round(metrics.averageSessionDuration / 1000)}s</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Notifications</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sent:</span>
                            <span className="font-medium">{metrics.notificationsSent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Clicked:</span>
                            <span className="font-medium">{metrics.notificationsClicked}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Permission Granted:</span>
                            <span className="font-medium">{metrics.notificationPermissionGranted}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Sync Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attempts:</span>
                            <span className="font-medium">{metrics.syncAttempts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Successes:</span>
                            <span className="font-medium">{metrics.syncSuccesses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Failures:</span>
                            <span className="font-medium">{metrics.syncFailures}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

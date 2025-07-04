'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface PWATestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

export default function PWATestPage() {
  const [testResults, setTestResults] = useState<PWATestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    runPWATests()
  }, [])

  const runPWATests = async () => {
    const results: PWATestResult[] = []

    // Test 1: Service Worker Support
    if ('serviceWorker' in navigator) {
      results.push({
        name: 'Service Worker Support',
        status: 'pass',
        message: 'Browser supports service workers'
      })

      // Test 2: Service Worker Registration
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          results.push({
            name: 'Service Worker Registration',
            status: 'pass',
            message: `Service worker registered at scope: ${registration.scope}`
          })
        } else {
          results.push({
            name: 'Service Worker Registration',
            status: 'warning',
            message: 'Service worker not yet registered (may be loading)'
          })
        }
      } catch (error) {
        results.push({
          name: 'Service Worker Registration',
          status: 'fail',
          message: `Failed to check registration: ${error}`
        })
      }
    } else {
      results.push({
        name: 'Service Worker Support',
        status: 'fail',
        message: 'Browser does not support service workers'
      })
    }

    // Test 3: Manifest Support
    if ('manifest' in document.createElement('link')) {
      results.push({
        name: 'Web App Manifest Support',
        status: 'pass',
        message: 'Browser supports web app manifests'
      })
    } else {
      results.push({
        name: 'Web App Manifest Support',
        status: 'fail',
        message: 'Browser does not support web app manifests'
      })
    }

    // Test 4: Manifest Accessibility
    try {
      const response = await fetch('/manifest.json')
      if (response.ok) {
        const manifest = await response.json()
        results.push({
          name: 'Manifest File',
          status: 'pass',
          message: `Manifest loaded: ${manifest.name}`
        })
      } else {
        results.push({
          name: 'Manifest File',
          status: 'fail',
          message: `Manifest not accessible: ${response.status}`
        })
      }
    } catch (error) {
      results.push({
        name: 'Manifest File',
        status: 'fail',
        message: `Failed to load manifest: ${error}`
      })
    }

    // Test 5: Push Notifications Support
    if ('Notification' in window) {
      results.push({
        name: 'Push Notifications Support',
        status: 'pass',
        message: `Browser supports notifications. Permission: ${Notification.permission}`
      })
    } else {
      results.push({
        name: 'Push Notifications Support',
        status: 'fail',
        message: 'Browser does not support push notifications'
      })
    }

    // Test 6: IndexedDB Support (for offline storage)
    if ('indexedDB' in window) {
      results.push({
        name: 'Offline Storage Support',
        status: 'pass',
        message: 'Browser supports IndexedDB for offline storage'
      })
    } else {
      results.push({
        name: 'Offline Storage Support',
        status: 'fail',
        message: 'Browser does not support IndexedDB'
      })
    }

    // Test 7: Install Prompt Support
    if ('BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window) {
      results.push({
        name: 'Install Prompt Support',
        status: 'pass',
        message: 'Browser supports PWA install prompts'
      })
    } else {
      results.push({
        name: 'Install Prompt Support',
        status: 'warning',
        message: 'Browser may not support install prompts (iOS Safari uses different method)'
      })
    }

    // Test 8: Cache API Support
    if ('caches' in window) {
      results.push({
        name: 'Cache API Support',
        status: 'pass',
        message: 'Browser supports Cache API for offline functionality'
      })
    } else {
      results.push({
        name: 'Cache API Support',
        status: 'fail',
        message: 'Browser does not support Cache API'
      })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const passCount = testResults.filter(r => r.status === 'pass').length
  const failCount = testResults.filter(r => r.status === 'fail').length
  const warningCount = testResults.filter(r => r.status === 'warning').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PWA Functionality Test</h1>
          <p className="text-xl text-gray-600">
            Comprehensive test of Progressive Web App features
          </p>
        </div>

        {/* Test Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
            <CardDescription>
              Results of PWA functionality verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Running PWA tests...</p>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Badge className="bg-green-100 text-green-800">
                  ✅ {passCount} Passed
                </Badge>
                <Badge className="bg-orange-100 text-orange-800">
                  ⚠️ {warningCount} Warnings
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  ❌ {failCount} Failed
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
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
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Test PWA Installation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-blue-700">
              <div>
                <h4 className="font-semibold">On Desktop (Chrome/Edge):</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Look for the install icon in the address bar</li>
                  <li>Click it to install Singapore Legal Help as a desktop app</li>
                  <li>The app will open in its own window without browser UI</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold">On Mobile (Android):</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Open Chrome and navigate to this site</li>
                  <li>Tap the menu (three dots) → "Add to Home screen"</li>
                  <li>Or wait for the automatic install banner</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold">On iOS:</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Open Safari and navigate to this site</li>
                  <li>Tap the Share button → "Add to Home Screen"</li>
                  <li>The app will appear on your home screen</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

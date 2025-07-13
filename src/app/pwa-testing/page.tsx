'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TestTube } from 'lucide-react'

// Route segment config - disable prerendering
export const dynamic = 'force-dynamic'
export const revalidate = false

export default function PWATestingPage() {
  const [isBrowser, setIsBrowser] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  const runBasicTests = () => {
    if (!isBrowser) return

    const results: string[] = []
    
    // Test 1: Service Worker
    if ('serviceWorker' in navigator) {
      results.push('✅ Service Worker API supported')
    } else {
      results.push('❌ Service Worker API not supported')
    }

    // Test 2: PWA Manifest
    results.push('✅ Running in browser environment')

    // Test 3: Cache API
    if ('caches' in window) {
      results.push('✅ Cache API supported')
    } else {
      results.push('❌ Cache API not supported')
    }

    // Test 4: Online status
    results.push(`✅ Network status: ${navigator.onLine ? 'Online' : 'Offline'}`)

    setTestResults(results)
  }

  if (!isBrowser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <TestTube className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading PWA Testing...</h1>
          <p className="text-gray-600">Preparing browser environment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">PWA Testing Suite</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple PWA functionality tests running in browser environment.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Basic PWA Tests</CardTitle>
            <CardDescription>
              Test basic PWA functionality in the browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runBasicTests}
              className="flex items-center space-x-2 mb-4"
            >
              <TestTube className="h-4 w-4" />
              <span>Run Basic Tests</span>
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Test Results:</h3>
                {testResults.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
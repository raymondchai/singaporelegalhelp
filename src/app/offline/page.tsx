'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  WifiOff, 
  RefreshCw, 
  FileText, 
  BookOpen, 
  Clock,
  AlertCircle,
  Home,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)
  const [offlineContent, setOfflineContent] = useState<any[]>([])

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline content
    loadOfflineContent()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineContent = () => {
    try {
      const stored = localStorage.getItem('offline-documents')
      if (stored) {
        setOfflineContent(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading offline content:', error)
    }
  }

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <WifiOff className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">You're Offline</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't worry! You can still access some content and features while offline.
          </p>
          
          {/* Online Status */}
          <div className="mt-4">
            <Badge 
              variant={isOnline ? "default" : "secondary"}
              className={`${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {isOnline ? '🟢 Back Online' : '🔴 Offline'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button onClick={handleRetry} disabled={!isOnline} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Button>
          <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>

        {/* Offline Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Offline Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Offline Documents</CardTitle>
              </div>
              <CardDescription>
                Access your saved documents without internet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {offlineContent.length} documents available offline
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/pwa-demo')}
                  className="w-full"
                >
                  View Offline Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Legal Resources */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <CardTitle>Legal Resources</CardTitle>
              </div>
              <CardDescription>
                Basic legal information cached for offline use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Essential legal guides and FAQs
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                  className="w-full"
                >
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offline Tools */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardTitle>Offline Tools</CardTitle>
              </div>
              <CardDescription>
                Tools that work without internet connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Basic calculators and forms
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                  className="w-full"
                >
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offline Tips */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <CardTitle>Offline Tips</CardTitle>
            </div>
            <CardDescription>
              Make the most of your offline experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What Works Offline:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Saved documents and forms</li>
                  <li>• Previously viewed legal content</li>
                  <li>• Basic calculators and tools</li>
                  <li>• Offline document viewer</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What Needs Internet:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• AI legal assistant chat</li>
                  <li>• Real-time legal updates</li>
                  <li>• Document generation</li>
                  <li>• Payment processing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              We'll automatically reconnect when your internet is back
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {isOnline && (
                <Button size="sm" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotificationManager } from '@/components/notification-manager'
import { OfflineDocumentViewer } from '@/components/offline-document-viewer'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { 
  Smartphone, 
  Download, 
  WifiOff, 
  Bell, 
  FileText, 
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function PWADemoPage() {
  const { saveDocument } = useOfflineStorage()
  const { toast } = useToast()

  const handleSaveSampleDocument = async () => {
    try {
      await saveDocument({
        title: 'Sample Legal Contract',
        content: `LEGAL SERVICE AGREEMENT

This Legal Service Agreement ("Agreement") is entered into on [DATE] between Singapore Legal Help ("Provider") and [CLIENT NAME] ("Client").

1. SCOPE OF SERVICES
The Provider agrees to provide legal consultation and document review services for matters related to Singapore law.

2. FEES AND PAYMENT
- Consultation: S$200 per hour
- Document review: S$150 per document
- Payment terms: Net 30 days

3. CONFIDENTIALITY
All information shared between parties shall remain confidential and protected under attorney-client privilege.

4. GOVERNING LAW
This agreement shall be governed by the laws of Singapore.

[Additional terms and conditions...]`,
        type: 'legal-contract',
        lastModified: new Date().toISOString(),
      })
      
      toast({
        title: 'Document saved offline',
        description: 'Sample contract is now available offline',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save document offline',
        variant: 'destructive',
      })
    }
  }

  const pwaFeatures = [
    {
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      title: 'Mobile App Experience',
      description: 'Install as a native app on your mobile device for quick access',
      status: 'Available'
    },
    {
      icon: <WifiOff className="h-6 w-6 text-green-600" />,
      title: 'Offline Access',
      description: 'View saved documents and forms even without internet connection',
      status: 'Active'
    },
    {
      icon: <Bell className="h-6 w-6 text-orange-600" />,
      title: 'Push Notifications',
      description: 'Get notified about legal deadlines and court dates',
      status: 'Configurable'
    },
    {
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      title: 'Document Storage',
      description: 'Securely store legal documents for offline viewing',
      status: 'Secure'
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      title: 'Fast Loading',
      description: 'Cached resources for instant loading and better performance',
      status: 'Optimized'
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600" />,
      title: 'Secure Storage',
      description: 'Client-side encryption for sensitive legal documents',
      status: 'Protected'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">PWA Demo</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience Singapore Legal Help as a Progressive Web App with offline capabilities, 
            push notifications, and native mobile app features.
          </p>
          <Badge className="mt-4 bg-blue-100 text-blue-800">
            🇸🇬 Optimized for Singapore Legal Professionals
          </Badge>
        </div>

        {/* PWA Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pwaFeatures.map((feature, index) => (
            <Card key={index} className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.status}
                  </Badge>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Installation Instructions */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Download className="h-5 w-5" />
              <span>Install Singapore Legal Help</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Add this app to your home screen for the best experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">📱 On Mobile (Android/iOS)</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                  <li>Look for the install prompt at the bottom of the screen</li>
                  <li>Tap "Install App" to add to home screen</li>
                  <li>Or use browser menu → "Add to Home Screen"</li>
                  <li>Launch from home screen for full-screen experience</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">💻 On Desktop</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                  <li>Look for install icon in address bar</li>
                  <li>Click to install as desktop app</li>
                  <li>Or use Chrome menu → "Install Singapore Legal Help"</li>
                  <li>Access from desktop or start menu</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Try PWA Features</CardTitle>
            <CardDescription>
              Test the offline and notification capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleSaveSampleDocument} className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Save Sample Document Offline</span>
              </Button>
              <Button variant="outline" onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(() => {
                    toast({
                      title: 'Service Worker Active',
                      description: 'PWA features are working correctly',
                    })
                  })
                }
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Test Service Worker
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Manager */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Notification System</h2>
          <NotificationManager />
        </div>

        {/* Offline Document Viewer */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Offline Document Access</h2>
          <OfflineDocumentViewer />
        </div>

        {/* Benefits for Singapore Legal Industry */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Benefits for Singapore Legal Professionals</CardTitle>
            <CardDescription className="text-blue-700">
              Why PWA technology is perfect for Singapore's legal industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">🏛️ Court & Client Meetings</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Access documents offline in courtrooms</li>
                  <li>Quick reference during client consultations</li>
                  <li>No dependency on court Wi-Fi availability</li>
                  <li>Professional mobile app experience</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">⚡ Productivity & Efficiency</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>Instant loading with cached resources</li>
                  <li>Push notifications for deadlines</li>
                  <li>Secure offline document storage</li>
                  <li>Native app performance on any device</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

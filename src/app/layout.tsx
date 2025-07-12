import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toaster'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import SessionManager from '@/components/SessionManager'
import DevCacheCleaner from '@/components/DevCacheCleaner'
import { WebVitalsMonitor } from '@/components/monitoring/WebVitalsMonitor'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineIndicator } from '@/components/offline-indicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Singapore Legal Help - AI-Powered Legal Assistance',
  description: 'Get expert legal advice and assistance for Singapore law matters with our AI-powered platform.',
  keywords: 'Singapore law, legal advice, legal assistance, AI legal help, Singapore legal services',
  authors: [{ name: 'Singapore Legal Help' }],
  creator: 'Singapore Legal Help',
  publisher: 'Singapore Legal Help',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SG Legal',
    startupImage: [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ],
  },
  applicationName: 'Singapore Legal Help',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SG Legal',
    'application-name': 'Singapore Legal Help',
    'msapplication-TileColor': '#1e40af',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#1e40af',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <GoogleAnalytics />
              <WebVitalsMonitor />
              {children}
              <Toaster />
              <PWAInstallPrompt />
              <SessionManager />
              <OfflineIndicator position="bottom" />
              <DevCacheCleaner />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

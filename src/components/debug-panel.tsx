'use client'

import { useEffect, useState } from 'react'

interface DebugInfo {
  timestamp: string
  isAuthenticated: boolean
  connectionStatus: string
  isConnected: boolean
  user: any
  conversationId?: string
  currentConversation?: any
  messagesCount: number
  typingUsersCount: number
  onlineUsersCount: number
  showRealtimeFeatures: boolean
  url: string
  userAgent: string
}

interface DebugPanelProps {
  isAuthenticated: boolean
  connectionStatus: string
  isConnected: boolean
  user: any
  conversationId?: string
  currentConversation?: any
  messagesCount: number
  typingUsersCount: number
  onlineUsersCount: number
  showRealtimeFeatures: boolean
}

// Client-side only WebSocket test functions
let runWebSocketTest: (() => void) | null = null
let runDetailedWebSocketTest: (() => void) | null = null

// Dynamically import WebSocket test functions only on client
const loadWebSocketTests = async () => {
  if (typeof window !== 'undefined' && !runWebSocketTest) {
    try {
      const { runWebSocketTest: wsTest, runDetailedWebSocketTest: detailedTest } = await import('@/lib/websocket-test')
      runWebSocketTest = wsTest
      runDetailedWebSocketTest = detailedTest

      // Make available globally for console access
      ;(window as any).runWebSocketTest = wsTest
      ;(window as any).runDetailedWebSocketTest = detailedTest
    } catch (error) {
      console.warn('Failed to load WebSocket test functions:', error)
    }
  }
}

function DebugPanel({
  isAuthenticated,
  connectionStatus,
  isConnected,
  user,
  conversationId,
  currentConversation,
  messagesCount,
  typingUsersCount,
  onlineUsersCount,
  showRealtimeFeatures
}: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [testsLoaded, setTestsLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Load WebSocket test functions
    loadWebSocketTests().then(() => {
      setTestsLoaded(true)
    })

    // Cleanup function to remove global functions
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).runWebSocketTest
        delete (window as any).runDetailedWebSocketTest
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const collectDebugInfo = () => {
      if (typeof window === 'undefined') return

      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        isAuthenticated,
        connectionStatus,
        isConnected,
        user: user ? { id: user.id, email: user.email } : null,
        conversationId,
        currentConversation: currentConversation ? { id: currentConversation.id, title: currentConversation.title } : null,
        messagesCount,
        typingUsersCount,
        onlineUsersCount,
        showRealtimeFeatures,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      setDebugInfo(info)
    }

    collectDebugInfo()
  }, [mounted, isAuthenticated, connectionStatus, isConnected, user, conversationId, currentConversation, messagesCount, typingUsersCount, onlineUsersCount, showRealtimeFeatures])

  // Don't render anything during SSR
  if (!mounted || process.env.NODE_ENV !== 'development' || !debugInfo) {
    return null
  }

  return (
    <details className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <summary className="text-xs font-medium text-gray-700 cursor-pointer">
        Debug Information (Dev Mode)
      </summary>
      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('🧪 Running WebSocket connection test...')
              if (runWebSocketTest) {
                runWebSocketTest()
              } else {
                console.warn('WebSocket test function not loaded yet')
              }
            }}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            disabled={!testsLoaded}
          >
            Test WebSocket
          </button>
          <button
            onClick={() => {
              console.log('🔍 Running DETAILED WebSocket test...')
              if (runDetailedWebSocketTest) {
                runDetailedWebSocketTest()
              } else {
                console.warn('Detailed WebSocket test function not loaded yet')
              }
            }}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            disabled={!testsLoaded}
          >
            Detailed Test
          </button>
        </div>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </details>
  )
}

// Export with dynamic import to ensure client-side only rendering
export default DebugPanel

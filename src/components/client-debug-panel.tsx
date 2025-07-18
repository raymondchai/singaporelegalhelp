'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Define the props interface
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

// Dynamically import the DebugPanel with no SSR
const DebugPanel = dynamic(
  () => import('./debug-panel'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <div className="text-sm text-gray-500">Loading debug panel...</div>
      </div>
    )
  }
) as ComponentType<DebugPanelProps>

// Client-only wrapper component
export default function ClientDebugPanel(props: DebugPanelProps) {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return <DebugPanel {...props} />
}

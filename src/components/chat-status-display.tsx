'use client'

import { useState, useEffect } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  MessageSquare,
  Bot,
  Shield
} from 'lucide-react'

interface ChatStatusDisplayProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  isAuthenticated: boolean
  onlineUsers?: number
  messageCount?: number
  showDetails?: boolean
}

export default function ChatStatusDisplay({
  connectionStatus,
  isAuthenticated,
  onlineUsers = 0,
  messageCount = 0,
  showDetails = true
}: ChatStatusDisplayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  const getConnectionConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Connected',
          description: 'Real-time features active'
        }
      case 'connecting':
        return {
          icon: Loader2,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Connecting...',
          description: 'Establishing connection'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Disconnected',
          description: 'Real-time features unavailable'
        }
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Connection Error',
          description: 'Unable to connect to real-time services'
        }
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Unknown',
          description: 'Connection status unknown'
        }
    }
  }

  const config = getConnectionConfig()
  const Icon = config.icon

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      {/* Main Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Icon 
            className={`h-5 w-5 ${config.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} 
          />
          <div>
            <h3 className={`text-sm font-medium ${config.color}`}>
              {config.text}
            </h3>
            <p className="text-xs text-gray-600">
              {config.description}
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {connectionStatus === 'error' && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Authentication Status */}
      <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200">
        <Shield className={`h-4 w-4 ${isAuthenticated ? 'text-green-600' : 'text-gray-400'}`} />
        <span className="text-xs text-gray-600">
          {isAuthenticated ? 'Authenticated User' : 'Anonymous Session'}
        </span>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-2">
          {/* Real-time Features */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Bot className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Real-time Chat</span>
            </div>
            <span className={`font-medium ${
              connectionStatus === 'connected' && isAuthenticated 
                ? 'text-green-600' 
                : 'text-gray-400'
            }`}>
              {connectionStatus === 'connected' && isAuthenticated ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Online Users */}
          {isAuthenticated && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600">Online Users</span>
              </div>
              <span className="font-medium text-gray-700">
                {onlineUsers}
              </span>
            </div>
          )}

          {/* Message Count */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-3 w-3 text-blue-500" />
              <span className="text-gray-600">Messages</span>
            </div>
            <span className="font-medium text-gray-700">
              {messageCount}
            </span>
          </div>

          {/* WebSocket Info */}
          {connectionStatus === 'connected' && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">
                  WebSocket Active
                </span>
              </div>
            </div>
          )}

          {/* Error Details */}
          {connectionStatus === 'error' && (
            <div className="mt-3 pt-2 border-t border-red-200">
              <p className="text-xs text-red-600">
                Real-time features are temporarily unavailable. 
                Basic chat functionality may still work.
              </p>
            </div>
          )}

          {/* Authentication Prompt */}
          {!isAuthenticated && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Login to access real-time messaging, typing indicators, 
                and presence features.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for headers/sidebars
export function CompactChatStatus({
  connectionStatus,
  isAuthenticated
}: {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  isAuthenticated: boolean
}) {
  const config = {
    connected: { icon: Wifi, color: 'text-green-500', text: 'Connected' },
    connecting: { icon: Loader2, color: 'text-yellow-500', text: 'Connecting...' },
    disconnected: { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' },
    error: { icon: AlertTriangle, color: 'text-red-500', text: 'Error' }
  }[connectionStatus]

  const Icon = config.icon

  return (
    <div className="flex items-center space-x-2">
      <Icon className={`h-4 w-4 ${config.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
      <span className={`text-xs ${config.color}`}>
        {config.text}
      </span>
      {!isAuthenticated && (
        <Shield className="h-3 w-3 text-gray-400" />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Clock } from 'lucide-react'

interface EnhancedLoadingProps {
  isLoading: boolean
  error: string | null
  onRetry: () => void
  isRetrying?: boolean
  retryCount?: number
  hasTimedOut?: boolean
  loadingMessage?: string
  retryingMessage?: string
  timeoutMessage?: string
  className?: string
}

export function EnhancedLoading({
  isLoading,
  error,
  onRetry,
  isRetrying = false,
  retryCount = 0,
  hasTimedOut = false,
  loadingMessage = "Loading...",
  retryingMessage = "Retrying...",
  timeoutMessage = "This is taking longer than expected...",
  className = ""
}: EnhancedLoadingProps) {
  const [dots, setDots] = useState('')

  // Animated dots for loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.')
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">
            {isRetrying ? retryingMessage : loadingMessage}{dots}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {hasTimedOut ? timeoutMessage : 'This may take a few moments'}
          </div>
          {retryCount > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Attempt {retryCount + 1}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </div>
          <div className="text-gray-600 mb-4">{error}</div>
          
          {retryCount > 0 && (
            <div className="text-sm text-gray-500 mb-4">
              Failed attempts: {retryCount}
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
            
            <div className="flex space-x-4 justify-center mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

interface LoadingTimeoutProps {
  timeout: number
  onTimeout: () => void
  isActive: boolean
}

export function LoadingTimeout({ timeout, onTimeout, isActive }: LoadingTimeoutProps) {
  const [timeLeft, setTimeLeft] = useState(timeout)

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(timeout)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeout, onTimeout])

  if (!isActive || timeLeft <= 0) return null

  return (
    <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
      <Clock className="h-4 w-4 mr-1" />
      Timeout in {timeLeft}s
    </div>
  )
}

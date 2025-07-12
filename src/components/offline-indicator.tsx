'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useBackgroundSync } from '@/hooks/use-background-sync'
import { ClientOnly } from './client-only'
import {
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom'
  showDetails?: boolean
  className?: string
}

function OfflineIndicatorInner({
  position = 'top',
  showDetails = false,
  className = ''
}: OfflineIndicatorProps) {
  const {
    isOnline,
    isSyncing,
    syncStats,
    lastSyncTime,
    triggerSync,
    retryFailedActions,
    getSyncStatusMessage,
    getSyncStatusColor,
    hasPendingChanges
  } = useBackgroundSync()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Show notification when going offline/online
    if (!isOnline) {
      setShowNotification(true)
      setIsVisible(true)
    } else if (isOnline && hasPendingChanges()) {
      setShowNotification(true)
    }
  }, [isOnline, hasPendingChanges])

  useEffect(() => {
    // Auto-hide notification after 5 seconds if online and no pending changes
    if (showNotification && isOnline && !hasPendingChanges()) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showNotification, isOnline, hasPendingChanges])

  const handleDismiss = () => {
    setIsVisible(false)
    setShowNotification(false)
  }

  const handleRetry = () => {
    if (syncStats.failedSyncs > 0) {
      retryFailedActions()
    } else {
      triggerSync()
    }
  }

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }

    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }

    if (syncStats.failedSyncs > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }

    if (syncStats.pendingActions > 0) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatusBadgeVariant = () => {
    const color = getSyncStatusColor()
    switch (color) {
      case 'red':
        return 'destructive'
      case 'yellow':
        return 'secondary'
      case 'green':
        return 'default'
      case 'gray':
      default:
        return 'outline'
    }
  }

  const getSyncProgress = () => {
    if (syncStats.totalActions === 0) return 100
    const completed = syncStats.successfulSyncs
    const total = syncStats.totalActions
    return Math.round((completed / total) * 100)
  }

  if (!isVisible && !showNotification && isOnline && !hasPendingChanges()) {
    return null
  }

  const positionClasses = position === 'top'
    ? 'top-4 left-1/2 transform -translate-x-1/2'
    : 'bottom-4 left-1/2 transform -translate-x-1/2'

  return (
    <div className={`fixed ${positionClasses} z-50 pointer-events-none ${className}`}>
      <Card className="pointer-events-auto shadow-lg border-l-4 border-l-blue-500 max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {!isOnline ? 'Offline' : 'Online'}
                  </span>
                  <Badge variant={getStatusBadgeVariant()} className="text-xs">
                    {getSyncStatusMessage()}
                  </Badge>
                </div>

                {showDetails && (
                  <div className="mt-1 text-xs text-gray-500">
                    {lastSyncTime && (
                      <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(syncStats.pendingActions > 0 || syncStats.failedSyncs > 0) && isOnline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isSyncing}
                  className="text-xs"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  {syncStats.failedSyncs > 0 ? 'Retry' : 'Sync'}
                </Button>
              )}

              {(syncStats.totalActions > 0 || !isOnline) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Sync Progress */}
              {isSyncing && syncStats.totalActions > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Syncing changes...</span>
                    <span>{getSyncProgress()}%</span>
                  </div>
                  <Progress value={getSyncProgress()} className="h-2" />
                </div>
              )}

              {/* Sync Stats */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending:</span>
                    <span className="font-medium">{syncStats.pendingActions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed:</span>
                    <span className="font-medium text-green-600">{syncStats.successfulSyncs}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Failed:</span>
                    <span className="font-medium text-red-600">{syncStats.failedSyncs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-medium">{syncStats.totalActions}</span>
                  </div>
                </div>
              </div>

              {/* Offline Message */}
              {!isOnline && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <WifiOff className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">You're currently offline</p>
                      <p>Your changes are being saved locally and will sync automatically when your connection is restored.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed Sync Message */}
              {syncStats.failedSyncs > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-xs text-red-700">
                      <p className="font-medium mb-1">Some changes failed to sync</p>
                      <p>Click "Retry" to attempt syncing failed changes again.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {isOnline && syncStats.pendingActions === 0 && syncStats.failedSyncs === 0 && syncStats.totalActions > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="text-xs text-green-700">
                      <p className="font-medium">All changes synced successfully</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function OfflineIndicator(props: OfflineIndicatorProps = {}) {
  return (
    <ClientOnly>
      <OfflineIndicatorInner {...props} />
    </ClientOnly>
  )
}

// Compact version for status bar
export function OfflineStatusBadge() {
  const { isOnline, isSyncing, hasPendingChanges, getSyncStatusColor } = useBackgroundSync()

  const getStatusColor = () => {
    const color = getSyncStatusColor()
    switch (color) {
      case 'red':
        return 'bg-red-500'
      case 'yellow':
        return 'bg-yellow-500'
      case 'green':
        return 'bg-green-500'
      case 'gray':
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (hasPendingChanges()) return 'Pending'
    return 'Synced'
  }

  return (
    <ClientOnly>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs text-gray-600">
          {getStatusText()}
        </span>
      </div>
    </ClientOnly>
  )
}

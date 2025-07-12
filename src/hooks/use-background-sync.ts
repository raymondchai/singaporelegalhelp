'use client'

import { useState, useEffect, useCallback } from 'react'
import { backgroundSync, SyncStats } from '@/lib/background-sync'
import { offlineStorage } from '@/lib/offline-storage'

export function useBackgroundSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalActions: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingActions: 0
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load initial sync stats
    loadSyncStats()

    // Set up periodic stats refresh
    const statsInterval = setInterval(loadSyncStats, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(statsInterval)
    }
  }, [])

  const loadSyncStats = useCallback(async () => {
    try {
      const stats = await backgroundSync.getSyncStats()
      setSyncStats(stats)
    } catch (error) {
      console.error('Failed to load sync stats:', error)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const stats = await backgroundSync.triggerSync()
      setSyncStats(stats)
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  const retryFailedActions = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const stats = await backgroundSync.retryFailedActions()
      setSyncStats(stats)
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  const queueFormSubmission = useCallback(async (formType: string, formData: any) => {
    try {
      await offlineStorage.queueAction({
        type: 'form_submission',
        entityType: 'form',
        entityId: crypto.randomUUID(),
        maxRetries: 3,
        data: {
          formType,
          formData,
          submittedAt: new Date().toISOString()
        }
      })

      // Trigger sync if online
      if (isOnline) {
        triggerSync()
      }
    } catch (error) {
      console.error('Failed to queue form submission:', error)
      throw error
    }
  }, [isOnline, triggerSync])

  const queueDocumentUpload = useCallback(async (file: File, metadata: any) => {
    try {
      // Convert file to base64 for storage
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await offlineStorage.queueAction({
        type: 'document_upload',
        entityType: 'document',
        entityId: crypto.randomUUID(),
        maxRetries: 3,
        data: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData,
          metadata,
          uploadedAt: new Date().toISOString()
        }
      })

      // Trigger sync if online
      if (isOnline) {
        triggerSync()
      }
    } catch (error) {
      console.error('Failed to queue document upload:', error)
      throw error
    }
  }, [isOnline, triggerSync])

  const queueUserAction = useCallback(async (actionType: string, entityType: string, entityId: string, data: any) => {
    try {
      await offlineStorage.queueAction({
        type: actionType as any,
        entityType: entityType as 'document' | 'task' | 'deadline' | 'profile' | 'form',
        entityId,
        maxRetries: 3,
        data
      })

      // Trigger sync if online
      if (isOnline) {
        triggerSync()
      }
    } catch (error) {
      console.error('Failed to queue user action:', error)
      throw error
    }
  }, [isOnline, triggerSync])

  const getSyncStatusMessage = (): string => {
    if (!isOnline) {
      return 'Offline - Changes will sync when connection is restored'
    }
    
    if (isSyncing) {
      return 'Syncing changes...'
    }
    
    if (syncStats.pendingActions > 0) {
      return `${syncStats.pendingActions} changes pending sync`
    }
    
    if (syncStats.failedSyncs > 0) {
      return `${syncStats.failedSyncs} changes failed to sync`
    }
    
    if (lastSyncTime) {
      const timeDiff = Date.now() - lastSyncTime.getTime()
      const minutes = Math.floor(timeDiff / 60000)
      
      if (minutes < 1) {
        return 'All changes synced'
      } else if (minutes < 60) {
        return `Last synced ${minutes} minute${minutes > 1 ? 's' : ''} ago`
      } else {
        const hours = Math.floor(minutes / 60)
        return `Last synced ${hours} hour${hours > 1 ? 's' : ''} ago`
      }
    }
    
    return 'Ready to sync'
  }

  const getSyncStatusColor = (): 'green' | 'yellow' | 'red' | 'gray' => {
    if (!isOnline) return 'gray'
    if (isSyncing) return 'yellow'
    if (syncStats.failedSyncs > 0) return 'red'
    if (syncStats.pendingActions > 0) return 'yellow'
    return 'green'
  }

  const hasPendingChanges = (): boolean => {
    return syncStats.pendingActions > 0 || syncStats.failedSyncs > 0
  }

  return {
    // State
    isOnline,
    isSyncing,
    syncStats,
    lastSyncTime,
    
    // Actions
    triggerSync,
    retryFailedActions,
    queueFormSubmission,
    queueDocumentUpload,
    queueUserAction,
    
    // Utilities
    getSyncStatusMessage,
    getSyncStatusColor,
    hasPendingChanges,
    loadSyncStats
  }
}

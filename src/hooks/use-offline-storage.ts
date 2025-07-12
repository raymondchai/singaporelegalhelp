'use client'

import { useState, useEffect, useCallback } from 'react'
import { offlineStorage, OfflineDocument, OfflineAction } from '@/lib/offline-storage'

export interface StorageStats {
  documentsCount: number
  pendingActionsCount: number
  conflictsCount: number
  estimatedSize: number
  used: number
  quota: number
  percentage: number
  available: number
}

export function useOfflineStorage() {
  const [isSupported, setIsSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [documents, setDocuments] = useState<OfflineDocument[]>([])
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([])
  const [storageStats, setStorageStats] = useState<StorageStats>({
    documentsCount: 0,
    pendingActionsCount: 0,
    conflictsCount: 0,
    estimatedSize: 0,
    used: 0,
    quota: 0,
    percentage: 0,
    available: 0
  })
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check if IndexedDB is supported
    const supported = 'indexedDB' in window
    setIsSupported(supported)

    if (supported) {
      initializeStorage()
    }

    // Monitor online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const initializeStorage = async () => {
    try {
      await offlineStorage.initialize()
      setIsInitialized(true)
      await loadData()
    } catch (error) {
      console.error('Failed to initialize offline storage:', error)
    }
  }

  const loadData = useCallback(async () => {
    if (!isInitialized) return

    try {
      const [docs, actions, stats] = await Promise.all([
        offlineStorage.getDocuments(),
        offlineStorage.getPendingActions(),
        getStorageStats()
      ])

      setDocuments(docs)
      setPendingActions(actions)
      setStorageStats(stats)
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }, [isInitialized])

  const getStorageStats = async (): Promise<StorageStats> => {
    try {
      const [dbStats, storageEstimate] = await Promise.all([
        offlineStorage.getStorageStats(),
        navigator.storage?.estimate() || Promise.resolve({ usage: 0, quota: 0 })
      ])

      const used = Math.round((storageEstimate.usage || 0) / (1024 * 1024))
      const quota = Math.round((storageEstimate.quota || 0) / (1024 * 1024))
      const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0

      return {
        ...dbStats,
        used,
        quota,
        percentage,
        available: quota - used
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return storageStats
    }
  }

  const saveDocument = async (document: Omit<OfflineDocument, 'id' | 'createdAt' | 'version' | 'syncStatus'>) => {
    if (!isInitialized) throw new Error('Storage not initialized')

    try {
      const id = await offlineStorage.saveDocument(document)
      await loadData() // Refresh data
      return id
    } catch (error) {
      console.error('Failed to save document:', error)
      throw error
    }
  }

  const updateDocument = async (id: string, updates: Partial<OfflineDocument>) => {
    if (!isInitialized) throw new Error('Storage not initialized')

    try {
      await offlineStorage.updateDocument(id, updates)
      await loadData() // Refresh data
    } catch (error) {
      console.error('Failed to update document:', error)
      throw error
    }
  }

  const getDocument = async (id: string): Promise<OfflineDocument | null> => {
    if (!isInitialized) throw new Error('Storage not initialized')

    try {
      return await offlineStorage.getDocument(id)
    } catch (error) {
      console.error('Failed to get document:', error)
      return null
    }
  }

  const deleteDocument = async (id: string) => {
    if (!isInitialized) throw new Error('Storage not initialized')

    try {
      await offlineStorage.deleteDocument(id)
      await loadData() // Refresh data
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  }

  const clearAllDocuments = async () => {
    if (!isInitialized) throw new Error('Storage not initialized')

    try {
      await offlineStorage.clearAllData()
      await loadData() // Refresh data
    } catch (error) {
      console.error('Failed to clear documents:', error)
      throw error
    }
  }

  // Background sync functions
  const syncPendingActions = async () => {
    if (!isOnline || !isInitialized) return

    const actions = await offlineStorage.getPendingActions({ status: 'pending' })

    for (const action of actions) {
      try {
        await offlineStorage.updateActionStatus(action.id, 'processing')

        // Process the action based on type
        switch (action.type) {
          case 'create':
          case 'update':
            await syncDocumentAction(action)
            break
          case 'delete':
            await syncDeleteAction(action)
            break
          case 'form_submission':
            await syncFormSubmission(action)
            break
          default:
            console.warn('Unknown action type:', action.type)
        }

        await offlineStorage.updateActionStatus(action.id, 'completed')
        await offlineStorage.removeAction(action.id)
      } catch (error) {
        console.error('Failed to sync action:', action.id, error)

        const newRetryCount = action.retryCount + 1
        if (newRetryCount >= action.maxRetries) {
          await offlineStorage.updateActionStatus(action.id, 'failed', newRetryCount)
        } else {
          await offlineStorage.updateActionStatus(action.id, 'pending', newRetryCount)
        }
      }
    }

    await loadData() // Refresh data
  }

  const syncDocumentAction = async (action: OfflineAction) => {
    // Implement document sync logic here
    // This would typically involve API calls to sync with the server
    console.log('Syncing document action:', action)
  }

  const syncDeleteAction = async (action: OfflineAction) => {
    // Implement delete sync logic here
    console.log('Syncing delete action:', action)
  }

  const syncFormSubmission = async (action: OfflineAction) => {
    // Implement form submission sync logic here
    console.log('Syncing form submission:', action)
  }

  // Utility functions
  const getStorageInfo = () => {
    return {
      used: storageStats.used,
      quota: storageStats.quota,
      percentage: storageStats.percentage,
      available: storageStats.available,
      documentsCount: storageStats.documentsCount,
      pendingActionsCount: storageStats.pendingActionsCount,
      conflictsCount: storageStats.conflictsCount,
      estimatedSize: Math.round(storageStats.estimatedSize / 1024) // KB
    }
  }

  const refreshStorage = async () => {
    await loadData()
  }

  return {
    // State
    isSupported,
    isInitialized,
    isOnline,
    documents,
    pendingActions,
    storageStats,

    // Document operations
    saveDocument,
    updateDocument,
    getDocument,
    deleteDocument,
    clearAllDocuments,

    // Sync operations
    syncPendingActions,

    // Utility functions
    getStorageInfo,
    refreshStorage,
    loadData
  }
}

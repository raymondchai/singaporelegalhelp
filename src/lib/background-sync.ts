// Background Sync Service for Singapore Legal Help PWA
// Handles offline actions and synchronizes them when online

import { offlineStorage, OfflineAction } from './offline-storage'

export interface SyncResult {
  success: boolean
  error?: string
  retryAfter?: number
}

export interface SyncStats {
  totalActions: number
  successfulSyncs: number
  failedSyncs: number
  pendingActions: number
}

class BackgroundSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncInProgress: boolean = false
  private syncInterval: NodeJS.Timeout | null = null
  private readonly retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.initializeEventListeners()
      this.startPeriodicSync()
    }
  }

  private initializeEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.triggerSync()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerSync()
      }
    })
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.triggerSync()
      }
    }, 5 * 60 * 1000)
  }

  async triggerSync(): Promise<SyncStats> {
    if (this.syncInProgress || !this.isOnline) {
      return this.getEmptyStats()
    }

    this.syncInProgress = true
    console.log('[BackgroundSync] Starting sync process...')

    try {
      // Ensure offline storage is initialized before trying to sync
      await offlineStorage.initialize()
      const pendingActions = await offlineStorage.getPendingActions({ status: 'pending' })
      const stats: SyncStats = {
        totalActions: pendingActions.length,
        successfulSyncs: 0,
        failedSyncs: 0,
        pendingActions: pendingActions.length
      }

      for (const action of pendingActions) {
        try {
          await offlineStorage.updateActionStatus(action.id, 'processing')
          const result = await this.syncAction(action)

          if (result.success) {
            await offlineStorage.updateActionStatus(action.id, 'completed')
            await offlineStorage.removeAction(action.id)
            stats.successfulSyncs++
            stats.pendingActions--
          } else {
            await this.handleSyncFailure(action, result)
            stats.failedSyncs++
          }
        } catch (error) {
          console.error('[BackgroundSync] Error syncing action:', action.id, error)
          await this.handleSyncFailure(action, { success: false, error: String(error) })
          stats.failedSyncs++
        }
      }

      console.log('[BackgroundSync] Sync completed:', stats)
      return stats
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncAction(action: OfflineAction): Promise<SyncResult> {
    switch (action.type) {
      case 'create':
        return await this.syncCreateAction(action)
      case 'update':
        return await this.syncUpdateAction(action)
      case 'delete':
        return await this.syncDeleteAction(action)
      case 'form_submission':
        return await this.syncFormSubmission(action)
      case 'document_upload':
        return await this.syncDocumentUpload(action)
      default:
        return { success: false, error: `Unknown action type: ${action.type}` }
    }
  }

  private async syncCreateAction(action: OfflineAction): Promise<SyncResult> {
    try {
      const endpoint = this.getApiEndpoint(action.entityType)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(action.data)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local storage with server-assigned ID if different
        if (result.id && result.id !== action.entityId) {
          await this.updateLocalEntityId(action.entityType, action.entityId, result.id)
        }

        return { success: true }
      } else {
        const error = await response.text()
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${error}`,
          retryAfter: this.getRetryDelay(response.status)
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private async syncUpdateAction(action: OfflineAction): Promise<SyncResult> {
    try {
      const endpoint = `${this.getApiEndpoint(action.entityType)}/${action.entityId}`
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(action.data)
      })

      if (response.ok) {
        return { success: true }
      } else if (response.status === 404) {
        // Entity doesn't exist on server, convert to create action
        return await this.syncCreateAction({ ...action, type: 'create' })
      } else if (response.status === 409) {
        // Conflict - handle merge conflict
        const serverData = await response.json()
        await this.handleMergeConflict(action, serverData)
        return { success: false, error: 'Merge conflict detected' }
      } else {
        const error = await response.text()
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${error}`,
          retryAfter: this.getRetryDelay(response.status)
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private async syncDeleteAction(action: OfflineAction): Promise<SyncResult> {
    try {
      const endpoint = `${this.getApiEndpoint(action.entityType)}/${action.entityId}`
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      })

      if (response.ok || response.status === 404) {
        // Success or already deleted
        return { success: true }
      } else {
        const error = await response.text()
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${error}`,
          retryAfter: this.getRetryDelay(response.status)
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private async syncFormSubmission(action: OfflineAction): Promise<SyncResult> {
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          formType: action.data.formType,
          formData: action.data.formData,
          submittedAt: action.timestamp
        })
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${error}`,
          retryAfter: this.getRetryDelay(response.status)
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private async syncDocumentUpload(action: OfflineAction): Promise<SyncResult> {
    try {
      const formData = new FormData()
      
      // Reconstruct file from stored data
      if (action.data.fileData && action.data.fileName) {
        const blob = new Blob([action.data.fileData], { type: action.data.fileType })
        formData.append('file', blob, action.data.fileName)
      }
      
      formData.append('metadata', JSON.stringify(action.data.metadata))

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${error}`,
          retryAfter: this.getRetryDelay(response.status)
        }
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  private async handleSyncFailure(action: OfflineAction, result: SyncResult) {
    const newRetryCount = action.retryCount + 1
    
    if (newRetryCount >= action.maxRetries) {
      await offlineStorage.updateActionStatus(action.id, 'failed', newRetryCount)
      console.error('[BackgroundSync] Action failed permanently:', action.id, result.error)
    } else {
      await offlineStorage.updateActionStatus(action.id, 'pending', newRetryCount)
      
      // Schedule retry with exponential backoff
      const retryDelay = result.retryAfter || Math.pow(2, newRetryCount) * 1000
      const timeout = setTimeout(() => {
        this.retryTimeouts.delete(action.id)
        if (this.isOnline) {
          this.triggerSync()
        }
      }, retryDelay)
      
      this.retryTimeouts.set(action.id, timeout)
      console.log(`[BackgroundSync] Scheduling retry for action ${action.id} in ${retryDelay}ms`)
    }
  }

  private async handleMergeConflict(action: OfflineAction, serverData: any) {
    // Store conflict for user resolution
    const conflict = {
      id: crypto.randomUUID(),
      entityType: action.entityType,
      entityId: action.entityId,
      localVersion: action.data,
      remoteVersion: serverData,
      conflictType: 'concurrent_edit' as const,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    // This would typically be stored in the conflicts store
    console.log('[BackgroundSync] Merge conflict detected:', conflict)
  }

  private getApiEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      document: '/api/documents',
      task: '/api/dashboard/tasks',
      deadline: '/api/dashboard/deadlines',
      profile: '/api/profile'
    }
    
    return endpoints[entityType] || `/api/${entityType}`
  }

  private getAuthToken(): string {
    // Get auth token from localStorage or session storage
    return localStorage.getItem('supabase.auth.token') || ''
  }

  private async updateLocalEntityId(entityType: string, oldId: string, newId: string) {
    // Update local storage with server-assigned ID
    if (entityType === 'document') {
      const document = await offlineStorage.getDocument(oldId)
      if (document) {
        await offlineStorage.deleteDocument(oldId)
        // Create a new document with the server ID by omitting the auto-generated fields
        const { id, createdAt, version, syncStatus, ...documentData } = document
        const savedId = await offlineStorage.saveDocument(documentData)
        // The saveDocument method generates a new ID, so we need to update it manually
        // This is a limitation of the current storage design
        console.log(`Document ID updated from ${oldId} to ${newId}, but storage assigned ${savedId}`)
      }
    }
  }

  private getRetryDelay(statusCode: number): number {
    switch (statusCode) {
      case 429: // Rate limited
        return 60000 // 1 minute
      case 503: // Service unavailable
        return 30000 // 30 seconds
      case 500: // Server error
        return 10000 // 10 seconds
      default:
        return 5000 // 5 seconds
    }
  }

  private getEmptyStats(): SyncStats {
    return {
      totalActions: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      pendingActions: 0
    }
  }

  // Public methods
  async getSyncStats(): Promise<SyncStats> {
    const pendingActions = await offlineStorage.getPendingActions()
    const completedActions = pendingActions.filter(a => a.status === 'completed')
    const failedActions = pendingActions.filter(a => a.status === 'failed')
    const pendingCount = pendingActions.filter(a => a.status === 'pending').length

    return {
      totalActions: pendingActions.length,
      successfulSyncs: completedActions.length,
      failedSyncs: failedActions.length,
      pendingActions: pendingCount
    }
  }

  async retryFailedActions(): Promise<SyncStats> {
    const failedActions = await offlineStorage.getPendingActions({ status: 'failed' })
    
    for (const action of failedActions) {
      await offlineStorage.updateActionStatus(action.id, 'pending', 0) // Reset retry count
    }

    return await this.triggerSync()
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncService()

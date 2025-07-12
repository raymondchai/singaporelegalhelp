// Advanced IndexedDB Storage System for Singapore Legal Help PWA
// Provides robust offline storage with synchronization and conflict resolution

export interface OfflineDocument {
  id: string
  title: string
  content: string
  type: 'legal-contract' | 'legal-form' | 'legal-guide' | 'user-document' | 'template'
  category?: string
  tags?: string[]
  lastModified: string
  createdAt: string
  userId?: string
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error'
  version: number
  checksum?: string
}

export interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'form_submission' | 'document_upload'
  entityType: 'document' | 'task' | 'deadline' | 'profile' | 'form'
  entityId: string
  data: any
  timestamp: string
  userId?: string
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  localVersion: any
  remoteVersion: any
  conflictType: 'version' | 'concurrent_edit' | 'deleted_remotely'
  timestamp: string
  resolved: boolean
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null
  private readonly dbName = 'LegalHelpOfflineDB'
  private readonly dbVersion = 2
  private initializationPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // If already initialized, return immediately
    if (this.db) {
      return Promise.resolve()
    }

    // Create new initialization promise
    this.initializationPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        this.initializationPromise = null
        reject(request.error)
      }
      request.onsuccess = () => {
        this.db = request.result
        this.initializationPromise = null
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' })
          documentsStore.createIndex('type', 'type', { unique: false })
          documentsStore.createIndex('userId', 'userId', { unique: false })
          documentsStore.createIndex('lastModified', 'lastModified', { unique: false })
          documentsStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          documentsStore.createIndex('category', 'category', { unique: false })
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionsStore = db.createObjectStore('pendingActions', { keyPath: 'id' })
          actionsStore.createIndex('type', 'type', { unique: false })
          actionsStore.createIndex('entityType', 'entityType', { unique: false })
          actionsStore.createIndex('status', 'status', { unique: false })
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false })
          actionsStore.createIndex('userId', 'userId', { unique: false })
        }

        // Sync conflicts store
        if (!db.objectStoreNames.contains('syncConflicts')) {
          const conflictsStore = db.createObjectStore('syncConflicts', { keyPath: 'id' })
          conflictsStore.createIndex('entityType', 'entityType', { unique: false })
          conflictsStore.createIndex('entityId', 'entityId', { unique: false })
          conflictsStore.createIndex('resolved', 'resolved', { unique: false })
          conflictsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Cache metadata store
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          const metadataStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' })
          metadataStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
          metadataStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        }

        // User preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          const prefsStore = db.createObjectStore('userPreferences', { keyPath: 'userId' })
          prefsStore.createIndex('lastModified', 'lastModified', { unique: false })
        }
      }
    })

    return this.initializationPromise
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
  }

  // Document Management
  async saveDocument(document: Omit<OfflineDocument, 'id' | 'createdAt' | 'version' | 'syncStatus'>): Promise<string> {
    await this.ensureInitialized()

    const fullDocument: OfflineDocument = {
      ...document,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending',
      checksum: await this.generateChecksum(document.content)
    }

    const transaction = this.db!.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(fullDocument)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Queue sync action
    await this.queueAction({
      type: 'create',
      entityType: 'document',
      entityId: fullDocument.id,
      maxRetries: 3,
      data: fullDocument
    })

    return fullDocument.id
  }

  async updateDocument(id: string, updates: Partial<OfflineDocument>): Promise<void> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')

    // Get existing document
    const existing = await new Promise<OfflineDocument>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!existing) throw new Error('Document not found')

    const updatedDocument: OfflineDocument = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString(),
      version: existing.version + 1,
      syncStatus: 'pending',
      checksum: updates.content ? await this.generateChecksum(updates.content) : existing.checksum
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(updatedDocument)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Queue sync action
    await this.queueAction({
      type: 'update',
      entityType: 'document',
      entityId: id,
      maxRetries: 3,
      data: updatedDocument
    })
  }

  async getDocument(id: string): Promise<OfflineDocument | null> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getDocuments(filters?: {
    type?: string
    userId?: string
    syncStatus?: string
    category?: string
  }): Promise<OfflineDocument[]> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result
        
        if (filters) {
          results = results.filter(doc => {
            if (filters.type && doc.type !== filters.type) return false
            if (filters.userId && doc.userId !== filters.userId) return false
            if (filters.syncStatus && doc.syncStatus !== filters.syncStatus) return false
            if (filters.category && doc.category !== filters.category) return false
            return true
          })
        }
        
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteDocument(id: string): Promise<void> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Queue sync action
    await this.queueAction({
      type: 'delete',
      entityType: 'document',
      entityId: id,
      maxRetries: 3,
      data: { id }
    })
  }

  // Action Queue Management
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    await this.ensureInitialized()

    const fullAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3,
      status: 'pending'
    }

    const transaction = this.db!.transaction(['pendingActions'], 'readwrite')
    const store = transaction.objectStore('pendingActions')

    await new Promise<void>((resolve, reject) => {
      const request = store.add(fullAction)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    return fullAction.id
  }

  async getPendingActions(filters?: { type?: string; entityType?: string; status?: string }): Promise<OfflineAction[]> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['pendingActions'], 'readonly')
    const store = transaction.objectStore('pendingActions')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result
        
        if (filters) {
          results = results.filter(action => {
            if (filters.type && action.type !== filters.type) return false
            if (filters.entityType && action.entityType !== filters.entityType) return false
            if (filters.status && action.status !== filters.status) return false
            return true
          })
        }
        
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async updateActionStatus(id: string, status: OfflineAction['status'], retryCount?: number): Promise<void> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['pendingActions'], 'readwrite')
    const store = transaction.objectStore('pendingActions')

    const existing = await new Promise<OfflineAction>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!existing) throw new Error('Action not found')

    const updatedAction: OfflineAction = {
      ...existing,
      status,
      retryCount: retryCount !== undefined ? retryCount : existing.retryCount
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(updatedAction)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeAction(id: string): Promise<void> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['pendingActions'], 'readwrite')
    const store = transaction.objectStore('pendingActions')

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Utility methods
  private async generateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async getStorageStats(): Promise<{
    documentsCount: number
    pendingActionsCount: number
    conflictsCount: number
    estimatedSize: number
  }> {
    await this.ensureInitialized()

    const [documents, actions, conflicts] = await Promise.all([
      this.getDocuments(),
      this.getPendingActions(),
      this.getSyncConflicts()
    ])

    // Estimate storage size (rough calculation)
    const estimatedSize = documents.reduce((size, doc) => size + doc.content.length, 0) +
                         actions.reduce((size, action) => size + JSON.stringify(action.data).length, 0)

    return {
      documentsCount: documents.length,
      pendingActionsCount: actions.length,
      conflictsCount: conflicts.length,
      estimatedSize
    }
  }

  async getSyncConflicts(): Promise<SyncConflict[]> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['syncConflicts'], 'readonly')
    const store = transaction.objectStore('syncConflicts')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized()

    const transaction = this.db!.transaction(['documents', 'pendingActions', 'syncConflicts', 'cacheMetadata'], 'readwrite')
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('documents').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('pendingActions').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('syncConflicts').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('cacheMetadata').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    ])
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager()

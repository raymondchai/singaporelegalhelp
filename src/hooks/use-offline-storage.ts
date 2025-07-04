'use client'

import { useState, useEffect } from 'react'

interface OfflineDocument {
  id: string
  title: string
  content: string
  type: 'legal-form' | 'contract' | 'agreement' | 'document'
  lastModified: string
  size: number
}

export function useOfflineStorage() {
  const [isSupported, setIsSupported] = useState(false)
  const [documents, setDocuments] = useState<OfflineDocument[]>([])
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageQuota, setStorageQuota] = useState(0)

  useEffect(() => {
    // Check if IndexedDB is supported
    const supported = 'indexedDB' in window
    setIsSupported(supported)

    if (supported) {
      loadDocuments()
      checkStorageQuota()
    }
  }, [])

  const checkStorageQuota = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        setStorageUsed(estimate.usage || 0)
        setStorageQuota(estimate.quota || 0)
      } catch (error) {
        console.error('Error checking storage quota:', error)
      }
    }
  }

  const loadDocuments = async () => {
    try {
      const stored = localStorage.getItem('offline-documents')
      if (stored) {
        setDocuments(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading offline documents:', error)
    }
  }

  const saveDocument = async (document: Omit<OfflineDocument, 'id' | 'lastModified'>) => {
    try {
      const newDocument: OfflineDocument = {
        ...document,
        id: crypto.randomUUID(),
        lastModified: new Date().toISOString(),
      }

      const updatedDocuments = [...documents, newDocument]
      setDocuments(updatedDocuments)
      localStorage.setItem('offline-documents', JSON.stringify(updatedDocuments))
      
      await checkStorageQuota()
      return newDocument.id
    } catch (error) {
      console.error('Error saving document offline:', error)
      throw error
    }
  }

  const getDocument = (id: string): OfflineDocument | undefined => {
    return documents.find(doc => doc.id === id)
  }

  const deleteDocument = async (id: string) => {
    try {
      const updatedDocuments = documents.filter(doc => doc.id !== id)
      setDocuments(updatedDocuments)
      localStorage.setItem('offline-documents', JSON.stringify(updatedDocuments))
      
      await checkStorageQuota()
    } catch (error) {
      console.error('Error deleting offline document:', error)
      throw error
    }
  }

  const clearAllDocuments = async () => {
    try {
      setDocuments([])
      localStorage.removeItem('offline-documents')
      await checkStorageQuota()
    } catch (error) {
      console.error('Error clearing offline documents:', error)
      throw error
    }
  }

  const getStorageInfo = () => {
    const usedMB = Math.round(storageUsed / (1024 * 1024))
    const quotaMB = Math.round(storageQuota / (1024 * 1024))
    const usagePercentage = storageQuota > 0 ? Math.round((storageUsed / storageQuota) * 100) : 0

    return {
      used: usedMB,
      quota: quotaMB,
      percentage: usagePercentage,
      available: quotaMB - usedMB,
    }
  }

  return {
    isSupported,
    documents,
    saveDocument,
    getDocument,
    deleteDocument,
    clearAllDocuments,
    getStorageInfo,
    refreshStorage: checkStorageQuota,
  }
}

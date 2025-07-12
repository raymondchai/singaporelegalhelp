'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  FileText,
  Folder,
  Users,
  History,
  Settings,
  Upload,
  BarChart3
} from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import DocumentCollectionManager from '@/components/dashboard/DocumentCollectionManager'
import DocumentVersionControl from '@/components/dashboard/DocumentVersionControl'
import DocumentCollaboration from '@/components/dashboard/DocumentCollaboration'
import { EnhancedDocument, DocumentCollection } from '@/types/dashboard'

export default function EnhancedDocumentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<EnhancedDocument[]>([])
  const [collections, setCollections] = useState<DocumentCollection[]>([])
  const [selectedDocument, setSelectedDocument] = useState<EnhancedDocument | null>(null)
  const [activeTab, setActiveTab] = useState('collections')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadDocumentsAndCollections()
    }
  }, [user])

  const loadDocumentsAndCollections = async () => {
    try {
      setLoadingData(true)
      
      const [documentsRes, collectionsRes] = await Promise.all([
        fetch('/api/documents/enhanced'),
        fetch('/api/documents/collections')
      ])

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setDocuments(documentsData.documents || [])
      }

      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json()
        setCollections(collectionsData.collections || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents and collections',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleDocumentUpdate = async (documentId: string, updates: Partial<EnhancedDocument>) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? { ...doc, ...updates } : doc
        ))
        toast({
          title: 'Success',
          description: 'Document updated successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive'
      })
    }
  }

  const handleCollectionCreate = async (collection: Omit<DocumentCollection, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/documents/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      })

      if (response.ok) {
        const data = await response.json()
        setCollections(prev => [...prev, data.collection])
      }
    } catch (error) {
      throw new Error('Failed to create collection')
    }
  }

  const handleCollectionUpdate = async (collectionId: string, updates: Partial<DocumentCollection>) => {
    try {
      const response = await fetch('/api/documents/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, updates })
      })

      if (response.ok) {
        setCollections(prev => prev.map(col => 
          col.id === collectionId ? { ...col, ...updates } : col
        ))
      }
    } catch (error) {
      throw new Error('Failed to update collection')
    }
  }

  const handleCollectionDelete = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/documents/collections?id=${collectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCollections(prev => prev.filter(col => col.id !== collectionId))
      }
    } catch (error) {
      throw new Error('Failed to delete collection')
    }
  }

  const handleVersionCreate = async (documentId: string, file: File, description: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('changeDescription', description)

    const response = await fetch(`/api/documents/${documentId}/versions`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to create version')
    }

    // Refresh document data
    await loadDocumentsAndCollections()
  }

  const handleVersionRestore = async (documentId: string, versionId: string) => {
    const response = await fetch(`/api/documents/${documentId}/versions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId, action: 'restore' })
    })

    if (!response.ok) {
      throw new Error('Failed to restore version')
    }

    // Refresh document data
    await loadDocumentsAndCollections()
  }

  const handleVersionDelete = async (versionId: string) => {
    // Implementation for version deletion
    console.log('Delete version:', versionId)
  }

  const handleUpdateSharing = async (documentId: string, settings: any) => {
    await handleDocumentUpdate(documentId, settings)
  }

  const handleAddCollaborator = async (documentId: string, email: string, permission: string) => {
    const response = await fetch(`/api/documents/${documentId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, permission })
    })

    if (!response.ok) {
      throw new Error('Failed to add collaborator')
    }
  }

  const handleRemoveCollaborator = async (documentId: string, collaboratorId: string) => {
    const response = await fetch(`/api/documents/${documentId}/collaborators/${collaboratorId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to remove collaborator')
    }
  }

  const handleUpdateCollaboratorPermission = async (documentId: string, collaboratorId: string, permission: string) => {
    const response = await fetch(`/api/documents/${documentId}/collaborators/${collaboratorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission })
    })

    if (!response.ok) {
      throw new Error('Failed to update collaborator permission')
    }
  }

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Enhanced Document Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Enhanced Document Management"
      subtitle="Advanced document organization, version control, and collaboration"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Folder className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-gray-600">Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter(doc => doc.collaborators.length > 0).length}
                </p>
                <p className="text-sm text-gray-600">Shared Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <History className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.version, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="versions">Version Control</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="mt-6">
          <DocumentCollectionManager
            documents={documents}
            collections={collections}
            onDocumentUpdate={handleDocumentUpdate}
            onCollectionCreate={handleCollectionCreate}
            onCollectionUpdate={handleCollectionUpdate}
            onCollectionDelete={handleCollectionDelete}
          />
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          {selectedDocument ? (
            <DocumentVersionControl
              document={selectedDocument}
              onVersionCreate={handleVersionCreate}
              onVersionRestore={handleVersionRestore}
              onVersionDelete={handleVersionDelete}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
                <p className="text-gray-500">Choose a document to view its version history</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.slice(0, 6).map(doc => (
                    <Card 
                      key={doc.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.title}</p>
                            <p className="text-sm text-gray-500">v{doc.version}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="mt-6">
          {selectedDocument ? (
            <DocumentCollaboration
              document={selectedDocument}
              onUpdateSharing={handleUpdateSharing}
              onAddCollaborator={handleAddCollaborator}
              onRemoveCollaborator={handleRemoveCollaborator}
              onUpdateCollaboratorPermission={handleUpdateCollaboratorPermission}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
                <p className="text-gray-500">Choose a document to manage collaboration settings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Document Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">
                  Detailed analytics for document usage, collaboration patterns, and version history
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

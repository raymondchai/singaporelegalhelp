'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  FolderPlus,
  Folder,
  FileText,
  Tag,
  Users,
  Share2,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Eye
} from 'lucide-react'
import { DocumentCollection, EnhancedDocument } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'

interface DocumentCollectionManagerProps {
  documents: EnhancedDocument[]
  collections: DocumentCollection[]
  onDocumentUpdate: (documentId: string, updates: Partial<EnhancedDocument>) => void
  onCollectionCreate: (collection: Omit<DocumentCollection, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCollectionUpdate: (collectionId: string, updates: Partial<DocumentCollection>) => void
  onCollectionDelete: (collectionId: string) => void
}

const COLLECTION_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const COLLECTION_ICONS = [
  'folder', 'briefcase', 'file-text', 'users', 'star', 
  'bookmark', 'tag', 'archive', 'shield', 'clock'
]

export default function DocumentCollectionManager({
  documents,
  collections,
  onDocumentUpdate,
  onCollectionCreate,
  onCollectionUpdate,
  onCollectionDelete
}: DocumentCollectionManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCollection, setEditingCollection] = useState<DocumentCollection | null>(null)
  
  // New collection form state
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: COLLECTION_COLORS[0],
    icon: COLLECTION_ICONS[0],
    tags: [] as string[],
    isShared: false
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCollection = selectedCollection === 'all' || 
      doc.collections.includes(selectedCollection)
    
    return matchesSearch && matchesCollection
  })

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      await onCollectionCreate({
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color,
        icon: newCollection.icon,
        documentCount: 0,
        tags: newCollection.tags,
        isShared: newCollection.isShared,
        collaborators: []
      })

      setNewCollection({
        name: '',
        description: '',
        color: COLLECTION_COLORS[0],
        icon: COLLECTION_ICONS[0],
        tags: [],
        isShared: false
      })
      setShowCreateDialog(false)
      
      toast({
        title: 'Success',
        description: 'Collection created successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive'
      })
    }
  }

  const handleAddToCollection = async (documentId: string, collectionId: string) => {
    const document = documents.find(d => d.id === documentId)
    if (!document) return

    const updatedCollections = [...document.collections]
    if (!updatedCollections.includes(collectionId)) {
      updatedCollections.push(collectionId)
      await onDocumentUpdate(documentId, { collections: updatedCollections })
      
      toast({
        title: 'Success',
        description: 'Document added to collection'
      })
    }
  }

  const handleRemoveFromCollection = async (documentId: string, collectionId: string) => {
    const document = documents.find(d => d.id === documentId)
    if (!document) return

    const updatedCollections = document.collections.filter(id => id !== collectionId)
    await onDocumentUpdate(documentId, { collections: updatedCollections })
    
    toast({
      title: 'Success',
      description: 'Document removed from collection'
    })
  }

  const getCollectionById = (id: string) => collections.find(c => c.id === id)

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Document Collections</h2>
          <p className="text-gray-600">Organize your documents into collections</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter collection name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COLLECTION_COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded-full border-2 ${
                            newCollection.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={newCollection.icon}
                      onValueChange={(value) => setNewCollection(prev => ({ ...prev, icon: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECTION_ICONS.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            {icon.charAt(0).toUpperCase() + icon.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection}>
                    Create Collection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Collections Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${
            selectedCollection === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedCollection('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">All Documents</p>
                <p className="text-sm text-gray-500">{documents.length} documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {collections.map(collection => (
          <Card
            key={collection.id}
            className={`cursor-pointer transition-colors ${
              selectedCollection === collection.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCollection(collection.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${collection.color}20` }}
                >
                  <Folder className="h-5 w-5" style={{ color: collection.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{collection.name}</p>
                  <p className="text-sm text-gray-500">{collection.documentCount} documents</p>
                </div>
                {collection.isShared && (
                  <Share2 className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documents Display */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
        {filteredDocuments.map(document => (
          <Card key={document.id} className="group hover:shadow-md transition-shadow">
            <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-3'}>
              <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'items-center justify-between'} gap-3`}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{document.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{document.fileName}</p>
                    
                    {/* Collections badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {document.collections.map(collectionId => {
                        const collection = getCollectionById(collectionId)
                        return collection ? (
                          <Badge
                            key={collectionId}
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: `${collection.color}20`, color: collection.color }}
                          >
                            {collection.name}
                          </Badge>
                        ) : null
                      })}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {document.isFavorite && <Star className="h-4 w-4 text-yellow-500" />}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {viewMode === 'grid' && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                  <span>Modified {new Date(document.lastModified).toLocaleDateString()}</span>
                  <span>{(document.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              {selectedCollection === 'all' 
                ? 'Upload some documents to get started'
                : 'No documents in this collection yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

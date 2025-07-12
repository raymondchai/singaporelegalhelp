'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FolderOpen, 
  Folder,
  Plus, 
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { ContentCollection } from '@/types/dashboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CollectionsSidebarProps {
  collections: ContentCollection[]
  selectedCollection: string
  onSelectCollection: (collectionId: string) => void
  onCreateCollection: () => void
  onEditCollection: (collectionId: string) => void
}

export default function CollectionsSidebar({
  collections,
  selectedCollection,
  onSelectCollection,
  onCreateCollection,
  onEditCollection
}: CollectionsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())

  // Filter collections based on search
  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Organize collections into hierarchy
  const rootCollections = filteredCollections.filter(c => !c.parentCollectionId)
  const childCollections = filteredCollections.filter(c => c.parentCollectionId)

  const getChildCollections = (parentId: string): ContentCollection[] => {
    return childCollections.filter(c => c.parentCollectionId === parentId)
  }

  const toggleExpanded = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  const getCollectionIcon = (collection: ContentCollection) => {
    if (collection.isSmartCollection) {
      return '🤖'
    }
    return collection.icon || 'folder'
  }

  const renderCollectionItem = (collection: ContentCollection, level: number = 0) => {
    const hasChildren = getChildCollections(collection.id).length > 0
    const isExpanded = expandedCollections.has(collection.id)
    const isSelected = selectedCollection === collection.id

    return (
      <div key={collection.id} className="space-y-1">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}
          `}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => onSelectCollection(collection.id)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(collection.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          <div 
            className="w-4 h-4 rounded flex items-center justify-center text-xs"
            style={{ backgroundColor: collection.color }}
          >
            {getCollectionIcon(collection) === 'folder' ? (
              isSelected ? <FolderOpen className="h-3 w-3 text-white" /> : <Folder className="h-3 w-3 text-white" />
            ) : (
              <span>{getCollectionIcon(collection)}</span>
            )}
          </div>

          <span className="flex-1 text-sm font-medium truncate">
            {collection.name}
          </span>

          {collection.itemCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {collection.itemCount}
            </Badge>
          )}

          {collection.isDefault && (
            <Badge variant="outline" className="text-xs">
              Default
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground">
              <MoreHorizontal className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditCollection(collection.id)}>
                <Edit className="h-3 w-3 mr-2" />
                Edit Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateCollection()}>
                <Plus className="h-3 w-3 mr-2" />
                Add Subcollection
              </DropdownMenuItem>
              {!collection.isDefault && (
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Collection
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render child collections */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {getChildCollections(collection.id).map(child => 
              renderCollectionItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Collections</CardTitle>
          <Button size="sm" onClick={onCreateCollection}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* All Collections Option */}
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2
            ${selectedCollection === '' ? 'bg-blue-50 border border-blue-200' : ''}
          `}
          onClick={() => onSelectCollection('')}
        >
          <div className="w-4 h-4 rounded bg-gray-500 flex items-center justify-center">
            <FolderOpen className="h-3 w-3 text-white" />
          </div>
          <span className="flex-1 text-sm font-medium">All Collections</span>
          <Badge variant="secondary" className="text-xs">
            {collections.reduce((sum, c) => sum + (c.itemCount || 0), 0)}
          </Badge>
        </div>

        {/* Collections List */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {rootCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No collections found</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={onCreateCollection}>
                <Plus className="h-3 w-3 mr-1" />
                Create Collection
              </Button>
            </div>
          ) : (
            rootCollections.map(collection => renderCollectionItem(collection))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="h-3 w-3 mr-2" />
            New Collection
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FolderOpen className="h-3 w-3 mr-2" />
            Import Collections
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

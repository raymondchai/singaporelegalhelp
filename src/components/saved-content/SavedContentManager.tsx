'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Archive,
  Tag,
  FolderOpen,
  Folder,
  Plus,
  Download,
  Share2,
  Settings,
  Eye,
  Edit,
  Trash2,
  Heart,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react'
import { SavedContentItem, ContentCollection, ContentTag, SearchFilters } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

interface SavedContentManagerProps {
  userId: string
}

type ViewMode = 'grid' | 'list'
type FilterTab = 'all' | 'favorites' | 'unread' | 'archived'

export default function SavedContentManager({ userId }: SavedContentManagerProps) {
  const [items, setItems] = useState<SavedContentItem[]>([])
  const [collections, setCollections] = useState<ContentCollection[]>([])
  const [tags, setTags] = useState<ContentTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCollections: 0,
    totalTags: 0,
    favoriteItems: 0,
    unreadItems: 0
  })

  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      searchContent()
    }
  }, [searchQuery, selectedCollection, selectedTags, activeTab, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch collections, tags, and initial content in parallel
      const [collectionsResponse, tagsResponse, statsResponse] = await Promise.all([
        fetch('/api/saved-content/collections?include_item_count=true', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
        }),
        fetch('/api/saved-content/tags?popular=true', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
        }),
        fetch('/api/dashboard/analytics/content-stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
        })
      ])

      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json()
        setCollections(collectionsData.collections || [])
      }

      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        setTags(tagsData.tags || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.statistics || stats)
      }

      // Initial content search
      await searchContent()

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load saved content",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const searchContent = async () => {
    try {
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCollection) params.append('collection_id', selectedCollection)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      
      // Apply tab filters
      switch (activeTab) {
        case 'favorites':
          params.append('is_favorite', 'true')
          break
        case 'unread':
          params.append('read_status', 'unread')
          break
        case 'archived':
          // This would need special handling as archived items are typically excluded
          break
      }

      // Apply additional filters
      if (filters.contentTypes?.length) {
        params.append('content_types', filters.contentTypes.join(','))
      }
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)

      params.append('include_annotations', 'true')
      params.append('limit', '50')

      const response = await fetch(`/api/saved-content/items?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else {
        throw new Error('Failed to search content')
      }

    } catch (error) {
      console.error('Error searching content:', error)
      toast({
        title: "Error",
        description: "Failed to search content",
        variant: "destructive"
      })
    }
  }

  const handleToggleFavorite = async (itemId: string, isFavorite: boolean) => {
    try {
      const response = await fetch(`/api/saved-content/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ is_favorite: !isFavorite })
      })

      if (response.ok) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, isFavorite: !isFavorite } : item
        ))
        
        toast({
          title: isFavorite ? "Removed from favorites" : "Added to favorites",
          description: "Content updated successfully"
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      })
    }
  }

  const handleUpdateReadStatus = async (itemId: string, readStatus: string) => {
    try {
      const response = await fetch(`/api/saved-content/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ read_status: readStatus })
      })

      if (response.ok) {
        setItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, readStatus: readStatus as 'read' | 'reading' | 'unread' } : item
        ))
      }
    } catch (error) {
      console.error('Error updating read status:', error)
    }
  }

  const getTabCounts = () => {
    return {
      all: items.length,
      favorites: items.filter(item => item.isFavorite).length,
      unread: items.filter(item => item.readStatus === 'unread').length,
      archived: 0 // Would need separate query for archived items
    }
  }

  const tabCounts = getTabCounts()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Saved Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Saved Content Organization
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalCollections}</div>
              <div className="text-sm text-gray-600">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalTags}</div>
              <div className="text-sm text-gray-600">Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.favoriteItems}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.unreadItems}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search saved content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Collection Filter */}
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Collections</SelectItem>
                {collections.map(collection => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: collection.color }}
                      ></div>
                      {collection.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="qa">Q&A</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="template">Templates</SelectItem>
                      <SelectItem value="external">External Links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Priority</SelectItem>
                      <SelectItem value="2">Urgent</SelectItem>
                      <SelectItem value="1">Important</SelectItem>
                      <SelectItem value="0">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Has Annotations</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="true">With Annotations</SelectItem>
                      <SelectItem value="false">Without Annotations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs and Display */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  All
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Favorites
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.favorites}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Unread
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.unread}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.archived}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved content found</h3>
                  <p className="text-gray-500 mb-4">
                    {activeTab === 'all'
                      ? "Start saving legal content to organize and access it later"
                      : `No ${activeTab} content found`
                    }
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Save Content
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {items.map(item => (
                    <SavedContentCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      onToggleFavorite={handleToggleFavorite}
                      onUpdateReadStatus={handleUpdateReadStatus}
                      onEdit={(itemId) => {
                        // Handle edit
                        console.log('Edit item:', itemId)
                      }}
                      onDelete={(itemId) => {
                        // Handle delete
                        console.log('Delete item:', itemId)
                      }}
                      onView={(itemId) => {
                        // Handle view
                        console.log('View item:', itemId)
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Collections Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant={selectedCollection === collection.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {collection.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.name)
                          ? prev.filter(t => t !== tag.name)
                          : [...prev, tag.name]
                      )
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Saved Content Card Component
interface SavedContentCardProps {
  item: SavedContentItem
  viewMode: ViewMode
  onToggleFavorite: (itemId: string, isFavorite: boolean) => void
  onUpdateReadStatus: (itemId: string, readStatus: string) => void
  onEdit: (itemId: string) => void
  onDelete: (itemId: string) => void
  onView: (itemId: string) => void
}

function SavedContentCard({
  item,
  viewMode,
  onToggleFavorite,
  onUpdateReadStatus,
  onEdit,
  onDelete,
  onView
}: SavedContentCardProps) {
  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'article': return <FileText className="h-4 w-4" />
      case 'qa': return <BookOpen className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'template': return <FileText className="h-4 w-4" />
      case 'external': return <ExternalLink className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getReadStatusColor = (readStatus: string) => {
    switch (readStatus) {
      case 'unread': return 'bg-blue-100 text-blue-800'
      case 'reading': return 'bg-yellow-100 text-yellow-800'
      case 'read': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2: return 'border-red-500'
      case 1: return 'border-orange-500'
      default: return 'border-gray-200'
    }
  }

  if (viewMode === 'list') {
    return (
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(item.priority)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getContentTypeIcon(item.contentType)}
                <h3 className="font-semibold truncate">{item.customTitle || item.title}</h3>
                <Badge className={getReadStatusColor(item.readStatus)}>
                  {item.readStatus}
                </Badge>
                {item.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{new Date(item.savedAt).toLocaleDateString()}</span>
                {item.collection && (
                  <span className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {item.collection.name}
                  </span>
                )}
                {(item.annotationCount || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {item.annotationCount} annotations
                  </span>
                )}
              </div>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(item.id, item.isFavorite)}
              >
                <Star className={`h-4 w-4 ${item.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(item.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(item.priority)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getContentTypeIcon(item.contentType)}
            <Badge className={getReadStatusColor(item.readStatus)}>
              {item.readStatus}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(item.id, item.isFavorite)}
          >
            <Star className={`h-4 w-4 ${item.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
          </Button>
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2">
          {item.customTitle || item.title}
        </h3>

        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {item.description}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(item.savedAt).toLocaleDateString()}</span>
          {(item.annotationCount || 0) > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {item.annotationCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(item.id)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item.id)}
          >
            <Edit className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

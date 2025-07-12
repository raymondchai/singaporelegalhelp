'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Tag, 
  Plus, 
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Hash,
  TrendingUp,
  Filter
} from 'lucide-react'
import { ContentTag } from '@/types/dashboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TagsPanelProps {
  tags: ContentTag[]
  selectedTags: string[]
  onToggleTag: (tagName: string) => void
  onCreateTag: () => void
  onEditTag: (tagId: string) => void
}

export default function TagsPanel({
  tags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  onEditTag
}: TagsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage')

  // Filter and sort tags
  const filteredTags = tags
    .filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || tag.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'usage':
          return b.usageCount - a.usageCount
        case 'recent':
          return new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime()
        default:
          return 0
      }
    })

  // Group tags by category
  const tagsByCategory = filteredTags.reduce((acc, tag) => {
    const category = tag.category || 'custom'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(tag)
    return acc
  }, {} as Record<string, ContentTag[]>)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'practice_area': return '⚖️'
      case 'priority': return '🔥'
      case 'status': return '📊'
      case 'custom': return '🏷️'
      default: return '🏷️'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'practice_area': return 'Practice Areas'
      case 'priority': return 'Priority'
      case 'status': return 'Status'
      case 'custom': return 'Custom Tags'
      default: return 'Other'
    }
  }

  const getTagUsageLevel = (usageCount: number) => {
    if (usageCount >= 20) return 'high'
    if (usageCount >= 5) return 'medium'
    return 'low'
  }

  const getUsageLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
          <Button size="sm" onClick={onCreateTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="practice_area">Practice Areas</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="name">Alphabetical</SelectItem>
                <SelectItem value="recent">Recently Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tagName => {
                const tag = tags.find(t => t.name === tagName)
                return (
                  <Badge
                    key={tagName}
                    variant="default"
                    className="cursor-pointer"
                    style={{ backgroundColor: tag?.color || '#6B7280' }}
                    onClick={() => onToggleTag(tagName)}
                  >
                    {tagName} ×
                  </Badge>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => selectedTags.forEach(tag => onToggleTag(tag))}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Tags by Category */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.keys(tagsByCategory).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tags found</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={onCreateTag}>
                <Plus className="h-3 w-3 mr-1" />
                Create Tag
              </Button>
            </div>
          ) : (
            Object.entries(tagsByCategory).map(([category, categoryTags]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>{getCategoryIcon(category)}</span>
                  <span>{getCategoryLabel(category)}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryTags.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {categoryTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.name)
                    const usageLevel = getTagUsageLevel(tag.usageCount)

                    return (
                      <div key={tag.id} className="group relative">
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            cursor-pointer transition-all hover:shadow-sm
                            ${isSelected ? '' : 'hover:bg-gray-100'}
                          `}
                          style={{
                            backgroundColor: isSelected ? tag.color : undefined,
                            borderColor: tag.color,
                            color: isSelected ? 'white' : tag.color
                          }}
                          onClick={() => onToggleTag(tag.name)}
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {tag.name}
                          {tag.usageCount > 0 && (
                            <span className="ml-1 text-xs opacity-75">
                              {tag.usageCount}
                            </span>
                          )}
                        </Badge>

                        {/* Tag Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-white border shadow-sm inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground">
                            <MoreHorizontal className="h-2 w-2" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditTag(tag.id)}>
                              <Edit className="h-3 w-3 mr-2" />
                              Edit Tag
                            </DropdownMenuItem>
                            {!tag.isSystemTag && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete Tag
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tag Statistics */}
        {tags.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium text-gray-700 mb-2">Tag Statistics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Tags:</span>
                <Badge variant="outline">{tags.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Most Used:</span>
                <Badge variant="outline">
                  {tags.reduce((max, tag) => Math.max(max, tag.usageCount), 0)}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="h-3 w-3 mr-2" />
            Create New Tag
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <TrendingUp className="h-3 w-3 mr-2" />
            Suggest Tags
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  X, 
  FileText, 
  MessageCircle, 
  Clock, 
  Eye, 
  User,
  ExternalLink,
  Bookmark
} from 'lucide-react'
import Link from 'next/link'

interface ContentDetails {
  id: string
  title?: string
  question?: string
  summary?: string
  content?: string
  answer?: string
  category_id: string
  slug?: string
  legal_categories?: {
    name: string
    slug: string
  }
  reading_time_minutes?: number
  view_count?: number
  author_name?: string
}

interface SavedContentItem {
  id: string
  content_type: 'article' | 'qa'
  content_id: string
  collection_name: string
  notes: string
  saved_at: string
  content_details: ContentDetails
}

interface ContentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  savedItem: SavedContentItem | null
}

export default function ContentViewerModal({ 
  isOpen, 
  onClose, 
  savedItem 
}: ContentViewerModalProps) {
  if (!savedItem || !savedItem.content_details) return null

  const { content_details: content, content_type } = savedItem
  const isArticle = content_type === 'article'

  const formatContent = (text: string) => {
    return text
      .replace(/\\n/g, '\n')
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null

        const trimmedParagraph = paragraph.trim()

        // Handle bold headings **text:**
        if (trimmedParagraph.startsWith('**') && trimmedParagraph.includes(':**')) {
          const headingText = trimmedParagraph.replace(/\*\*(.*?):\*\*/g, '$1')
          return (
            <h3
              key={`heading-${index}`}
              className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2"
            >
              {headingText}
            </h3>
          )
        }

        // Handle numbered lists
        if (/^\d+\./.test(trimmedParagraph)) {
          return (
            <div key={`list-${index}`} className="ml-4 mb-2">
              <p className="text-gray-700 leading-relaxed">{trimmedParagraph}</p>
            </div>
          )
        }

        // Handle bullet points
        if (trimmedParagraph.startsWith('- ') || trimmedParagraph.startsWith('• ')) {
          return (
            <div key={`bullet-${index}`} className="ml-4 mb-2">
              <p className="text-gray-700 leading-relaxed">{trimmedParagraph}</p>
            </div>
          )
        }

        // Regular paragraphs
        return (
          <p key={`para-${index}`} className="text-gray-700 leading-relaxed mb-4">
            {trimmedParagraph}
          </p>
        )
      })
      .filter(Boolean)
  }

  const getViewUrl = () => {
    if (!content.legal_categories?.slug) return '#'
    
    if (isArticle) {
      return `/legal-categories/${content.legal_categories.slug}/articles/${content.id}`
    } else {
      return `/legal-categories/${content.legal_categories.slug}/qa/${content.id}`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {isArticle ? (
                  <FileText className="h-5 w-5 text-purple-600" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                )}
                <Badge variant="outline">
                  {content.legal_categories?.name || 'Legal Content'}
                </Badge>
                <Badge variant="secondary">
                  {savedItem.collection_name}
                </Badge>
              </div>
              
              <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
                {isArticle ? content.title : content.question}
              </DialogTitle>

              {isArticle && content.summary && (
                <p className="text-gray-600 mb-3">{content.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {isArticle && content.author_name && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {content.author_name}
                  </div>
                )}
                {isArticle && content.reading_time_minutes && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {content.reading_time_minutes} min read
                  </div>
                )}
                {content.view_count !== undefined && (
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {content.view_count} views
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Link href={getViewUrl()} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Full Page
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-sm max-w-none">
            {isArticle && content.content ? (
              <div>{formatContent(content.content)}</div>
            ) : content.answer ? (
              <div>{formatContent(content.answer)}</div>
            ) : (
              <p className="text-gray-500 italic">Content not available</p>
            )}
          </div>

          {savedItem.notes && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Bookmark className="h-4 w-4 text-yellow-600 mr-2" />
                <h4 className="font-medium text-yellow-800">Your Notes</h4>
              </div>
              <p className="text-yellow-700 text-sm">{savedItem.notes}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

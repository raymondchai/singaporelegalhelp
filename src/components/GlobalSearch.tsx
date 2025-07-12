'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Search, BookOpen, MessageSquare, ArrowRight } from 'lucide-react'

interface QuickSearchResult {
  id: string
  title: string
  summary?: string
  question?: string
  content_type: 'article' | 'qa'
  category_name: string
  category_slug: string
}

interface GlobalSearchProps {
  className?: string
  placeholder?: string
  showQuickResults?: boolean
}

export default function GlobalSearch({ 
  className = '', 
  placeholder = 'Search legal content...',
  showQuickResults = true 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [quickResults, setQuickResults] = useState<QuickSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length >= 2 && showQuickResults) {
      const debounceTimer = setTimeout(() => {
        performQuickSearch(query)
      }, 300)

      return () => clearTimeout(debounceTimer)
    } else {
      setQuickResults([])
      setShowResults(false)
    }
  }, [query, showQuickResults])

  const performQuickSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Search articles (limit to 3)
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select(`
          id,
          title,
          summary,
          legal_categories!inner(name)
        `)
        .eq('is_published', true)
        .or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
        .limit(3)

      // Search Q&As (limit to 3)
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select(`
          id,
          question,
          legal_categories!inner(name)
        `)
        .eq('is_public', true)
        .eq('status', 'published')
        .or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`)
        .limit(3)

      if (articlesError) throw articlesError
      if (qasError) throw qasError

      const articleResults: QuickSearchResult[] = (articlesData || []).map((article: any) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        content_type: 'article' as const,
        category_name: article.legal_categories.name,
        category_slug: article.legal_categories.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      }))

      const qaResults: QuickSearchResult[] = (qasData || []).map((qa: any) => ({
        id: qa.id,
        title: qa.question,
        question: qa.question,
        content_type: 'qa' as const,
        category_name: qa.legal_categories.name,
        category_slug: qa.legal_categories.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
      }))

      const combinedResults = [...articleResults, ...qaResults].slice(0, 6)
      setQuickResults(combinedResults)
      setShowResults(combinedResults.length > 0)
    } catch (error) {
      console.error('Error performing quick search:', error)
      setQuickResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
      setQuery('')
    }
  }

  const handleResultClick = (result: QuickSearchResult) => {
    router.push(`/legal-categories/${result.category_slug}`)
    setShowResults(false)
    setQuery('')
  }

  const handleViewAllResults = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
      setQuery('')
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (quickResults.length > 0) {
                setShowResults(true)
              }
            }}
            className="pl-10 pr-20"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {showResults && showQuickResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            ) : quickResults.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {quickResults.map((result) => (
                  <div
                    key={`${result.content_type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {result.content_type === 'article' ? (
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {result.category_name}
                          </Badge>
                          <Badge 
                            variant={result.content_type === 'article' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {result.content_type === 'article' ? 'Article' : 'Q&A'}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        {result.summary && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {result.summary}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
                
                {/* View All Results */}
                <div 
                  onClick={handleViewAllResults}
                  className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2 text-sm font-medium text-blue-600">
                    <Search className="h-4 w-4" />
                    <span>View all results for "{query}"</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600">No results found for "{query}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

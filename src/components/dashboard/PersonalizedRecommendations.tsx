'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  TrendingUp, 
  Clock, 
  Star,
  ChevronRight,
  Bookmark,
  Share2,
  Eye
} from 'lucide-react'
import { PersonalizedRecommendation } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface PersonalizedRecommendationsProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export default function PersonalizedRecommendations({ 
  limit = 6, 
  showHeader = true,
  className = ""
}: PersonalizedRecommendationsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadRecommendations()
    }
  }, [user])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No valid session for recommendations')
        return
      }

      // Use API route instead of direct database queries
      const response = await fetch(`/api/dashboard/recommendations?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load personalized recommendations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
    toast({
      title: 'Refreshed',
      description: 'Recommendations updated based on your latest activity'
    })
  }

  const getContentIcon = (type: PersonalizedRecommendation['type']) => {
    switch (type) {
      case 'article':
        return <BookOpen className="h-4 w-4" />
      case 'qa':
        return <HelpCircle className="h-4 w-4" />
      case 'template':
        return <FileText className="h-4 w-4" />
      case 'practice_area':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (type: PersonalizedRecommendation['type']) => {
    switch (type) {
      case 'article':
        return 'Article'
      case 'qa':
        return 'Q&A'
      case 'template':
        return 'Template'
      case 'practice_area':
        return 'Practice Area'
      default:
        return 'Content'
    }
  }

  const getContentUrl = (recommendation: PersonalizedRecommendation) => {
    // Safely handle undefined practiceArea
    const practiceArea = recommendation.practiceArea || 'general'
    const practiceAreaSlug = practiceArea.toLowerCase().replace(/\s+/g, '-')

    switch (recommendation.type) {
      case 'article':
        return `/legal-guide/${practiceAreaSlug}/articles/${recommendation.contentId}`
      case 'qa':
        return `/legal-guide/${practiceAreaSlug}/qa/${recommendation.contentId}`
      case 'template':
        return `/document-builder/templates/${recommendation.contentId}`
      case 'practice_area':
        return `/legal-guide/${practiceAreaSlug}`
      default:
        return '#'
    }
  }

  const handleBookmark = async (recommendation: PersonalizedRecommendation) => {
    try {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: recommendation.type,
          contentId: recommendation.contentId,
          title: recommendation.title
        })
      })

      if (response.ok) {
        toast({
          title: 'Bookmarked',
          description: `"${recommendation.title}" has been saved to your bookmarks`
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to bookmark content',
        variant: 'destructive'
      })
    }
  }

  const handleShare = async (recommendation: PersonalizedRecommendation) => {
    const url = getContentUrl(recommendation)
    const fullUrl = `${window.location.origin}${url}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recommendation.title,
          text: recommendation.description,
          url: fullUrl
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(fullUrl)
      toast({
        title: 'Link Copied',
        description: 'Content link copied to clipboard'
      })
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recommended for You
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recommended for You
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Start exploring content to get personalized recommendations
            </p>
            <Button asChild>
              <Link href="/legal-guide">Browse Legal Guide</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Recommended for You
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshRecommendations}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="group border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getContentIcon(recommendation.type)}
                <Badge variant="secondary" className="text-xs">
                  {getContentTypeLabel(recommendation.type)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {recommendation.practiceArea}
                </Badge>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmark(recommendation)}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(recommendation)}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Link href={getContentUrl(recommendation)} className="block">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                {recommendation.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {recommendation.description}
              </p>
            </Link>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(recommendation.relevanceScore * 100)}% match
                </span>
                {recommendation.estimatedReadTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recommendation.estimatedReadTime} min read
                  </span>
                )}
              </div>
              <Link 
                href={getContentUrl(recommendation)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                View <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-2 text-xs text-gray-500 italic">
              {recommendation.reason}
            </div>
          </div>
        ))}

        {recommendations.length >= limit && (
          <div className="text-center pt-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/recommendations">
                View All Recommendations
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

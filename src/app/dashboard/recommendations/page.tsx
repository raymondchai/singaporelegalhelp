'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { 
  Star, 
  Filter, 
  Search, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  TrendingUp,
  Clock,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react'
import { PersonalizedRecommendation } from '@/types/dashboard'
import { createRecommendationEngine } from '@/lib/recommendations'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import DashboardLayout from '../components/DashboardLayout'

export default function RecommendationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [filteredRecommendations, setFilteredRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [practiceAreaFilter, setPracticeAreaFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'type'>('relevance')

  useEffect(() => {
    if (user) {
      loadRecommendations()
    }
  }, [user])

  useEffect(() => {
    filterRecommendations()
  }, [recommendations, searchQuery, typeFilter, practiceAreaFilter, sortBy])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const engine = createRecommendationEngine(user.id)
      const recs = await engine.generateRecommendations(50) // Get more for filtering
      setRecommendations(recs)
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load recommendations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterRecommendations = () => {
    let filtered = [...recommendations]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(rec =>
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.practiceArea.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(rec => rec.type === typeFilter)
    }

    // Practice area filter
    if (practiceAreaFilter !== 'all') {
      filtered = filtered.filter(rec => rec.practiceArea === practiceAreaFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore
        case 'date':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    setFilteredRecommendations(filtered)
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

  const getContentUrl = (recommendation: PersonalizedRecommendation) => {
    switch (recommendation.type) {
      case 'article':
        return `/legal-guide/${recommendation.practiceArea.toLowerCase().replace(/\s+/g, '-')}/articles/${recommendation.contentId}`
      case 'qa':
        return `/legal-guide/${recommendation.practiceArea.toLowerCase().replace(/\s+/g, '-')}/qa/${recommendation.contentId}`
      case 'template':
        return `/document-builder/templates/${recommendation.contentId}`
      case 'practice_area':
        return `/legal-guide/${recommendation.practiceArea.toLowerCase().replace(/\s+/g, '-')}`
      default:
        return '#'
    }
  }

  const handleFeedback = async (recommendationId: string, rating: 'positive' | 'negative') => {
    try {
      const response = await fetch('/api/dashboard/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          recommendationId,
          rating: rating === 'positive' ? 5 : 1
        })
      })

      if (response.ok) {
        toast({
          title: 'Feedback Recorded',
          description: 'Thank you for helping us improve recommendations'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record feedback',
        variant: 'destructive'
      })
    }
  }

  const uniquePracticeAreas = Array.from(new Set(recommendations.map(r => r.practiceArea)))

  return (
    <DashboardLayout
      title="Personalized Recommendations"
      subtitle="Discover content tailored to your interests and activity"
    >
      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="qa">Q&A</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="practice_area">Practice Areas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={practiceAreaFilter} onValueChange={setPracticeAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Practice Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {uniquePracticeAreas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date Updated</SelectItem>
                <SelectItem value="type">Content Type</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadRecommendations} disabled={loading} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredRecommendations.length} of {recommendations.length} recommendations
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((recommendation) => (
          <Card key={recommendation.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getContentIcon(recommendation.type)}
                  <Badge variant="secondary" className="text-xs">
                    {recommendation.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(recommendation.id, 'positive')}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(recommendation.id, 'negative')}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs w-fit">
                {recommendation.practiceArea}
              </Badge>
            </CardHeader>

            <CardContent>
              <Link href={getContentUrl(recommendation)}>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                  {recommendation.title}
                </h3>
              </Link>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {recommendation.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(recommendation.relevanceScore * 100)}% match
                </span>
                {recommendation.estimatedReadTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {recommendation.estimatedReadTime} min
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 italic mb-4">
                {recommendation.reason}
              </div>

              <div className="flex items-center justify-between">
                <Button asChild size="sm" className="flex-1 mr-2">
                  <Link href={getContentUrl(recommendation)}>
                    View Content
                  </Link>
                </Button>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or explore more content to get personalized recommendations
            </p>
            <Button asChild>
              <Link href="/legal-guide">Browse Legal Guide</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  Star, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react'

interface Template {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  subscription_tier: string
  price_sgd: number
  difficulty_level: string
  estimated_time_minutes: number
  singapore_compliant: boolean
  usage_count?: number
  rating?: number
  is_trending?: boolean
}

interface RecommendationReason {
  type: 'popular' | 'trending' | 'similar' | 'category' | 'user_history' | 'ai_suggested'
  description: string
  confidence: number
}

interface TemplateRecommendation {
  template: Template
  reason: RecommendationReason
  score: number
}

interface TemplateRecommendationsProps {
  userId?: string
  currentTemplate?: Template
  userHistory?: Template[]
  onTemplateSelect: (template: Template) => void
  maxRecommendations?: number
}

export default function TemplateRecommendations({
  userId,
  currentTemplate,
  userHistory = [],
  onTemplateSelect,
  maxRecommendations = 6
}: TemplateRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'free' | 'basic' | 'premium'>('all')

  useEffect(() => {
    generateRecommendations()
  }, [userId, currentTemplate, userHistory, filter])

  const generateRecommendations = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would call an API
      // For now, we'll generate mock recommendations
      const mockRecommendations = await generateMockRecommendations()
      
      // Filter by subscription tier if needed
      const filteredRecommendations = filter === 'all' 
        ? mockRecommendations
        : mockRecommendations.filter(rec => rec.template.subscription_tier === filter)
      
      // Sort by score and limit
      const sortedRecommendations = filteredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations)
      
      setRecommendations(sortedRecommendations)
    } catch (error) {
      console.error('Recommendation generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockRecommendations = async (): Promise<TemplateRecommendation[]> => {
    // Mock templates data
    const mockTemplates: Template[] = [
      {
        id: '1',
        title: 'Employment Contract Template',
        description: 'Comprehensive employment contract for Singapore businesses',
        category: 'Employment Law',
        subcategory: 'Employment Contracts',
        subscription_tier: 'basic',
        price_sgd: 25,
        difficulty_level: 'intermediate',
        estimated_time_minutes: 20,
        singapore_compliant: true,
        usage_count: 1250,
        rating: 4.8,
        is_trending: true
      },
      {
        id: '2',
        title: 'Freelancer Agreement',
        description: 'Perfect for hiring freelancers and contractors',
        category: 'Employment Law',
        subcategory: 'Contractor Agreements',
        subscription_tier: 'basic',
        price_sgd: 20,
        difficulty_level: 'intermediate',
        estimated_time_minutes: 25,
        singapore_compliant: true,
        usage_count: 890,
        rating: 4.6
      },
      {
        id: '3',
        title: 'NDA Template',
        description: 'Protect your confidential information',
        category: 'Corporate Law',
        subcategory: 'Business Agreements',
        subscription_tier: 'free',
        price_sgd: 0,
        difficulty_level: 'basic',
        estimated_time_minutes: 10,
        singapore_compliant: true,
        usage_count: 2100,
        rating: 4.9
      },
      {
        id: '4',
        title: 'Partnership Agreement',
        description: 'Establish clear partnership terms',
        category: 'Corporate Law',
        subcategory: 'Business Partnerships',
        subscription_tier: 'premium',
        price_sgd: 45,
        difficulty_level: 'advanced',
        estimated_time_minutes: 35,
        singapore_compliant: true,
        usage_count: 450,
        rating: 4.7
      },
      {
        id: '5',
        title: 'Tenancy Agreement',
        description: 'Standard rental agreement for properties',
        category: 'Property Law',
        subcategory: 'Rental Agreements',
        subscription_tier: 'basic',
        price_sgd: 25,
        difficulty_level: 'basic',
        estimated_time_minutes: 20,
        singapore_compliant: true,
        usage_count: 1800,
        rating: 4.5
      },
      {
        id: '6',
        title: 'Loan Agreement',
        description: 'Personal loan agreement template',
        category: 'Contract Law',
        subcategory: 'Loan Agreements',
        subscription_tier: 'basic',
        price_sgd: 30,
        difficulty_level: 'intermediate',
        estimated_time_minutes: 20,
        singapore_compliant: true,
        usage_count: 650,
        rating: 4.4
      }
    ]

    // Generate recommendations with reasons
    const recommendations: TemplateRecommendation[] = []

    // Popular templates
    const popularTemplates = mockTemplates
      .filter(t => t.usage_count && t.usage_count > 1000)
      .slice(0, 2)
    
    popularTemplates.forEach(template => {
      recommendations.push({
        template,
        reason: {
          type: 'popular',
          description: `Popular choice with ${template.usage_count?.toLocaleString()} users`,
          confidence: 0.9
        },
        score: 90 + (template.rating || 0) * 2
      })
    })

    // Trending templates
    const trendingTemplates = mockTemplates.filter(t => t.is_trending)
    trendingTemplates.forEach(template => {
      recommendations.push({
        template,
        reason: {
          type: 'trending',
          description: 'Trending this week',
          confidence: 0.8
        },
        score: 85 + (template.rating || 0) * 2
      })
    })

    // Category-based recommendations
    if (currentTemplate) {
      const sameCategory = mockTemplates.filter(t => 
        t.category === currentTemplate.category && t.id !== currentTemplate.id
      )
      sameCategory.forEach(template => {
        recommendations.push({
          template,
          reason: {
            type: 'category',
            description: `Related to ${currentTemplate.category}`,
            confidence: 0.7
          },
          score: 75 + (template.rating || 0) * 2
        })
      })
    }

    // User history-based recommendations
    if (userHistory.length > 0) {
      const historyCategories = [...new Set(userHistory.map(t => t.category))]
      const relatedTemplates = mockTemplates.filter(t => 
        historyCategories.includes(t.category) && 
        !userHistory.some(h => h.id === t.id)
      )
      
      relatedTemplates.forEach(template => {
        recommendations.push({
          template,
          reason: {
            type: 'user_history',
            description: 'Based on your previous documents',
            confidence: 0.8
          },
          score: 80 + (template.rating || 0) * 2
        })
      })
    }

    // AI-suggested (mock)
    const aiSuggested = mockTemplates.filter(t => t.difficulty_level === 'basic').slice(0, 1)
    aiSuggested.forEach(template => {
      recommendations.push({
        template,
        reason: {
          type: 'ai_suggested',
          description: 'AI recommends for beginners',
          confidence: 0.6
        },
        score: 70 + (template.rating || 0) * 2
      })
    })

    return recommendations
  }

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'popular':
        return <Users className="h-4 w-4" />
      case 'trending':
        return <TrendingUp className="h-4 w-4" />
      case 'similar':
      case 'category':
        return <Filter className="h-4 w-4" />
      case 'user_history':
        return <Clock className="h-4 w-4" />
      case 'ai_suggested':
        return <Sparkles className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getReasonColor = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'popular':
        return 'text-green-600 bg-green-100'
      case 'trending':
        return 'text-orange-600 bg-orange-100'
      case 'similar':
      case 'category':
        return 'text-blue-600 bg-blue-100'
      case 'user_history':
        return 'text-purple-600 bg-purple-100'
      case 'ai_suggested':
        return 'text-pink-600 bg-pink-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-green-100 text-green-800'
      case 'basic':
        return 'bg-blue-100 text-blue-800'
      case 'premium':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recommended Templates</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recommended Templates</h3>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free Only</option>
          <option value="basic">Basic Tier</option>
          <option value="premium">Premium Tier</option>
        </select>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recommendations available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={rec.template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onTemplateSelect(rec.template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{rec.template.title}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierBadgeColor(rec.template.subscription_tier)}`}>
                      {rec.template.subscription_tier}
                    </span>
                    {rec.template.price_sgd > 0 && (
                      <span className="text-sm text-gray-600">${rec.template.price_sgd} SGD</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{rec.template.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {rec.template.estimated_time_minutes} min
                    </div>
                    {rec.template.rating && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-400" />
                        {rec.template.rating}
                      </div>
                    )}
                    {rec.template.usage_count && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {rec.template.usage_count.toLocaleString()} users
                      </div>
                    )}
                  </div>
                </div>
                
                <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(rec.reason.type)}`}>
                  {getReasonIcon(rec.reason.type)}
                  <span className="ml-1">{rec.reason.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

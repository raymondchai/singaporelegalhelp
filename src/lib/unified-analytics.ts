// Unified Analytics Service for Singapore Legal Help Platform
// Integrates search analytics with RAG system analytics for comprehensive insights

import { createClient } from '@supabase/supabase-js'

export interface UnifiedAnalytics {
  searchMetrics: SearchMetrics
  aiMetrics: AIMetrics
  userEngagement: UserEngagementMetrics
  contentPerformance: ContentPerformanceMetrics
  trends: TrendAnalysis
}

export interface SearchMetrics {
  totalSearches: number
  uniqueQueries: number
  avgResultsPerSearch: number
  clickThroughRate: number
  topQueries: Array<{
    query: string
    count: number
    ctr: number
  }>
  categoryDistribution: Record<string, number>
}

export interface AIMetrics {
  totalAIQueries: number
  avgConfidence: number
  cacheHitRate: number
  avgResponseTime: number
  complianceScore: number
  escalationRate: number
  topCategories: Array<{
    category: string
    count: number
    avgConfidence: number
  }>
}

export interface UserEngagementMetrics {
  activeUsers: number
  avgSessionDuration: number
  queriesPerSession: number
  returnUserRate: number
  satisfactionScore: number
  featureUsage: Record<string, number>
}

export interface ContentPerformanceMetrics {
  mostViewedContent: Array<{
    id: string
    title: string
    views: number
    type: 'article' | 'qa'
  }>
  contentGaps: Array<{
    query: string
    frequency: number
    hasContent: boolean
  }>
  lowPerformingContent: Array<{
    id: string
    title: string
    views: number
    lastViewed: string
  }>
}

export interface TrendAnalysis {
  emergingTopics: Array<{
    topic: string
    growth: number
    confidence: number
  }>
  seasonalPatterns: Array<{
    period: string
    categories: string[]
    intensity: number
  }>
  userBehaviorTrends: Array<{
    behavior: string
    change: number
    significance: string
  }>
}

export class UnifiedAnalyticsService {
  private readonly supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async getUnifiedAnalytics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<UnifiedAnalytics> {
    const [
      searchMetrics,
      aiMetrics,
      userEngagement,
      contentPerformance,
      trends
    ] = await Promise.all([
      this.getSearchMetrics(timeRange),
      this.getAIMetrics(timeRange),
      this.getUserEngagementMetrics(timeRange),
      this.getContentPerformanceMetrics(timeRange),
      this.getTrendAnalysis(timeRange)
    ])

    return {
      searchMetrics,
      aiMetrics,
      userEngagement,
      contentPerformance,
      trends
    }
  }

  private async getSearchMetrics(timeRange: string): Promise<SearchMetrics> {
    const daysBack = this.getDaysFromTimeRange(timeRange)
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    try {
      // Get basic search metrics
      const { data: searchData } = await this.supabase
        .from('search_analytics')
        .select('query, results_count, created_at')
        .gte('created_at', startDate.toISOString())

      // Get click-through rate data
      const { data: ctrData } = await this.supabase
        .rpc('get_search_ctr_analytics', { days_back: daysBack, result_limit: 10 })

      // Calculate metrics
      const totalSearches = searchData?.length || 0
      const uniqueQueries = new Set(searchData?.map((s: any) => s.query) || []).size
      const avgResultsPerSearch = searchData?.reduce((sum: number, s: any) => sum + (s.results_count || 0), 0) / totalSearches || 0
      const avgCTR = ctrData?.reduce((sum: number, c: any) => sum + (c.click_through_rate || 0), 0) / (ctrData?.length || 1) || 0

      // Get category distribution
      const categoryDistribution: Record<string, number> = {}
      // This would require joining with content categories - simplified for now
      
      return {
        totalSearches,
        uniqueQueries,
        avgResultsPerSearch: Math.round(avgResultsPerSearch * 100) / 100,
        clickThroughRate: Math.round(avgCTR * 100) / 100,
        topQueries: ctrData?.slice(0, 5).map((c: any) => ({
          query: c.query,
          count: Number(c.total_searches),
          ctr: Number(c.click_through_rate)
        })) || [],
        categoryDistribution
      }
    } catch (error) {
      console.error('Error getting search metrics:', error)
      return this.getEmptySearchMetrics()
    }
  }

  private async getAIMetrics(timeRange: string): Promise<AIMetrics> {
    const daysBack = this.getDaysFromTimeRange(timeRange)
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    try {
      // Get AI query data
      const { data: aiData } = await this.supabase
        .from('ai_query_logs')
        .select('confidence, category, response_time_ms, from_cache, created_at')
        .gte('created_at', startDate.toISOString())

      if (!aiData || aiData.length === 0) {
        return this.getEmptyAIMetrics()
      }

      const totalAIQueries = aiData.length
      const avgConfidence = aiData.reduce((sum: number, q: any) => sum + (q.confidence || 0), 0) / totalAIQueries
      const cacheHits = aiData.filter((q: any) => q.from_cache).length
      const cacheHitRate = (cacheHits / totalAIQueries) * 100
      const avgResponseTime = aiData
        .filter((q: any) => q.response_time_ms)
        .reduce((sum: number, q: any) => sum + q.response_time_ms, 0) / aiData.filter((q: any) => q.response_time_ms).length || 0
      
      // Calculate compliance score (simplified)
      const complianceScore = avgConfidence * 100 // Simplified - would use actual compliance data
      
      // Calculate escalation rate (queries with confidence < 0.5)
      const lowConfidenceQueries = aiData.filter((q: any) => (q.confidence || 0) < 0.5).length
      const escalationRate = (lowConfidenceQueries / totalAIQueries) * 100

      // Get top categories
      const categoryStats: Record<string, { count: number; totalConfidence: number }> = {}
      aiData.forEach((q: any) => {
        const category = q.category || 'general'
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, totalConfidence: 0 }
        }
        categoryStats[category].count++
        categoryStats[category].totalConfidence += q.confidence || 0
      })

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          avgConfidence: Math.round((stats.totalConfidence / stats.count) * 100) / 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalAIQueries,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        complianceScore: Math.round(complianceScore * 100) / 100,
        escalationRate: Math.round(escalationRate * 100) / 100,
        topCategories
      }
    } catch (error) {
      console.error('Error getting AI metrics:', error)
      return this.getEmptyAIMetrics()
    }
  }

  private async getUserEngagementMetrics(timeRange: string): Promise<UserEngagementMetrics> {
    const daysBack = this.getDaysFromTimeRange(timeRange)
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    try {
      // Get user session data
      const { data: sessionData } = await this.supabase
        .from('user_chat_sessions')
        .select('user_id, message_count, created_at, updated_at')
        .gte('created_at', startDate.toISOString())

      // Get search data for engagement
      const { data: searchData } = await this.supabase
        .from('search_analytics')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString())

      const activeUsers = new Set([
        ...(sessionData?.map((s: { user_id: string }) => s.user_id) || []),
        ...(searchData?.map((s: { user_id: string }) => s.user_id) || [])
      ]).size

      // Calculate session metrics
      const avgSessionDuration = sessionData?.reduce((sum: number, s: { updated_at: string; created_at: string }) => {
        const duration = new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()
        return sum + duration
      }, 0) / (sessionData?.length || 1) / (1000 * 60) || 0 // Convert to minutes

      const queriesPerSession = sessionData?.reduce((sum: number, s: { message_count?: number }) => sum + (s.message_count || 0), 0) / (sessionData?.length || 1) || 0

      return {
        activeUsers,
        avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
        queriesPerSession: Math.round(queriesPerSession * 100) / 100,
        returnUserRate: 0, // Would need to track user return visits
        satisfactionScore: 0, // Would need user feedback data
        featureUsage: {
          'ai_chat': sessionData?.length || 0,
          'search': searchData?.length || 0,
          'content_view': 0 // Would need content view tracking
        }
      }
    } catch (error) {
      console.error('Error getting user engagement metrics:', error)
      return this.getEmptyUserEngagementMetrics()
    }
  }

  private async getContentPerformanceMetrics(timeRange: string): Promise<ContentPerformanceMetrics> {
    try {
      // Get most clicked content from search results
      const { data: clickData } = await this.supabase
        .from('search_result_clicks')
        .select('clicked_result_id, clicked_result_type, query')
        .gte('clicked_at', new Date(Date.now() - this.getDaysFromTimeRange(timeRange) * 24 * 60 * 60 * 1000).toISOString())

      // Aggregate click data
      const contentViews: Record<string, { count: number; type: string; title?: string }> = {}
      clickData?.forEach((click: { clicked_result_id: string; clicked_result_type: string; query: string }) => {
        const key = `${click.clicked_result_type}_${click.clicked_result_id}`
        if (!contentViews[key]) {
          contentViews[key] = { count: 0, type: click.clicked_result_type }
        }
        contentViews[key].count++
      })

      const mostViewedContent = Object.entries(contentViews)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([key, data]) => ({
          id: key.split('_')[1],
          title: `Content ${key}`, // Would fetch actual titles
          views: data.count,
          type: data.type as 'article' | 'qa'
        }))

      // Identify content gaps (queries with no good results)
      const { data: searchData } = await this.supabase
        .from('search_analytics')
        .select('query, results_count')
        .eq('results_count', 0)
        .gte('created_at', new Date(Date.now() - this.getDaysFromTimeRange(timeRange) * 24 * 60 * 60 * 1000).toISOString())

      const queryFrequency: Record<string, number> = {}
      searchData?.forEach((search: { query: string; results_count: number }) => {
        queryFrequency[search.query] = (queryFrequency[search.query] || 0) + 1
      })

      const contentGaps = Object.entries(queryFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, frequency]) => ({
          query,
          frequency,
          hasContent: false
        }))

      return {
        mostViewedContent,
        contentGaps,
        lowPerformingContent: [] // Would need more complex analysis
      }
    } catch (error) {
      console.error('Error getting content performance metrics:', error)
      return {
        mostViewedContent: [],
        contentGaps: [],
        lowPerformingContent: []
      }
    }
  }

  private async getTrendAnalysis(timeRange: string): Promise<TrendAnalysis> {
    try {
      // Get trending queries
      const { data: trendingData } = await this.supabase
        .rpc('get_trending_search_queries', { 
          days_back: this.getDaysFromTimeRange(timeRange), 
          result_limit: 10 
        })

      const emergingTopics = trendingData?.map((trend: { query: string; trend_percentage: string | number; current_searches: number }) => ({
        topic: trend.query,
        growth: Number(trend.trend_percentage),
        confidence: trend.current_searches > 5 ? 0.8 : 0.5
      })) || []

      return {
        emergingTopics,
        seasonalPatterns: [], // Would need historical data analysis
        userBehaviorTrends: [] // Would need behavioral analysis
      }
    } catch (error) {
      console.error('Error getting trend analysis:', error)
      return {
        emergingTopics: [],
        seasonalPatterns: [],
        userBehaviorTrends: []
      }
    }
  }

  private getDaysFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '24h': return 1
      case '7d': return 7
      case '30d': return 30
      default: return 7
    }
  }

  private getEmptySearchMetrics(): SearchMetrics {
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultsPerSearch: 0,
      clickThroughRate: 0,
      topQueries: [],
      categoryDistribution: {}
    }
  }

  private getEmptyAIMetrics(): AIMetrics {
    return {
      totalAIQueries: 0,
      avgConfidence: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      complianceScore: 0,
      escalationRate: 0,
      topCategories: []
    }
  }

  private getEmptyUserEngagementMetrics(): UserEngagementMetrics {
    return {
      activeUsers: 0,
      avgSessionDuration: 0,
      queriesPerSession: 0,
      returnUserRate: 0,
      satisfactionScore: 0,
      featureUsage: {}
    }
  }

  // Export analytics data for reporting
  async exportAnalyticsReport(timeRange: '24h' | '7d' | '30d' = '7d', format: 'json' | 'csv' = 'json'): Promise<string> {
    const analytics = await this.getUnifiedAnalytics(timeRange)
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2)
    } else {
      // Convert to CSV format
      const csvData = [
        ['Metric', 'Value'],
        ['Total Searches', analytics.searchMetrics.totalSearches.toString()],
        ['Total AI Queries', analytics.aiMetrics.totalAIQueries.toString()],
        ['Active Users', analytics.userEngagement.activeUsers.toString()],
        ['Avg Confidence', analytics.aiMetrics.avgConfidence.toString()],
        ['Cache Hit Rate', analytics.aiMetrics.cacheHitRate.toString()],
        ['Click Through Rate', analytics.searchMetrics.clickThroughRate.toString()]
      ]
      
      return csvData.map(row => row.join(',')).join('\n')
    }
  }
}

import { createClient } from '@supabase/supabase-js'
import { UsageAnalytics, UserActivity, EngagementMetrics } from '@/types/dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class EnhancedAnalyticsService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Get comprehensive usage analytics for the user
   */
  async getUsageAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<UsageAnalytics> {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    const [
      dailyActivity,
      practiceAreaBreakdown,
      contentEngagement,
      timeSpentAnalytics
    ] = await Promise.all([
      this.getDailyActivity(startDate, endDate),
      this.getPracticeAreaBreakdown(startDate, endDate),
      this.getContentEngagement(startDate, endDate),
      this.getTimeSpentAnalytics(startDate, endDate)
    ])

    return {
      dailyActivity,
      practiceAreaBreakdown,
      contentEngagement,
      timeSpentAnalytics
    }
  }

  /**
   * Get daily activity breakdown
   */
  private async getDailyActivity(startDate: Date, endDate: Date) {
    const { data: activities } = await supabase
      .from('user_activity_logs')
      .select('activity_type, created_at, metadata')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (!activities) return []

    // Group activities by date
    const dailyStats: Record<string, { documents: number; chats: number; searches: number; views: number }> = {}

    activities.forEach(activity => {
      const date = new Date(activity.created_at).toISOString().split('T')[0]
      
      if (!dailyStats[date]) {
        dailyStats[date] = { documents: 0, chats: 0, searches: 0, views: 0 }
      }

      switch (activity.activity_type) {
        case 'upload':
        case 'document_generation':
          dailyStats[date].documents++
          break
        case 'chat':
        case 'ai_query':
          dailyStats[date].chats++
          break
        case 'search':
          dailyStats[date].searches++
          break
        case 'view_article':
        case 'view_qa':
          dailyStats[date].views++
          break
      }
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats
    }))
  }

  /**
   * Get practice area breakdown with trends
   */
  private async getPracticeAreaBreakdown(startDate: Date, endDate: Date) {
    const { data: activities } = await supabase
      .from('user_activity_logs')
      .select('practice_area, created_at')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('practice_area', 'is', null)

    if (!activities) return []

    // Count activities by practice area
    const practiceAreaCounts: Record<string, number> = {}
    const totalActivities = activities.length

    activities.forEach(activity => {
      const area = activity.practice_area
      practiceAreaCounts[area] = (practiceAreaCounts[area] || 0) + 1
    })

    // Calculate trends (simplified - comparing with previous period)
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (endDate.getTime() - startDate.getTime()))

    const { data: previousActivities } = await supabase
      .from('user_activity_logs')
      .select('practice_area')
      .eq('user_id', this.userId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString())
      .not('practice_area', 'is', null)

    const previousCounts: Record<string, number> = {}
    if (previousActivities) {
      previousActivities.forEach(activity => {
        const area = activity.practice_area
        previousCounts[area] = (previousCounts[area] || 0) + 1
      })
    }

    return Object.entries(practiceAreaCounts).map(([area, count]) => {
      const percentage = totalActivities > 0 ? (count / totalActivities) * 100 : 0
      const previousCount = previousCounts[area] || 0
      let trend: 'up' | 'down' | 'stable' = 'stable'
      
      if (count > previousCount) trend = 'up'
      else if (count < previousCount) trend = 'down'

      return {
        area,
        percentage: Math.round(percentage * 10) / 10,
        count,
        trend
      }
    }).sort((a, b) => b.count - a.count)
  }

  /**
   * Get content engagement metrics
   */
  private async getContentEngagement(startDate: Date, endDate: Date) {
    // Most viewed articles
    const { data: articleViews } = await supabase
      .from('user_activity_logs')
      .select('content_id, metadata, practice_area')
      .eq('user_id', this.userId)
      .eq('activity_type', 'view_article')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const articleViewCounts: Record<string, { count: number; practiceArea: string }> = {}
    if (articleViews) {
      articleViews.forEach(view => {
        if (view.content_id) {
          if (!articleViewCounts[view.content_id]) {
            articleViewCounts[view.content_id] = { count: 0, practiceArea: view.practice_area || 'General' }
          }
          articleViewCounts[view.content_id].count++
        }
      })
    }

    // Get article titles for most viewed
    const mostViewedIds = Object.entries(articleViewCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([id]) => id)

    const { data: articles } = await supabase
      .from('legal_articles')
      .select('id, title, category_id')
      .in('id', mostViewedIds)

    const mostViewedArticles = articles?.map(article => ({
      id: article.id,
      title: article.title,
      views: articleViewCounts[article.id]?.count || 0,
      practiceArea: 'General' // Use category_id to get practice area if needed
    })) || []

    // Bookmark trends by month
    const { data: bookmarks } = await supabase
      .from('user_saved_content')
      .select('saved_at')
      .eq('user_id', this.userId)
      .gte('saved_at', startDate.toISOString())
      .lte('saved_at', endDate.toISOString())

    const bookmarksByMonth: Record<string, number> = {}
    if (bookmarks) {
      bookmarks.forEach(bookmark => {
        const month = new Date(bookmark.saved_at).toISOString().substring(0, 7) // YYYY-MM
        bookmarksByMonth[month] = (bookmarksByMonth[month] || 0) + 1
      })
    }

    const bookmarkTrends = Object.entries(bookmarksByMonth).map(([month, bookmarks]) => ({
      month,
      bookmarks
    }))

    // Search patterns
    const { data: searches } = await supabase
      .from('user_activity_logs')
      .select('metadata, created_at')
      .eq('user_id', this.userId)
      .eq('activity_type', 'search')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    const searchCounts: Record<string, { frequency: number; lastSearched: string }> = {}
    if (searches) {
      searches.forEach(search => {
        const query = search.metadata?.query || 'Unknown'
        if (!searchCounts[query]) {
          searchCounts[query] = { frequency: 0, lastSearched: search.created_at }
        }
        searchCounts[query].frequency++
        if (search.created_at > searchCounts[query].lastSearched) {
          searchCounts[query].lastSearched = search.created_at
        }
      })
    }

    const searchPatterns = Object.entries(searchCounts)
      .map(([query, data]) => ({
        query,
        frequency: data.frequency,
        lastSearched: data.lastSearched
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    return {
      mostViewedArticles,
      bookmarkTrends,
      searchPatterns
    }
  }

  /**
   * Get time spent analytics
   */
  private async getTimeSpentAnalytics(startDate: Date, endDate: Date) {
    // This would require session tracking implementation
    // For now, we'll provide estimated values based on activity
    const { data: activities } = await supabase
      .from('user_activity_logs')
      .select('created_at, activity_type')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (!activities || activities.length === 0) {
      return {
        totalHours: 0,
        averageSessionLength: 0,
        peakUsageHours: []
      }
    }

    // Estimate session lengths (simplified)
    const estimatedTotalMinutes = activities.length * 3 // 3 minutes per activity on average
    const totalHours = Math.round((estimatedTotalMinutes / 60) * 10) / 10

    // Calculate peak usage hours
    const hourlyActivity: Record<number, number> = {}
    activities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours()
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
    })

    const peakUsageHours = Object.entries(hourlyActivity)
      .map(([hour, activity]) => ({
        hour: parseInt(hour),
        activity
      }))
      .sort((a, b) => b.activity - a.activity)

    return {
      totalHours,
      averageSessionLength: Math.round((estimatedTotalMinutes / Math.max(1, activities.length / 5)) * 10) / 10, // Estimate sessions
      peakUsageHours
    }
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: this.userId,
          activity_type: activity.type,
          practice_area: activity.metadata?.practiceArea,
          content_id: activity.metadata?.contentId,
          metadata: activity.metadata,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking activity:', error)
    }
  }

  /**
   * Get engagement metrics for a specific time period
   */
  async getEngagementMetrics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<EngagementMetrics> {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
    }

    const { data: activities } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (!activities) {
      return {
        sessionDuration: 0,
        pageViews: 0,
        bounceRate: 0,
        conversionEvents: [],
        userJourney: []
      }
    }

    // Calculate metrics
    const pageViews = activities.filter(a => 
      ['view_article', 'view_qa', 'view_template'].includes(a.activity_type)
    ).length

    const conversionEvents = activities
      .filter(a => ['document_generation', 'subscription_upgrade', 'bookmark'].includes(a.activity_type))
      .map(a => ({
        event: a.activity_type,
        timestamp: a.created_at,
        value: a.metadata?.value
      }))

    const userJourney = activities.map((activity, index) => ({
      step: activity.activity_type,
      timestamp: activity.created_at,
      duration: index < activities.length - 1 
        ? new Date(activities[index + 1].created_at).getTime() - new Date(activity.created_at).getTime()
        : 0
    }))

    return {
      sessionDuration: userJourney.reduce((total, step) => total + step.duration, 0) / 1000 / 60, // minutes
      pageViews,
      bounceRate: pageViews <= 1 ? 100 : 0, // Simplified bounce rate calculation
      conversionEvents,
      userJourney
    }
  }
}

export const createAnalyticsService = (userId: string) => new EnhancedAnalyticsService(userId)

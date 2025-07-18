import { createClient } from '@supabase/supabase-js'
import { PersonalizedRecommendation, UserPreferences, UsageAnalytics } from '@/types/dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class RecommendationEngine {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Generate personalized content recommendations based on user behavior and preferences
   */
  async generateRecommendations(limit: number = 10): Promise<PersonalizedRecommendation[]> {
    try {
      const [userPreferences, userActivity, contentInteractions] = await Promise.all([
        this.getUserPreferences(),
        this.getUserActivity(),
        this.getContentInteractions()
      ])

      const recommendations: PersonalizedRecommendation[] = []

      // 1. Practice Area Based Recommendations
      const practiceAreaRecs = await this.getPracticeAreaRecommendations(userPreferences, userActivity)
      recommendations.push(...practiceAreaRecs)

      // 2. Content Type Preferences
      const contentTypeRecs = await this.getContentTypeRecommendations(userPreferences, contentInteractions)
      recommendations.push(...contentTypeRecs)

      // 3. Trending Content in User's Areas of Interest
      const trendingRecs = await this.getTrendingRecommendations(userPreferences)
      recommendations.push(...trendingRecs)

      // 4. Similar User Recommendations (Collaborative Filtering)
      const collaborativeRecs = await this.getCollaborativeRecommendations(userActivity)
      recommendations.push(...collaborativeRecs)

      // 5. Recently Updated Content in User's Practice Areas
      const recentUpdateRecs = await this.getRecentUpdateRecommendations(userPreferences)
      recommendations.push(...recentUpdateRecs)

      // Sort by relevance score and return top recommendations
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)

    } catch (error) {
      console.error('Error generating recommendations:', error)
      return []
    }
  }

  /**
   * Get recommendations based on user's practice area interests
   */
  private async getPracticeAreaRecommendations(
    preferences: UserPreferences | null,
    activity: any[]
  ): Promise<PersonalizedRecommendation[]> {
    if (!preferences?.practiceAreasInterest?.length) return []

    const recommendations: PersonalizedRecommendation[] = []

    for (const practiceArea of preferences.practiceAreasInterest) {
      // Get top articles in this practice area - using existing columns only
      const { data: articles } = await supabase
        .from('legal_articles')
        .select('id, title, summary, updated_at, reading_time_minutes')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (articles) {
        articles.forEach(article => {
          recommendations.push({
            id: `article_${article.id}`,
            type: 'article',
            title: article.title,
            description: article.summary || '',
            practiceArea: practiceArea, // Use the practice area from the loop
            relevanceScore: this.calculatePracticeAreaScore(practiceArea, activity),
            reason: `Based on your interest in ${practiceArea}`,
            contentId: article.id,
            estimatedReadTime: article.reading_time_minutes,
            lastUpdated: article.updated_at
          })
        })
      }

      // Get relevant Q&As - using existing columns only
      const { data: qas } = await supabase
        .from('legal_qa')
        .select('id, question, answer, updated_at')
        .eq('is_public', true)
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(2)

      if (qas) {
        qas.forEach(qa => {
          recommendations.push({
            id: `qa_${qa.id}`,
            type: 'qa',
            title: qa.question,
            description: qa.answer.substring(0, 150) + '...',
            practiceArea: practiceArea, // Use the practice area from the loop
            relevanceScore: this.calculatePracticeAreaScore(practiceArea, activity) * 0.8,
            reason: `Popular Q&A in ${practiceArea}`,
            contentId: qa.id,
            lastUpdated: qa.updated_at
          })
        })
      }
    }

    return recommendations
  }

  /**
   * Get recommendations based on content type preferences
   */
  private async getContentTypeRecommendations(
    preferences: UserPreferences | null,
    interactions: any[]
  ): Promise<PersonalizedRecommendation[]> {
    if (!preferences?.contentTypes?.length) return []

    const recommendations: PersonalizedRecommendation[] = []

    // Analyze user's content interaction patterns
    const contentTypeScores = this.analyzeContentTypePreferences(interactions)

    for (const contentType of preferences.contentTypes) {
      if (contentType === 'templates') {
        const { data: templates } = await supabase
          .from('legal_document_templates')
          .select('id, title, description, category, updated_at')
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(3)

        if (templates) {
          templates.forEach(template => {
            recommendations.push({
              id: `template_${template.id}`,
              type: 'template',
              title: template.title,
              description: template.description || '',
              practiceArea: template.category,
              relevanceScore: contentTypeScores[contentType] || 0.5,
              reason: 'Popular legal document template',
              contentId: template.id,
              lastUpdated: template.updated_at
            })
          })
        }
      }
    }

    return recommendations
  }

  /**
   * Get trending content recommendations
   */
  private async getTrendingRecommendations(
    preferences: UserPreferences | null
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []

    // Get trending articles based on view count - using existing columns only
    const { data: trendingArticles } = await supabase
      .from('legal_articles')
      .select('id, title, summary, updated_at, view_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(5)

    if (trendingArticles) {
      trendingArticles.forEach(article => {
        // Since practice_area column doesn't exist, we'll include all trending articles
        recommendations.push({
          id: `trending_${article.id}`,
          type: 'article',
          title: article.title,
          description: article.summary || '',
          practiceArea: 'General', // Default practice area for trending content
          relevanceScore: 0.7,
          reason: 'Trending content in Singapore legal community',
          contentId: article.id,
          lastUpdated: article.updated_at
        })
      })
    }

    return recommendations
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userActivity: any[]
  ): Promise<PersonalizedRecommendation[]> {
    // Find users with similar activity patterns
    const similarUsers = await this.findSimilarUsers(userActivity)
    const recommendations: PersonalizedRecommendation[] = []

    for (const similarUser of similarUsers.slice(0, 3)) {
      // Get content that similar users engaged with but current user hasn't
      const { data: similarUserContent } = await supabase
        .from('user_activity_logs')
        .select('content_id, activity_type, metadata')
        .eq('user_id', similarUser.userId)
        .in('activity_type', ['view_article', 'bookmark', 'download'])
        .limit(5)

      // Filter out content current user has already seen
      // Implementation would check against current user's activity
      // This is a simplified version
    }

    return recommendations
  }

  /**
   * Get recommendations for recently updated content
   */
  private async getRecentUpdateRecommendations(
    preferences: UserPreferences | null
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = []
    const practiceAreas = preferences?.practiceAreasInterest || []

    // Note: practice_area column doesn't exist in legal_articles table
    // Using category_id instead for future enhancement
    if (practiceAreas.length > 0) {
      const { data: recentUpdates } = await supabase
        .from('legal_articles')
        .select('id, title, summary, category_id, updated_at')
        .eq('is_published', true)
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false })
        .limit(5)

      if (recentUpdates) {
        recentUpdates.forEach(article => {
          recommendations.push({
            id: `recent_${article.id}`,
            type: 'article',
            title: article.title,
            description: article.summary || '',
            practiceArea: 'General', // Use category mapping in future
            relevanceScore: 0.6,
            reason: 'Recently updated content',
            contentId: article.id,
            lastUpdated: article.updated_at
          })
        })
      }
    }

    return recommendations
  }

  // Helper methods
  private async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_type, subscription_tier') // Only select fields that exist
        .eq('user_id', this.userId)
        .single()

      if (!data) return null

      // Return default preferences since the specific preference fields don't exist yet
      return {
        practiceAreasInterest: [], // Default empty array
        contentTypes: ['articles', 'qa', 'templates'],
        notificationSettings: {
          email: false,
          push: false,
          sms: false,
          deadlineReminders: false,
          contentUpdates: false,
          weeklyDigest: false
        },
        dashboardLayout: { widgets: [] },
        language: 'en', // Default to English
        timezone: 'Asia/Singapore'
      }
    } catch (error) {
      console.warn('Failed to fetch user preferences, using defaults:', error)
      return {
        practiceAreasInterest: [],
        contentTypes: ['articles', 'qa', 'templates'],
        notificationSettings: {
          email: false,
          push: false,
          sms: false,
          deadlineReminders: false,
          contentUpdates: false,
          weeklyDigest: false
        },
        dashboardLayout: { widgets: [] },
        language: 'en',
        timezone: 'Asia/Singapore'
      }
    }
  }

  private async getUserActivity(): Promise<any[]> {
    const { data } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(100)

    return data || []
  }

  private async getContentInteractions(): Promise<any[]> {
    const { data } = await supabase
      .from('user_saved_content')
      .select('*')
      .eq('user_id', this.userId)

    return data || []
  }

  private calculatePracticeAreaScore(practiceArea: string, activity: any[]): number {
    // Note: practice_area doesn't exist in current schema, using general scoring
    const baseScore = 0.5
    const activityBonus = Math.min(activity.length * 0.05, 0.3)
    return baseScore + activityBonus
  }

  private analyzeContentTypePreferences(interactions: any[]): Record<string, number> {
    const scores: Record<string, number> = {
      articles: 0.5,
      qa: 0.5,
      templates: 0.5,
      guides: 0.5
    }

    // Analyze interaction patterns to adjust scores
    interactions.forEach(interaction => {
      if (interaction.content_type === 'article') {
        scores.articles += 0.1
      } else if (interaction.content_type === 'qa') {
        scores.qa += 0.1
      }
    })

    return scores
  }

  private async findSimilarUsers(userActivity: any[]): Promise<Array<{ userId: string; similarity: number }>> {
    // Simplified collaborative filtering
    // In a real implementation, this would use more sophisticated algorithms
    return []
  }
}

export const createRecommendationEngine = (userId: string) => new RecommendationEngine(userId)

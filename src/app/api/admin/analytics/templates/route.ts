// Template Analytics API
// Singapore Legal Help Platform - Document Builder Analytics

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Template analytics and usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d' // 7d, 30d, 90d, 1y
    const templateId = searchParams.get('template_id')
    const category = searchParams.get('category')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
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
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get overall template statistics
    const overallStats = await getOverallTemplateStats(startDate, endDate, templateId || undefined, category || undefined)
    
    // Get usage trends
    const usageTrends = await getUsageTrends(startDate, endDate, templateId || undefined, category || undefined)
    
    // Get popular templates
    const popularTemplates = await getPopularTemplates(startDate, endDate, category || undefined)
    
    // Get user behavior analytics
    const userBehavior = await getUserBehaviorAnalytics(startDate, endDate, templateId || undefined)
    
    // Get conversion metrics
    const conversionMetrics = await getConversionMetrics(startDate, endDate, templateId || undefined)
    
    // Get error analytics
    const errorAnalytics = await getErrorAnalytics(startDate, endDate, templateId || undefined)

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        overallStats,
        usageTrends,
        popularTemplates,
        userBehavior,
        conversionMetrics,
        errorAnalytics
      }
    })

  } catch (error) {
    console.error('Template analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template analytics' },
      { status: 500 }
    )
  }
}

// Get overall template statistics
async function getOverallTemplateStats(startDate: Date, endDate: Date, templateId?: string, category?: string) {
  try {
    let query = supabaseAdmin
      .from('document_generation_history')
      .select('*')
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: generations, error } = await query

    if (error) throw error

    // Filter by category if specified
    let filteredGenerations = generations || []
    if (category) {
      const { data: templates } = await supabaseAdmin
        .from('legal_document_templates')
        .select('id')
        .eq('category', category)
      
      const templateIds = templates?.map(t => t.id) || []
      filteredGenerations = filteredGenerations.filter(g => templateIds.includes(g.template_id))
    }

    const totalGenerations = filteredGenerations.length
    const successfulGenerations = filteredGenerations.filter(g => g.status === 'success').length
    const failedGenerations = filteredGenerations.filter(g => g.status === 'failed').length
    const uniqueUsers = new Set(filteredGenerations.map(g => g.user_id)).size
    const uniqueTemplates = new Set(filteredGenerations.map(g => g.template_id)).size

    // Calculate average generation time
    const generationTimes = filteredGenerations
      .filter(g => g.generation_time_ms)
      .map(g => g.generation_time_ms)
    const avgGenerationTime = generationTimes.length > 0 
      ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length 
      : 0

    // Format breakdown
    const formatBreakdown = {
      docx: filteredGenerations.filter(g => g.output_format === 'docx').length,
      pdf: filteredGenerations.filter(g => g.output_format === 'pdf').length
    }

    return {
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      successRate: totalGenerations > 0 ? (successfulGenerations / totalGenerations * 100).toFixed(2) : 0,
      uniqueUsers,
      uniqueTemplates,
      avgGenerationTime: Math.round(avgGenerationTime),
      formatBreakdown
    }

  } catch (error) {
    console.error('Overall stats error:', error)
    return null
  }
}

// Get usage trends over time
async function getUsageTrends(startDate: Date, endDate: Date, templateId?: string, category?: string) {
  try {
    let query = supabaseAdmin
      .from('document_generation_history')
      .select('generated_at, template_id, status')
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .order('generated_at', { ascending: true })

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: generations, error } = await query

    if (error) throw error

    // Group by day
    const dailyStats: Record<string, { date: string; generations: number; success: number; failed: number }> = {}
    
    generations?.forEach(gen => {
      const date = new Date(gen.generated_at).toISOString().split('T')[0]
      
      if (!dailyStats[date]) {
        dailyStats[date] = { date, generations: 0, success: 0, failed: 0 }
      }
      
      dailyStats[date].generations++
      if (gen.status === 'success') {
        dailyStats[date].success++
      } else if (gen.status === 'failed') {
        dailyStats[date].failed++
      }
    })

    return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))

  } catch (error) {
    console.error('Usage trends error:', error)
    return []
  }
}

// Get popular templates
async function getPopularTemplates(startDate: Date, endDate: Date, category?: string) {
  try {
    let query = supabaseAdmin
      .from('document_generation_history')
      .select(`
        template_id,
        legal_document_templates (
          title,
          category,
          subscription_tier,
          price_sgd
        )
      `)
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .eq('status', 'success')

    const { data: generations, error } = await query

    if (error) throw error

    // Count generations per template
    const templateCounts: Record<string, any> = {}
    
    generations?.forEach(gen => {
      const templateId = gen.template_id
      if (!templateCounts[templateId]) {
        const templateData = Array.isArray(gen.legal_document_templates) ? gen.legal_document_templates[0] : gen.legal_document_templates
        templateCounts[templateId] = {
          template_id: templateId,
          title: templateData?.title || 'Unknown',
          category: templateData?.category || 'Unknown',
          subscription_tier: templateData?.subscription_tier || 'free',
          price_sgd: templateData?.price_sgd || 0,
          generations: 0
        }
      }
      templateCounts[templateId].generations++
    })

    // Filter by category if specified
    let templates = Object.values(templateCounts)
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // Sort by popularity and return top 10
    return templates
      .sort((a, b) => b.generations - a.generations)
      .slice(0, 10)

  } catch (error) {
    console.error('Popular templates error:', error)
    return []
  }
}

// Get user behavior analytics
async function getUserBehaviorAnalytics(startDate: Date, endDate: Date, templateId?: string) {
  try {
    let query = supabaseAdmin
      .from('document_generation_history')
      .select('user_id, generated_at, template_id')
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .eq('status', 'success')

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: generations, error } = await query

    if (error) throw error

    // Analyze user behavior patterns
    const userStats: Record<string, any> = {}
    
    generations?.forEach(gen => {
      const userId = gen.user_id
      if (!userStats[userId]) {
        userStats[userId] = {
          totalGenerations: 0,
          uniqueTemplates: new Set(),
          firstGeneration: gen.generated_at,
          lastGeneration: gen.generated_at
        }
      }
      
      userStats[userId].totalGenerations++
      userStats[userId].uniqueTemplates.add(gen.template_id)
      
      if (gen.generated_at < userStats[userId].firstGeneration) {
        userStats[userId].firstGeneration = gen.generated_at
      }
      if (gen.generated_at > userStats[userId].lastGeneration) {
        userStats[userId].lastGeneration = gen.generated_at
      }
    })

    const users = Object.values(userStats)
    const totalUsers = users.length
    const avgGenerationsPerUser = totalUsers > 0 
      ? users.reduce((sum: number, user: any) => sum + user.totalGenerations, 0) / totalUsers 
      : 0
    const avgTemplatesPerUser = totalUsers > 0
      ? users.reduce((sum: number, user: any) => sum + user.uniqueTemplates.size, 0) / totalUsers
      : 0

    // User segments
    const powerUsers = users.filter((user: any) => user.totalGenerations >= 10).length
    const regularUsers = users.filter((user: any) => user.totalGenerations >= 3 && user.totalGenerations < 10).length
    const casualUsers = users.filter((user: any) => user.totalGenerations < 3).length

    return {
      totalUsers,
      avgGenerationsPerUser: Math.round(avgGenerationsPerUser * 100) / 100,
      avgTemplatesPerUser: Math.round(avgTemplatesPerUser * 100) / 100,
      userSegments: {
        powerUsers,
        regularUsers,
        casualUsers
      }
    }

  } catch (error) {
    console.error('User behavior analytics error:', error)
    return null
  }
}

// Get conversion metrics
async function getConversionMetrics(startDate: Date, endDate: Date, templateId?: string) {
  try {
    // This would require tracking page views and form starts
    // For now, return mock data structure
    return {
      templateViews: 0,
      formStarts: 0,
      formCompletions: 0,
      documentGenerations: 0,
      conversionRate: 0,
      dropoffPoints: []
    }

  } catch (error) {
    console.error('Conversion metrics error:', error)
    return null
  }
}

// Get error analytics
async function getErrorAnalytics(startDate: Date, endDate: Date, templateId?: string) {
  try {
    let query = supabaseAdmin
      .from('document_generation_history')
      .select('error_message, template_id, generated_at')
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .eq('status', 'failed')

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data: errors, error } = await query

    if (error) throw error

    // Analyze error patterns
    const errorCounts: Record<string, number> = {}
    const errorsByTemplate: Record<string, number> = {}
    
    errors?.forEach(err => {
      const errorMsg = err.error_message || 'Unknown error'
      errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1
      errorsByTemplate[err.template_id] = (errorsByTemplate[err.template_id] || 0) + 1
    })

    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    return {
      totalErrors: errors?.length || 0,
      topErrors,
      errorsByTemplate
    }

  } catch (error) {
    console.error('Error analytics error:', error)
    return null
  }
}

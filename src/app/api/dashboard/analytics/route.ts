import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createAnalyticsService } from '@/lib/enhanced-analytics'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('timeRange') || '30d') as '7d' | '30d' | '90d' | '1y'
    const type = searchParams.get('type') // 'usage' | 'engagement' | 'all'

    const service = createAnalyticsService(user.id)

    let response: any = {}

    if (type === 'engagement') {
      const engagementTimeRange = timeRange === '1y' ? '30d' : timeRange
      response.engagement = await service.getEngagementMetrics(engagementTimeRange as '24h' | '7d' | '30d')
    } else if (type === 'usage' || !type) {
      response.usage = await service.getUsageAnalytics(timeRange)
    }

    if (type === 'all') {
      const engagementTimeRange = timeRange === '1y' ? '30d' : timeRange
      response.engagement = await service.getEngagementMetrics(engagementTimeRange as '24h' | '7d' | '30d')
    }

    return NextResponse.json({
      success: true,
      data: response,
      timeRange,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { type, description, metadata } = body

    // Track user activity
    const service = createAnalyticsService(user.id)
    await service.trackActivity({
      type,
      description,
      metadata
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics tracking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Additional endpoint for specific analytics queries
export async function PUT(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { query, params } = body

    let result: any = {}

    switch (query) {
      case 'practice_area_trends':
        result = await getPracticeAreaTrends(user.id, params)
        break
      case 'content_performance':
        result = await getContentPerformance(user.id, params)
        break
      case 'search_analytics':
        result = await getSearchAnalytics(user.id, params)
        break
      case 'time_analysis':
        result = await getTimeAnalysis(user.id, params)
        break
      default:
        return NextResponse.json({ error: 'Invalid query type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      query,
      params
    })

  } catch (error) {
    console.error('Analytics query API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for specific analytics queries
async function getPracticeAreaTrends(userId: string, params: any) {
  const supabase = getSupabaseAdmin()
  const { timeRange = '30d' } = params
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
  }

  const { data } = await supabase
    .from('user_activity_logs')
    .select('practice_area, created_at, activity_type')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('practice_area', 'is', null)

  // Process and return trends data
  return data || []
}

async function getContentPerformance(userId: string, params: any) {
  const supabase = getSupabaseAdmin()
  const { contentType = 'all', limit = 10 } = params

  let query = supabase
    .from('user_activity_logs')
    .select('content_id, activity_type, created_at, metadata')
    .eq('user_id', userId)
    .in('activity_type', ['view_article', 'view_qa', 'bookmark', 'share'])

  if (contentType !== 'all') {
    query = query.eq('metadata->content_type', contentType)
  }

  const { data } = await query
    .order('created_at', { ascending: false })
    .limit(limit * 5) // Get more to process

  return data || []
}

async function getSearchAnalytics(userId: string, params: any) {
  const supabase = getSupabaseAdmin()
  const { timeRange = '30d' } = params
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
  }

  const { data } = await supabase
    .from('user_activity_logs')
    .select('metadata, created_at')
    .eq('user_id', userId)
    .eq('activity_type', 'search')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  return data || []
}

async function getTimeAnalysis(userId: string, params: any) {
  const supabase = getSupabaseAdmin()
  const { groupBy = 'hour' } = params // 'hour', 'day', 'week'
  
  const { data } = await supabase
    .from('user_activity_logs')
    .select('created_at, activity_type')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  return data || []
}

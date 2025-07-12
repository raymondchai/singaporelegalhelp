import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const timeRange = url.searchParams.get('timeRange') || '7d'
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Fetch compliance data
    const { data: queries, error: queriesError } = await supabase
      .from('ai_query_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (queriesError) {
      console.error('Error fetching compliance data:', queriesError)
      return NextResponse.json(
        { error: 'Failed to fetch compliance data' },
        { status: 500 }
      )
    }

    // Calculate compliance metrics
    const totalQueries = queries?.length || 0
    const highRiskQueries = queries?.filter(q => (q.confidence || 0) < 0.5).length || 0
    const mediumRiskQueries = queries?.filter(q => {
      const conf = q.confidence || 0
      return conf >= 0.5 && conf < 0.8
    }).length || 0
    const lowRiskQueries = queries?.filter(q => (q.confidence || 0) >= 0.8).length || 0
    
    const averageConfidence = totalQueries > 0 
      ? queries.reduce((sum, q) => sum + (q.confidence || 0), 0) / totalQueries 
      : 0
    
    const escalationRate = totalQueries > 0 ? (highRiskQueries / totalQueries) * 100 : 0

    // Get trending data (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000))
    const { data: previousQueries } = await supabase
      .from('ai_query_logs')
      .select('confidence')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousTotalQueries = previousQueries?.length || 0
    const queryGrowth = previousTotalQueries > 0 
      ? ((totalQueries - previousTotalQueries) / previousTotalQueries) * 100 
      : 0

    const previousAverageConfidence = previousTotalQueries > 0 && previousQueries
      ? previousQueries.reduce((sum, q) => sum + (q.confidence || 0), 0) / previousTotalQueries
      : 0
    
    const confidenceChange = previousAverageConfidence > 0
      ? ((averageConfidence - previousAverageConfidence) / previousAverageConfidence) * 100
      : 0

    // Get top risk categories
    const riskCategories = queries
      ?.filter(q => (q.confidence || 0) < 0.7)
      .reduce((acc: any, q) => {
        const category = q.category || 'general'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})

    const topRiskCategories = Object.entries(riskCategories || {})
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Recent high-risk queries for review
    const highRiskRecentQueries = queries
      ?.filter(q => (q.confidence || 0) < 0.5)
      .slice(0, 10)
      .map(q => ({
        id: q.id,
        question: q.question,
        confidence: q.confidence,
        created_at: q.created_at,
        category: q.category,
        user_id: q.user_id
      }))

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalQueries,
          highRiskQueries,
          mediumRiskQueries,
          lowRiskQueries,
          averageConfidence,
          escalationRate,
          queryGrowth,
          confidenceChange
        },
        trends: {
          queryGrowth,
          confidenceChange
        },
        topRiskCategories,
        highRiskRecentQueries,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in compliance API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch compliance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for updating compliance settings
export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, queryId, notes } = body

    if (action === 'review_query' && queryId) {
      // Mark query as reviewed
      const { error: updateError } = await supabase
        .from('ai_query_logs')
        .update({ 
          reviewed: true,
          review_notes: notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', queryId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update query review status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Query marked as reviewed'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in compliance POST API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process compliance action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

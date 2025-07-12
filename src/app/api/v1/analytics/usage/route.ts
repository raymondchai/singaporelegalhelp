import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext, validateSubscriptionTier } from '@/lib/api-middleware'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for analytics queries
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

// GET /api/v1/analytics/usage - Get API usage analytics
async function getUsageAnalytics(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  // Validate subscription tier for analytics access
  validateSubscriptionTier(context, ['premium', 'enterprise'])

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d' // 1d, 7d, 30d, 90d
  const groupBy = searchParams.get('group_by') || 'day' // hour, day, week, month
  const endpoint = searchParams.get('endpoint')
  const apiKeyId = searchParams.get('api_key_id')

  try {
    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    // Build base query
    let query = supabaseAdmin
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', context.user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())

    // Apply filters
    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }
    if (apiKeyId) {
      query = query.eq('api_key_id', apiKeyId)
    }

    const { data: usageLogs, error } = await query.order('timestamp', { ascending: true })

    if (error) {
      console.error('Usage analytics error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch usage analytics' },
        { status: 500 }
      )
    }

    // Process data for analytics
    const analytics = processUsageData(usageLogs || [], groupBy)

    // Get summary statistics
    const summary = calculateSummaryStats(usageLogs || [])

    // Get top endpoints
    const topEndpoints = getTopEndpoints(usageLogs || [])

    // Get error analysis
    const errorAnalysis = getErrorAnalysis(usageLogs || [])

    return NextResponse.json({
      success: true,
      data: {
        period,
        groupBy,
        summary,
        timeSeries: analytics,
        topEndpoints,
        errorAnalysis,
        totalRecords: usageLogs?.length || 0
      }
    })

  } catch (error) {
    console.error('Usage analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/analytics/performance - Get API performance metrics
async function getPerformanceMetrics(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  validateSubscriptionTier(context, ['premium', 'enterprise'])

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d'

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(period.replace('d', '')))

    // Get performance metrics
    const { data: performanceData, error } = await supabaseAdmin
      .from('api_usage_logs')
      .select('endpoint, response_time_ms, status_code, timestamp')
      .eq('user_id', context.user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .not('response_time_ms', 'is', null)

    if (error) {
      console.error('Performance metrics error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      )
    }

    // Calculate performance metrics
    const metrics = calculatePerformanceMetrics(performanceData || [])

    return NextResponse.json({
      success: true,
      data: {
        period,
        metrics,
        totalRequests: performanceData?.length || 0
      }
    })

  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function processUsageData(logs: any[], groupBy: string) {
  const grouped = new Map()

  logs.forEach(log => {
    const date = new Date(log.timestamp)
    let key: string

    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
        break
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        timestamp: key,
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      })
    }

    const group = grouped.get(key)
    group.requests++
    
    if (log.status_code >= 400) {
      group.errors++
    }
    
    if (log.response_time_ms) {
      group.totalResponseTime += log.response_time_ms
      group.avgResponseTime = group.totalResponseTime / group.requests
    }
  })

  return Array.from(grouped.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function calculateSummaryStats(logs: any[]) {
  const totalRequests = logs.length
  const successfulRequests = logs.filter(log => log.status_code < 400).length
  const errorRequests = logs.filter(log => log.status_code >= 400).length
  const avgResponseTime = logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalRequests || 0

  return {
    totalRequests,
    successfulRequests,
    errorRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: Math.round(avgResponseTime)
  }
}

function getTopEndpoints(logs: any[]) {
  const endpointCounts = new Map()

  logs.forEach(log => {
    const count = endpointCounts.get(log.endpoint) || 0
    endpointCounts.set(log.endpoint, count + 1)
  })

  return Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function getErrorAnalysis(logs: any[]) {
  const errorCounts = new Map()

  logs.filter(log => log.status_code >= 400).forEach(log => {
    const key = `${log.status_code} - ${log.endpoint}`
    const count = errorCounts.get(key) || 0
    errorCounts.set(key, count + 1)
  })

  return Array.from(errorCounts.entries())
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function calculatePerformanceMetrics(data: any[]) {
  const endpointMetrics = new Map()

  data.forEach(log => {
    if (!endpointMetrics.has(log.endpoint)) {
      endpointMetrics.set(log.endpoint, {
        endpoint: log.endpoint,
        requests: 0,
        totalResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        responseTimes: []
      })
    }

    const metric = endpointMetrics.get(log.endpoint)
    metric.requests++
    metric.totalResponseTime += log.response_time_ms
    metric.minResponseTime = Math.min(metric.minResponseTime, log.response_time_ms)
    metric.maxResponseTime = Math.max(metric.maxResponseTime, log.response_time_ms)
    metric.responseTimes.push(log.response_time_ms)
  })

  return Array.from(endpointMetrics.values()).map(metric => {
    const sortedTimes = metric.responseTimes.sort((a: number, b: number) => a - b)
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)]
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)]

    return {
      endpoint: metric.endpoint,
      requests: metric.requests,
      avgResponseTime: Math.round(metric.totalResponseTime / metric.requests),
      minResponseTime: metric.minResponseTime,
      maxResponseTime: metric.maxResponseTime,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99
    }
  }).sort((a, b) => b.requests - a.requests)
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getUsageAnalytics, {
  requiredPermissions: ['read'],
  rateLimit: 100
})

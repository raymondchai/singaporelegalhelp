import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext, validateSubscriptionTier } from '@/lib/api-middleware'
import { createClient } from '@supabase/supabase-js'

// Create admin client for enterprise queries
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

// GET /api/v1/enterprise/dashboard - Get enterprise dashboard overview
async function getEnterpriseDashboard(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  // Validate subscription tier for enterprise dashboard access
  validateSubscriptionTier(context, ['enterprise'])

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d' // 7d, 30d, 90d
  const organizationId = searchParams.get('organization_id')

  try {
    // Get user's organization if not specified
    let orgId = organizationId
    if (!orgId) {
      const { data: membership } = await supabaseAdmin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', context.user.id)
        .eq('status', 'active')
        .single()

      if (!membership) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 404 }
        )
      }
      orgId = membership.organization_id
    }

    // Verify user has access to this organization
    const { data: hasAccess } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', context.user.id)
      .eq('status', 'active')
      .single()

    if (!hasAccess || !['owner', 'admin', 'manager'].includes(hasAccess.role)) {
      return NextResponse.json(
        { error: 'Access denied to organization dashboard' },
        { status: 403 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
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
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get organization overview
    const { data: organization } = await supabaseAdmin
      .from('enterprise_organizations')
      .select(`
        id,
        name,
        subscription_tier,
        max_users,
        max_api_calls_per_month,
        max_storage_gb,
        status,
        settings
      `)
      .eq('id', orgId)
      .single()

    // Get member count and breakdown
    const { data: memberStats } = await supabaseAdmin
      .from('organization_members')
      .select('role, status')
      .eq('organization_id', orgId)

    const memberBreakdown = {
      total: memberStats?.length || 0,
      active: memberStats?.filter(m => m.status === 'active').length || 0,
      byRole: memberStats?.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }

    // Get API usage statistics
    const { data: apiUsage } = await supabaseAdmin
      .from('api_usage_logs')
      .select('endpoint, status_code, response_time_ms, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())

    const apiStats = {
      totalCalls: apiUsage?.length || 0,
      successfulCalls: apiUsage?.filter(log => log.status_code < 400).length || 0,
      errorCalls: apiUsage?.filter(log => log.status_code >= 400).length || 0,
      avgResponseTime: apiUsage && apiUsage.length > 0
        ? apiUsage.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / apiUsage.length
        : 0,
      topEndpoints: getTopEndpoints(apiUsage || [])
    }

    // Get document statistics
    const { data: documentStats } = await supabaseAdmin
      .from('user_documents')
      .select('document_type, status, created_at, file_size')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const docStats = {
      totalDocuments: documentStats?.length || 0,
      byType: documentStats?.reduce((acc, doc) => {
        acc[doc.document_type] = (acc[doc.document_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      byStatus: documentStats?.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      totalSize: documentStats?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0
    }

    // Get collaboration statistics
    const { data: collaborationStats } = await supabaseAdmin
      .from('collaboration_sessions')
      .select('session_type, status, started_at')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())

    const collabStats = {
      totalSessions: collaborationStats?.length || 0,
      activeSessions: collaborationStats?.filter(s => s.status === 'active').length || 0,
      byType: collaborationStats?.reduce((acc, session) => {
        acc[session.session_type] = (acc[session.session_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }

    // Get security events
    const { data: securityEvents } = await supabaseAdmin
      .from('security_audit_logs')
      .select('event_type, risk_level, result, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const securityStats = {
      totalEvents: securityEvents?.length || 0,
      highRiskEvents: securityEvents?.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length || 0,
      failedEvents: securityEvents?.filter(e => e.result === 'failure').length || 0,
      recentEvents: securityEvents?.slice(0, 5) || []
    }

    // Get billing information
    const { data: billingInfo } = await supabaseAdmin
      .from('billing_usage_records')
      .select('*')
      .eq('organization_id', orgId)
      .order('billing_period_start', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        organization,
        period,
        overview: {
          members: memberBreakdown,
          api: apiStats,
          documents: docStats,
          collaboration: collabStats,
          security: securityStats,
          billing: billingInfo
        },
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Enterprise dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get top API endpoints
function getTopEndpoints(apiUsage: any[]): Array<{ endpoint: string; count: number; avgResponseTime: number }> {
  const endpointStats = new Map()

  apiUsage.forEach(log => {
    if (!endpointStats.has(log.endpoint)) {
      endpointStats.set(log.endpoint, {
        endpoint: log.endpoint,
        count: 0,
        totalResponseTime: 0
      })
    }

    const stat = endpointStats.get(log.endpoint)
    stat.count++
    stat.totalResponseTime += log.response_time_ms || 0
  })

  return Array.from(endpointStats.values())
    .map(stat => ({
      endpoint: stat.endpoint,
      count: stat.count,
      avgResponseTime: Math.round(stat.totalResponseTime / stat.count)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// GET /api/v1/enterprise/dashboard/analytics - Get detailed analytics
async function getDetailedAnalytics(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  validateSubscriptionTier(context, ['enterprise'])

  const { searchParams } = new URL(request.url)
  const metric = searchParams.get('metric') || 'usage' // usage, performance, security, billing
  const period = searchParams.get('period') || '30d'
  const granularity = searchParams.get('granularity') || 'day' // hour, day, week, month

  try {
    // Get user's organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', context.user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const orgId = membership.organization_id

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
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

    let analyticsData: any = {}

    switch (metric) {
      case 'usage':
        analyticsData = await getUsageAnalytics(orgId, startDate, endDate, granularity)
        break
      case 'performance':
        analyticsData = await getPerformanceAnalytics(orgId, startDate, endDate, granularity)
        break
      case 'security':
        analyticsData = await getSecurityAnalytics(orgId, startDate, endDate, granularity)
        break
      case 'billing':
        analyticsData = await getBillingAnalytics(orgId, startDate, endDate, granularity)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        metric,
        period,
        granularity,
        analytics: analyticsData,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Detailed analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for different analytics types
async function getUsageAnalytics(orgId: string, startDate: Date, endDate: Date, granularity: string) {
  const { data } = await supabaseAdmin
    .from('usage_analytics_daily')
    .select('*')
    .eq('organization_id', orgId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  return {
    timeSeries: data || [],
    summary: {
      totalApiCalls: data?.reduce((sum, d) => sum + d.api_calls, 0) || 0,
      totalDocuments: data?.reduce((sum, d) => sum + d.documents_created, 0) || 0,
      totalSessions: data?.reduce((sum, d) => sum + d.collaboration_sessions, 0) || 0,
      avgStorageUsed: data?.reduce((sum, d) => sum + d.storage_used_bytes, 0) / (data?.length || 1) || 0
    }
  }
}

async function getPerformanceAnalytics(orgId: string, startDate: Date, endDate: Date, granularity: string) {
  const { data } = await supabaseAdmin
    .from('api_usage_logs')
    .select('endpoint, response_time_ms, status_code, timestamp')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())

  return {
    responseTimeDistribution: calculateResponseTimeDistribution(data || []),
    errorRateByEndpoint: calculateErrorRateByEndpoint(data || []),
    performanceTrends: calculatePerformanceTrends(data || [], granularity)
  }
}

async function getSecurityAnalytics(orgId: string, startDate: Date, endDate: Date, granularity: string) {
  const { data } = await supabaseAdmin
    .from('security_audit_logs')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  return {
    eventsByType: calculateEventsByType(data || []),
    riskLevelDistribution: calculateRiskLevelDistribution(data || []),
    securityTrends: calculateSecurityTrends(data || [], granularity)
  }
}

async function getBillingAnalytics(orgId: string, startDate: Date, endDate: Date, granularity: string) {
  const { data } = await supabaseAdmin
    .from('billing_usage_records')
    .select('*')
    .eq('organization_id', orgId)
    .gte('billing_period_start', startDate.toISOString())
    .lte('billing_period_end', endDate.toISOString())

  return {
    costBreakdown: data || [],
    usageTrends: calculateUsageTrends(data || []),
    projectedCosts: calculateProjectedCosts(data || [])
  }
}

// Calculation helper functions (simplified implementations)
function calculateResponseTimeDistribution(data: any[]) {
  const buckets = { '<100ms': 0, '100-500ms': 0, '500ms-1s': 0, '>1s': 0 }
  data.forEach(log => {
    const time = log.response_time_ms || 0
    if (time < 100) buckets['<100ms']++
    else if (time < 500) buckets['100-500ms']++
    else if (time < 1000) buckets['500ms-1s']++
    else buckets['>1s']++
  })
  return buckets
}

function calculateErrorRateByEndpoint(data: any[]) {
  const endpointStats = new Map()
  data.forEach(log => {
    if (!endpointStats.has(log.endpoint)) {
      endpointStats.set(log.endpoint, { total: 0, errors: 0 })
    }
    const stat = endpointStats.get(log.endpoint)
    stat.total++
    if (log.status_code >= 400) stat.errors++
  })

  return Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
    endpoint,
    errorRate: (stats.errors / stats.total) * 100,
    totalRequests: stats.total
  }))
}

function calculatePerformanceTrends(data: any[], granularity: string) {
  // Simplified implementation - group by time period and calculate averages
  return []
}

function calculateEventsByType(data: any[]) {
  return data.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {})
}

function calculateRiskLevelDistribution(data: any[]) {
  return data.reduce((acc, event) => {
    acc[event.risk_level] = (acc[event.risk_level] || 0) + 1
    return acc
  }, {})
}

function calculateSecurityTrends(data: any[], granularity: string) {
  // Simplified implementation
  return []
}

function calculateUsageTrends(data: any[]) {
  return data.map(record => ({
    period: record.billing_period_start,
    apiCalls: record.total_api_calls,
    storage: record.total_storage_gb,
    cost: record.total_cost_sgd
  }))
}

function calculateProjectedCosts(data: any[]) {
  if (data.length === 0) return { nextMonth: 0, nextQuarter: 0 }
  
  const avgMonthlyCost = data.reduce((sum, record) => sum + record.total_cost_sgd, 0) / data.length
  return {
    nextMonth: avgMonthlyCost,
    nextQuarter: avgMonthlyCost * 3
  }
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getEnterpriseDashboard, {
  requiredPermissions: ['read'],
  rateLimit: 100
})

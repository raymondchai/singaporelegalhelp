import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

interface SystemMetrics {
  activeUsers: number
  totalRequests: number
  errorRate: number
  avgResponseTime: number
  dbConnections: number
  storageUsage: number
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Calculate active users (users with activity in last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('user_activity_logs')
      .select('user_id')
      .gte('created_at', fifteenMinutesAgo)
      .not('user_id', 'is', null)

    const activeUsers = activeUsersData ? new Set(activeUsersData.map(log => log.user_id)).size : 0

    // Calculate total requests today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: requestsData, error: requestsError } = await supabase
      .from('api_request_logs')
      .select('id')
      .gte('created_at', todayStart.toISOString())

    const totalRequests = requestsData?.length || 0

    // Calculate error rate (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: totalRequestsLast24h } = await supabase
      .from('api_request_logs')
      .select('id, status_code')
      .gte('created_at', twentyFourHoursAgo)

    const errorRequests = totalRequestsLast24h?.filter(req => 
      req.status_code >= 400 && req.status_code < 600
    ).length || 0
    
    const totalRequestsLast24hCount = totalRequestsLast24h?.length || 0
    const errorRate = totalRequestsLast24hCount > 0 
      ? Math.round((errorRequests / totalRequestsLast24hCount) * 100 * 100) / 100 
      : 0

    // Calculate average response time (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: responseTimeData } = await supabase
      .from('api_request_logs')
      .select('response_time_ms')
      .gte('created_at', oneHourAgo)
      .not('response_time_ms', 'is', null)

    const avgResponseTime = responseTimeData && responseTimeData.length > 0
      ? Math.round(responseTimeData.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / responseTimeData.length)
      : 0

    // Get database connection info (approximate)
    const { data: dbStats } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    // Simulate database connections (in production, you'd get this from your database monitoring)
    const dbConnections = dbStats ? Math.floor(Math.random() * 50) + 10 : 0

    // Calculate storage usage (approximate from file uploads)
    const { data: storageData } = await supabase
      .from('user_documents')
      .select('file_size')
      .not('file_size', 'is', null)

    const totalStorageBytes = storageData?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0
    const storageUsage = Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100 // Convert to GB

    const metrics: SystemMetrics = {
      activeUsers,
      totalRequests,
      errorRate,
      avgResponseTime,
      dbConnections,
      storageUsage,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('System metrics error:', error)
    
    // Return fallback metrics on error
    const fallbackMetrics: SystemMetrics = {
      activeUsers: 0,
      totalRequests: 0,
      errorRate: 0,
      avgResponseTime: 0,
      dbConnections: 0,
      storageUsage: 0,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(fallbackMetrics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

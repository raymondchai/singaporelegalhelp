import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action_type = searchParams.get('action_type')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    // Build query for activity logs
    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (action_type) {
      query = query.eq('action_type', action_type)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data: activities, error: activitiesError } = await query

    if (activitiesError) {
      console.error('Activities fetch error:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (action_type) {
      countQuery = countQuery.eq('action_type', action_type)
    }

    if (start_date) {
      countQuery = countQuery.gte('created_at', start_date)
    }

    if (end_date) {
      countQuery = countQuery.lte('created_at', end_date)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count fetch error:', countError)
    }

    // Get activity statistics
    const { data: stats, error: statsError } = await supabase
      .from('user_activity_logs')
      .select('action_type')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (statsError) {
      console.error('Stats fetch error:', statsError)
    }

    // Calculate activity statistics
    const activityStats = (stats || []).reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get security-related activities
    const securityActions = [
      'login',
      'logout',
      'login_failed',
      'password_changed',
      'two_factor_enabled',
      'two_factor_disabled',
      'account_locked',
      'account_unlocked',
    ]

    const { data: securityActivities, error: securityError } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .in('action_type', securityActions)
      .order('created_at', { ascending: false })
      .limit(20)

    if (securityError) {
      console.error('Security activities fetch error:', securityError)
    }

    // Detect suspicious activities
    const suspiciousActivities = []
    
    // Check for multiple failed logins
    const recentFailures = activities?.filter(
      activity => activity.action_type === 'login_failed' &&
      new Date(activity.created_at).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    ) || []

    if (recentFailures.length >= 3) {
      suspiciousActivities.push({
        type: 'multiple_failed_logins',
        severity: 'high',
        description: `${recentFailures.length} failed login attempts in the last hour`,
        first_occurrence: recentFailures[recentFailures.length - 1].created_at,
        last_occurrence: recentFailures[0].created_at,
      })
    }

    // Check for logins from new locations/IPs
    const recentLogins = activities?.filter(
      activity => activity.action_type === 'login' &&
      new Date(activity.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    ) || []

    const uniqueIPs = new Set(recentLogins.map(login => login.ip_address))
    if (uniqueIPs.size > 3) {
      suspiciousActivities.push({
        type: 'multiple_ip_addresses',
        severity: 'medium',
        description: `Logins from ${uniqueIPs.size} different IP addresses in the last 24 hours`,
        details: Array.from(uniqueIPs),
      })
    }

    // Check for unusual activity patterns
    const activityHours = activities?.map(activity => 
      new Date(activity.created_at).getHours()
    ) || []

    const nightTimeActivity = activityHours.filter(hour => hour < 6 || hour > 22).length
    if (nightTimeActivity > 5) {
      suspiciousActivities.push({
        type: 'unusual_hours',
        severity: 'low',
        description: `${nightTimeActivity} activities during unusual hours (10 PM - 6 AM)`,
      })
    }

    return NextResponse.json({
      activities: activities || [],
      security_activities: securityActivities || [],
      suspicious_activities: suspiciousActivities,
      statistics: {
        total_count: count || 0,
        activity_stats: activityStats,
        has_more: (offset + limit) < (count || 0),
        next_offset: (offset + limit) < (count || 0) ? offset + limit : null,
      },
      filters: {
        action_type,
        start_date,
        end_date,
        limit,
        offset,
      },
    })

  } catch (error) {
    console.error('Activity logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Log a new activity (for internal use)
export async function POST(request: NextRequest) {
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

    const { action_type, resource_type, resource_id, details } = await request.json()

    if (!action_type) {
      return NextResponse.json(
        { error: 'Action type is required' },
        { status: 400 }
      )
    }

    // Log the activity
    const { data: activity, error: logError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single()

    if (logError) {
      console.error('Activity logging error:', logError)
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Activity logged successfully',
      activity,
    })

  } catch (error) {
    console.error('Activity logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

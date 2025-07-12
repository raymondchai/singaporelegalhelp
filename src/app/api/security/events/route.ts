import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

interface SecurityEvent {
  type: 'csp_violation' | 'xss_attempt' | 'suspicious_request' | 'rate_limit_exceeded' | 'auth_failure'
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const event: SecurityEvent = await request.json()
    
    // Validate required fields
    if (!event.type || !event.severity) {
      return NextResponse.json(
        { error: 'Invalid payload: type and severity are required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()
    
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'unknown'

    // Get user ID if available
    let userId: string | null = null
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      }
    } catch (error) {
      // Continue without user ID if auth fails
    }

    // Store security event
    const { error: insertError } = await supabase
      .from('security_events')
      .insert({
        event_type: event.type,
        severity: event.severity,
        details: event.details || {},
        client_ip: clientIP,
        user_agent: userAgent,
        referer: referer,
        user_id: userId,
        occurred_at: new Date(event.timestamp).toISOString(),
      })

    if (insertError) {
      console.error('Failed to store security event:', insertError)
      return NextResponse.json(
        { error: 'Failed to store security event' },
        { status: 500 }
      )
    }

    // Update security metrics
    await updateSecurityMetrics(supabase, event)

    // Handle high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await handleHighSeverityEvent(event, clientIP, userAgent)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Security events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateSecurityMetrics(supabase: any, event: SecurityEvent) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get or create daily security metrics
    const { data: existing } = await supabase
      .from('security_metrics_daily')
      .select('*')
      .eq('date', today)
      .eq('event_type', event.type)
      .eq('severity', event.severity)
      .single()

    if (existing) {
      // Update existing metrics
      await supabase
        .from('security_metrics_daily')
        .update({
          event_count: existing.event_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new metrics entry
      await supabase
        .from('security_metrics_daily')
        .insert({
          date: today,
          event_type: event.type,
          severity: event.severity,
          event_count: 1,
        })
    }
  } catch (error) {
    console.error('Failed to update security metrics:', error)
  }
}

async function handleHighSeverityEvent(event: SecurityEvent, clientIP: string, userAgent: string) {
  try {
    // Log critical security events
    console.error('HIGH SEVERITY SECURITY EVENT:', {
      type: event.type,
      severity: event.severity,
      details: event.details,
      clientIP,
      userAgent,
      timestamp: new Date(event.timestamp).toISOString(),
    })

    // Send to external security monitoring (if configured)
    const securityWebhook = process.env.SECURITY_WEBHOOK_URL
    if (securityWebhook) {
      await fetch(securityWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`,
        },
        body: JSON.stringify({
          alert_type: 'security_event',
          severity: event.severity,
          event_type: event.type,
          details: event.details,
          client_info: {
            ip: clientIP,
            user_agent: userAgent,
          },
          timestamp: event.timestamp,
        }),
      })
    }

    // For critical events, also trigger immediate response
    if (event.severity === 'critical') {
      await triggerSecurityResponse(event, clientIP)
    }

  } catch (error) {
    console.error('Failed to handle high severity security event:', error)
  }
}

async function triggerSecurityResponse(event: SecurityEvent, clientIP: string) {
  try {
    const supabase = createSupabaseAdmin()

    // Add IP to temporary block list for certain event types
    const blockableEvents = ['xss_attempt', 'rate_limit_exceeded', 'auth_failure']
    if (blockableEvents.includes(event.type)) {
      await supabase
        .from('security_ip_blocks')
        .insert({
          ip_address: clientIP,
          reason: event.type,
          blocked_until: new Date(Date.now() + 3600000).toISOString(), // 1 hour block
          created_by: 'system',
        })
    }

    // Send immediate alert to security team
    const alertWebhook = process.env.SECURITY_ALERT_WEBHOOK_URL
    if (alertWebhook) {
      await fetch(alertWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 CRITICAL SECURITY ALERT`,
          attachments: [{
            color: 'danger',
            title: `${event.type.toUpperCase()} - Critical Security Event`,
            fields: [
              {
                title: 'Event Type',
                value: event.type,
                short: true,
              },
              {
                title: 'Client IP',
                value: clientIP,
                short: true,
              },
              {
                title: 'Timestamp',
                value: new Date(event.timestamp).toISOString(),
                short: true,
              },
              {
                title: 'Details',
                value: JSON.stringify(event.details, null, 2),
                short: false,
              },
            ],
          }],
        }),
      })
    }

  } catch (error) {
    console.error('Failed to trigger security response:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const eventType = searchParams.get('type')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const supabase = createSupabaseAdmin()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('security_events')
      .select('*')
      .gte('occurred_at', startDate)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch security events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch security events' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Security events GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

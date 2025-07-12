import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

interface ErrorLogData {
  message: string
  stack?: string
  context?: string
  metadata?: Record<string, any>
  timestamp: string
  url: string
  userAgent: string
  userId?: string
  sessionId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'javascript' | 'api' | 'database' | 'auth' | 'payment' | 'performance' | 'security'
}

interface ErrorBatch {
  errors: ErrorLogData[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ErrorBatch = await request.json()
    
    if (!body.errors || !Array.isArray(body.errors)) {
      return NextResponse.json(
        { error: 'Invalid payload: errors array is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()
    
    // Process each error in the batch
    const processedErrors = body.errors.map(error => ({
      message: error.message,
      stack: error.stack,
      context: error.context,
      metadata: error.metadata || {},
      timestamp: error.timestamp,
      url: error.url,
      user_agent: error.userAgent,
      user_id: error.userId,
      session_id: error.sessionId,
      severity: error.severity,
      category: error.category,
      created_at: new Date().toISOString(),
    }))

    // Store errors in database
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert(processedErrors)

    if (insertError) {
      console.error('Failed to store error logs:', insertError)
      return NextResponse.json(
        { error: 'Failed to store error logs' },
        { status: 500 }
      )
    }

    // Update error metrics
    await updateErrorMetrics(supabase, body.errors)

    // Send critical errors to external monitoring (if configured)
    const criticalErrors = body.errors.filter(error => error.severity === 'critical')
    if (criticalErrors.length > 0) {
      await sendCriticalErrorAlerts(criticalErrors)
    }

    return NextResponse.json({ 
      success: true, 
      processed: body.errors.length 
    })

  } catch (error) {
    console.error('Error logging API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateErrorMetrics(supabase: any, errors: ErrorLogData[]) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Group errors by category and severity
    const errorStats = errors.reduce((acc, error) => {
      const key = `${error.category}_${error.severity}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Update daily error metrics
    for (const [key, count] of Object.entries(errorStats)) {
      const [category, severity] = key.split('_')
      
      const { data: existing } = await supabase
        .from('error_metrics_daily')
        .select('*')
        .eq('date', today)
        .eq('category', category)
        .eq('severity', severity)
        .single()

      if (existing) {
        await supabase
          .from('error_metrics_daily')
          .update({
            error_count: existing.error_count + count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('error_metrics_daily')
          .insert({
            date: today,
            category,
            severity,
            error_count: count,
          })
      }
    }
  } catch (error) {
    console.error('Failed to update error metrics:', error)
  }
}

async function sendCriticalErrorAlerts(criticalErrors: ErrorLogData[]) {
  try {
    // Here you would integrate with your alerting system
    // Examples: Slack, Discord, email, PagerDuty, etc.
    
    const alertData = {
      timestamp: new Date().toISOString(),
      errorCount: criticalErrors.length,
      errors: criticalErrors.map(error => ({
        message: error.message,
        context: error.context,
        url: error.url,
        category: error.category,
      })),
    }

    // Example: Send to Slack webhook (if configured)
    const slackWebhook = process.env.SLACK_ERROR_WEBHOOK_URL
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error Alert - ${criticalErrors.length} critical errors detected`,
          attachments: [{
            color: 'danger',
            fields: criticalErrors.slice(0, 5).map(error => ({
              title: error.category.toUpperCase(),
              value: `${error.message}\nURL: ${error.url}`,
              short: false,
            })),
          }],
        }),
      })
    }

    // Example: Send email alert (if configured)
    const emailService = process.env.EMAIL_SERVICE_URL
    if (emailService) {
      await fetch(emailService, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: `Critical Error Alert - Singapore Legal Help`,
          html: generateErrorEmailHtml(alertData),
        }),
      })
    }

  } catch (error) {
    console.error('Failed to send critical error alerts:', error)
  }
}

function generateErrorEmailHtml(alertData: any): string {
  return `
    <h2>Critical Error Alert</h2>
    <p><strong>Time:</strong> ${alertData.timestamp}</p>
    <p><strong>Error Count:</strong> ${alertData.errorCount}</p>
    
    <h3>Error Details:</h3>
    <ul>
      ${alertData.errors.map((error: any) => `
        <li>
          <strong>${error.category.toUpperCase()}:</strong> ${error.message}<br>
          <small>Context: ${error.context || 'N/A'}</small><br>
          <small>URL: ${error.url}</small>
        </li>
      `).join('')}
    </ul>
    
    <p>Please investigate these critical errors immediately.</p>
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const supabase = createSupabaseAdmin()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch error logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error logs GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

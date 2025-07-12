import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  details?: string
  timestamp: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: HealthCheck[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthCheck[] = []
  
  try {
    // Database health check
    const dbStart = Date.now()
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      checks.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - dbStart,
        details: error ? error.message : 'Connection successful',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Authentication service check
    const authStart = Date.now()
    try {
      const { data, error } = await supabase.auth.getSession()
      checks.push({
        service: 'authentication',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - authStart,
        details: error ? error.message : 'Service available',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      checks.push({
        service: 'authentication',
        status: 'unhealthy',
        responseTime: Date.now() - authStart,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // Storage service check
    const storageStart = Date.now()
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list('', { limit: 1 })
      
      checks.push({
        service: 'storage',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - storageStart,
        details: error ? error.message : 'Service available',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      checks.push({
        service: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - storageStart,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }

    // External API checks
    const apiChecks = [
      {
        name: 'stripe',
        url: 'https://api.stripe.com/v1/charges',
        headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      },
      {
        name: 'aixplain',
        url: 'https://api.aixplain.com/v1/health',
        headers: { 'Authorization': `Bearer ${process.env.AIXPLAIN_API_KEY}` }
      }
    ]

    for (const api of apiChecks) {
      const apiStart = Date.now()
      try {
        const response = await fetch(api.url, {
          method: 'GET',
          headers: api.headers,
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        checks.push({
          service: api.name,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - apiStart,
          details: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        checks.push({
          service: api.name,
          status: 'unhealthy',
          responseTime: Date.now() - apiStart,
          details: error instanceof Error ? error.message : 'Connection failed',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy'
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded'
    }

    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      summary
    }

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthResponse, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: [{
        service: 'health-check',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      }],
      summary: {
        total: 1,
        healthy: 0,
        unhealthy: 1,
        degraded: 0
      }
    }

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

interface PerformancePayload {
  type: 'longtask' | 'layout-shift' | 'custom' | 'slow-resources'
  name?: string
  value?: number
  duration?: number
  startTime?: number
  sources?: Array<{
    node?: string
    currentRect?: DOMRect
    previousRect?: DOMRect
  }>
  resources?: Array<{
    name: string
    duration: number
    size: number
    type: string
  }>
  metadata?: Record<string, any>
  url: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const payload: PerformancePayload = await request.json()
    
    // Validate required fields
    if (!payload.type || !payload.url) {
      return NextResponse.json(
        { error: 'Invalid payload: type and url are required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()
    
    // Get user ID from session if available
    let userId: string | null = null
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      }
    } catch (error) {
      console.warn('Failed to get user from token:', error)
    }

    // Store performance data based on type
    switch (payload.type) {
      case 'longtask':
        await storeLongTask(supabase, payload, userId)
        break
      case 'layout-shift':
        await storeLayoutShift(supabase, payload, userId)
        break
      case 'custom':
        await storeCustomMetric(supabase, payload, userId)
        break
      case 'slow-resources':
        await storeSlowResources(supabase, payload, userId)
        break
      default:
        return NextResponse.json(
          { error: 'Unknown performance metric type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storeLongTask(supabase: any, payload: PerformancePayload, userId: string | null) {
  const { error } = await supabase
    .from('performance_longtasks')
    .insert({
      duration: payload.duration,
      start_time: payload.startTime,
      page_url: payload.url,
      user_id: userId,
      recorded_at: new Date(payload.timestamp).toISOString(),
    })

  if (error) {
    console.error('Failed to store long task:', error)
  }
}

async function storeLayoutShift(supabase: any, payload: PerformancePayload, userId: string | null) {
  const { error } = await supabase
    .from('performance_layout_shifts')
    .insert({
      shift_value: payload.value,
      sources: payload.sources || [],
      page_url: payload.url,
      user_id: userId,
      recorded_at: new Date(payload.timestamp).toISOString(),
    })

  if (error) {
    console.error('Failed to store layout shift:', error)
  }
}

async function storeCustomMetric(supabase: any, payload: PerformancePayload, userId: string | null) {
  const { error } = await supabase
    .from('performance_custom_metrics')
    .insert({
      metric_name: payload.name,
      metric_value: payload.value,
      metadata: payload.metadata || {},
      page_url: payload.url,
      user_id: userId,
      recorded_at: new Date(payload.timestamp).toISOString(),
    })

  if (error) {
    console.error('Failed to store custom metric:', error)
  }
}

async function storeSlowResources(supabase: any, payload: PerformancePayload, userId: string | null) {
  if (!payload.resources || payload.resources.length === 0) return

  const records = payload.resources.map(resource => ({
    resource_name: resource.name,
    duration: resource.duration,
    size_bytes: resource.size,
    resource_type: resource.type,
    page_url: payload.url,
    user_id: userId,
    recorded_at: new Date(payload.timestamp).toISOString(),
  }))

  const { error } = await supabase
    .from('performance_slow_resources')
    .insert(records)

  if (error) {
    console.error('Failed to store slow resources:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const supabase = createSupabaseAdmin()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let data: any = []

    switch (type) {
      case 'longtasks':
        const { data: longTasks } = await supabase
          .from('performance_longtasks')
          .select('*')
          .gte('recorded_at', startDate)
          .order('recorded_at', { ascending: false })
          .limit(limit)
        data = longTasks || []
        break

      case 'layout-shifts':
        const { data: layoutShifts } = await supabase
          .from('performance_layout_shifts')
          .select('*')
          .gte('recorded_at', startDate)
          .order('recorded_at', { ascending: false })
          .limit(limit)
        data = layoutShifts || []
        break

      case 'custom':
        const { data: customMetrics } = await supabase
          .from('performance_custom_metrics')
          .select('*')
          .gte('recorded_at', startDate)
          .order('recorded_at', { ascending: false })
          .limit(limit)
        data = customMetrics || []
        break

      case 'slow-resources':
        const { data: slowResources } = await supabase
          .from('performance_slow_resources')
          .select('*')
          .gte('recorded_at', startDate)
          .order('duration', { ascending: false })
          .limit(limit)
        data = slowResources || []
        break

      case 'summary':
        // Return aggregated performance summary
        const [longTasksCount, layoutShiftsCount, slowResourcesCount] = await Promise.all([
          supabase.from('performance_longtasks').select('id', { count: 'exact' }).gte('recorded_at', startDate),
          supabase.from('performance_layout_shifts').select('id', { count: 'exact' }).gte('recorded_at', startDate),
          supabase.from('performance_slow_resources').select('id', { count: 'exact' }).gte('recorded_at', startDate),
        ])

        data = {
          longTasks: longTasksCount.count || 0,
          layoutShifts: layoutShiftsCount.count || 0,
          slowResources: slowResourcesCount.count || 0,
          period: `${days} days`,
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Performance GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

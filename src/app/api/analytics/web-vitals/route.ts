import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

interface WebVitalsPayload {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
  url: string
  userAgent: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebVitalsPayload = await request.json()
    
    // Validate required fields
    if (!payload.name || typeof payload.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid payload: name and value are required' },
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
      // Continue without user ID if auth fails
      console.warn('Failed to get user from token:', error)
    }

    // Store Web Vitals data
    const { error: insertError } = await supabase
      .from('web_vitals_metrics')
      .insert({
        metric_name: payload.name,
        metric_value: payload.value,
        rating: payload.rating,
        delta: payload.delta,
        metric_id: payload.id,
        navigation_type: payload.navigationType,
        page_url: payload.url,
        user_agent: payload.userAgent,
        user_id: userId,
        recorded_at: new Date(payload.timestamp).toISOString(),
      })

    if (insertError) {
      console.error('Failed to store Web Vitals data:', insertError)
      return NextResponse.json(
        { error: 'Failed to store metrics' },
        { status: 500 }
      )
    }

    // Update aggregated metrics
    await updateAggregatedMetrics(supabase, payload)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Web Vitals API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateAggregatedMetrics(supabase: any, payload: WebVitalsPayload) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get or create daily aggregate
    const { data: existing } = await supabase
      .from('web_vitals_daily_aggregates')
      .select('*')
      .eq('date', today)
      .eq('metric_name', payload.name)
      .single()

    if (existing) {
      // Update existing aggregate
      const newCount = existing.sample_count + 1
      const newAverage = (existing.average_value * existing.sample_count + payload.value) / newCount
      
      await supabase
        .from('web_vitals_daily_aggregates')
        .update({
          average_value: newAverage,
          min_value: Math.min(existing.min_value, payload.value),
          max_value: Math.max(existing.max_value, payload.value),
          sample_count: newCount,
          good_count: existing.good_count + (payload.rating === 'good' ? 1 : 0),
          needs_improvement_count: existing.needs_improvement_count + (payload.rating === 'needs-improvement' ? 1 : 0),
          poor_count: existing.poor_count + (payload.rating === 'poor' ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new aggregate
      await supabase
        .from('web_vitals_daily_aggregates')
        .insert({
          date: today,
          metric_name: payload.name,
          average_value: payload.value,
          min_value: payload.value,
          max_value: payload.value,
          sample_count: 1,
          good_count: payload.rating === 'good' ? 1 : 0,
          needs_improvement_count: payload.rating === 'needs-improvement' ? 1 : 0,
          poor_count: payload.rating === 'poor' ? 1 : 0,
        })
    }
  } catch (error) {
    console.error('Failed to update aggregated metrics:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const metric = searchParams.get('metric')
    
    const supabase = createSupabaseAdmin()
    
    let query = supabase
      .from('web_vitals_daily_aggregates')
      .select('*')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (metric) {
      query = query.eq('metric_name', metric)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch Web Vitals aggregates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Web Vitals GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UnifiedAnalyticsService } from '@/lib/unified-analytics'

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
    const timeRange = (url.searchParams.get('timeRange') as '24h' | '7d' | '30d') || '7d'
    const format = (url.searchParams.get('format') as 'json' | 'csv') || 'json'
    const export_data = url.searchParams.get('export') === 'true'

    console.log(`Admin ${user.id} requesting unified analytics for ${timeRange}`)

    // Get unified analytics
    const analyticsService = new UnifiedAnalyticsService()
    
    if (export_data) {
      // Export data
      const exportData = await analyticsService.exportAnalyticsReport(timeRange, format)
      
      const headers = new Headers()
      if (format === 'csv') {
        headers.set('Content-Type', 'text/csv')
        headers.set('Content-Disposition', `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`)
      } else {
        headers.set('Content-Type', 'application/json')
        headers.set('Content-Disposition', `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json"`)
      }
      
      return new Response(exportData, { headers })
    } else {
      // Return analytics data
      const analytics = await analyticsService.getUnifiedAnalytics(timeRange)
      
      return NextResponse.json({
        success: true,
        data: analytics,
        metadata: {
          timeRange,
          generatedAt: new Date().toISOString(),
          generatedBy: user.id
        }
      })
    }

  } catch (error) {
    console.error('Error in unified analytics API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch unified analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for analytics configuration
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
    const { action, config } = body

    if (action === 'update_analytics_config') {
      // Update analytics configuration
      const { error: updateError } = await supabase
        .from('system_config')
        .upsert({
          key: 'analytics_config',
          value: config,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update analytics configuration' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Analytics configuration updated successfully'
      })
    }

    if (action === 'trigger_analytics_refresh') {
      // Trigger analytics data refresh
      // This could trigger background jobs to recalculate metrics
      
      return NextResponse.json({
        success: true,
        message: 'Analytics refresh triggered'
      })
    }

    if (action === 'cleanup_analytics_data') {
      // Cleanup old analytics data
      try {
        await supabase.rpc('cleanup_old_search_analytics')
        
        return NextResponse.json({
          success: true,
          message: 'Analytics data cleanup completed'
        })
      } catch (cleanupError) {
        return NextResponse.json(
          { error: 'Failed to cleanup analytics data' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in unified analytics POST API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process analytics action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

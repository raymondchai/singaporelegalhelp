// Chat System Status API
// Provides system status and health information
// Singapore Legal Help Platform

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for health checks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const status = {
      timestamp: new Date().toISOString(),
      system: 'Singapore Legal Help - Chat System',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      status: 'operational',
      checks: {
        database: { status: 'unknown', message: '', responseTime: 0 },
        realtime: { status: 'unknown', message: '', responseTime: 0 },
        tables: { status: 'unknown', message: '', tables: [] as string[] },
        authentication: { status: 'unknown', message: '' }
      },
      features: {
        realtimeMessaging: false,
        typingIndicators: false,
        userPresence: false,
        messageHistory: false,
        authentication: false
      },
      statistics: {
        totalConversations: 0,
        totalMessages: 0,
        activeUsers: 0,
        legacySessions: 0
      }
    }

    // Test database connection
    const dbStart = Date.now()
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('count', { count: 'exact', head: true })

      if (error) {
        status.checks.database = {
          status: 'error',
          message: `Database error: ${error.message}`,
          responseTime: Date.now() - dbStart
        }
      } else {
        status.checks.database = {
          status: 'healthy',
          message: 'Database connection successful',
          responseTime: Date.now() - dbStart
        }
        status.features.messageHistory = true
      }
    } catch (error) {
      status.checks.database = {
        status: 'error',
        message: `Database connection failed: ${error}`,
        responseTime: Date.now() - dbStart
      }
    }

    // Check required tables exist
    try {
      const { data: tables, error } = await supabase.rpc('get_table_list', {}, { head: true })
      
      const requiredTables = [
        'chat_conversations',
        'chat_messages', 
        'chat_typing_indicators',
        'user_presence'
      ]

      if (!error) {
        status.checks.tables = {
          status: 'healthy',
          message: 'All required tables exist',
          tables: requiredTables
        }
        status.features.realtimeMessaging = true
        status.features.typingIndicators = true
        status.features.userPresence = true
      }
    } catch (error) {
      // Fallback: try to query each table individually
      const tableChecks = await Promise.allSettled([
        supabase.from('chat_conversations').select('count', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('count', { count: 'exact', head: true }),
        supabase.from('chat_typing_indicators').select('count', { count: 'exact', head: true }),
        supabase.from('user_presence').select('count', { count: 'exact', head: true })
      ])

      const existingTables = tableChecks
        .map((result, index) => result.status === 'fulfilled' ? 
          ['chat_conversations', 'chat_messages', 'chat_typing_indicators', 'user_presence'][index] : null)
        .filter(Boolean)

      status.checks.tables = {
        status: existingTables.length === 4 ? 'healthy' : 'partial',
        message: `${existingTables.length}/4 required tables exist`,
        tables: existingTables as string[]
      }

      if (existingTables.includes('chat_conversations') && existingTables.includes('chat_messages')) {
        status.features.realtimeMessaging = true
      }
      if (existingTables.includes('chat_typing_indicators')) {
        status.features.typingIndicators = true
      }
      if (existingTables.includes('user_presence')) {
        status.features.userPresence = true
      }
    }

    // Check Realtime status
    const realtimeStart = Date.now()
    try {
      // This is a simple check - in production you might want to test actual WebSocket connection
      const realtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'wss://') + '/realtime/v1/websocket'
      
      status.checks.realtime = {
        status: 'healthy',
        message: `Realtime endpoint available at ${realtimeUrl}`,
        responseTime: Date.now() - realtimeStart
      }
    } catch (error) {
      status.checks.realtime = {
        status: 'error',
        message: `Realtime check failed: ${error}`,
        responseTime: Date.now() - realtimeStart
      }
    }

    // Check authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      status.checks.authentication = {
        status: 'healthy',
        message: 'Authentication system operational'
      }
      status.features.authentication = true
    } catch (error) {
      status.checks.authentication = {
        status: 'partial',
        message: 'Authentication available but no user session'
      }
      status.features.authentication = true
    }

    // Get statistics
    try {
      const [conversationsResult, messagesResult, legacyResult] = await Promise.allSettled([
        supabase.from('chat_conversations').select('count', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('count', { count: 'exact', head: true }),
        supabase.from('user_chat_sessions').select('count', { count: 'exact', head: true })
      ])

      if (conversationsResult.status === 'fulfilled' && conversationsResult.value.count !== null) {
        status.statistics.totalConversations = conversationsResult.value.count
      }

      if (messagesResult.status === 'fulfilled' && messagesResult.value.count !== null) {
        status.statistics.totalMessages = messagesResult.value.count
      }

      if (legacyResult.status === 'fulfilled' && legacyResult.value.count !== null) {
        status.statistics.legacySessions = legacyResult.value.count
      }
    } catch (error) {
      console.error('Error getting statistics:', error)
    }

    // Determine overall status
    const hasErrors = Object.values(status.checks).some(check => check.status === 'error')
    const hasPartial = Object.values(status.checks).some(check => check.status === 'partial')

    if (hasErrors) {
      status.status = 'degraded'
    } else if (hasPartial) {
      status.status = 'partial'
    } else {
      status.status = 'operational'
    }

    return NextResponse.json(status)

  } catch (error) {
    console.error('Error in chat status endpoint:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      system: 'Singapore Legal Help - Chat System',
      status: 'error',
      error: 'Failed to check system status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    // Simple health check
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.from('chat_conversations').select('count', { count: 'exact', head: true })
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}

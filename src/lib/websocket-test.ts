// WebSocket Connection Test Utility
// Use this to diagnose Supabase Realtime connection issues
// Singapore Legal Help Platform

import { createClient } from '@supabase/supabase-js'

export interface WebSocketTestResult {
  success: boolean
  error?: string
  details: {
    supabaseUrl: string
    connectionAttempted: boolean
    channelCreated: boolean
    subscriptionStatus?: string
    timeToConnect?: number
    errorDetails?: any
  }
}

export async function testWebSocketConnection(): Promise<WebSocketTestResult> {
  const result: WebSocketTestResult = {
    success: false,
    details: {
      supabaseUrl: '',
      connectionAttempted: false,
      channelCreated: false
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    result.details.supabaseUrl = supabaseUrl

    console.log('🧪 Starting WebSocket connection test...')
    console.log('📍 URL:', supabaseUrl)
    console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials')
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    console.log('✅ Supabase client created')

    // Test basic database connection first
    console.log('🔄 Testing database connection...')
    const { error: dbError } = await supabase
      .from('chat_conversations')
      .select('count', { count: 'exact', head: true })

    if (dbError) {
      throw new Error(`Database connection failed: ${dbError.message}`)
    }

    console.log('✅ Database connection successful')

    // Test WebSocket connection
    console.log('🔄 Testing WebSocket connection...')
    result.details.connectionAttempted = true

    const startTime = Date.now()

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error('❌ WebSocket connection timeout (15 seconds)')
        result.error = 'Connection timeout after 15 seconds'
        result.details.errorDetails = 'Timeout waiting for WebSocket connection'
        resolve(result)
      }, 15000)

      const testChannel = supabase
        .channel('websocket-test-' + Date.now())
        .on('broadcast', { event: 'test' }, (payload) => {
          console.log('📨 Test broadcast received:', payload)
        })
        .subscribe((status) => {
          console.log('🔄 Channel status:', status)
          result.details.subscriptionStatus = status

          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            result.details.timeToConnect = Date.now() - startTime
            console.log(`✅ WebSocket connected successfully in ${result.details.timeToConnect}ms`)
            
            // Test sending a message
            testChannel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Hello from test!' }
            })

            result.success = true
            
            // Clean up
            setTimeout(() => {
              supabase.removeChannel(testChannel)
              console.log('🧹 Test channel cleaned up')
              resolve(result)
            }, 2000)

          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout)
            console.error('❌ WebSocket channel error')
            result.error = 'Channel subscription failed'
            result.details.errorDetails = 'CHANNEL_ERROR status received'
            resolve(result)

          } else if (status === 'CLOSED') {
            clearTimeout(timeout)
            console.log('🔄 WebSocket connection closed')
            result.error = 'Connection closed unexpectedly'
            result.details.errorDetails = 'CLOSED status received'
            resolve(result)
          }
        })

      result.details.channelCreated = true
      console.log('📡 Test channel created, waiting for subscription...')
    })

  } catch (error) {
    console.error('❌ WebSocket test failed:', error)
    result.error = error instanceof Error ? error.message : 'Unknown error'
    result.details.errorDetails = error
    return result
  }
}

// Browser console helper function
export function runWebSocketTest() {
  console.log('🚀 Running WebSocket connection test...')
  
  testWebSocketConnection()
    .then(result => {
      console.log('📊 Test Results:', result)
      
      if (result.success) {
        console.log('🎉 WebSocket connection test PASSED!')
        console.log(`⚡ Connection time: ${result.details.timeToConnect}ms`)
      } else {
        console.log('❌ WebSocket connection test FAILED!')
        console.log('🔍 Error:', result.error)
        console.log('📋 Details:', result.details)
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error)
    })
}

// Enhanced browser console helper with more detailed logging
export function runDetailedWebSocketTest() {
  console.log('🚀 Running DETAILED WebSocket connection test...')
  console.log('🔍 Environment check:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('- Browser WebSocket support:', typeof WebSocket !== 'undefined')
  console.log('- Current URL:', window.location.href)

  testWebSocketConnection()
    .then(result => {
      console.log('📊 DETAILED Test Results:', result)

      if (result.success) {
        console.log('🎉 WebSocket connection test PASSED!')
        console.log(`⚡ Connection time: ${result.details.timeToConnect}ms`)
      } else {
        console.log('❌ WebSocket connection test FAILED!')
        console.log('🔍 Error:', result.error)
        console.log('📋 Details:', result.details)

        // Additional debugging
        console.log('🔧 Debugging suggestions:')
        console.log('1. Check if Supabase project is active')
        console.log('2. Verify Realtime is enabled in Supabase dashboard')
        console.log('3. Check browser network tab for WebSocket connections')
        console.log('4. Verify environment variables are loaded correctly')
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error)
    })
}

// Note: WebSocket test functions are now made available globally
// through the DebugPanel component to avoid SSR issues

export default testWebSocketConnection

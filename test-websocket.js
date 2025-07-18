// Direct WebSocket Test for Singapore Legal Help
// Run this with: node test-websocket.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testWebSocketConnection() {
  console.log('🧪 Starting WebSocket connection test...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('📍 Supabase URL:', supabaseUrl)
  console.log('🔑 Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
    
    console.log('✅ Supabase client created')
    
    // Test basic database connection
    console.log('🔄 Testing database connection...')
    const { data, error: dbError } = await supabase
      .from('chat_conversations')
      .select('count', { count: 'exact', head: true })
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Test WebSocket connection
    console.log('🔄 Testing WebSocket connection...')
    
    const startTime = Date.now()
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error('❌ WebSocket connection timeout (15 seconds)')
        resolve(false)
      }, 15000)
      
      const testChannel = supabase
        .channel('websocket-test-' + Date.now())
        .on('broadcast', { event: 'test' }, (payload) => {
          console.log('📨 Test broadcast received:', payload)
        })
        .subscribe((status) => {
          console.log('🔄 Channel status:', status)
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            const connectionTime = Date.now() - startTime
            console.log(`✅ WebSocket connected successfully in ${connectionTime}ms`)
            
            // Test sending a message
            testChannel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Hello from Node.js test!' }
            })
            
            // Clean up
            setTimeout(() => {
              supabase.removeChannel(testChannel)
              console.log('🧹 Test channel cleaned up')
              resolve(true)
            }, 2000)
            
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout)
            console.error('❌ WebSocket channel error')
            resolve(false)
            
          } else if (status === 'CLOSED') {
            clearTimeout(timeout)
            console.log('🔄 WebSocket connection closed')
            resolve(false)
          }
        })
      
      console.log('📡 Test channel created, waiting for subscription...')
    })
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error)
    return false
  }
}

// Run the test
testWebSocketConnection()
  .then(success => {
    if (success) {
      console.log('🎉 WebSocket test PASSED!')
    } else {
      console.log('❌ WebSocket test FAILED!')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })

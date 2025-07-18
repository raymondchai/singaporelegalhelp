// Real-time Chat System using Supabase Realtime
// Singapore Legal Help Platform

import { createClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Types for chat system
export interface ChatConversation {
  id: string
  user_id: string
  title: string
  practice_area?: string
  status: 'active' | 'archived' | 'closed'
  last_message_at: string
  message_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  user_id?: string
  content: string
  message_type: 'user' | 'ai' | 'system'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  reply_to_id?: string
  metadata: Record<string, any>
  attachments: any[]
  is_edited: boolean
  edited_at?: string
  created_at: string
}

export interface TypingIndicator {
  id: string
  conversation_id: string
  user_id: string
  is_typing: boolean
  last_typed_at: string
  created_at: string
}

export interface UserPresence {
  id: string
  user_id: string
  status: 'online' | 'away' | 'offline'
  last_seen: string
  current_conversation_id?: string
  metadata: Record<string, any>
  updated_at: string
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

// Connection status type
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// Event types for real-time subscriptions
export interface ChatEvents {
  messageReceived: (message: ChatMessage) => void
  messageUpdated: (message: ChatMessage) => void
  messageDeleted: (messageId: string) => void
  typingStarted: (indicator: TypingIndicator) => void
  typingStopped: (userId: string, conversationId: string) => void
  userPresenceChanged: (presence: UserPresence) => void
  conversationUpdated: (conversation: ChatConversation) => void
  connectionStatusChanged: (status: ConnectionStatus) => void
}

class RealtimeChatService {
  private supabase: ReturnType<typeof createClient<Database>>
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventListeners: Map<keyof ChatEvents, Set<Function>> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private currentUserId?: string
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private presenceUpdateInterval?: NodeJS.Timeout

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    console.log('🔧 Initializing Supabase Realtime client...')
    console.log('📍 Supabase URL:', supabaseUrl)
    console.log('🔑 Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')

    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    console.log('✅ Supabase client created')
    console.log('🔗 Expected WebSocket URL:', `wss://${supabaseUrl.replace('https://', '')}/realtime/v1/websocket`)
    this.initializeEventListeners()
  }

  private initializeEventListeners() {
    // Initialize event listener maps
    const eventTypes: (keyof ChatEvents)[] = [
      'messageReceived',
      'messageUpdated', 
      'messageDeleted',
      'typingStarted',
      'typingStopped',
      'userPresenceChanged',
      'conversationUpdated',
      'connectionStatusChanged'
    ]

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, new Set())
    })
  }

  // Initialize real-time connection for a user
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId
    this.setConnectionStatus('connecting')

    try {
      console.log('🔄 Initializing realtime chat for user:', userId)

      // Test basic database connection first
      const { error: testError } = await this.supabase
        .from('user_presence')
        .select('count', { count: 'exact', head: true })

      if (testError) {
        console.error('❌ Database connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }

      console.log('✅ Database connection test passed')

      // Update user presence to online
      console.log('🔄 Updating user presence to online...')
      await this.updateUserPresence('online')
      console.log('✅ User presence updated')

      // Create a test channel to verify Realtime connection
      console.log('🔄 Testing Realtime connection...')

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        console.error('❌ Realtime connection timeout (20 seconds)')
        this.setConnectionStatus('error')
      }, 20000)

      const testChannel = this.supabase
        .channel('test-connection')
        .on('broadcast', { event: 'test' }, (payload) => {
          console.log('✅ Realtime test message received:', payload)
        })
        .subscribe((status, err) => {
          console.log('🔄 Test channel status:', status)
          if (err) {
            console.error('🔄 Test channel error:', err)
          }

          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime connection established successfully')
            clearTimeout(connectionTimeout)
            this.setConnectionStatus('connected')

            // Clean up test channel
            setTimeout(() => {
              this.supabase.removeChannel(testChannel)
              console.log('🧹 Test channel cleaned up')
            }, 1000)
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime connection failed with CHANNEL_ERROR')
            console.error('❌ Error details:', err)
            clearTimeout(connectionTimeout)
            this.setConnectionStatus('error')
          } else if (status === 'CLOSED') {
            console.log('🔄 Realtime connection closed')
            console.log('🔄 Close details:', err)
            clearTimeout(connectionTimeout)
            this.setConnectionStatus('disconnected')
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Realtime connection timed out')
            clearTimeout(connectionTimeout)
            this.setConnectionStatus('error')
          } else {
            console.log('🔄 Unknown status:', status, err)
          }
        })

      // Set up presence update interval
      this.presenceUpdateInterval = setInterval(() => {
        this.updateUserPresence('online')
      }, 30000) // Update every 30 seconds

      // Don't set connected here - wait for channel subscription
      console.log('🔄 Waiting for Realtime connection confirmation...')

    } catch (error) {
      console.error('❌ Failed to initialize realtime chat:', error)
      this.setConnectionStatus('error')
      throw error
    }
  }

  // Subscribe to a conversation's real-time updates
  async subscribeToConversation(conversationId: string): Promise<void> {
    if (this.channels.has(conversationId)) {
      return // Already subscribed
    }

    const channel = this.supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          if (payload.new) {
            this.emit('messageReceived', payload.new as ChatMessage)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          if (payload.new) {
            this.emit('messageUpdated', payload.new as ChatMessage)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          if (payload.old) {
            this.emit('messageDeleted', (payload.old as ChatMessage)?.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: RealtimePostgresChangesPayload<TypingIndicator>) => {
          if (payload.new) {
            const indicator = payload.new as TypingIndicator
            if (indicator.is_typing && indicator.user_id !== this.currentUserId) {
              this.emit('typingStarted', indicator)
            } else if (!indicator.is_typing) {
              this.emit('typingStopped', indicator.user_id, indicator.conversation_id)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload: RealtimePostgresChangesPayload<UserPresence>) => {
          if (payload.new) {
            this.emit('userPresenceChanged', payload.new as UserPresence)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to conversation: ${conversationId}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to conversation: ${conversationId}`)
          this.setConnectionStatus('error')
        }
      })

    this.channels.set(conversationId, channel)
  }

  // Unsubscribe from a conversation
  async unsubscribeFromConversation(conversationId: string): Promise<void> {
    const channel = this.channels.get(conversationId)
    if (channel) {
      await this.supabase.removeChannel(channel)
      this.channels.delete(conversationId)
      console.log(`Unsubscribed from conversation: ${conversationId}`)
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'user' | 'ai' | 'system' = 'user',
    metadata: Record<string, any> = {}
  ): Promise<ChatMessage> {
    if (!this.currentUserId) {
      throw new Error('User not initialized')
    }

    const message: Partial<ChatMessage> = {
      conversation_id: conversationId,
      user_id: this.currentUserId,
      content,
      message_type: messageType,
      status: 'sending',
      metadata,
      attachments: []
    }

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as ChatMessage
  }

  // Update typing indicator
  async updateTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUserId) return

    const key = `${conversationId}-${this.currentUserId}`

    if (isTyping) {
      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Insert or update typing indicator
      await this.supabase
        .from('chat_typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: this.currentUserId,
          is_typing: true,
          last_typed_at: new Date().toISOString()
        })

      // Set timeout to stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        this.updateTypingIndicator(conversationId, false)
      }, 3000)

      this.typingTimeouts.set(key, timeout)
    } else {
      // Remove typing indicator
      await this.supabase
        .from('chat_typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', this.currentUserId)

      // Clear timeout
      const existingTimeout = this.typingTimeouts.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        this.typingTimeouts.delete(key)
      }
    }
  }

  // Update user presence
  async updateUserPresence(
    status: 'online' | 'away' | 'offline',
    conversationId?: string
  ): Promise<void> {
    if (!this.currentUserId) return

    const { error } = await this.supabase.rpc('update_user_presence', {
      p_user_id: this.currentUserId,
      p_status: status,
      p_conversation_id: conversationId || null
    })

    if (error) {
      console.error('Failed to update user presence:', error)
    }
  }

  // Event listener management
  on<K extends keyof ChatEvents>(event: K, listener: ChatEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.add(listener)
    }
  }

  off<K extends keyof ChatEvents>(event: K, listener: ChatEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  private emit<K extends keyof ChatEvents>(event: K, ...args: Parameters<ChatEvents[K]>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          // @ts-ignore - TypeScript has trouble with the spread args
          listener(...args)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.emit('connectionStatusChanged', status)
    }
  }

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    // Clear all timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout))
    this.typingTimeouts.clear()

    // Clear presence update interval
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval)
    }

    // Update presence to offline
    if (this.currentUserId) {
      await this.updateUserPresence('offline')
    }

    // Unsubscribe from all channels
    for (const conversationId of Array.from(this.channels.keys())) {
      await this.unsubscribeFromConversation(conversationId)
    }

    // Clear event listeners
    this.eventListeners.forEach(listeners => listeners.clear())

    this.setConnectionStatus('disconnected')
  }
}

// Export singleton instance
export const realtimeChatService = new RealtimeChatService()

// Export types and service
export default RealtimeChatService

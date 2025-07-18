// React Hook for Real-time Chat Management
// Singapore Legal Help Platform

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { 
  realtimeChatService, 
  ChatConversation, 
  ChatMessage, 
  TypingIndicator,
  UserPresence,
  ConnectionStatus 
} from '@/lib/realtime-chat'

interface UseRealtimeChatOptions {
  conversationId?: string
  autoConnect?: boolean
  messageLimit?: number
}

interface UseRealtimeChatReturn {
  // Connection state
  connectionStatus: ConnectionStatus
  isConnected: boolean
  
  // Conversation state
  currentConversation: ChatConversation | null
  conversations: ChatConversation[]
  
  // Message state
  messages: ChatMessage[]
  isLoadingMessages: boolean
  hasMoreMessages: boolean
  
  // Typing indicators
  typingUsers: TypingIndicator[]
  isTyping: boolean
  
  // User presence
  onlineUsers: UserPresence[]
  
  // Actions
  sendMessage: (content: string, messageType?: 'user' | 'ai' | 'system') => Promise<ChatMessage>
  loadMoreMessages: () => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  createConversation: (title?: string, practiceArea?: string) => Promise<ChatConversation>
  switchConversation: (conversationId: string) => Promise<void>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  markMessagesAsRead: (conversationId: string) => Promise<void>
  
  // Utilities
  refreshConversations: () => Promise<void>
  reconnect: () => Promise<void>
}

export function useRealtimeChat(options: UseRealtimeChatOptions = {}): UseRealtimeChatReturn {
  const { user } = useAuth()
  const { conversationId, autoConnect = true, messageLimit = 50 } = options
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  
  // Conversation state
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  
  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [messageOffset, setMessageOffset] = useState(0)
  
  // Typing state
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  // Presence state
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  
  // Refs for cleanup
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isInitializedRef = useRef(false)

  // Initialize real-time service
  useEffect(() => {
    if (user && autoConnect && !isInitializedRef.current) {
      initializeService()
      isInitializedRef.current = true
    }

    return () => {
      if (isInitializedRef.current) {
        cleanup()
      }
    }
  }, [user, autoConnect])

  // Subscribe to conversation when conversationId changes
  useEffect(() => {
    if (conversationId && isConnected) {
      switchConversation(conversationId)
    }
  }, [conversationId, isConnected])

  const initializeService = async () => {
    if (!user) return

    try {
      // Set up event listeners
      realtimeChatService.on('connectionStatusChanged', handleConnectionStatusChange)
      realtimeChatService.on('messageReceived', handleMessageReceived)
      realtimeChatService.on('messageUpdated', handleMessageUpdated)
      realtimeChatService.on('messageDeleted', handleMessageDeleted)
      realtimeChatService.on('typingStarted', handleTypingStarted)
      realtimeChatService.on('typingStopped', handleTypingStopped)
      realtimeChatService.on('userPresenceChanged', handleUserPresenceChanged)
      realtimeChatService.on('conversationUpdated', handleConversationUpdated)

      // Initialize service
      await realtimeChatService.initialize(user.id)
      
      // Load conversations
      await refreshConversations()
      
    } catch (error) {
      console.error('Failed to initialize realtime chat:', error)
    }
  }

  const cleanup = async () => {
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Cleanup service
    await realtimeChatService.cleanup()
    
    // Reset state
    setConnectionStatus('disconnected')
    setIsConnected(false)
    setMessages([])
    setTypingUsers([])
    setOnlineUsers([])
    setCurrentConversation(null)
    
    isInitializedRef.current = false
  }

  // Event handlers
  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status)
    setIsConnected(status === 'connected')
  }, [])

  const handleMessageReceived = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev
      }
      return [...prev, message].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
  }, [])

  const handleMessageUpdated = useCallback((message: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === message.id ? message : m))
  }, [])

  const handleMessageDeleted = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }, [])

  const handleTypingStarted = useCallback((indicator: TypingIndicator) => {
    setTypingUsers(prev => {
      const filtered = prev.filter(t => t.user_id !== indicator.user_id)
      return [...filtered, indicator]
    })
  }, [])

  const handleTypingStopped = useCallback((userId: string, conversationId: string) => {
    setTypingUsers(prev => prev.filter(t => t.user_id !== userId))
  }, [])

  const handleUserPresenceChanged = useCallback((presence: UserPresence) => {
    setOnlineUsers(prev => {
      const filtered = prev.filter(p => p.user_id !== presence.user_id)
      if (presence.status === 'online') {
        return [...filtered, presence]
      }
      return filtered
    })
  }, [])

  const handleConversationUpdated = useCallback((conversation: ChatConversation) => {
    setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c))
    if (currentConversation?.id === conversation.id) {
      setCurrentConversation(conversation)
    }
  }, [currentConversation])

  // Actions
  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'user' | 'ai' | 'system' = 'user'
  ): Promise<ChatMessage> => {
    if (!currentConversation) {
      throw new Error('No active conversation')
    }

    // Stop typing when sending message
    if (isTyping) {
      stopTyping()
    }

    return await realtimeChatService.sendMessage(
      currentConversation.id,
      content,
      messageType
    )
  }, [currentConversation, isTyping])

  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || isLoadingMessages || !hasMoreMessages) return

    setIsLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: false })
        .range(messageOffset, messageOffset + messageLimit - 1)

      if (error) throw error

      if (data.length < messageLimit) {
        setHasMoreMessages(false)
      }

      const sortedMessages = data.reverse() // Reverse to get chronological order
      setMessages(prev => [...sortedMessages, ...prev])
      setMessageOffset(prev => prev + data.length)

    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentConversation, isLoadingMessages, hasMoreMessages, messageOffset, messageLimit])

  const startTyping = useCallback(() => {
    if (!currentConversation || isTyping) return

    setIsTyping(true)
    realtimeChatService.updateTypingIndicator(currentConversation.id, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [currentConversation, isTyping])

  const stopTyping = useCallback(() => {
    if (!currentConversation || !isTyping) return

    setIsTyping(false)
    realtimeChatService.updateTypingIndicator(currentConversation.id, false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [currentConversation, isTyping])

  const createConversation = useCallback(async (
    title?: string,
    practiceArea?: string
  ): Promise<ChatConversation> => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Get current session for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Use API endpoint instead of direct database access
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: title || 'New Legal Consultation',
          practice_area: practiceArea
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      const conversation = result.data as ChatConversation

      setConversations(prev => [conversation, ...prev])

      return conversation
    } catch (error) {
      console.error('Create conversation error:', error)
      throw error
    }
  }, [user])

  const switchConversation = useCallback(async (newConversationId: string) => {
    try {
      // Unsubscribe from current conversation
      if (currentConversation) {
        await realtimeChatService.unsubscribeFromConversation(currentConversation.id)
      }

      // Load new conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', newConversationId)
        .single()

      if (convError) throw convError

      setCurrentConversation(conversation as ChatConversation)

      // Load messages for new conversation
      setIsLoadingMessages(true)
      setMessages([])
      setMessageOffset(0)
      setHasMoreMessages(true)

      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', newConversationId)
        .order('created_at', { ascending: true })
        .limit(messageLimit)

      if (msgError) throw msgError

      setMessages(messages as ChatMessage[])
      setMessageOffset(messages.length)

      if (messages.length < messageLimit) {
        setHasMoreMessages(false)
      }

      // Subscribe to new conversation
      await realtimeChatService.subscribeToConversation(newConversationId)

      // Update user presence
      await realtimeChatService.updateUserPresence('online', newConversationId)

    } catch (error) {
      console.error('Failed to switch conversation:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [currentConversation, messageLimit])

  const updateConversationTitle = useCallback(async (
    conversationId: string, 
    title: string
  ) => {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (error) throw error

    // Update local state
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, title } : c
    ))

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null)
    }
  }, [currentConversation])

  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error

    // Update local state
    setConversations(prev => prev.filter(c => c.id !== conversationId))

    // If deleting current conversation, clear it
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
      setMessages([])
      await realtimeChatService.unsubscribeFromConversation(conversationId)
    }
  }, [currentConversation])

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    // TODO: Implement read status tracking
    console.log('Mark messages as read:', conversationId)
  }, [])

  const refreshConversations = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: user.id
      })

      if (error) throw error

      setConversations(data || [])
    } catch (error) {
      console.error('Failed to refresh conversations:', error)
    }
  }, [user])

  const reconnect = useCallback(async () => {
    if (user) {
      await cleanup()
      await initializeService()
    }
  }, [user])

  return {
    // Connection state
    connectionStatus,
    isConnected,
    
    // Conversation state
    currentConversation,
    conversations,
    
    // Message state
    messages,
    isLoadingMessages,
    hasMoreMessages,
    
    // Typing indicators
    typingUsers,
    isTyping,
    
    // User presence
    onlineUsers,
    
    // Actions
    sendMessage,
    loadMoreMessages,
    startTyping,
    stopTyping,
    createConversation,
    switchConversation,
    updateConversationTitle,
    deleteConversation,
    markMessagesAsRead,
    
    // Utilities
    refreshConversations,
    reconnect
  }
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Upload,
  Mic,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Info,
  MessageSquare,
  Bot,
  Lightbulb,
  Plus,
  Users,
  Wifi,
  WifiOff,
  MoreVertical,
  Edit3,
  Trash2,
  Clock,
  Circle
} from 'lucide-react'
import AIChatWelcome from '@/components/ai-chat-welcome'
import LegalDisclaimer from '@/components/legal-disclaimer'
import ChatStatusDisplay, { CompactChatStatus } from '@/components/chat-status-display'
import { useRealtimeChat } from '@/hooks/useRealtimeChat'
import { useAuth } from '@/contexts/auth-context'
import { ChatMessage, ChatConversation, ConnectionStatus } from '@/lib/realtime-chat'
import { chatMigrationService } from '@/lib/chat-migration'
import ClientDebugPanel from '@/components/client-debug-panel'

// Connection status indicator component
const ConnectionIndicator = ({ status }: { status: ConnectionStatus }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return { icon: Wifi, color: 'text-green-500', text: 'Connected' }
      case 'connecting':
        return { icon: Loader2, color: 'text-yellow-500', text: 'Connecting...' }
      case 'disconnected':
        return { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' }
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-500', text: 'Connection Error' }
      default:
        return { icon: WifiOff, color: 'text-gray-500', text: 'Unknown' }
    }
  }

  const { icon: Icon, color, text } = getStatusConfig()

  return (
    <div className="flex items-center space-x-2">
      <Icon className={`h-4 w-4 ${color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
      <span className={`text-xs ${color}`}>{text}</span>
    </div>
  )
}

// Typing indicator component
const TypingIndicator = ({ typingUsers }: { typingUsers: any[] }) => {
  if (typingUsers.length === 0) return null

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-sm">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs text-gray-500">AI is thinking...</span>
        </div>
      </div>
    </div>
  )
}

export default function RealtimeChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const conversationId = searchParams?.get('conversation')

  const {
    connectionStatus,
    isConnected,
    currentConversation,
    conversations,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    isTyping,
    onlineUsers,
    sendMessage,
    loadMoreMessages,
    startTyping,
    stopTyping,
    createConversation,
    switchConversation,
    updateConversationTitle,
    deleteConversation,
    refreshConversations
  } = useRealtimeChat({
    conversationId: conversationId || undefined,
    autoConnect: true,
    messageLimit: 50
  })

  const [newMessage, setNewMessage] = useState('')
  const [showConversationList, setShowConversationList] = useState(false)
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(true)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)

  const [migrationStatus, setMigrationStatus] = useState<any>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  useEffect(() => {
    if (newMessage.length > 0 && !isTyping) {
      startTyping()
    } else if (newMessage.length === 0 && isTyping) {
      stopTyping()
    }
  }, [newMessage, isTyping, startTyping, stopTyping])

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return

    try {
      await sendMessage(newMessage.trim())
      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle creating new conversation
  const handleCreateConversation = async () => {
    try {
      console.log('🔄 Creating new conversation...')
      console.log('User authenticated:', !!user)
      console.log('User ID:', user?.id)

      const conversation = await createConversation(
        'New Legal Consultation',
        'General Legal Inquiry'
      )

      console.log('✅ Conversation created:', conversation)
      router.push(`/chat?conversation=${conversation.id}`)
    } catch (error) {
      console.error('❌ Failed to create conversation:', error)

      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to create conversation: ${error.message}`)
      } else {
        alert('Failed to create conversation. Please try again.')
      }
    }
  }

  // Handle conversation title editing
  const handleTitleEdit = async (conversationId: string, newTitle: string) => {
    try {
      await updateConversationTitle(conversationId, newTitle)
      setEditingTitle(null)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(conversationId)
        if (currentConversation?.id === conversationId) {
          router.push('/chat')
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error)
      }
    }
  }

  // Handle both authenticated and anonymous users
  const isAuthenticated = !!user
  const showRealtimeFeatures = isAuthenticated && isConnected

  // Check migration status if authenticated
  useEffect(() => {
    const checkMigrationStatus = async () => {
      if (user) {
        try {
          const status = await chatMigrationService.getMigrationStatus(user.id)
          setMigrationStatus(status)
        } catch (error) {
          console.error('Error getting migration status:', error)
        }
      }
    }

    checkMigrationStatus()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Conversation Sidebar */}
      <div className={`${showConversationList ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button
              onClick={handleCreateConversation}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <ConnectionIndicator status={connectionStatus} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => router.push(`/chat?conversation=${conversation.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingTitle === conversation.id ? (
                    <input
                      type="text"
                      defaultValue={conversation.title}
                      className="w-full text-sm font-medium bg-transparent border-none outline-none"
                      onBlur={(e) => handleTitleEdit(conversation.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTitleEdit(conversation.id, e.currentTarget.value)
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm font-medium truncate">{conversation.title}</h3>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {conversation.practice_area} • {conversation.message_count} messages
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(conversation.last_message_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTitle(conversation.id)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConversation(conversation.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">
                  {currentConversation?.title || 'AI Legal Assistant'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Singapore Legal Help</span>
                  {currentConversation?.practice_area && (
                    <>
                      <span>•</span>
                      <span>{currentConversation.practice_area}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <CompactChatStatus
                connectionStatus={connectionStatus}
                isAuthenticated={isAuthenticated}
              />
              {showRealtimeFeatures && onlineUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
                </div>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Legal Disclaimer */}
          {showLegalDisclaimer && messages.length > 0 && (
            <LegalDisclaimer
              onDismiss={() => setShowLegalDisclaimer(false)}
              variant="banner"
            />
          )}

          {/* Welcome Component - Show when no conversation selected */}
          {!currentConversation && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Legal Assistant
                </h2>
                <p className="text-gray-600 mb-4">
                  {isAuthenticated
                    ? "Start a new conversation to get legal guidance for Singapore law matters."
                    : "Please log in to access the full real-time chat experience."
                  }
                </p>

                {/* Enhanced Status Display */}
                <div className="mb-6">
                  <ChatStatusDisplay
                    connectionStatus={connectionStatus}
                    isAuthenticated={isAuthenticated}
                    onlineUsers={onlineUsers.length}
                    messageCount={messages.length}
                    showDetails={true}
                  />
                </div>

                {/* Migration Status */}
                {migrationStatus && migrationStatus.legacySessionCount > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Legacy Chat Data Found
                    </h4>
                    <p className="text-xs text-blue-700 mb-2">
                      Found {migrationStatus.legacySessionCount} previous chat sessions.
                      {migrationStatus.needsMigration
                        ? " Migration available to enable real-time features."
                        : " Already migrated to new system."
                      }
                    </p>
                    {migrationStatus.needsMigration && (
                      <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Migrate Chat History
                      </button>
                    )}
                  </div>
                )}

                {/* Debug Information (Development Only) */}
                <ClientDebugPanel
                  isAuthenticated={isAuthenticated}
                  connectionStatus={connectionStatus}
                  isConnected={isConnected}
                  user={user}
                  conversationId={conversationId ?? undefined}
                  currentConversation={currentConversation}
                  messagesCount={messages.length}
                  typingUsersCount={typingUsers.length}
                  onlineUsersCount={onlineUsers.length}
                  showRealtimeFeatures={showRealtimeFeatures}
                />

                {isAuthenticated ? (
                  <button
                    onClick={handleCreateConversation}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Start New Conversation</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                    >
                      <span>Login for Real-time Chat</span>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2 mx-auto"
                    >
                      <span>Continue to Dashboard</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {currentConversation && (
            <div className="space-y-4">
              {/* Load More Button */}
              {hasMoreMessages && (
                <div className="text-center">
                  <button
                    onClick={loadMoreMessages}
                    disabled={isLoadingMessages}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-2 mx-auto"
                  >
                    {isLoadingMessages ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>{isLoadingMessages ? 'Loading...' : 'Load older messages'}</span>
                  </button>
                </div>
              )}

              {/* Message List */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                      message.message_type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.message_type === 'ai' && (
                        <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* Message Status */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                          {message.message_type === 'user' && (
                            <div className="flex items-center space-x-1">
                              {message.status === 'sending' && (
                                <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                              )}
                              {message.status === 'sent' && (
                                <CheckCircle className="h-3 w-3 opacity-70" />
                              )}
                              {message.status === 'error' && (
                                <AlertTriangle className="h-3 w-3 text-red-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} />

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        {currentConversation && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask me anything about Singapore law..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isConnected}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Upload document (Coming soon)"
                  disabled
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Voice message (Coming soon)"
                  disabled
                >
                  <Mic className="h-4 w-4" />
                </button>
                <div className="text-xs text-gray-500">
                  Press Enter to send
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>Powered by Real-time AI • Singapore Law</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

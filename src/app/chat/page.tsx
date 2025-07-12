'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  AlertCircle,
  Loader2
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  session_id: string
}

interface ChatSession {
  id: string
  user_id: string
  title: string
  practice_area?: string
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeChat()
  }, [])

  const initializeChat = async () => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newSession: ChatSession = {
        id: sessionId,
        user_id: 'anonymous',
        title: 'New Legal Consultation',
        created_at: new Date().toISOString()
      }

      setSession(newSession)
      
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: "Hello! I'm your AI Legal Assistant for Singapore law. I can help you with questions about family law, employment law, property law, immigration, corporate law, and more. How can I assist you today?",
        role: 'assistant',
        timestamp: new Date(),
        session_id: sessionId
      }

      setMessages([welcomeMessage])
      setLoading(false)
    } catch (error) {
      console.error('Error initializing chat:', error)
      setError('Failed to initialize chat. Please try again.')
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !session) return

    setSending(true)
    setError(null)

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: newMessage.trim(),
      role: 'user',
      timestamp: new Date(),
      session_id: session.id
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    try {
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          content: `Thank you for your question: "${userMessage.content}". This is a simulated response. In a real implementation, this would connect to an AI service like OpenAI or aiXplain to provide legal guidance based on Singapore law. Please note that this is for informational purposes only and does not constitute legal advice.`,
          role: 'assistant',
          timestamp: new Date(),
          session_id: session.id
        }

        setMessages(prev => [...prev, aiResponse])
        setSending(false)
      }, 2000)

    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">AI Legal Assistant</h1>
              <p className="text-sm text-gray-600">Singapore Legal Help</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Bot className="h-3 w-3" />
            <span>Online</span>
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div className={`flex items-start space-x-2 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <Card className={`${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start space-x-2 max-w-3xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">AI is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Singapore law..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This AI assistant provides general information only and does not constitute legal advice.
          </p>
        </div>
      </div>
    </div>
  )
}

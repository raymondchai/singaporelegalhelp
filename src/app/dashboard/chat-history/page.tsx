'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatSession {
  id: string
  title: string
  practice_area: string
  message_count: number
  first_message: string
  last_message: string
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  session_id: string
  message_type: 'user' | 'assistant'
  message: string
  created_at: string
}

export default function ChatHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    thisMonth: 0
  })

  useEffect(() => {
    if (user) {
      fetchChatHistory()
    }
  }, [user])

  const fetchChatHistory = async () => {
    try {
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No valid session for chat history')
        return
      }

      // Use API route instead of direct database query
      const response = await fetch('/api/chat/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Chat history API call failed:', response.status)
        return
      }

      const { sessions: data } = await response.json()
      setSessions(data ?? [])

      // Calculate stats
      const totalMessages = data?.reduce((sum: number, session: any) => sum + (session.message_count ?? 0), 0) ?? 0
      const thisMonthCount = data?.filter((session: any) => {
        const sessionDate = new Date(session.created_at)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return sessionDate > thirtyDaysAgo
      }).length ?? 0

      setStats({
        totalChats: data?.length ?? 0,
        totalMessages,
        thisMonth: thisMonthCount
      })
    } catch (error) {
      console.error('Error fetching chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResumeChat = (sessionId: string) => {
    console.log('Resuming chat session:', sessionId)
    // Navigate to chat interface with session ID
    router.push(`/chat?session=${sessionId}`)
  }

  const handleExportChat = async (session: ChatSession) => {
    try {
      console.log('Exporting chat session:', session.title)

      // Fetch all messages for this session
      const { data: messages, error } = await supabase
        .from('user_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        alert('Unable to export chat. Please try again.')
        return
      }

      // Create text content
      const chatContent = [
        `Chat Session: ${session.title}`,
        `Practice Area: ${session.practice_area}`,
        `Date: ${new Date(session.created_at).toLocaleDateString()}`,
        `Messages: ${session.message_count}`,
        '',
        '--- CONVERSATION ---',
        '',
        ...(messages || []).map((msg: ChatMessage) =>
          `${msg.message_type.toUpperCase()}: ${msg.message}\n`
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([chatContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${session.id.slice(0, 8)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('Chat export completed')
    } catch (error) {
      console.error('Error exporting chat:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleStartNewChat = async () => {
    console.log('Starting new chat')

    try {
      if (!user?.id) {
        console.error('User not authenticated')
        return
      }

      // Create a new chat session
      const { data: newSession, error } = await supabase
        .from('user_chat_sessions')
        .insert({
          user_id: user.id,
          title: `Legal Consultation - ${new Date().toLocaleDateString()}`,
          practice_area: 'General Legal Inquiry',
          message_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating new chat session:', error)
        alert('Unable to start new chat. Please try again.')
        return
      }

      console.log('New chat session created:', newSession.id)
      // Navigate to chat interface with new session ID
      router.push(`/chat?session=${newSession.id}`)
    } catch (error) {
      console.error('Error starting new chat:', error)
      alert('Unable to start new chat. Please try again.')
    }
  }
  if (loading) {
    return (
      <DashboardLayout
        title="Chat History"
        subtitle="Loading your chat history..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading chat history...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Chat History"
      subtitle="View and manage your legal consultation history"
      actions={
        <Button onClick={handleStartNewChat}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Start New Chat
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Chat Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalChats === 0 ? 'No conversations yet' : 'Conversations started'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Messages exchanged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                New conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chat Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>
              Your legal consultation history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-4">Start your first legal consultation to see your chat history here.</p>
                <Button onClick={handleStartNewChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-medium">{session.title}</h3>
                        <p className="text-sm text-gray-500">
                          {session.practice_area} • {session.message_count} messages • {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                        {session.first_message && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
                            "{session.first_message.substring(0, 100)}..."
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeChat(session.id)}
                        title="Resume this conversation"
                      >
                        Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportChat(session)}
                        title="Export conversation as text file"
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

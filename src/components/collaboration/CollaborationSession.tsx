'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// Using simple div for avatar instead of external component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// Using simple checkbox instead of Switch component
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Video, 
  Share2, 
  Settings, 
  Play, 
  Pause, 
  Square,
  Copy,
  UserPlus,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CollaborationSession {
  id: string
  document_id: string
  session_name: string
  session_type: 'view' | 'edit' | 'review' | 'meeting'
  max_participants: number
  is_public: boolean
  access_code: string
  status: 'scheduled' | 'active' | 'paused' | 'ended'
  started_at: string
  ended_at?: string
  settings: {
    allow_anonymous: boolean
    require_approval: boolean
    enable_chat: boolean
    enable_voice: boolean
    auto_save_interval: number
  }
  host_user: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  document: {
    id: string
    title: string
    document_type: string
  }
  participants?: Participant[]
}

interface Participant {
  id: string
  role: 'host' | 'moderator' | 'participant' | 'observer'
  status: 'active' | 'idle' | 'away' | 'offline'
  joined_at: string
  user: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

interface CollaborationSessionProps {
  documentId: string
  currentUserId: string
  onSessionCreated?: (session: CollaborationSession) => void
}

export default function CollaborationSession({ 
  documentId, 
  currentUserId, 
  onSessionCreated 
}: CollaborationSessionProps) {
  const [sessions, setSessions] = useState<CollaborationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSession, setNewSession] = useState({
    session_name: '',
    session_type: 'edit' as 'view' | 'edit' | 'review' | 'meeting',
    max_participants: 10,
    is_public: false,
    settings: {
      allow_anonymous: false,
      require_approval: true,
      enable_chat: true,
      enable_voice: false,
      auto_save_interval: 30
    }
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSessions()
  }, [documentId])

  const loadSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const url = new URL('/api/collaboration/sessions', window.location.origin)
      url.searchParams.set('document_id', documentId)

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load sessions')
      }

      const data = await response.json()
      setSessions(data.sessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load collaboration sessions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!newSession.session_name.trim()) {
      toast({
        title: 'Error',
        description: 'Session name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/collaboration/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          ...newSession,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      setSessions(prev => [data.session, ...prev])
      setShowCreateDialog(false)
      setNewSession({
        session_name: '',
        session_type: 'edit',
        max_participants: 10,
        is_public: false,
        settings: {
          allow_anonymous: false,
          require_approval: true,
          enable_chat: true,
          enable_voice: false,
          auto_save_interval: 30
        }
      })

      if (onSessionCreated) {
        onSessionCreated(data.session)
      }

      toast({
        title: 'Success',
        description: 'Collaboration session created successfully'
      })
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create collaboration session',
        variant: 'destructive'
      })
    }
  }

  const copyAccessCode = (accessCode: string) => {
    navigator.clipboard.writeText(accessCode)
    toast({
      title: 'Copied',
      description: 'Access code copied to clipboard'
    })
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="h-4 w-4" />
      case 'edit': return <Edit className="h-4 w-4" />
      case 'review': return <MessageSquare className="h-4 w-4" />
      case 'meeting': return <Video className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Sessions
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Collaboration Session</DialogTitle>
                <DialogDescription>
                  Start a new collaboration session for this document
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session_name">Session Name</Label>
                  <Input
                    id="session_name"
                    value={newSession.session_name}
                    onChange={(e) => setNewSession(prev => ({ ...prev, session_name: e.target.value }))}
                    placeholder="Enter session name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="session_type">Session Type</Label>
                  <Select 
                    value={newSession.session_type} 
                    onValueChange={(value: any) => setNewSession(prev => ({ ...prev, session_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="edit">Collaborative Edit</SelectItem>
                      <SelectItem value="review">Review Session</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="2"
                    max="50"
                    value={newSession.max_participants}
                    onChange={(e) => setNewSession(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newSession.is_public}
                    onChange={(e) => setNewSession(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_public">Public Session</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_chat"
                    checked={newSession.settings.enable_chat}
                    onChange={(e) => setNewSession(prev => ({
                      ...prev,
                      settings: { ...prev.settings, enable_chat: e.target.checked }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enable_chat">Enable Chat</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateSession} className="flex-1">
                    Create Session
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getSessionTypeIcon(session.session_type)}
                  <div>
                    <h3 className="font-medium">{session.session_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Host: {session.host_user.full_name}</span>
                      <span>•</span>
                      <span>{new Date(session.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{session.participants?.length || 0}/{session.max_participants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  <span className="font-mono text-xs">{session.access_code}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyAccessCode(session.access_code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {session.participants && session.participants.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Participants:</span>
                  <div className="flex -space-x-2">
                    {session.participants.slice(0, 5).map((participant) => (
                      <div
                        key={participant.id}
                        className="h-6 w-6 border-2 border-white rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <span className="text-xs text-white font-medium">
                          {participant.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {session.participants.length > 5 && (
                      <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{session.participants.length - 5}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {session.status === 'active' && (
                  <>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Join Session
                    </Button>
                    {session.host_user.id === currentUserId && (
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                  </>
                )}
                {session.status === 'paused' && session.host_user.id === currentUserId && (
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                {session.host_user.id === currentUserId && (
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No collaboration sessions yet.</p>
            <p className="text-sm">Create a session to start collaborating!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

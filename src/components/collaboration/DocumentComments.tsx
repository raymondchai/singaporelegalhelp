'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// Using simple div for avatar instead of external component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  MessageCircle, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Reply,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
// Using simple buttons instead of dropdown menu

interface Comment {
  id: string
  content: string
  comment_type: 'general' | 'suggestion' | 'question' | 'approval' | 'rejection'
  status: 'open' | 'resolved' | 'dismissed'
  page_number?: number
  highlighted_text?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  resolved_by_user?: {
    id: string
    full_name: string
    email: string
  }
  replies?: Comment[]
}

interface DocumentCommentsProps {
  documentId: string
  currentUserId: string
  onCommentAdded?: (comment: Comment) => void
}

export default function DocumentComments({ 
  documentId, 
  currentUserId, 
  onCommentAdded 
}: DocumentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'general' | 'suggestion' | 'question' | 'approval' | 'rejection'>('general')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const { toast } = useToast()

  useEffect(() => {
    loadComments()
  }, [documentId, filter])

  const loadComments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const url = new URL(`/api/documents/${documentId}/comments`, window.location.origin)
      if (filter !== 'all') {
        url.searchParams.set('status', filter)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load comments')
      }

      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: newComment,
          comment_type: commentType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const data = await response.json()
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
      setCommentType('general')
      
      if (onCommentAdded) {
        onCommentAdded(data.comment)
      }

      toast({
        title: 'Success',
        description: 'Comment added successfully'
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      })
    }
  }

  const handleResolveComment = async (commentId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/${documentId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const data = await response.json()
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? data.comment : comment
        )
      )

      toast({
        title: 'Success',
        description: `Comment ${status} successfully`
      })
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive'
      })
    }
  }

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'suggestion': return 'bg-blue-100 text-blue-800'
      case 'question': return 'bg-yellow-100 text-yellow-800'
      case 'approval': return 'bg-green-100 text-green-800'
      case 'rejection': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'dismissed': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
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
            <MessageCircle className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Comment */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="rejection">Rejection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              rows={3}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {comment.user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.user.full_name}</span>
                      <Badge className={getCommentTypeColor(comment.comment_type)}>
                        {comment.comment_type}
                      </Badge>
                      {getStatusIcon(comment.status)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {comment.status === 'open' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveComment(comment.id, 'resolved')}
                        title="Resolve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveComment(comment.id, 'dismissed')}
                        title="Dismiss"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    title="Reply"
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="ml-11">
                <p className="text-sm text-gray-700">{comment.content}</p>
                
                {comment.highlighted_text && (
                  <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-xs text-gray-600">Referenced text:</p>
                    <p className="text-sm italic">"{comment.highlighted_text}"</p>
                  </div>
                )}

                {comment.status !== 'open' && comment.resolved_by_user && (
                  <div className="mt-2 text-xs text-gray-500">
                    {comment.status === 'resolved' ? 'Resolved' : 'Dismissed'} by {comment.resolved_by_user.full_name}
                  </div>
                )}
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-2 border-l-2 border-gray-200 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {reply.user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{reply.user.full_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-11 flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="sm"
                      onClick={() => {
                        // Handle reply submission
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                      disabled={!replyContent.trim()}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to add one!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

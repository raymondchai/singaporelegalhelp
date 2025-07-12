'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  User,
  FileText,
  Edit,
  Trash2,
  Bell,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { CalendarEvent } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

interface EventDetailsModalProps {
  event: CalendarEvent
  onClose: () => void
  onEdit: (eventId: string) => void
  onDelete: (eventId: string) => void
}

export default function EventDetailsModal({ 
  event, 
  onClose, 
  onEdit, 
  onDelete 
}: EventDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getStatusIcon = (type: string, status?: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    
    switch (type) {
      case 'deadline':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'task':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'milestone':
        return <Calendar className="h-5 w-5 text-purple-500" />
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'deadline': return 'Legal Deadline'
      case 'task': return 'Legal Task'
      case 'milestone': return 'Legal Milestone'
      case 'court_date': return 'Court Date'
      case 'meeting': return 'Meeting'
      default: return 'Event'
    }
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDateTime = (dateString: string, allDay: boolean): string => {
    const date = new Date(dateString)
    
    if (allDay) {
      return date.toLocaleDateString('en-SG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    return date.toLocaleDateString('en-SG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/dashboard/calendar/event/${event.id}`
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link copied",
        description: "Event link has been copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      setLoading(true)
      await onDelete(event.id)
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted"
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (): boolean => {
    const eventDate = new Date(event.startDate)
    const now = new Date()
    return eventDate < now && event.type === 'deadline'
  }

  const getDaysUntil = (): number => {
    const eventDate = new Date(event.startDate)
    const now = new Date()
    const diffTime = eventDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(event.type)}
              <div>
                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {getTypeLabel(event.type)}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(event.priority)}>
                {event.priority.toUpperCase()}
              </Badge>
              
              {isOverdue() && (
                <Badge variant="destructive">
                  OVERDUE
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Description */}
          {event.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="space-y-3">
              <h4 className="font-medium">Date & Time</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDateTime(event.startDate, event.allDay)}</span>
                </div>
                
                {!event.allDay && event.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      Ends: {new Date(event.endDate).toLocaleTimeString('en-SG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                
                {event.type === 'deadline' && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className={getDaysUntil() < 0 ? 'text-red-600' : 'text-orange-600'}>
                      {getDaysUntil() < 0 
                        ? `${Math.abs(getDaysUntil())} days overdue`
                        : getDaysUntil() === 0 
                          ? 'Due today'
                          : `${getDaysUntil()} days remaining`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Practice Area & Category */}
            <div className="space-y-3">
              <h4 className="font-medium">Category</h4>
              <div className="space-y-2">
                {event.practiceArea && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.practiceArea}</Badge>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Type: {getTypeLabel(event.type)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle share functionality
                  toast({
                    title: "Share",
                    description: "Share functionality coming soon"
                  })
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle reminder functionality
                  toast({
                    title: "Reminder",
                    description: "Reminder functionality coming soon"
                  })
                }}
              >
                <Bell className="h-4 w-4 mr-1" />
                Set Reminder
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(event.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Related Information */}
          {event.relatedId && (
            <div>
              <h4 className="font-medium mb-2">Related Information</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to related item
                  const baseUrl = event.type === 'deadline' ? '/dashboard/deadlines' 
                    : event.type === 'task' ? '/dashboard/tasks'
                    : '/dashboard/milestones'
                  window.open(`${baseUrl}/${event.relatedId}`, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View {getTypeLabel(event.type)}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Bell,
  MapPin,
  FileText,
  Users
} from 'lucide-react'
import { LegalDeadline } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

interface DeadlineManagerProps {
  userId: string
}

export default function DeadlineManager({ userId }: DeadlineManagerProps) {
  const [deadlines, setDeadlines] = useState<LegalDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<LegalDeadline | null>(null)
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    practiceArea: '',
    status: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchDeadlines()
  }, [userId])

  const fetchDeadlines = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/deadlines', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDeadlines(data.deadlines || [])
      } else {
        throw new Error('Failed to fetch deadlines')
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error)
      toast({
        title: "Error",
        description: "Failed to load deadlines",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredDeadlines = deadlines.filter(deadline => {
    // Search filter
    if (searchQuery && !deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !deadline.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Tab filter
    switch (selectedTab) {
      case 'upcoming':
        return deadline.status === 'upcoming'
      case 'due_today':
        return deadline.status === 'due_today'
      case 'overdue':
        return deadline.status === 'overdue'
      case 'completed':
        return deadline.status === 'completed'
      default:
        return true
    }
  }).filter(deadline => {
    // Additional filters
    if (filters.priority && deadline.priority !== filters.priority) return false
    if (filters.category && deadline.category !== filters.category) return false
    if (filters.practiceArea && deadline.practiceArea !== filters.practiceArea) return false
    if (filters.status && deadline.status !== filters.status) return false
    return true
  })

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'due_today': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getDaysUntil = (deadlineDate: string): number => {
    const deadline = new Date(deadlineDate)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDeadlineDate = (date: string, time?: string): string => {
    const deadline = new Date(date)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    
    let formatted = deadline.toLocaleDateString('en-SG', options)
    
    if (time) {
      formatted += ` at ${time}`
    }
    
    return formatted
  }

  const getTabCounts = () => {
    return {
      all: deadlines.length,
      upcoming: deadlines.filter(d => d.status === 'upcoming').length,
      due_today: deadlines.filter(d => d.status === 'due_today').length,
      overdue: deadlines.filter(d => d.status === 'overdue').length,
      completed: deadlines.filter(d => d.status === 'completed').length
    }
  }

  const tabCounts = getTabCounts()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Legal Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Legal Deadlines
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Deadline
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deadlines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="court_filing">Court Filing</SelectItem>
                <SelectItem value="client_meeting">Client Meeting</SelectItem>
                <SelectItem value="document_submission">Document Submission</SelectItem>
                <SelectItem value="hearing">Hearing</SelectItem>
                <SelectItem value="appeal">Appeal</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Deadline Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  Upcoming
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.upcoming}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="due_today" className="flex items-center gap-2">
                  Due Today
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.due_today}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="overdue" className="flex items-center gap-2">
                  Overdue
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.overdue}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  Completed
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.completed}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedTab} className="p-6">
              {filteredDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No deadlines found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeadlines.map(deadline => (
                    <DeadlineCard
                      key={deadline.id}
                      deadline={deadline}
                      onEdit={setEditingDeadline}
                      onDelete={(id) => {
                        // Handle delete
                        console.log('Delete deadline:', id)
                      }}
                      onComplete={(id) => {
                        // Handle complete
                        console.log('Complete deadline:', id)
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Deadline Card Component
interface DeadlineCardProps {
  deadline: LegalDeadline
  onEdit: (deadline: LegalDeadline) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}

function DeadlineCard({ deadline, onEdit, onDelete, onComplete }: DeadlineCardProps) {
  const getDaysUntil = (deadlineDate: string): number => {
    const deadlineDateTime = new Date(deadlineDate)
    const now = new Date()
    const diffTime = deadlineDateTime.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'due_today': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const daysUntil = getDaysUntil(deadline.deadlineDate)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(deadline.priority)}`}></div>
              <h3 className="font-semibold">{deadline.title}</h3>
              <Badge className={getStatusColor(deadline.status)}>
                {deadline.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {deadline.category.replace('_', ' ')}
              </Badge>
            </div>

            {deadline.description && (
              <p className="text-sm text-gray-600 mb-3">
                {deadline.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(deadline.deadlineDate).toLocaleDateString('en-SG', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {deadline.deadlineTime && ` at ${deadline.deadlineTime}`}
                </span>
              </div>

              {deadline.status !== 'completed' && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className={daysUntil < 0 ? 'text-red-600' : daysUntil === 0 ? 'text-yellow-600' : ''}>
                    {daysUntil < 0 
                      ? `${Math.abs(daysUntil)} days overdue`
                      : daysUntil === 0 
                        ? 'Due today'
                        : `${daysUntil} days remaining`
                    }
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{deadline.practiceArea}</span>
              </div>

              {deadline.courtType && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{deadline.courtType.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {deadline.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(deadline.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(deadline)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(deadline.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

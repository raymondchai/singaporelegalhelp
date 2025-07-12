'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Clock, 
  CheckCircle, 
  Circle,
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  Play,
  Pause,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Target
} from 'lucide-react'
import { LegalTask } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'

interface TaskManagerProps {
  userId: string
}

export default function TaskManager({ userId }: TaskManagerProps) {
  const [tasks, setTasks] = useState<LegalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<LegalTask | null>(null)
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    practiceArea: '',
    status: '',
    assignedTo: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        throw new Error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Tab filter
    switch (selectedTab) {
      case 'not_started':
        return task.status === 'not_started'
      case 'in_progress':
        return task.status === 'in_progress'
      case 'review':
        return task.status === 'review'
      case 'completed':
        return task.status === 'completed'
      case 'blocked':
        return task.status === 'blocked'
      default:
        return true
    }
  }).filter(task => {
    // Additional filters
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.category && task.category !== filters.category) return false
    if (filters.practiceArea && task.practiceArea !== filters.practiceArea) return false
    if (filters.status && task.status !== filters.status) return false
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false
    return true
  })

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-orange-100 text-orange-800'
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

  const getTabCounts = () => {
    return {
      all: tasks.length,
      not_started: tasks.filter(t => t.status === 'not_started').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length
    }
  }

  const tabCounts = getTabCounts()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Legal Tasks
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
              <Clock className="h-5 w-5" />
              Legal Tasks
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
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
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="drafting">Drafting</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="filing">Filing</SelectItem>
                <SelectItem value="client_communication">Client Communication</SelectItem>
                <SelectItem value="court_appearance">Court Appearance</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Task Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="not_started" className="flex items-center gap-2">
                  Not Started
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.not_started}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="flex items-center gap-2">
                  In Progress
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.in_progress}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-2">
                  Review
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.review}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  Completed
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.completed}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="blocked" className="flex items-center gap-2">
                  Blocked
                  <Badge variant="secondary" className="text-xs">
                    {tabCounts.blocked}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedTab} className="p-6">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onDelete={(id) => {
                        // Handle delete
                        console.log('Delete task:', id)
                      }}
                      onStatusChange={(id, status) => {
                        // Handle status change
                        console.log('Change task status:', id, status)
                      }}
                      onProgressUpdate={(id, progress) => {
                        // Handle progress update
                        console.log('Update task progress:', id, progress)
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

// Task Card Component
interface TaskCardProps {
  task: LegalTask
  onEdit: (task: LegalTask) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onProgressUpdate: (id: string, progress: number) => void
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, onProgressUpdate }: TaskCardProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-orange-100 text-orange-800'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'blocked':
        return <Pause className="h-4 w-4 text-orange-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const completedItems = task.checklistItems.filter(item => item.completed).length
  const totalItems = task.checklistItems.length

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
              {getStatusIcon(task.status)}
              <h3 className="font-semibold">{task.title}</h3>
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.category.replace('_', ' ')}
              </Badge>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-3">
                {task.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium">{task.progressPercentage}%</span>
              </div>
              <Progress value={task.progressPercentage} className="h-2" />
              {totalItems > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {completedItems} of {totalItems} items completed
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{task.practiceArea}</span>
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString('en-SG', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {task.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{task.estimatedHours}h estimated</span>
                </div>
              )}

              {task.assignedTo && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Assigned</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Select
              value={task.status}
              onValueChange={(value) => onStatusChange(task.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

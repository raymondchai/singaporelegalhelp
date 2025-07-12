'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  AlertTriangle,
  Target,
  Plus,
  ArrowLeft,
  Bell,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../components/DashboardLayout'
import LegalCalendar from '@/components/dashboard/LegalCalendar'
import DeadlineManager from '@/components/dashboard/DeadlineManager'
import TaskManager from '@/components/dashboard/TaskManager'
import { useToast } from '@/hooks/use-toast'

export default function LegalCalendarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('calendar')
  const [stats, setStats] = useState({
    upcomingDeadlines: 0,
    activeTasks: 0,
    overdueTasks: 0,
    completedThisWeek: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch deadline statistics
      const deadlinesResponse = await fetch('/api/dashboard/deadlines?include_stats=true&upcoming=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })
      
      // Fetch task statistics
      const tasksResponse = await fetch('/api/dashboard/tasks?include_stats=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })

      if (deadlinesResponse.ok) {
        const deadlinesData = await deadlinesResponse.json()
        setStats(prev => ({
          ...prev,
          upcomingDeadlines: deadlinesData.deadlines?.length || 0
        }))
      }

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        const tasks = tasksData.tasks || []
        
        setStats(prev => ({
          ...prev,
          activeTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
          overdueTasks: tasks.filter((t: any) => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
          ).length,
          completedThisWeek: tasks.filter((t: any) => {
            if (!t.completedAt) return false
            const completedDate = new Date(t.completedAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return completedDate >= weekAgo
          }).length
        }))
      }

    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <DashboardLayout title="Legal Calendar" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Legal Calendar & Task Management" 
      subtitle="Manage deadlines, tasks, and milestones"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming Deadlines</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loading ? '...' : stats.upcomingDeadlines}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : stats.activeTasks}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-red-600">
                    {loading ? '...' : stats.overdueTasks}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed This Week</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? '...' : stats.completedThisWeek}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Legal Calendar & Task Management
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => {
                  // Handle quick add functionality
                  toast({
                    title: "Quick Add",
                    description: "Quick add functionality coming soon"
                  })
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Quick Add
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendar View
                  </TabsTrigger>
                  <TabsTrigger value="deadlines" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Deadlines
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tasks
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="calendar" className="p-6">
                <LegalCalendar userId={user.id} />
              </TabsContent>

              <TabsContent value="deadlines" className="p-6">
                <DeadlineManager userId={user.id} />
              </TabsContent>

              <TabsContent value="tasks" className="p-6">
                <TaskManager userId={user.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  toast({
                    title: "Add Deadline",
                    description: "Add deadline functionality coming soon"
                  })
                }}
              >
                <AlertTriangle className="h-6 w-6" />
                <span>Add Deadline</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  toast({
                    title: "Create Task",
                    description: "Create task functionality coming soon"
                  })
                }}
              >
                <Clock className="h-6 w-6" />
                <span>Create Task</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  toast({
                    title: "Set Milestone",
                    description: "Set milestone functionality coming soon"
                  })
                }}
              >
                <Target className="h-6 w-6" />
                <span>Set Milestone</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips & Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Deadline Management</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Set reminders 1-2 weeks before critical deadlines</li>
                  <li>• Use court-specific categories for better organization</li>
                  <li>• Link related documents to deadlines</li>
                  <li>• Set up recurring deadlines for regular filings</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Task Organization</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Break large tasks into smaller checklist items</li>
                  <li>• Use dependencies to manage task sequences</li>
                  <li>• Assign tasks to team members when collaborating</li>
                  <li>• Track time estimates vs. actual time spent</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

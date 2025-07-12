'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter
} from 'lucide-react'
import { CalendarEvent, LegalDeadline, LegalTask, LegalMilestone } from '@/types/dashboard'
import { useToast } from '@/hooks/use-toast'
import { MonthView, WeekView, DayView, AgendaView } from './calendar-views'
import EventDetailsModal from './EventDetailsModal'

interface LegalCalendarProps {
  userId: string
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

export default function LegalCalendar({ userId }: LegalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [deadlines, setDeadlines] = useState<LegalDeadline[]>([])
  const [tasks, setTasks] = useState<LegalTask[]>([])
  const [milestones, setMilestones] = useState<LegalMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    showDeadlines: true,
    showTasks: true,
    showMilestones: true,
    practiceAreas: [] as string[],
    priorities: [] as string[]
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchCalendarData()
  }, [userId, currentDate, viewMode])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on view mode
      const startDate = getViewStartDate()
      const endDate = getViewEndDate()
      
      // Fetch calendar events
      const eventsResponse = await fetch(
        `/api/dashboard/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        }
      )
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events || [])
      }
      
      // Fetch detailed data for each type
      await Promise.all([
        fetchDeadlines(),
        fetchTasks(),
        fetchMilestones()
      ])
      
    } catch (error) {
      console.error('Error fetching calendar data:', error)
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDeadlines = async () => {
    try {
      const response = await fetch('/api/dashboard/deadlines', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDeadlines(data.deadlines || [])
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/dashboard/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/dashboard/milestones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    }
  }

  const getViewStartDate = (): Date => {
    const date = new Date(currentDate)
    switch (viewMode) {
      case 'month':
        date.setDate(1)
        date.setDate(date.getDate() - date.getDay()) // Start of week containing first day of month
        return date
      case 'week':
        date.setDate(date.getDate() - date.getDay()) // Start of current week
        return date
      case 'day':
        return date
      case 'agenda':
        return date
      default:
        return date
    }
  }

  const getViewEndDate = (): Date => {
    const date = new Date(currentDate)
    switch (viewMode) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 0) // Last day of current month
        date.setDate(date.getDate() + (6 - date.getDay())) // End of week containing last day of month
        return date
      case 'week':
        date.setDate(date.getDate() - date.getDay() + 6) // End of current week
        return date
      case 'day':
        return date
      case 'agenda':
        date.setDate(date.getDate() + 30) // Next 30 days
        return date
      default:
        return date
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'agenda':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 30 : -30))
        break
    }
    
    setCurrentDate(newDate)
  }

  const getDateTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long'
    }
    
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-SG', options)
      case 'week':
        const weekStart = getViewStartDate()
        const weekEnd = getViewEndDate()
        return `${weekStart.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'day':
        return currentDate.toLocaleDateString('en-SG', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'agenda':
        return 'Upcoming Events'
      default:
        return ''
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

  const getStatusIcon = (type: string, status?: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    switch (type) {
      case 'deadline':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'task':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'milestone':
        return <Calendar className="h-4 w-4 text-purple-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredEvents = events.filter(event => {
    if (!filters.showDeadlines && event.type === 'deadline') return false
    if (!filters.showTasks && event.type === 'task') return false
    if (!filters.showMilestones && event.type === 'milestone') return false
    
    if (filters.practiceAreas.length > 0 && event.practiceArea && 
        !filters.practiceAreas.includes(event.practiceArea)) return false
    
    if (filters.priorities.length > 0 && 
        !filters.priorities.includes(event.priority)) return false
    
    return true
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Legal Calendar
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
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Legal Calendar
              </CardTitle>
              <Badge variant="outline">
                {filteredEvents.length} events
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-semibold min-w-[200px] text-center">
                {getDateTitle()}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Type Filters */}
              <div>
                <h4 className="font-medium mb-2">Event Types</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showDeadlines}
                      onChange={(e) => setFilters(prev => ({ ...prev, showDeadlines: e.target.checked }))}
                      className="mr-2"
                    />
                    Deadlines
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showTasks}
                      onChange={(e) => setFilters(prev => ({ ...prev, showTasks: e.target.checked }))}
                      className="mr-2"
                    />
                    Tasks
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showMilestones}
                      onChange={(e) => setFilters(prev => ({ ...prev, showMilestones: e.target.checked }))}
                      className="mr-2"
                    />
                    Milestones
                  </label>
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <h4 className="font-medium mb-2">Priority</h4>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, priorities: [...prev.priorities, priority] }))
                          } else {
                            setFilters(prev => ({ ...prev, priorities: prev.priorities.filter(p => p !== priority) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="capitalize">{priority}</span>
                      <div className={`w-3 h-3 rounded-full ml-2 ${getPriorityColor(priority)}`}></div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Practice Area Filters */}
              <div>
                <h4 className="font-medium mb-2">Practice Areas</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Array.from(new Set(events.map(e => e.practiceArea).filter(Boolean))).map(area => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.practiceAreas.includes(area!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, practiceAreas: [...prev.practiceAreas, area!] }))
                          } else {
                            setFilters(prev => ({ ...prev, practiceAreas: prev.practiceAreas.filter(p => p !== area) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={viewMode} className="w-full">
            {/* Month View */}
            <TabsContent value="month" className="p-6">
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            </TabsContent>

            {/* Week View */}
            <TabsContent value="week" className="p-6">
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            </TabsContent>

            {/* Day View */}
            <TabsContent value="day" className="p-6">
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            </TabsContent>

            {/* Agenda View */}
            <TabsContent value="agenda" className="p-6">
              <AgendaView
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(eventId) => {
            // Handle edit event
            console.log('Edit event:', eventId)
          }}
          onDelete={(eventId) => {
            // Handle delete event
            console.log('Delete event:', eventId)
          }}
        />
      )}
    </div>
  )
}



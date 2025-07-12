'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  User,
  FileText
} from 'lucide-react'
import { CalendarEvent } from '@/types/dashboard'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

// Helper function for status icons
export function getStatusIcon(type: string, status?: string) {
  if (status === 'completed') {
    return <CheckCircle className="h-3 w-3 text-green-500" />
  }
  
  switch (type) {
    case 'deadline':
      return <AlertTriangle className="h-3 w-3 text-red-500" />
    case 'task':
      return <Clock className="h-3 w-3 text-blue-500" />
    case 'milestone':
      return <Calendar className="h-3 w-3 text-purple-500" />
    default:
      return <Calendar className="h-3 w-3 text-gray-500" />
  }
}

// Month View Component
interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const getDaysInMonth = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // End at the Saturday of the week containing the last day
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days: CalendarDay[] = []
    const currentDateIter = new Date(startDate)

    while (currentDateIter <= endDate) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate.toDateString() === currentDateIter.toDateString()
      })

      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.toDateString() === new Date().toDateString(),
        events: dayEvents
      })

      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }

    return days
  }

  const days = getDaysInMonth()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50
              ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
              ${day.isToday ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <div className={`
              text-sm font-medium mb-1
              ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              ${day.isToday ? 'text-blue-600' : ''}
            `}>
              {day.date.getDate()}
            </div>

            <div className="space-y-1">
              {day.events.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: event.color }}
                >
                  <div className="flex items-center gap-1 text-white">
                    {getStatusIcon(event.type)}
                    <span className="truncate">{event.title}</span>
                  </div>
                </div>
              ))}

              {day.events.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Week View Component
interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    return days
  }

  const weekDays = getWeekDays()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="grid grid-cols-8 gap-1">
        <div className="p-2"></div> {/* Empty cell for time column */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-2 text-center">
            <div className="font-medium text-sm">
              {day.toLocaleDateString('en-SG', { weekday: 'short' })}
            </div>
            <div className={`text-lg ${day.toDateString() === new Date().toDateString() ? 'text-blue-600 font-bold' : ''}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-8 gap-1 max-h-96 overflow-y-auto">
        {hours.map(hour => (
          <React.Fragment key={hour}>
            {/* Time column */}
            <div className="p-2 text-xs text-gray-500 text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* Day columns */}
            {weekDays.map(day => {
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.startDate)
                const eventHour = eventDate.getHours()
                return eventDate.toDateString() === day.toDateString() && 
                       (event.allDay || eventHour === hour)
              })

              return (
                <div key={`${day.toISOString()}-${hour}`} className="min-h-[40px] p-1 border-t border-gray-100">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="text-xs p-1 mb-1 rounded cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color }}
                    >
                      <div className="flex items-center gap-1 text-white">
                        {getStatusIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Day View Component
interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate)
    return eventDate.toDateString() === currentDate.toDateString()
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-SG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {dayEvents.length} events scheduled
        </p>
      </div>

      {/* All-day events */}
      {dayEvents.filter(e => e.allDay).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">All Day</h4>
          <div className="space-y-1">
            {dayEvents.filter(e => e.allDay).map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-2 rounded cursor-pointer hover:opacity-80"
                style={{ backgroundColor: event.color }}
              >
                <div className="flex items-center gap-2 text-white">
                  {getStatusIcon(event.type)}
                  <span className="font-medium">{event.title}</span>
                  {event.practiceArea && (
                    <Badge variant="secondary" className="text-xs">
                      {event.practiceArea}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly schedule */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            if (event.allDay) return false
            const eventDate = new Date(event.startDate)
            return eventDate.getHours() === hour
          })

          return (
            <div key={hour} className="flex border-t border-gray-100">
              <div className="w-16 p-2 text-xs text-gray-500 text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 min-h-[60px] p-2">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="p-2 mb-1 rounded cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color }}
                  >
                    <div className="flex items-center gap-2 text-white">
                      {getStatusIcon(event.type)}
                      <div>
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-xs opacity-90 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Agenda View Component
interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = new Date(event.startDate).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'border-red-500'
      case 'high': return 'border-orange-500'
      case 'medium': return 'border-yellow-500'
      case 'low': return 'border-green-500'
      default: return 'border-gray-300'
    }
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'deadline': return 'Deadline'
      case 'task': return 'Task'
      case 'milestone': return 'Milestone'
      case 'court_date': return 'Court Date'
      case 'meeting': return 'Meeting'
      default: return 'Event'
    }
  }

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No upcoming events</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(dateKey => {
        const date = new Date(dateKey)
        const dateEvents = eventsByDate[dateKey].sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )

        return (
          <div key={dateKey} className="space-y-3">
            {/* Date header */}
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">
                {date.toLocaleDateString('en-SG', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-500">
                {date.getFullYear()}
              </div>
              <Badge variant="outline">
                {dateEvents.length} events
              </Badge>
            </div>

            {/* Events for this date */}
            <div className="space-y-2 ml-4">
              {dateEvents.map(event => (
                <Card 
                  key={event.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(event.priority)}`}
                  onClick={() => onEventClick(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(event.type)}
                          <span className="font-medium">{event.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(event.type)}
                          </Badge>
                          {event.practiceArea && (
                            <Badge variant="outline" className="text-xs">
                              {event.practiceArea}
                            </Badge>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.allDay ? 'All day' : new Date(event.startDate).toLocaleTimeString('en-SG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="capitalize">{event.priority}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Bell, BellOff, Calendar, Clock, FileText, Gavel } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function NotificationManager() {
  const {
    permission,
    isSupported,
    notifications,
    requestPermission,
    scheduleCourtDateReminder,
    scheduleDeadlineReminder,
    scheduleDocumentReminder,
    cancelNotification,
  } = usePushNotifications()
  
  const { toast } = useToast()
  const [courtCase, setCourtCase] = useState('')
  const [courtDate, setCourtDate] = useState('')
  const [deadlineDesc, setDeadlineDesc] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [documentDesc, setDocumentDesc] = useState('')
  const [documentDate, setDocumentDate] = useState('')

  const handleRequestPermission = async () => {
    const result = await requestPermission()
    if (result === 'granted') {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive legal deadline reminders',
      })
    } else {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings',
        variant: 'destructive',
      })
    }
  }

  const handleScheduleCourtDate = async () => {
    if (!courtCase || !courtDate) return

    try {
      await scheduleCourtDateReminder(new Date(courtDate), courtCase, 'Singapore Courts')
      toast({
        title: 'Court date reminder set',
        description: `Reminder scheduled for ${courtCase}`,
      })
      setCourtCase('')
      setCourtDate('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule court date reminder',
        variant: 'destructive',
      })
    }
  }

  const handleScheduleDeadline = async () => {
    if (!deadlineDesc || !deadlineDate) return

    try {
      await scheduleDeadlineReminder(new Date(deadlineDate), deadlineDesc)
      toast({
        title: 'Deadline reminder set',
        description: `Reminder scheduled for ${deadlineDesc}`,
      })
      setDeadlineDesc('')
      setDeadlineDate('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule deadline reminder',
        variant: 'destructive',
      })
    }
  }

  const handleScheduleDocument = async () => {
    if (!documentDesc || !documentDate) return

    try {
      await scheduleDocumentReminder(new Date(documentDate), documentDesc, `doc_${Date.now()}`)
      toast({
        title: 'Document reminder set',
        description: `Reminder scheduled for ${documentDesc}`,
      })
      setDocumentDesc('')
      setDocumentDate('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule document reminder',
        variant: 'destructive',
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'court-date': return <Gavel className="h-4 w-4" />
      case 'deadline': return <Clock className="h-4 w-4" />
      case 'reminder': return <FileText className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'court-date': return 'bg-red-100 text-red-800'
      case 'deadline': return 'bg-orange-100 text-orange-800'
      case 'reminder': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Notifications Not Supported</CardTitle>
          <CardDescription className="text-orange-700">
            Your browser doesn't support push notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {permission === 'granted' ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <CardTitle>Legal Notifications</CardTitle>
            </div>
            <Badge 
              variant={permission === 'granted' ? 'default' : 'secondary'}
              className={permission === 'granted' ? 'bg-green-100 text-green-800' : ''}
            >
              {permission === 'granted' ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <CardDescription>
            Get notified about important legal deadlines and court dates
          </CardDescription>
        </CardHeader>
        {permission !== 'granted' && (
          <CardContent>
            <Button onClick={handleRequestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          </CardContent>
        )}
      </Card>

      {permission === 'granted' && (
        <>
          {/* Schedule Notifications */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Court Date Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gavel className="h-5 w-5 text-red-600" />
                  <span>Court Date</span>
                </CardTitle>
                <CardDescription>
                  Set reminders for court hearings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="court-case">Case Title</Label>
                  <Input
                    id="court-case"
                    value={courtCase}
                    onChange={(e) => setCourtCase(e.target.value)}
                    placeholder="Enter case title"
                  />
                </div>
                <div>
                  <Label htmlFor="court-date">Court Date</Label>
                  <Input
                    id="court-date"
                    type="datetime-local"
                    value={courtDate}
                    onChange={(e) => setCourtDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleScheduleCourtDate}
                  disabled={!courtCase || !courtDate}
                  className="w-full"
                >
                  Schedule Reminder
                </Button>
              </CardContent>
            </Card>

            {/* Deadline Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Deadline</span>
                </CardTitle>
                <CardDescription>
                  Set reminders for legal deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deadline-desc">Description</Label>
                  <Input
                    id="deadline-desc"
                    value={deadlineDesc}
                    onChange={(e) => setDeadlineDesc(e.target.value)}
                    placeholder="Enter deadline description"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline-date">Deadline</Label>
                  <Input
                    id="deadline-date"
                    type="datetime-local"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleScheduleDeadline}
                  disabled={!deadlineDesc || !deadlineDate}
                  className="w-full"
                >
                  Schedule Reminder
                </Button>
              </CardContent>
            </Card>

            {/* Document Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Document</span>
                </CardTitle>
                <CardDescription>
                  Set reminders for document submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="document-desc">Document</Label>
                  <Input
                    id="document-desc"
                    value={documentDesc}
                    onChange={(e) => setDocumentDesc(e.target.value)}
                    placeholder="Enter document description"
                  />
                </div>
                <div>
                  <Label htmlFor="document-date">Due Date</Label>
                  <Input
                    id="document-date"
                    type="datetime-local"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleScheduleDocument}
                  disabled={!documentDesc || !documentDate}
                  className="w-full"
                >
                  Schedule Reminder
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
              <CardDescription>
                Your upcoming legal reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled notifications</p>
                  <p className="text-sm">Set reminders above to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <Badge className={getNotificationColor(notification.type)}>
                            {notification.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.body}</p>
                          <p className="text-xs text-gray-500">
                            {notification.scheduledFor.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelNotification(notification.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

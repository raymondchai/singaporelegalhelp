'use client'

import { useState, useEffect } from 'react'

export interface NotificationState {
  permission: NotificationPermission | 'unsupported'
  isSupported: boolean
}

export interface LegalNotification {
  id: string
  title: string
  body: string
  type: 'deadline' | 'reminder' | 'update' | 'court-date'
  scheduledFor: Date
  isActive: boolean
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [notifications, setNotifications] = useState<LegalNotification[]>([])

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      loadScheduledNotifications()
    }
  }, [])

  const loadScheduledNotifications = () => {
    try {
      const stored = localStorage.getItem('legal-notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        const notifications = parsed.map((n: any) => ({
          ...n,
          scheduledFor: new Date(n.scheduledFor)
        }))
        setNotifications(notifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isSupported) {
      return 'unsupported'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  const scheduleNotification = async (notification: Omit<LegalNotification, 'id' | 'isActive'>) => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('Notifications not supported or permission denied')
    }

    const newNotification: LegalNotification = {
      ...notification,
      id: crypto.randomUUID(),
      isActive: true,
    }

    const updatedNotifications = [...notifications, newNotification]
    setNotifications(updatedNotifications)
    localStorage.setItem('legal-notifications', JSON.stringify(updatedNotifications))

    // Schedule the notification
    const timeUntilNotification = notification.scheduledFor.getTime() - Date.now()
    
    if (timeUntilNotification > 0) {
      setTimeout(() => {
        showNotification(newNotification)
      }, timeUntilNotification)
    }

    return newNotification.id
  }

  const showNotification = (notification: LegalNotification) => {
    if (!isSupported || permission !== 'granted') return

    const notificationOptions: NotificationOptions = {
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: notification.id,
      requireInteraction: true,
      data: {
        type: notification.type,
        id: notification.id,
      }
    }

    const notif = new Notification(notification.title, notificationOptions)

    notif.onclick = () => {
      window.focus()
      // Navigate to relevant page based on notification type
      switch (notification.type) {
        case 'deadline':
        case 'court-date':
          window.location.href = '/dashboard/calendar'
          break
        case 'reminder':
          window.location.href = '/dashboard/tasks'
          break
        case 'update':
          window.location.href = '/dashboard/notifications'
          break
        default:
          window.location.href = '/dashboard'
      }
      notif.close()
    }
  }

  const cancelNotification = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, isActive: false } : n
    )
    setNotifications(updatedNotifications)
    localStorage.setItem('legal-notifications', JSON.stringify(updatedNotifications))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    localStorage.removeItem('legal-notifications')
  }

  // Common legal notification templates
  const scheduleCourtDateReminder = (courtDate: Date, caseTitle: string) => {
    const reminderDate = new Date(courtDate.getTime() - 24 * 60 * 60 * 1000) // 1 day before
    
    return scheduleNotification({
      title: 'Court Date Reminder',
      body: `You have a court hearing tomorrow for ${caseTitle}`,
      type: 'court-date',
      scheduledFor: reminderDate,
    })
  }

  const scheduleDeadlineReminder = (deadline: Date, description: string) => {
    const reminderDate = new Date(deadline.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
    
    return scheduleNotification({
      title: 'Legal Deadline Approaching',
      body: `Deadline in 2 hours: ${description}`,
      type: 'deadline',
      scheduledFor: reminderDate,
    })
  }

  const scheduleDocumentReminder = (description: string, dueDate: Date) => {
    const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) // 1 day before
    
    return scheduleNotification({
      title: 'Document Submission Due',
      body: `Document due tomorrow: ${description}`,
      type: 'reminder',
      scheduledFor: reminderDate,
    })
  }

  return {
    permission,
    isSupported,
    notifications: notifications.filter(n => n.isActive),
    requestPermission,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    // Helper methods for common legal scenarios
    scheduleCourtDateReminder,
    scheduleDeadlineReminder,
    scheduleDocumentReminder,
  }
}

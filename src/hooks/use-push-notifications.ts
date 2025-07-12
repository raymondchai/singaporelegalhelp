"use client"

import { useState, useEffect, useCallback } from 'react'

export interface LegalNotification {
  id: string
  title: string
  body: string
  type: 'deadline' | 'court_date' | 'document_reminder' | 'payment_due' | 'general'
  scheduledFor: Date
  isActive: boolean
  metadata?: {
    caseId?: string
    documentId?: string
    amount?: number
    courtLocation?: string
  }
}

export interface NotificationSettings {
  enabled: boolean
  types: {
    deadlines: boolean
    court_dates: boolean
    document_reminders: boolean
    payment_due: boolean
    general: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency: 'immediate' | 'batched' | 'daily_digest'
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [notifications, setNotifications] = useState<LegalNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    types: {
      deadlines: true,
      court_dates: true,
      document_reminders: true,
      payment_due: true,
      general: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    frequency: 'immediate'
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

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

  const scheduleNotification = useCallback(async (notification: Omit<LegalNotification, 'id' | 'isActive'>) => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    const newNotification: LegalNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      isActive: true
    }

    setNotifications(prev => [...prev, newNotification])
    return true
  }, [isSupported, permission])

  const cancelNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isActive: false } : n
      )
    )
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const saveNotificationSettings = useCallback(async (newSettings: NotificationSettings) => {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      return true
    } catch (error) {
      console.error('Error saving notification settings:', error)
      return false
    }
  }, [])

  const scheduleCourtDateReminder = useCallback((courtDate: Date, caseId: string, courtLocation: string) => {
    const reminderDate = new Date(courtDate.getTime() - 24 * 60 * 60 * 1000)
    
    return scheduleNotification({
      title: 'Court Date Reminder',
      body: `You have a court hearing tomorrow at ${courtLocation}`,
      type: 'court_date',
      scheduledFor: reminderDate,
      metadata: { caseId, courtLocation }
    })
  }, [scheduleNotification])

  const scheduleDeadlineReminder = useCallback((deadline: Date, title: string, caseId?: string) => {
    const reminderDate = new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    return scheduleNotification({
      title: 'Legal Deadline Approaching',
      body: `Deadline for "${title}" is in 3 days`,
      type: 'deadline',
      scheduledFor: reminderDate,
      metadata: { caseId }
    })
  }, [scheduleNotification])

  const scheduleDocumentReminder = useCallback((dueDate: Date, documentType: string, documentId: string) => {
    const reminderDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return scheduleNotification({
      title: 'Document Submission Reminder',
      body: `${documentType} submission due in 1 week`,
      type: 'document_reminder',
      scheduledFor: reminderDate,
      metadata: { documentId }
    })
  }, [scheduleNotification])

  const schedulePaymentReminder = useCallback((dueDate: Date, amount: number, description: string) => {
    const reminderDate = new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000)
    
    return scheduleNotification({
      title: 'Payment Due Reminder',
      body: `Payment of $${amount} for ${description} due in 2 days`,
      type: 'payment_due',
      scheduledFor: reminderDate,
      metadata: { amount }
    })
  }, [scheduleNotification])

  const shouldShowNotification = useCallback((notification: LegalNotification): boolean => {
    if (!settings.enabled) {
      return false
    }

    // Map notification types to settings types
    const typeMapping: Record<string, keyof typeof settings.types> = {
      'deadline': 'deadlines',
      'court_date': 'court_dates',
      'document_reminder': 'document_reminders',
      'payment_due': 'payment_due',
      'general': 'general'
    }

    const settingsType = typeMapping[notification.type]
    if (!settingsType || !settings.types[settingsType]) {
      return false
    }

    return true
  }, [settings])

  const isInQuietHours = useCallback((): boolean => {
    if (!settings.quietHours.enabled) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { start, end } = settings.quietHours
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end
    } else {
      return currentTime >= start || currentTime <= end
    }
  }, [settings.quietHours])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }, [])

  return {
    permission,
    isSupported,
    notifications: notifications.filter(n => n.isActive),
    settings,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    updateSettings,
    saveNotificationSettings,
    scheduleCourtDateReminder,
    scheduleDeadlineReminder,
    scheduleDocumentReminder,
    schedulePaymentReminder,
    shouldShowNotification,
    isInQuietHours
  }
}

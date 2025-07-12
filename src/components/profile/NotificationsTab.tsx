'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Mail, MessageSquare, Smartphone, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  notification_preferences?: {
    email: boolean
    sms: boolean
    push: boolean
  }
  language_preference?: string
}

interface NotificationsTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function NotificationsTab({ userProfile, onUpdate }: NotificationsTabProps) {
  const [preferences, setPreferences] = useState({
    email: userProfile.notification_preferences?.email ?? true,
    sms: userProfile.notification_preferences?.sms ?? false,
    push: userProfile.notification_preferences?.push ?? true,
    language: userProfile.language_preference ?? 'en',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      onUpdate({
        ...userProfile,
        notification_preferences: {
          email: preferences.email,
          sms: preferences.sms,
          push: preferences.push,
        },
        language_preference: preferences.language,
      })

      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update preferences.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Important updates and legal alerts</p>
                </div>
              </div>
              <Checkbox
                checked={preferences.email}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email: checked as boolean }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Urgent alerts and reminders</p>
                </div>
              </div>
              <Checkbox
                checked={preferences.sms}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, sms: checked as boolean }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Browser and mobile app notifications</p>
                </div>
              </div>
              <Checkbox
                checked={preferences.push}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, push: checked as boolean }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Language Preference</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="ms">Bahasa Melayu</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

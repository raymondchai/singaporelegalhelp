'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Globe, 
  Shield, 
  FileText, 
  Eye,
  ExternalLink
} from 'lucide-react'
import { RegistrationData } from '../RegistrationWizard'

interface RegistrationStep5Props {
  data: RegistrationData
  onUpdate: (data: Partial<RegistrationData>) => void
}

export function RegistrationStep5({ data, onUpdate }: RegistrationStep5Props) {
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    onUpdate({ [field]: value })
  }

  const handleNotificationChange = (type: 'email' | 'sms' | 'push', value: boolean) => {
    const currentPrefs = data.notification_preferences || { email: true, sms: false, push: true }
    handleInputChange('notification_preferences', {
      ...currentPrefs,
      [type]: value
    })
  }

  const practiceAreas = [
    'Business Law',
    'Employment Law',
    'Property Law',
    'Family Law',
    'Criminal Law',
    'Intellectual Property',
    'Immigration Law',
    'Tax Law',
    'Contract Law',
    'Debt & Bankruptcy',
  ]

  const handlePracticeAreaChange = (area: string, checked: boolean) => {
    const current = data.practice_areas_interest || []
    if (checked) {
      handleInputChange('practice_areas_interest', [...current, area])
    } else {
      handleInputChange('practice_areas_interest', current.filter(a => a !== area))
    }
  }

  return (
    <div className="space-y-6">
      {/* Preferences Header */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Platform Preferences</h4>
            <p className="text-sm text-blue-800">
              Customize your experience and set your communication preferences. 
              You can change these settings anytime in your account.
            </p>
          </div>
        </div>
      </div>

      {/* Practice Areas Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Areas of Legal Interest</span>
          </CardTitle>
          <CardDescription>
            Select the legal areas you're most interested in (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {practiceAreas.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={area}
                  checked={(data.practice_areas_interest || []).includes(area)}
                  onCheckedChange={(checked) => handlePracticeAreaChange(area, checked as boolean)}
                />
                <Label htmlFor={area} className="text-sm font-normal">
                  {area}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            This helps us personalize your content and recommendations
          </p>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how you'd like to receive updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Important updates and legal alerts</p>
              </div>
            </div>
            <Checkbox
              checked={data.notification_preferences?.email ?? true}
              onCheckedChange={(checked) => handleNotificationChange('email', checked as boolean)}
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
              checked={data.notification_preferences?.sms ?? false}
              onCheckedChange={(checked) => handleNotificationChange('sms', checked as boolean)}
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
              checked={data.notification_preferences?.push ?? true}
              onCheckedChange={(checked) => handleNotificationChange('push', checked as boolean)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Preference */}
      <div className="space-y-2">
        <Label htmlFor="language_preference">Preferred Language</Label>
        <Select
          value={data.language_preference || 'en'}
          onValueChange={(value) => handleInputChange('language_preference', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preferred language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
            </SelectItem>
            <SelectItem value="zh">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>中文 (Chinese)</span>
              </div>
            </SelectItem>
            <SelectItem value="ms">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Bahasa Melayu</span>
              </div>
            </SelectItem>
            <SelectItem value="ta">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>தமிழ் (Tamil)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legal Agreements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Legal Agreements & Consent</span>
          </CardTitle>
          <CardDescription>
            Please review and accept our terms to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms_accepted"
              checked={data.terms_accepted || false}
              onCheckedChange={(checked) => handleInputChange('terms_accepted', checked)}
              required
            />
            <div className="flex-1">
              <Label htmlFor="terms_accepted" className="font-medium">
                I accept the Terms and Conditions *
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => setShowTerms(!showTerms)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showTerms ? 'Hide' : 'View'} Terms
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  asChild
                >
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in new tab
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy_policy_accepted"
              checked={data.privacy_policy_accepted || false}
              onCheckedChange={(checked) => handleInputChange('privacy_policy_accepted', checked)}
              required
            />
            <div className="flex-1">
              <Label htmlFor="privacy_policy_accepted" className="font-medium">
                I accept the Privacy Policy *
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => setShowPrivacy(!showPrivacy)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showPrivacy ? 'Hide' : 'View'} Privacy Policy
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  asChild
                >
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in new tab
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* PDPA Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="pdpa_consent"
              checked={data.pdpa_consent || false}
              onCheckedChange={(checked) => handleInputChange('pdpa_consent', checked)}
              required
            />
            <div className="flex-1">
              <Label htmlFor="pdpa_consent" className="font-medium">
                I consent to the collection and use of my personal data under PDPA *
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Required for Singapore legal compliance and service provision
              </p>
            </div>
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing_consent"
              checked={data.marketing_consent || false}
              onCheckedChange={(checked) => handleInputChange('marketing_consent', checked)}
            />
            <div className="flex-1">
              <Label htmlFor="marketing_consent" className="font-medium">
                I consent to receive marketing communications (Optional)
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Updates about new features, legal insights, and promotional offers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Notice */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Ready to Get Started!</h4>
        <p className="text-sm text-green-800">
          Once you complete registration, you'll receive an email verification link. 
          After verification, you can start using Singapore Legal Help to access 
          legal documents, get legal guidance, and manage your legal needs.
        </p>
      </div>
    </div>
  )
}

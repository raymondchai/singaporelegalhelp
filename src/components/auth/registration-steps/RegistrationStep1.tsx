'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, User, Building2, Scale, Briefcase } from 'lucide-react'
import { RegistrationData } from '../RegistrationWizard'

interface RegistrationStep1Props {
  data: RegistrationData
  onUpdate: (data: Partial<RegistrationData>) => void
}

export function RegistrationStep1({ data, onUpdate }: RegistrationStep1Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    onUpdate({ [field]: value })
  }

  const userTypeOptions = [
    {
      value: 'individual',
      label: 'Individual',
      description: 'Personal legal assistance',
      icon: User,
    },
    {
      value: 'business',
      label: 'Business',
      description: 'Small to medium business',
      icon: Building2,
    },
    {
      value: 'law_firm',
      label: 'Law Firm',
      description: 'Legal practice',
      icon: Scale,
    },
    {
      value: 'corporate',
      label: 'Corporate',
      description: 'Large corporation',
      icon: Briefcase,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Enter your full name"
          value={data.full_name || ''}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={data.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
        />
      </div>

      {/* User Type */}
      <div className="space-y-2">
        <Label htmlFor="user_type">Account Type *</Label>
        <Select
          value={data.user_type || 'individual'}
          onValueChange={(value) => handleInputChange('user_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            {userTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <option.icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={data.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Password must contain at least 8 characters with uppercase, lowercase, and number
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={data.confirm_password || ''}
            onChange={(e) => handleInputChange('confirm_password', e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Account Type Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Account Type Benefits</h4>
        <div className="text-sm text-blue-800">
          {data.user_type === 'individual' && (
            <ul className="list-disc list-inside space-y-1">
              <li>Personal legal document generation</li>
              <li>Individual consultation access</li>
              <li>Basic document storage</li>
            </ul>
          )}
          {data.user_type === 'business' && (
            <ul className="list-disc list-inside space-y-1">
              <li>Business document templates</li>
              <li>Team collaboration features</li>
              <li>Enhanced document storage</li>
              <li>Priority support</li>
            </ul>
          )}
          {data.user_type === 'law_firm' && (
            <ul className="list-disc list-inside space-y-1">
              <li>Professional legal templates</li>
              <li>Client management tools</li>
              <li>Advanced collaboration</li>
              <li>White-label options</li>
            </ul>
          )}
          {data.user_type === 'corporate' && (
            <ul className="list-disc list-inside space-y-1">
              <li>Enterprise-grade security</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
              <li>Advanced analytics</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

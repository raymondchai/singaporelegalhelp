'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, MapPin, Home } from 'lucide-react'
import { RegistrationData } from '../RegistrationWizard'

interface RegistrationStep2Props {
  data: RegistrationData
  onUpdate: (data: Partial<RegistrationData>) => void
}

export function RegistrationStep2({ data, onUpdate }: RegistrationStep2Props) {
  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    onUpdate({ [field]: value })
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as Singapore phone number
    if (digits.length <= 8) {
      return digits
    }
    return digits.slice(0, 8)
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone_number', formatted)
  }

  return (
    <div className="space-y-6">
      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <div className="flex">
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-r-0 rounded-l-md text-sm text-gray-600">
              +65
            </div>
            <Input
              id="phone_number"
              type="tel"
              placeholder="8123 4567"
              value={data.phone_number || ''}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="pl-4 rounded-l-none"
              maxLength={8}
              required
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Enter your 8-digit Singapore mobile number
        </p>
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="address_street">Street Address *</Label>
        <div className="relative">
          <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="address_street"
            type="text"
            placeholder="123 Orchard Road"
            value={data.address_street || ''}
            onChange={(e) => handleInputChange('address_street', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Unit Number */}
      <div className="space-y-2">
        <Label htmlFor="address_unit">Unit Number (Optional)</Label>
        <Input
          id="address_unit"
          type="text"
          placeholder="#12-34"
          value={data.address_unit || ''}
          onChange={(e) => handleInputChange('address_unit', e.target.value)}
        />
      </div>

      {/* Postal Code */}
      <div className="space-y-2">
        <Label htmlFor="address_postal_code">Postal Code *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="address_postal_code"
            type="text"
            placeholder="238864"
            value={data.address_postal_code || ''}
            onChange={(e) => handleInputChange('address_postal_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="pl-10"
            maxLength={6}
            required
          />
        </div>
        <p className="text-sm text-gray-500">
          Enter your 6-digit Singapore postal code
        </p>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="address_country">Country *</Label>
        <Select
          value={data.address_country || 'Singapore'}
          onValueChange={(value) => handleInputChange('address_country', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Singapore">Singapore</SelectItem>
            <SelectItem value="Malaysia">Malaysia</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Currently, we primarily serve Singapore residents
        </p>
      </div>

      {/* Address Verification Notice */}
      <div className="bg-amber-50 p-4 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">Address Verification</h4>
        <p className="text-sm text-amber-800">
          Your address information helps us provide location-specific legal guidance and 
          ensures compliance with Singapore legal requirements. This information is kept 
          secure and confidential in accordance with PDPA regulations.
        </p>
      </div>

      {/* Contact Preferences */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Contact Information Usage</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>We'll use your contact information for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account verification and security</li>
            <li>Important legal document notifications</li>
            <li>Service updates and communications</li>
            <li>Emergency contact if required</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

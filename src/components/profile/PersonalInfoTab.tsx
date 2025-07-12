'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name?: string
  phone_number?: string
  user_type: 'individual' | 'business' | 'law_firm' | 'corporate'
  singapore_nric?: string
  singapore_uen?: string
  date_of_birth?: string
  address_street?: string
  address_unit?: string
  address_postal_code?: string
  address_country?: string
  singapore_validation_status: 'pending' | 'verified' | 'failed' | 'expired'
}

interface PersonalInfoTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function PersonalInfoTab({ userProfile, onUpdate }: PersonalInfoTabProps) {
  const [formData, setFormData] = useState({
    full_name: userProfile.full_name || '',
    display_name: userProfile.display_name || '',
    phone_number: userProfile.phone_number || '',
    date_of_birth: userProfile.date_of_birth || '',
    address_street: userProfile.address_street || '',
    address_unit: userProfile.address_unit || '',
    address_postal_code: userProfile.address_postal_code || '',
    address_country: userProfile.address_country || 'Singapore',
  })
  
  const [loading, setLoading] = useState(false)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedProfile = await response.json()
      onUpdate(updatedProfile)

      toast({
        title: 'Profile Updated',
        description: 'Your personal information has been updated successfully.',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 8)
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>
            Update your basic personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="How others see your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-sm text-gray-500">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-r-0 rounded-l-md text-sm text-gray-600">
                  +65
                </div>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', formatPhoneNumber(e.target.value))}
                  placeholder="8123 4567"
                  className="rounded-l-none"
                  maxLength={8}
                />
              </div>
            </div>

            {userProfile.user_type === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="pl-10"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Address Information</span>
          </CardTitle>
          <CardDescription>
            Your address information for legal document delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_street">Street Address</Label>
              <Input
                id="address_street"
                value={formData.address_street}
                onChange={(e) => handleInputChange('address_street', e.target.value)}
                placeholder="123 Orchard Road"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_unit">Unit Number</Label>
                <Input
                  id="address_unit"
                  value={formData.address_unit}
                  onChange={(e) => handleInputChange('address_unit', e.target.value)}
                  placeholder="#12-34"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address_postal_code">Postal Code</Label>
                <Input
                  id="address_postal_code"
                  value={formData.address_postal_code}
                  onChange={(e) => handleInputChange('address_postal_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="238864"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_country">Country</Label>
              <Select
                value={formData.address_country}
                onValueChange={(value) => handleInputChange('address_country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singapore">Singapore</SelectItem>
                  <SelectItem value="Malaysia">Malaysia</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Singapore Identity Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Singapore Identity</span>
            <div className="flex items-center space-x-2">
              {getVerificationIcon(userProfile.singapore_validation_status)}
              <Badge variant={userProfile.singapore_validation_status === 'verified' ? 'default' : 'secondary'}>
                {userProfile.singapore_validation_status}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Your Singapore identity information for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userProfile.singapore_nric && (
              <div className="space-y-2">
                <Label>NRIC Number</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={showSensitiveInfo ? userProfile.singapore_nric : '••••••••'}
                    disabled
                    className="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  >
                    {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {userProfile.singapore_uen && (
              <div className="space-y-2">
                <Label>UEN Number</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={showSensitiveInfo ? userProfile.singapore_uen : '••••••••••'}
                    disabled
                    className="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  >
                    {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Singapore identity information cannot be changed once verified. 
                If you need to update this information, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

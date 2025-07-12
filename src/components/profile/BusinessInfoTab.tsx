'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  user_type: 'individual' | 'business' | 'law_firm' | 'corporate'
  company_name?: string
  business_registration_number?: string
  industry_sector?: string
  company_size?: string
}

interface BusinessInfoTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function BusinessInfoTab({ userProfile, onUpdate }: BusinessInfoTabProps) {
  const [formData, setFormData] = useState({
    company_name: userProfile.company_name || '',
    business_registration_number: userProfile.business_registration_number || '',
    industry_sector: userProfile.industry_sector || '',
    company_size: userProfile.company_size || '',
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/business-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update business information')

      const updatedProfile = await response.json()
      onUpdate(updatedProfile)

      toast({
        title: 'Business Information Updated',
        description: 'Your business information has been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update business information.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (userProfile.user_type === 'individual') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            This section is only available for business accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Your account is set up as an individual account. Business information is not applicable.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Business Information</span>
          </CardTitle>
          <CardDescription>
            Update your business details and company information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_registration_number">Business Registration Number</Label>
              <Input
                id="business_registration_number"
                value={formData.business_registration_number}
                onChange={(e) => setFormData(prev => ({ ...prev, business_registration_number: e.target.value }))}
                placeholder="Additional registration numbers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_sector">Industry Sector</Label>
              <Select
                value={formData.industry_sector}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry_sector: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail & E-commerce">Retail & E-commerce</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Legal Services">Legal Services</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={formData.company_size}
                onValueChange={(value) => setFormData(prev => ({ ...prev, company_size: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

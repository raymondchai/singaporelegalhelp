'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Users, FileText, Briefcase } from 'lucide-react'
import { RegistrationData } from '../RegistrationWizard'

interface RegistrationStep4Props {
  data: RegistrationData
  onUpdate: (data: Partial<RegistrationData>) => void
}

export function RegistrationStep4({ data, onUpdate }: RegistrationStep4Props) {
  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    onUpdate({ [field]: value })
  }

  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees', description: 'Small business' },
    { value: '11-50', label: '11-50 employees', description: 'Medium business' },
    { value: '51-200', label: '51-200 employees', description: 'Large business' },
    { value: '201-1000', label: '201-1000 employees', description: 'Enterprise' },
    { value: '1000+', label: '1000+ employees', description: 'Large enterprise' },
  ]

  const industrySectors = [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'Manufacturing',
    'Retail & E-commerce',
    'Real Estate',
    'Construction',
    'Education',
    'Legal Services',
    'Consulting',
    'Food & Beverage',
    'Transportation & Logistics',
    'Media & Entertainment',
    'Non-profit',
    'Government',
    'Other',
  ]

  return (
    <div className="space-y-6">
      {/* Business Information Header */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Business Information</h4>
            <p className="text-sm text-blue-800">
              Help us understand your business to provide tailored legal services and 
              appropriate document templates for your industry.
            </p>
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="company_name"
            type="text"
            placeholder="Enter your company name"
            value={data.company_name || ''}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-sm text-gray-500">
          Enter the official registered name of your business
        </p>
      </div>

      {/* Business Registration Number */}
      <div className="space-y-2">
        <Label htmlFor="business_registration_number">Business Registration Number</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="business_registration_number"
            type="text"
            placeholder="Enter registration number (if different from UEN)"
            value={data.business_registration_number || ''}
            onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-500">
          Additional registration numbers if applicable (optional)
        </p>
      </div>

      {/* Industry Sector */}
      <div className="space-y-2">
        <Label htmlFor="industry_sector">Industry Sector</Label>
        <Select
          value={data.industry_sector || ''}
          onValueChange={(value) => handleInputChange('industry_sector', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your industry sector" />
          </SelectTrigger>
          <SelectContent>
            {industrySectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          This helps us provide industry-specific legal templates and guidance
        </p>
      </div>

      {/* Company Size */}
      <div className="space-y-2">
        <Label htmlFor="company_size">Company Size</Label>
        <Select
          value={data.company_size || ''}
          onValueChange={(value) => handleInputChange('company_size', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {companySizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Company size helps us recommend appropriate service tiers
        </p>
      </div>

      {/* Business Type Benefits */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Business Account Benefits</h4>
        <div className="text-sm text-green-800">
          <p className="mb-2">With your business account, you'll get access to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Industry-specific legal document templates</li>
            <li>Team collaboration and document sharing</li>
            <li>Business compliance guidance</li>
            <li>Contract management tools</li>
            <li>Priority customer support</li>
            <li>Advanced analytics and reporting</li>
          </ul>
        </div>
      </div>

      {/* Account Type Specific Information */}
      {data.user_type === 'law_firm' && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Briefcase className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 mb-1">Law Firm Features</h4>
              <div className="text-sm text-purple-800">
                <p className="mb-2">As a law firm, you'll have access to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Professional legal document templates</li>
                  <li>Client portal and case management</li>
                  <li>White-label document generation</li>
                  <li>Advanced security and compliance tools</li>
                  <li>Integration with legal practice management systems</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.user_type === 'corporate' && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-indigo-900 mb-1">Corporate Features</h4>
              <div className="text-sm text-indigo-800">
                <p className="mb-2">Corporate accounts include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enterprise-grade security and compliance</li>
                  <li>Custom legal document workflows</li>
                  <li>API access for system integration</li>
                  <li>Dedicated account management</li>
                  <li>Custom training and onboarding</li>
                  <li>Advanced audit and reporting capabilities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

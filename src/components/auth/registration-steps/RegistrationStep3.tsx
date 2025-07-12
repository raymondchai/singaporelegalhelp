'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CreditCard, Building, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { RegistrationData } from '../RegistrationWizard'

interface RegistrationStep3Props {
  data: RegistrationData
  onUpdate: (data: Partial<RegistrationData>) => void
}

export function RegistrationStep3({ data, onUpdate }: RegistrationStep3Props) {
  const [validationStatus, setValidationStatus] = useState<{
    nric?: 'valid' | 'invalid' | 'pending'
    uen?: 'valid' | 'invalid' | 'pending'
  }>({})

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    onUpdate({ [field]: value })
    
    // Reset validation status when input changes
    if (field === 'singapore_nric') {
      setValidationStatus(prev => ({ ...prev, nric: undefined }))
    } else if (field === 'singapore_uen') {
      setValidationStatus(prev => ({ ...prev, uen: undefined }))
    }
  }

  const validateNRIC = (nric: string): boolean => {
    // Singapore NRIC validation algorithm
    if (!/^[STFG]\d{7}[A-Z]$/.test(nric)) return false
    
    const weights = [2, 7, 6, 5, 4, 3, 2]
    const letters = {
      'S': ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
      'T': ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
      'F': ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'],
      'G': ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K']
    }
    
    const prefix = nric[0] as keyof typeof letters
    const digits = nric.slice(1, 8).split('').map(Number)
    const checkLetter = nric[8]
    
    const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0)
    const expectedLetter = letters[prefix][sum % 11]
    
    return checkLetter === expectedLetter
  }

  const validateUEN = (uen: string): boolean => {
    // Basic UEN format validation
    return /^\d{8,10}[A-Z]$/.test(uen)
  }

  const handleNRICValidation = () => {
    if (!data.singapore_nric) return
    
    setValidationStatus(prev => ({ ...prev, nric: 'pending' }))
    
    setTimeout(() => {
      const isValid = validateNRIC(data.singapore_nric!)
      setValidationStatus(prev => ({ ...prev, nric: isValid ? 'valid' : 'invalid' }))
    }, 1000)
  }

  const handleUENValidation = () => {
    if (!data.singapore_uen) return
    
    setValidationStatus(prev => ({ ...prev, uen: 'pending' }))
    
    setTimeout(() => {
      const isValid = validateUEN(data.singapore_uen!)
      setValidationStatus(prev => ({ ...prev, uen: isValid ? 'valid' : 'invalid' }))
    }, 1000)
  }

  const isIndividual = data.user_type === 'individual'
  const isBusiness = ['business', 'law_firm', 'corporate'].includes(data.user_type || '')

  return (
    <div className="space-y-6">
      {/* Identity Verification Notice */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Singapore Identity Verification</h4>
            <p className="text-sm text-blue-800">
              To comply with Singapore regulations and provide you with accurate legal services, 
              we need to verify your identity. This information is encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      {/* Individual Identity Section */}
      {isIndividual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Individual Identity (NRIC)</span>
            </CardTitle>
            <CardDescription>
              Enter your Singapore NRIC for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="singapore_nric">NRIC Number *</Label>
              <div className="flex space-x-2">
                <Input
                  id="singapore_nric"
                  type="text"
                  placeholder="S1234567A"
                  value={data.singapore_nric || ''}
                  onChange={(e) => handleInputChange('singapore_nric', e.target.value.toUpperCase())}
                  className="flex-1"
                  maxLength={9}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNRICValidation}
                  disabled={!data.singapore_nric || validationStatus.nric === 'pending'}
                >
                  {validationStatus.nric === 'pending' ? 'Validating...' : 'Validate'}
                </Button>
              </div>
              
              {validationStatus.nric === 'valid' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">NRIC format is valid</span>
                </div>
              )}
              
              {validationStatus.nric === 'invalid' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invalid NRIC format. Please check and try again.</span>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Format: Letter + 7 digits + Letter (e.g., S1234567A)
              </p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date_of_birth"
                  type="date"
                  value={data.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="pl-10"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-sm text-gray-500">
                This helps us provide age-appropriate legal guidance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Identity Section */}
      {isBusiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Business Identity (UEN)</span>
            </CardTitle>
            <CardDescription>
              Enter your Singapore UEN for business verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="singapore_uen">UEN Number *</Label>
              <div className="flex space-x-2">
                <Input
                  id="singapore_uen"
                  type="text"
                  placeholder="201234567A"
                  value={data.singapore_uen || ''}
                  onChange={(e) => handleInputChange('singapore_uen', e.target.value.toUpperCase())}
                  className="flex-1"
                  maxLength={10}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUENValidation}
                  disabled={!data.singapore_uen || validationStatus.uen === 'pending'}
                >
                  {validationStatus.uen === 'pending' ? 'Validating...' : 'Validate'}
                </Button>
              </div>
              
              {validationStatus.uen === 'valid' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">UEN format is valid</span>
                </div>
              )}
              
              {validationStatus.uen === 'invalid' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invalid UEN format. Please check and try again.</span>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Format: 8-10 digits + Letter (e.g., 201234567A)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy and Security Notice */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Privacy & Security</h4>
        <div className="text-sm text-green-800 space-y-2">
          <p>Your identity information is:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Encrypted using industry-standard security</li>
            <li>Used only for verification and legal compliance</li>
            <li>Never shared with third parties</li>
            <li>Stored in accordance with PDPA requirements</li>
            <li>Can be deleted upon request</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

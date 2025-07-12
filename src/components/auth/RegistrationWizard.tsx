'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Scale, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Import step components
import { RegistrationStep1 } from './registration-steps/RegistrationStep1'
import { RegistrationStep2 } from './registration-steps/RegistrationStep2'
import { RegistrationStep3 } from './registration-steps/RegistrationStep3'
import { RegistrationStep4 } from './registration-steps/RegistrationStep4'
import { RegistrationStep5 } from './registration-steps/RegistrationStep5'

// Import validation schemas
import {
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  registrationStep4Schema,
  registrationStep5Schema,
  completeRegistrationSchema,
} from '@/lib/validation-schemas'

export interface RegistrationData {
  // Step 1
  email?: string
  password?: string
  confirm_password?: string
  full_name?: string
  user_type?: 'individual' | 'business' | 'law_firm' | 'corporate'
  
  // Step 2
  phone_number?: string
  address_street?: string
  address_unit?: string
  address_postal_code?: string
  address_country?: string
  
  // Step 3
  singapore_nric?: string
  singapore_uen?: string
  date_of_birth?: string
  
  // Step 4
  company_name?: string
  business_registration_number?: string
  industry_sector?: string
  company_size?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  
  // Step 5
  practice_areas_interest?: string[]
  notification_preferences?: {
    email: boolean
    sms: boolean
    push: boolean
  }
  language_preference?: 'en' | 'zh' | 'ms' | 'ta'
  terms_accepted?: boolean
  privacy_policy_accepted?: boolean
  pdpa_consent?: boolean
  marketing_consent?: boolean
}

const STEPS = [
  { id: 1, title: 'Account Setup', description: 'Basic account information' },
  { id: 2, title: 'Contact Details', description: 'Your contact information' },
  { id: 3, title: 'Identity Verification', description: 'Singapore ID verification' },
  { id: 4, title: 'Business Information', description: 'Company details (if applicable)' },
  { id: 5, title: 'Preferences', description: 'Platform preferences and consent' },
]

export default function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    user_type: 'individual',
    address_country: 'Singapore',
    notification_preferences: { email: true, sms: false, push: true },
    language_preference: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({})
  
  const router = useRouter()
  const { toast } = useToast()

  const updateRegistrationData = (stepData: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...stepData }))
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    try {
      switch (currentStep) {
        case 1:
          registrationStep1Schema.parse(registrationData)
          break
        case 2:
          registrationStep2Schema.parse(registrationData)
          break
        case 3:
          registrationStep3Schema.parse(registrationData)
          break
        case 4:
          // Step 4 is optional for individuals
          if (registrationData.user_type !== 'individual') {
            registrationStep4Schema.parse(registrationData)
          }
          break
        case 5:
          registrationStep5Schema.parse(registrationData)
          break
        default:
          return false
      }
      
      setStepValidation(prev => ({ ...prev, [currentStep]: true }))
      return true
    } catch (error) {
      console.error('Step validation failed:', error)
      setStepValidation(prev => ({ ...prev, [currentStep]: false }))
      return false
    }
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      })
      return
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Validate complete registration data
      const validatedData = completeRegistrationSchema.parse(registrationData)

      // Call the enhanced registration API
      const response = await fetch('/api/auth/register-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account.',
      })

      router.push('/auth/login?message=registration-success')
    } catch (error: any) {
      console.error('Registration failed:', error)
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const shouldShowStep4 = registrationData.user_type !== 'individual'
  const totalSteps = shouldShowStep4 ? STEPS.length : STEPS.length - 1
  const progressPercentage = (currentStep / totalSteps) * 100

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RegistrationStep1
            data={registrationData}
            onUpdate={updateRegistrationData}
          />
        )
      case 2:
        return (
          <RegistrationStep2
            data={registrationData}
            onUpdate={updateRegistrationData}
          />
        )
      case 3:
        return (
          <RegistrationStep3
            data={registrationData}
            onUpdate={updateRegistrationData}
          />
        )
      case 4:
        return shouldShowStep4 ? (
          <RegistrationStep4
            data={registrationData}
            onUpdate={updateRegistrationData}
          />
        ) : null
      case 5:
        return (
          <RegistrationStep5
            data={registrationData}
            onUpdate={updateRegistrationData}
          />
        )
      default:
        return null
    }
  }

  // Skip step 4 for individuals
  const getNextStep = () => {
    if (currentStep === 3 && !shouldShowStep4) {
      return 5
    }
    return currentStep + 1
  }

  const getPreviousStep = () => {
    if (currentStep === 5 && !shouldShowStep4) {
      return 3
    }
    return currentStep - 1
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Singapore Legal Help</span>
          </div>
          <p className="text-gray-600">Create your account - Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            {STEPS.filter(step => shouldShowStep4 || step.id !== 4).map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id === currentStep ? 'text-blue-600 font-medium' : ''
                } ${stepValidation[step.id] ? 'text-green-600' : ''}`}
              >
                {stepValidation[step.id] && (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1]?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(getPreviousStep())}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(getNextStep())}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

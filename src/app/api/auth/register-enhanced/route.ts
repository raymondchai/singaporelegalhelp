import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { completeRegistrationSchema } from '@/lib/validation-schemas'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the registration data
    const validatedData = completeRegistrationSchema.parse(body)
    
    // Create the user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.full_name,
          user_type: validatedData.user_type,
        },
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      )
    }

    // Create the user profile (compatible with current profiles table)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        phone: validatedData.phone_number,
        user_type: validatedData.user_type,
        singapore_nric: validatedData.singapore_nric,
        law_firm_uen: validatedData.singapore_uen, // Map UEN to law_firm_uen field
        subscription_status: 'free'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Note: User account was created but profile failed
      // In production, you might want to implement cleanup or retry logic
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    // Log consent records (if table exists)
    try {
      const consentRecords = [
        {
          user_id: authData.user.id,
          consent_type: 'terms',
          consent_given: validatedData.terms_accepted,
          consent_version: '1.0',
          consent_method: 'registration',
        },
        {
          user_id: authData.user.id,
          consent_type: 'privacy',
          consent_given: validatedData.privacy_policy_accepted,
          consent_version: '1.0',
          consent_method: 'registration',
        },
        {
          user_id: authData.user.id,
          consent_type: 'pdpa',
          consent_given: validatedData.pdpa_consent,
          consent_version: '1.0',
          consent_method: 'registration',
        },
        {
          user_id: authData.user.id,
          consent_type: 'marketing',
          consent_given: validatedData.marketing_consent ?? false,
          consent_version: '1.0',
          consent_method: 'registration',
        },
      ]

      const { error: consentError } = await supabase
        .from('user_consent_records')
        .insert(consentRecords)

      if (consentError) {
        console.log('Consent table not available:', consentError.message)
      }
    } catch (error: any) {
      console.log('Consent logging skipped - table may not exist:', error.message)
    }

    // Log registration activity
    const { error: activityError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: authData.user.id,
        activity_type: 'user_registration',
        metadata: {
          user_type: validatedData.user_type,
          registration_method: 'enhanced_wizard',
          has_singapore_id: !!(validatedData.singapore_nric ?? validatedData.singapore_uen),
        },
      })

    if (activityError) {
      console.error('Activity logging error:', activityError)
      // Non-critical error, continue with registration
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed: authData.user.email_confirmed_at !== null,
      },
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validate Singapore NRIC endpoint
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'validate-nric') {
      const { nric } = await request.json()
      
      if (!nric || typeof nric !== 'string') {
        return NextResponse.json(
          { error: 'NRIC is required' },
          { status: 400 }
        )
      }

      // Basic format validation
      const nricPattern = /^[STFG]\d{7}[A-Z]$/
      if (!nricPattern.test(nric)) {
        return NextResponse.json({
          valid: false,
          message: 'Invalid NRIC format'
        })
      }

      // Check digit validation
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
      
      const isValid = checkLetter === expectedLetter
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Valid NRIC' : 'Invalid NRIC check digit'
      })
    }
    
    if (action === 'validate-uen') {
      const { uen } = await request.json()
      
      if (!uen || typeof uen !== 'string') {
        return NextResponse.json(
          { error: 'UEN is required' },
          { status: 400 }
        )
      }

      // Basic UEN format validation
      const uenPattern = /^\d{8,10}[A-Z]$/
      const isValid = uenPattern.test(uen)
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Valid UEN format' : 'Invalid UEN format'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const businessInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  business_registration_number: z.string().max(50, 'Registration number too long').optional(),
  industry_sector: z.string().max(100, 'Industry sector too long').optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has a business account type
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.user_type === 'individual') {
      return NextResponse.json(
        { error: 'Business information is not applicable for individual accounts' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = businessInfoSchema.parse(body)

    // Update business information
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Business info update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update business information' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'business_info_updated',
        details: {
          updated_fields: Object.keys(validatedData),
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error('Business info error:', error)
    
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

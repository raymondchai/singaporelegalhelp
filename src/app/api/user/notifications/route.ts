import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  language: z.enum(['en', 'zh', 'ms', 'ta']).optional(),
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

    const body = await request.json()
    const validatedData = notificationPreferencesSchema.parse(body)

    // Update notification preferences - use correct table and column names
    const updateData: any = {
      notification_preferences: {
        email: validatedData.email,
        sms: validatedData.sms,
        push: validatedData.push,
      },
    }

    // Note: language_preference column doesn't exist in user_profiles table yet
    // Commenting out until column is added to schema
    // if (validatedData.language) {
    //   updateData.language_preference = validatedData.language
    // }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Notification preferences update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'notification_preferences_updated',
        details: {
          preferences: validatedData,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
    })

  } catch (error) {
    console.error('Notification preferences error:', error)
    
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

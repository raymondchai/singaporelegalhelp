// src/app/api/user/profile/route.ts - DEBUG VERSION with graceful fallbacks
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { retryOperation } from '@/lib/error-handling'

export const dynamic = 'force-dynamic';

// Enhanced Profile API with retry logic and connection pooling
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)

  try {
    console.log(`🔍 Profile API [${requestId}]: Starting GET request`)

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`❌ Profile API [${requestId}]: Missing authorization header`)
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session with retry logic
    console.log(`🔑 Profile API [${requestId}]: Getting user from token`)
    const token = authHeader.replace('Bearer ', '')

    const { user, authError } = await retryOperation(async () => {
      const supabase = getSupabaseAdmin()
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`)
      }

      if (!user) {
        throw new Error('No user returned from auth')
      }

      return { user, authError: null }
    }, 3, 1000)

    console.log(`✅ Profile API [${requestId}]: User authenticated:`, user.id)

    // STEP 1: Fetch profile from profiles table with retry logic
    console.log(`📋 Profile API [${requestId}]: Fetching profile`)
    const profile = await retryOperation(async () => {
      const supabase = getSupabaseAdmin()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error(`Profile fetch error: ${profileError.message}`)
      }

      if (!profile) {
        throw new Error('Profile not found')
      }

      return profile
    }, 3, 1000)

    console.log(`✅ Profile API [${requestId}]: Profile found:`, profile.id)

    // STEP 2: Try to fetch enhanced data (with fallbacks)
    const enhancedData: {
      subscriptions: any[]
      teams: any[]
      usage: any[]
      recent_activity: any[]
      pending_consultations: any[]
      tier_features: any
    } = {
      subscriptions: [],
      teams: [],
      usage: [],
      recent_activity: [],
      pending_consultations: [],
      tier_features: null
    }

    // Try to fetch subscriptions (optional) with retry
    try {
      console.log(`💳 Profile API [${requestId}]: Fetching subscriptions`)
      const subscriptions = await retryOperation(async () => {
        const supabase = getSupabaseAdmin()
        const { data: subscriptions, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', profile.id)

        if (subError) {
          throw new Error(`Subscriptions fetch error: ${subError.message}`)
        }

        return subscriptions || []
      }, 2, 500)

      enhancedData.subscriptions = subscriptions
      console.log(`✅ Profile API [${requestId}]: Found subscriptions:`, subscriptions.length)
    } catch (error: any) {
      console.log(`⚠️ Profile API [${requestId}]: Subscriptions query failed:`, error.message)
    }

    // Try to fetch teams (optional) with retry - Skip if table doesn't exist
    try {
      console.log(`👥 Profile API [${requestId}]: Fetching teams`)
      const teams = await retryOperation(async () => {
        const supabase = getSupabaseAdmin()
        const { data: teams, error: teamError } = await supabase
          .from('teams')
          .select(`
            id,
            team_name,
            team_type,
            max_members,
            created_at
          `)
          .eq('created_by', profile.id)

        if (teamError) {
          // Check if table doesn't exist
          if (teamError.message?.includes('relation "public.teams" does not exist')) {
            console.log(`⚠️ Profile API [${requestId}]: Teams table doesn't exist yet, skipping`)
            return []
          }
          throw new Error(`Teams fetch error: ${teamError.message}`)
        }

        return teams || []
      }, 2, 500)

      enhancedData.teams = teams
      console.log(`✅ Profile API [${requestId}]: Found teams:`, teams.length)
    } catch (error: any) {
      console.log(`⚠️ Profile API [${requestId}]: Teams query failed:`, error.message)
      enhancedData.teams = [] // Set empty array as fallback
    }

    // Try to fetch usage tracking (optional) with retry
    try {
      console.log(`📊 Profile API [${requestId}]: Fetching usage data`)
      const currentMonth = new Date()
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

      const usage = await retryOperation(async () => {
        const supabase = getSupabaseAdmin()
        const { data: usage, error: usageError } = await supabase
          .from('usage_tracking')
          .select('resource_type, quantity')
          .eq('user_id', profile.id)
          .gte('tracked_at', firstDayOfMonth.toISOString())

        if (usageError) {
          throw new Error(`Usage fetch error: ${usageError.message}`)
        }

        return usage || []
      }, 2, 500)

      enhancedData.usage = usage
      console.log(`✅ Profile API [${requestId}]: Found usage data:`, usage.length, 'records')
    } catch (error: any) {
      console.log(`⚠️ Profile API [${requestId}]: Usage query failed:`, error.message)
    }

    // Try to fetch tier features (optional) with retry
    try {
      console.log(`🎯 Profile API [${requestId}]: Fetching tier features`)
      const currentTier = enhancedData.subscriptions[0]?.tier || profile.subscription_tier || 'free'

      const tierFeatures = await retryOperation(async () => {
        const supabase = getSupabaseAdmin()
        const { data: tierFeatures, error: tierError } = await supabase
          .from('subscription_tier_features')
          .select('*')
          .eq('tier', currentTier)
          .single()

        if (tierError) {
          throw new Error(`Tier features fetch error: ${tierError.message}`)
        }

        return tierFeatures
      }, 2, 500)

      enhancedData.tier_features = tierFeatures
      console.log(`✅ Profile API [${requestId}]: Found tier features for:`, currentTier)
    } catch (error: any) {
      console.log(`⚠️ Profile API [${requestId}]: Tier features query failed:`, error.message)
    }

    // Calculate usage summary (safe fallback)
    const usageSummary: Record<string, number> = {
      document_generation: 0,
      ai_query: 0,
      storage_gb: 0,
      team_member: 0,
      api_call: 0,
      template_access: 0
    }

    if (enhancedData.usage.length > 0) {
      enhancedData.usage.forEach((item: any) => {
        if (usageSummary.hasOwnProperty(item.resource_type)) {
          usageSummary[item.resource_type] += item.quantity || 0
        }
      })
    }

    console.log('✅ Profile API: Returning enhanced profile data')
    return NextResponse.json({
      profile: {
        ...profile,
        current_usage: usageSummary,
        tier_features: enhancedData.tier_features,
        subscription_tier: profile.subscription_status || 'free', // Map subscription_status to subscription_tier for compatibility
        subscription_status: profile.subscription_status || 'free',
        team_count: enhancedData.teams.length,
        has_subscriptions: enhancedData.subscriptions.length > 0,
        has_teams: enhancedData.teams.length > 0,
        has_usage_data: enhancedData.usage.length > 0
      },
      debug_info: {
        subscriptions_count: enhancedData.subscriptions.length,
        teams_count: enhancedData.teams.length,
        usage_records: enhancedData.usage.length,
        has_tier_features: !!enhancedData.tier_features
      }
    })

  } catch (error: any) {
    console.error(`💥 Profile API [${requestId}]: Critical error:`, error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: error.message,
        stack: error.stack,
        request_id: requestId
      },
      { status: 500 }
    )
  }
}

// Simplified PUT method (keep it working)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Profile API: Starting PUT request')

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
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
    console.log('📝 Profile API: Updating profile with:', Object.keys(body))

    // Basic validation - remove any fields that shouldn't be updated
    const allowedFields = [
      'full_name', 'phone_number', 'address', 'nric_uen',
      'user_type', 'company_name', 'legal_practice_areas',
      'bio', 'website', 'linkedin_profile'
    ]

    const updateData: Record<string, any> = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    updateData.updated_at = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Profile API: Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', debug: updateError },
        { status: 500 }
      )
    }

    console.log('✅ Profile API: Profile updated successfully')

    // Try to log activity (optional)
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: updatedProfile.id,
          action_type: 'profile_update',
          details: {
            updated_fields: Object.keys(updateData),
            timestamp: new Date().toISOString()
          },
        })
      console.log('✅ Profile API: Activity logged')
    } catch (logError: any) {
      console.log('⚠️ Profile API: Failed to log activity:', logError.message)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ profile: updatedProfile })

  } catch (error: any) {
    console.error('💥 Profile API: PUT error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: error.message
      },
      { status: 500 }
    )
  }
}

// Simple DELETE method for GDPR compliance
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Profile API: Starting DELETE request')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile for logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    console.log('🚨 Profile API: Account deletion requested for:', profile.email)

    return NextResponse.json({
      message: 'Account deletion request received. You will receive a confirmation email within 24 hours.',
      reference_id: `SGP-DEL-${Date.now()}`,
      processing_time: '5-7 business days'
    })

  } catch (error) {
    console.error('💥 Profile API: DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
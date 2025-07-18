import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('👥 Admin Users API: Starting request')
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the session and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('👥 Admin Users API: Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin access
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('role, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (roleError || !adminRole) {
      console.error('👥 Admin Users API: Admin access denied')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('👥 Admin Users API: Admin access verified:', adminRole.role)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const userType = searchParams.get('user_type') || ''
    const subscriptionTier = searchParams.get('subscription_tier') || ''

    // Build query for profiles with auth users data
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_type,
        company_name,
        phone_number,
        subscription_tier,
        subscription_status,
        created_at,
        updated_at
      `)

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    if (userType) {
      query = query.eq('user_type', userType)
    }

    if (subscriptionTier) {
      query = query.eq('subscription_tier', subscriptionTier)
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get paginated results
    const { data: profiles, error: profilesError } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (profilesError) {
      console.error('👥 Admin Users API: Profiles query error:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // For now, we'll use profile data only since auth.admin requires special setup
    // In production, you'd configure proper admin auth access
    console.log('👥 Admin Users API: Using profile data only (auth.admin not configured)');

    // Use profile data (email is stored in profiles table)
    const users = profiles?.map(profile => {
      return {
        id: profile.id,
        email: profile.email || 'Unknown',
        full_name: profile.full_name,
        user_type: profile.user_type,
        company_name: profile.company_name || null,
        phone_number: profile.phone_number || null,
        subscription_tier: profile.subscription_tier || 'free',
        subscription_status: profile.subscription_status || 'active',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: null, // Would need auth.admin access
        email_confirmed_at: null, // Would need auth.admin access
        email_confirmed: true // Assume confirmed for now
      }
    }) || []

    console.log(`👥 Admin Users API: Returning ${users.length} users`)

    return NextResponse.json({
      users,
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    })

  } catch (error) {
    console.error('💥 Admin Users API: Critical error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Update user (for admin actions like suspend, change tier, etc.)
export async function PATCH(request: NextRequest) {
  console.log('👥 Admin Users API: Starting PATCH request')
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the session and verify admin access
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin access
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('role, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (roleError || !adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 })
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: updates.subscription_tier,
        subscription_status: updates.subscription_status,
        user_type: updates.user_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('👥 Admin Users API: Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    console.log('👥 Admin Users API: User updated successfully:', userId)

    return NextResponse.json({ 
      success: true, 
      user: updatedProfile 
    })

  } catch (error) {
    console.error('💥 Admin Users API: PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔐 Admin Roles API: Starting request')
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('🔐 Admin Roles API: Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('🔐 Admin Roles API: Checking roles for user:', session.user.id)

    // Query admin roles for the current user
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('role, permissions, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (roleError) {
      console.log('🔐 Admin Roles API: No admin role found:', roleError.message)
      return NextResponse.json({ 
        isAdmin: false, 
        role: null, 
        permissions: null 
      })
    }

    if (!adminRole || !adminRole.is_active) {
      console.log('🔐 Admin Roles API: Admin role inactive')
      return NextResponse.json({ 
        isAdmin: false, 
        role: null, 
        permissions: null 
      })
    }

    console.log('🔐 Admin Roles API: Admin role found:', adminRole.role)
    return NextResponse.json({
      isAdmin: true,
      role: adminRole.role,
      permissions: adminRole.permissions,
      is_active: adminRole.is_active
    })

  } catch (error) {
    console.error('💥 Admin Roles API: Critical error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

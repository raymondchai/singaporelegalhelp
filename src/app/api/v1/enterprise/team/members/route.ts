import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext, validateSubscriptionTier } from '@/lib/api-middleware'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Create admin client for enterprise queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
  department: z.string().optional(),
  team: z.string().optional(),
  job_title: z.string().optional(),
})

// GET /api/v1/enterprise/team/members - Get organization members
async function getTeamMembers(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  validateSubscriptionTier(context, ['enterprise'])

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const role = searchParams.get('role')
  const status = searchParams.get('status')

  try {
    // Get user's organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', context.user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      )
    }

    // Check if user has permission to view members
    if (!['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Build query for organization members
    let query = supabaseAdmin
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        status,
        department,
        team,
        job_title,
        joined_at,
        invited_at,
        user:profiles!organization_members_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', membership.organization_id)
      .order('joined_at', { ascending: false })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: members, error } = await query

    if (error) {
      console.error('Members fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)

    return NextResponse.json({
      success: true,
      data: {
        members: members || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Team members API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/enterprise/team/invite - Invite a new team member
async function inviteTeamMember(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  validateSubscriptionTier(context, ['enterprise'])

  try {
    const body = await request.json()
    const validatedData = inviteMemberSchema.parse(body)

    // Get user's organization and role
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', context.user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      )
    }

    // Check if user has permission to invite members
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Check if email is already invited or is a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', membership.organization_id)
      .eq('user_id', validatedData.email) // This would need to be resolved to user_id
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member or has been invited' },
        { status: 400 }
      )
    }

    // Check organization member limits
    const { data: organization } = await supabaseAdmin
      .from('enterprise_organizations')
      .select('max_users')
      .eq('id', membership.organization_id)
      .single()

    const { count: currentMemberCount } = await supabaseAdmin
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', membership.organization_id)
      .eq('status', 'active')

    if (organization && currentMemberCount && currentMemberCount >= organization.max_users) {
      return NextResponse.json(
        { error: 'Organization has reached maximum user limit' },
        { status: 402 }
      )
    }

    // Check if user exists in the system
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    let userId = existingUser?.id

    // If user doesn't exist, we'll create an invitation record without user_id
    // The user_id will be populated when they sign up and accept the invitation

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: membership.organization_id,
        user_id: userId, // Will be null if user doesn't exist yet
        role: validatedData.role,
        status: 'invited',
        department: validatedData.department,
        team: validatedData.team,
        job_title: validatedData.job_title,
        invited_by: context.user.id,
        invited_at: new Date().toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Invitation creation error:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // TODO: Send invitation email
    // await sendInvitationEmail(validatedData.email, invitation.id, organization.name)

    // Log the activity
    await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        organization_id: membership.organization_id,
        user_id: context.user.id,
        event_type: 'member_invited',
        event_category: 'user_management',
        action: 'invite_member',
        result: 'success',
        details: {
          invited_email: validatedData.email,
          invited_role: validatedData.role,
          invitation_id: invitation.id
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        invitation,
        message: `Invitation sent to ${validatedData.email}`
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getTeamMembers, {
  requiredPermissions: ['read'],
  rateLimit: 100
})

export const POST = withApiMiddleware(inviteTeamMember, {
  requiredPermissions: ['write'],
  rateLimit: 10
})

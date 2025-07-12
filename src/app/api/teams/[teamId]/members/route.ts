import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
})

// Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
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

    const { teamId } = params

    // Check if user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get all team members with their profiles
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        team_id,
        role,
        status,
        joined_at,
        invited_at,
        profiles (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Team members fetch error:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedMembers = members?.map(member => ({
      id: member.id,
      user_id: member.user_id,
      team_id: member.team_id,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
      invited_at: member.invited_at,
      user_profile: {
        full_name: (member as any).profiles?.full_name || 'Unknown User',
        email: (member as any).profiles?.email || '',
        avatar_url: (member as any).profiles?.avatar_url,
      },
    })) || []

    return NextResponse.json({
      members: formattedMembers,
      total_members: formattedMembers.length,
      user_role: membership.role,
    })

  } catch (error) {
    console.error('Team members GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Invite a new member
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
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

    const { teamId } = params

    // Check if user can invite members (owner, admin, or manager)
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = inviteMemberSchema.parse(body)

    // Check if user exists
    const { data: inviteeProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', validatedData.email)
      .single()

    if (profileError || !inviteeProfile) {
      return NextResponse.json(
        { error: 'User not found with this email address' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', inviteeProfile.id)
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json(
          { error: 'User is already a member of this team' },
          { status: 400 }
        )
      } else if (existingMember.status === 'invited') {
        return NextResponse.json(
          { error: 'User has already been invited to this team' },
          { status: 400 }
        )
      }
    }

    // Check team member limit
    const { data: currentMembers, error: countError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('status', 'active')

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('max_members')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (currentMembers && currentMembers.length >= team.max_members) {
      return NextResponse.json(
        { error: 'Team has reached maximum member limit' },
        { status: 400 }
      )
    }

    // Create the team member invitation
    const { data: newMember, error: inviteError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: inviteeProfile.id,
        role: validatedData.role,
        status: 'invited',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Team invitation error:', inviteError)
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'team_member_invited',
        resource_type: 'team',
        resource_id: teamId,
        details: {
          invited_user_email: validatedData.email,
          invited_user_id: inviteeProfile.id,
          role: validatedData.role,
        },
      })

    // In a real implementation, you would send an email invitation here
    // For now, we'll just return success

    return NextResponse.json({
      message: 'Team invitation sent successfully',
      member: {
        id: newMember.id,
        user_id: inviteeProfile.id,
        team_id: teamId,
        role: validatedData.role,
        status: 'invited',
        invited_at: newMember.invited_at,
        user_profile: {
          full_name: inviteeProfile.full_name,
          email: inviteeProfile.email,
        },
      },
    })

  } catch (error) {
    console.error('Team invitation error:', error)
    
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

// Update member role or status
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
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

    const { teamId } = params
    const { member_id, role, status } = await request.json()

    if (!member_id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update the member
    const updateData: any = {}
    if (role) updateData.role = role
    if (status) updateData.status = status

    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', member_id)
      .eq('team_id', teamId)
      .select()
      .single()

    if (updateError) {
      console.error('Member update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Member updated successfully',
      member: updatedMember,
    })

  } catch (error) {
    console.error('Member update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

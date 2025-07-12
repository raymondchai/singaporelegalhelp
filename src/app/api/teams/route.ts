import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createTeamSchema = z.object({
  team_name: z.string().min(2, 'Team name must be at least 2 characters').max(100, 'Team name too long'),
  team_description: z.string().max(500, 'Description too long').optional(),
  team_type: z.enum(['business', 'law_firm', 'department']).default('business'),
  max_members: z.number().min(2).max(100).default(10),
})

// Get user's teams
export async function GET(request: NextRequest) {
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

    // Get teams where user is owner or member
    const { data: teamMemberships, error: membershipsError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        status,
        teams (
          id,
          team_name,
          team_description,
          team_type,
          max_members,
          owner_id,
          settings,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (membershipsError) {
      console.error('Team memberships fetch error:', membershipsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Get member counts for each team
    const teamIds = teamMemberships?.map(tm => tm.team_id) || []
    const { data: memberCounts, error: countsError } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)
      .eq('status', 'active')

    if (countsError) {
      console.error('Member counts fetch error:', countsError)
    }

    // Count members per team
    const memberCountMap = (memberCounts || []).reduce((acc, member) => {
      acc[member.team_id] = (acc[member.team_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Format teams data
    const teams = teamMemberships?.map(tm => ({
      ...tm.teams,
      member_count: memberCountMap[tm.team_id] || 0,
      user_role: tm.role,
    })) || []

    return NextResponse.json({
      teams,
      total_teams: teams.length,
    })

  } catch (error) {
    console.error('Teams GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new team
export async function POST(request: NextRequest) {
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

    // Check if user has a business account
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
        { error: 'Team creation is only available for business accounts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        ...validatedData,
        owner_id: user.id,
        settings: {
          allow_external_sharing: false,
          require_approval: true,
        },
      })
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    // Add the creator as the team owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('Team member creation error:', memberError)
      // Try to clean up the team if member creation failed
      await supabase.from('teams').delete().eq('id', team.id)
      return NextResponse.json(
        { error: 'Failed to create team membership' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'team_created',
        resource_type: 'team',
        resource_id: team.id,
        details: {
          team_name: team.team_name,
          team_type: team.team_type,
        },
      })

    return NextResponse.json({
      message: 'Team created successfully',
      team: {
        ...team,
        member_count: 1,
        user_role: 'owner',
      },
    })

  } catch (error) {
    console.error('Team creation error:', error)
    
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

// Update team settings
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

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Check if user is team owner or admin
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

    const body = await request.json()
    const updateData = createTeamSchema.partial().parse(body)

    // Update the team
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single()

    if (updateError) {
      console.error('Team update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'team_updated',
        resource_type: 'team',
        resource_id: teamId,
        details: {
          updated_fields: Object.keys(updateData),
        },
      })

    return NextResponse.json({
      message: 'Team updated successfully',
      team: updatedTeam,
    })

  } catch (error) {
    console.error('Team update error:', error)
    
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

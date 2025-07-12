import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Milestones API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Milestones API: Missing authorization header')
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
    const supabase = getSupabaseAdmin()
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.log('❌ Milestones API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const practiceArea = searchParams.get('practice_area')
    const limit = searchParams.get('limit')

    console.log('🎯 Milestones API: Fetching milestones for user:', user.id)

    // Build the query
    let query = supabase
      .from('legal_milestones')
      .select(`
        id,
        title,
        description,
        category,
        status,
        start_date,
        target_date,
        completed_date,
        tasks,
        deadlines,
        practice_area,
        progress_percentage,
        critical_path,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('target_date', { ascending: true })

    // Add filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (practiceArea) {
      query = query.eq('practice_area', practiceArea)
    }

    // Add limit
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: milestones, error: milestonesError } = await query

    if (milestonesError) {
      console.error('❌ Milestones API: Error fetching milestones:', milestonesError)
      
      // Check if table doesn't exist
      if (milestonesError.message?.includes('relation "legal_milestones" does not exist')) {
        return NextResponse.json({
          milestones: [],
          message: 'Legal milestones table not created yet. Please run database migrations.'
        })
      }
      
      throw milestonesError
    }

    console.log('✅ Milestones API: Found', milestones?.length || 0, 'milestones')

    // Transform the data to match LegalMilestone interface
    const transformedMilestones = (milestones || []).map(milestone => ({
      id: milestone.id,
      userId: user.id,
      title: milestone.title,
      description: milestone.description || '',
      category: milestone.category,
      status: milestone.status,
      startDate: milestone.start_date,
      targetDate: milestone.target_date,
      completedDate: milestone.completed_date,
      tasks: milestone.tasks || [],
      deadlines: milestone.deadlines || [],
      practiceArea: milestone.practice_area,
      progressPercentage: milestone.progress_percentage || 0,
      criticalPath: milestone.critical_path || false,
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at
    }))

    return NextResponse.json({
      milestones: transformedMilestones,
      count: transformedMilestones.length
    })

  } catch (error: any) {
    console.error('❌ Milestones API: Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Milestones API: Creating new milestone')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
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

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      category = 'project_milestone',
      startDate,
      targetDate,
      practiceArea,
      tasks = [],
      deadlines = [],
      criticalPath = false
    } = body

    // Validate required fields
    if (!title || !startDate || !targetDate || !practiceArea) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, targetDate, practiceArea' },
        { status: 400 }
      )
    }

    // Create the milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('legal_milestones')
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        status: 'planned',
        start_date: startDate,
        target_date: targetDate,
        tasks,
        deadlines,
        practice_area: practiceArea,
        progress_percentage: 0,
        critical_path: criticalPath
      })
      .select()
      .single()

    if (milestoneError) {
      console.error('❌ Milestones API: Error creating milestone:', milestoneError)
      throw milestoneError
    }

    console.log('✅ Milestones API: Created milestone:', milestone.id)

    return NextResponse.json({
      milestone,
      message: 'Milestone created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Milestones API: Error creating milestone:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create milestone',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🎯 Milestones API: Updating milestone')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
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

    // Parse request body
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing milestone ID' },
        { status: 400 }
      )
    }

    // Update the milestone
    const { data: milestone, error: updateError } = await supabase
      .from('legal_milestones')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        completed_date: updateData.status === 'completed' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the milestone
      .select()
      .single()

    if (updateError) {
      console.error('❌ Milestones API: Error updating milestone:', updateError)
      throw updateError
    }

    console.log('✅ Milestones API: Updated milestone:', milestone.id)

    return NextResponse.json({
      milestone,
      message: 'Milestone updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Milestones API: Error updating milestone:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update milestone',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🎯 Milestones API: Deleting milestone')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    // Get the current user from the session
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

    // Get milestone ID from query parameters
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing milestone ID' },
        { status: 400 }
      )
    }

    // Delete the milestone
    const { error: deleteError } = await supabase
      .from('legal_milestones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the milestone

    if (deleteError) {
      console.error('❌ Milestones API: Error deleting milestone:', deleteError)
      throw deleteError
    }

    console.log('✅ Milestones API: Deleted milestone:', id)

    return NextResponse.json({
      message: 'Milestone deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Milestones API: Error deleting milestone:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete milestone',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

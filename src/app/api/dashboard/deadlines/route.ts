import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('⚖️ Deadlines API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Deadlines API: Missing authorization header')
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
      console.log('❌ Deadlines API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const practiceArea = searchParams.get('practice_area')
    const limit = searchParams.get('limit')
    const upcoming = searchParams.get('upcoming') // for dashboard widgets

    console.log('⚖️ Deadlines API: Fetching deadlines for user:', user.id)

    // Build the query
    let query = supabase
      .from('legal_deadlines')
      .select(`
        id,
        title,
        description,
        deadline_date,
        deadline_time,
        practice_area,
        priority,
        status,
        category,
        court_type,
        case_number,
        court_location,
        related_documents,
        related_tasks,
        assigned_to,
        is_recurring,
        recurring_frequency,
        recurring_interval,
        recurring_end_date,
        created_at,
        updated_at,
        completed_at
      `)
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order('deadline_date', { ascending: true })

    // Add filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (practiceArea) {
      query = query.eq('practice_area', practiceArea)
    }

    // For upcoming deadlines widget
    if (upcoming) {
      const daysAhead = parseInt(upcoming) || 30
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)
      
      query = query
        .in('status', ['upcoming', 'due_today'])
        .lte('deadline_date', futureDate.toISOString().split('T')[0])
    }

    // Add limit
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: deadlines, error: deadlinesError } = await query

    if (deadlinesError) {
      console.error('❌ Deadlines API: Error fetching deadlines:', deadlinesError)
      
      // Check if table doesn't exist
      if (deadlinesError.message?.includes('relation "legal_deadlines" does not exist')) {
        return NextResponse.json({
          deadlines: [],
          message: 'Legal deadlines table not created yet. Please run database migrations.'
        })
      }
      
      throw deadlinesError
    }

    console.log('✅ Deadlines API: Found', deadlines?.length || 0, 'deadlines')

    // Transform the data to match LegalDeadline interface
    const transformedDeadlines = (deadlines || []).map(deadline => ({
      id: deadline.id,
      userId: user.id,
      title: deadline.title,
      description: deadline.description || '',
      deadlineDate: deadline.deadline_date,
      deadlineTime: deadline.deadline_time,
      practiceArea: deadline.practice_area,
      priority: deadline.priority,
      status: deadline.status,
      category: deadline.category,
      courtType: deadline.court_type,
      caseNumber: deadline.case_number,
      courtLocation: deadline.court_location,
      reminders: [], // Will be populated from deadline_reminders table
      relatedDocuments: deadline.related_documents || [],
      relatedTasks: deadline.related_tasks || [],
      assignedTo: deadline.assigned_to,
      isRecurring: deadline.is_recurring || false,
      recurringPattern: deadline.is_recurring ? {
        frequency: deadline.recurring_frequency,
        interval: deadline.recurring_interval || 1,
        endDate: deadline.recurring_end_date
      } : undefined,
      createdAt: deadline.created_at,
      updatedAt: deadline.updated_at,
      completedAt: deadline.completed_at
    }))

    // Get statistics if requested
    const includeStats = searchParams.get('include_stats') === 'true'
    let statistics = null

    if (includeStats) {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_deadline_statistics', { p_user_id: user.id })

      if (!statsError && stats && stats.length > 0) {
        statistics = stats[0]
      }
    }

    return NextResponse.json({
      deadlines: transformedDeadlines,
      count: transformedDeadlines.length,
      statistics
    })

  } catch (error: any) {
    console.error('❌ Deadlines API: Unexpected error:', error)
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
    console.log('⚖️ Deadlines API: Creating new deadline')

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
      deadlineDate,
      deadlineTime,
      practiceArea,
      priority = 'medium',
      category = 'other',
      courtType,
      caseNumber,
      courtLocation,
      relatedDocuments = [],
      relatedTasks = [],
      assignedTo,
      isRecurring = false,
      recurringPattern
    } = body

    // Validate required fields
    if (!title || !deadlineDate || !practiceArea) {
      return NextResponse.json(
        { error: 'Missing required fields: title, deadlineDate, practiceArea' },
        { status: 400 }
      )
    }

    // Create the deadline
    const { data: deadline, error: deadlineError } = await supabase
      .from('legal_deadlines')
      .insert({
        user_id: user.id,
        title,
        description,
        deadline_date: deadlineDate,
        deadline_time: deadlineTime,
        practice_area: practiceArea,
        priority,
        status: 'upcoming',
        category,
        court_type: courtType,
        case_number: caseNumber,
        court_location: courtLocation,
        related_documents: relatedDocuments,
        related_tasks: relatedTasks,
        assigned_to: assignedTo,
        is_recurring: isRecurring,
        recurring_frequency: recurringPattern?.frequency,
        recurring_interval: recurringPattern?.interval,
        recurring_end_date: recurringPattern?.endDate
      })
      .select()
      .single()

    if (deadlineError) {
      console.error('❌ Deadlines API: Error creating deadline:', deadlineError)
      throw deadlineError
    }

    console.log('✅ Deadlines API: Created deadline:', deadline.id)

    return NextResponse.json({
      deadline,
      message: 'Deadline created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Deadlines API: Error creating deadline:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create deadline',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('⚖️ Deadlines API: Updating deadline')

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
        { error: 'Missing deadline ID' },
        { status: 400 }
      )
    }

    // Update the deadline
    const { data: deadline, error: updateError } = await supabase
      .from('legal_deadlines')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the deadline
      .select()
      .single()

    if (updateError) {
      console.error('❌ Deadlines API: Error updating deadline:', updateError)
      throw updateError
    }

    console.log('✅ Deadlines API: Updated deadline:', deadline.id)

    return NextResponse.json({
      deadline,
      message: 'Deadline updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Deadlines API: Error updating deadline:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update deadline',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Calendar Events API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Calendar Events API: Missing authorization header')
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
      console.log('❌ Calendar Events API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    console.log('📅 Calendar Events API: Fetching events for user:', user.id)
    console.log('📅 Date range:', { startDate, endDate })

    // Build the query for calendar events view
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })

    // Add date filters if provided
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      console.error('❌ Calendar Events API: Error fetching events:', eventsError)
      // Return empty array if view doesn't exist yet
      return NextResponse.json({
        events: [],
        message: 'Calendar events view not available yet'
      })
    }

    console.log('✅ Calendar Events API: Found', events?.length || 0, 'events')

    // Transform the data to match CalendarEvent interface
    const transformedEvents = (events || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      allDay: event.all_day,
      type: event.type,
      relatedId: event.related_id,
      practiceArea: event.practice_area,
      color: event.color,
      priority: event.priority,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))

    return NextResponse.json({
      events: transformedEvents,
      count: transformedEvents.length
    })

  } catch (error: any) {
    console.error('❌ Calendar Events API: Unexpected error:', error)
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
    console.log('📅 Calendar Events API: Creating new event')

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
      startDate,
      endDate,
      allDay = false,
      type,
      practiceArea,
      priority = 'medium',
      color,
      relatedId
    } = body

    // Validate required fields
    if (!title || !startDate || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, type' },
        { status: 400 }
      )
    }

    // Create the event based on type
    let createdEvent
    
    switch (type) {
      case 'deadline':
        // Create in legal_deadlines table
        const { data: deadline, error: deadlineError } = await supabase
          .from('legal_deadlines')
          .insert({
            user_id: user.id,
            title,
            description,
            deadline_date: new Date(startDate).toISOString().split('T')[0],
            deadline_time: allDay ? null : new Date(startDate).toTimeString().split(' ')[0],
            practice_area: practiceArea || 'General',
            priority,
            status: 'upcoming',
            category: 'other'
          })
          .select()
          .single()

        if (deadlineError) {
          throw deadlineError
        }
        createdEvent = deadline
        break

      case 'task':
        // Create in legal_tasks table
        const { data: task, error: taskError } = await supabase
          .from('legal_tasks')
          .insert({
            user_id: user.id,
            title,
            description,
            due_date: allDay ? new Date(startDate).toISOString().split('T')[0] : null,
            practice_area: practiceArea || 'General',
            priority,
            status: 'not_started',
            category: 'administrative'
          })
          .select()
          .single()

        if (taskError) {
          throw taskError
        }
        createdEvent = task
        break

      case 'milestone':
        // Create in legal_milestones table
        const { data: milestone, error: milestoneError } = await supabase
          .from('legal_milestones')
          .insert({
            user_id: user.id,
            title,
            description,
            start_date: new Date(startDate).toISOString().split('T')[0],
            target_date: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date(startDate).toISOString().split('T')[0],
            practice_area: practiceArea || 'General',
            status: 'planned',
            category: 'project_milestone'
          })
          .select()
          .single()

        if (milestoneError) {
          throw milestoneError
        }
        createdEvent = milestone
        break

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
    }

    console.log('✅ Calendar Events API: Created event:', createdEvent.id)

    return NextResponse.json({
      event: createdEvent,
      message: 'Event created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Calendar Events API: Error creating event:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create event',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

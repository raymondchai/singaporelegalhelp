import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Tasks API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Tasks API: Missing authorization header')
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
      console.log('❌ Tasks API: Auth error:', authError)
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
    const assignedTo = searchParams.get('assigned_to')
    const limit = searchParams.get('limit')

    console.log('📋 Tasks API: Fetching tasks for user:', user.id)

    // Build the query
    let query = supabase
      .from('legal_tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        category,
        start_date,
        due_date,
        estimated_hours,
        actual_hours,
        dependencies,
        blocked_by,
        parent_task_id,
        milestone_id,
        assigned_to,
        assigned_by,
        collaborators,
        progress_percentage,
        related_deadlines,
        related_documents,
        practice_area,
        tags,
        created_at,
        updated_at,
        completed_at
      `)
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id},collaborators.cs.{${user.id}}`)
      .order('created_at', { ascending: false })

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
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Add limit
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: tasks, error: tasksError } = await query

    if (tasksError) {
      console.error('❌ Tasks API: Error fetching tasks:', tasksError)
      
      // Check if table doesn't exist
      if (tasksError.message?.includes('relation "legal_tasks" does not exist')) {
        return NextResponse.json({
          tasks: [],
          message: 'Legal tasks table not created yet. Please run database migrations.'
        })
      }
      
      throw tasksError
    }

    console.log('✅ Tasks API: Found', tasks?.length || 0, 'tasks')

    // Get checklist items for each task
    const taskIds = (tasks || []).map(task => task.id)
    let checklistItems: any[] = []

    if (taskIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('task_checklist_items')
        .select('*')
        .in('task_id', taskIds)
        .order('sort_order', { ascending: true })

      if (!itemsError) {
        checklistItems = items || []
      }
    }

    // Transform the data to match LegalTask interface
    const transformedTasks = (tasks || []).map(task => {
      const taskChecklistItems = checklistItems
        .filter(item => item.task_id === task.id)
        .map(item => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
          completedAt: item.completed_at,
          completedBy: item.completed_by
        }))

      return {
        id: task.id,
        userId: user.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category,
        startDate: task.start_date,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        dependencies: task.dependencies || [],
        blockedBy: task.blocked_by,
        parentTaskId: task.parent_task_id,
        milestoneId: task.milestone_id,
        assignedTo: task.assigned_to,
        assignedBy: task.assigned_by,
        collaborators: task.collaborators || [],
        progressPercentage: task.progress_percentage || 0,
        checklistItems: taskChecklistItems,
        relatedDeadlines: task.related_deadlines || [],
        relatedDocuments: task.related_documents || [],
        practiceArea: task.practice_area,
        tags: task.tags || [],
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        completedAt: task.completed_at
      }
    })

    // Get statistics if requested
    const includeStats = searchParams.get('include_stats') === 'true'
    let statistics = null

    if (includeStats) {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_task_statistics', { p_user_id: user.id })

      if (!statsError && stats && stats.length > 0) {
        statistics = stats[0]
      }
    }

    return NextResponse.json({
      tasks: transformedTasks,
      count: transformedTasks.length,
      statistics
    })

  } catch (error: any) {
    console.error('❌ Tasks API: Unexpected error:', error)
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
    console.log('📋 Tasks API: Creating new task')

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
      priority = 'medium',
      category = 'administrative',
      startDate,
      dueDate,
      estimatedHours,
      practiceArea,
      assignedTo,
      collaborators = [],
      dependencies = [],
      parentTaskId,
      milestoneId,
      tags = [],
      checklistItems = []
    } = body

    // Validate required fields
    if (!title || !practiceArea) {
      return NextResponse.json(
        { error: 'Missing required fields: title, practiceArea' },
        { status: 400 }
      )
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('legal_tasks')
      .insert({
        user_id: user.id,
        title,
        description,
        status: 'not_started',
        priority,
        category,
        start_date: startDate,
        due_date: dueDate,
        estimated_hours: estimatedHours,
        practice_area: practiceArea,
        assigned_to: assignedTo,
        assigned_by: user.id,
        collaborators,
        dependencies,
        parent_task_id: parentTaskId,
        milestone_id: milestoneId,
        tags,
        progress_percentage: 0
      })
      .select()
      .single()

    if (taskError) {
      console.error('❌ Tasks API: Error creating task:', taskError)
      throw taskError
    }

    // Create checklist items if provided
    if (checklistItems.length > 0) {
      const checklistData = checklistItems.map((item: any, index: number) => ({
        task_id: task.id,
        text: item.text,
        completed: false,
        sort_order: index
      }))

      const { error: checklistError } = await supabase
        .from('task_checklist_items')
        .insert(checklistData)

      if (checklistError) {
        console.error('❌ Tasks API: Error creating checklist items:', checklistError)
        // Don't fail the entire request, just log the error
      }
    }

    console.log('✅ Tasks API: Created task:', task.id)

    return NextResponse.json({
      task,
      message: 'Task created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Tasks API: Error creating task:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create task',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📋 Tasks API: Updating task')

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
    const { id, checklistItems, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing task ID' },
        { status: 400 }
      )
    }

    // Update the task
    const { data: task, error: updateError } = await supabase
      .from('legal_tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        completed_at: updateData.status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id},collaborators.cs.{${user.id}}`)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Tasks API: Error updating task:', updateError)
      throw updateError
    }

    // Update checklist items if provided
    if (checklistItems) {
      // Delete existing checklist items
      await supabase
        .from('task_checklist_items')
        .delete()
        .eq('task_id', id)

      // Insert new checklist items
      if (checklistItems.length > 0) {
        const checklistData = checklistItems.map((item: any, index: number) => ({
          task_id: id,
          text: item.text,
          completed: item.completed || false,
          completed_at: item.completed ? new Date().toISOString() : null,
          completed_by: item.completed ? user.id : null,
          sort_order: index
        }))

        const { error: checklistError } = await supabase
          .from('task_checklist_items')
          .insert(checklistData)

        if (checklistError) {
          console.error('❌ Tasks API: Error updating checklist items:', checklistError)
        }
      }
    }

    console.log('✅ Tasks API: Updated task:', task.id)

    return NextResponse.json({
      task,
      message: 'Task updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Tasks API: Error updating task:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update task',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

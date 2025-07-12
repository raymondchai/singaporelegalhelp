import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createSessionSchema = z.object({
  document_id: z.string().uuid('Invalid document ID'),
  session_name: z.string().min(1, 'Session name is required').max(255, 'Session name too long'),
  session_type: z.enum(['view', 'edit', 'review', 'meeting']).default('edit'),
  max_participants: z.number().min(1).max(50).default(10),
  is_public: z.boolean().default(false),
  allowed_users: z.array(z.string().uuid()).default([]),
  settings: z.object({
    allow_anonymous: z.boolean().default(false),
    require_approval: z.boolean().default(true),
    enable_chat: z.boolean().default(true),
    enable_voice: z.boolean().default(false),
    auto_save_interval: z.number().min(10).max(300).default(30)
  }).default({})
})

// GET /api/collaboration/sessions - Get user's collaboration sessions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

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
    const status = searchParams.get('status')
    const document_id = searchParams.get('document_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query for sessions user is involved in
    let query = supabase
      .from('collaboration_sessions')
      .select(`
        id,
        document_id,
        session_name,
        session_type,
        max_participants,
        is_public,
        status,
        started_at,
        ended_at,
        settings,
        host_user:profiles!collaboration_sessions_host_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        document:user_documents!inner(
          id,
          title,
          document_type
        ),
        participants:collaboration_participants(
          id,
          role,
          status,
          joined_at,
          user:profiles!collaboration_participants_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .or(`host_user_id.eq.${user.id},allowed_users.cs.{${user.id}}`)
      .order('started_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (document_id) {
      query = query.eq('document_id', document_id)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('collaboration_sessions')
      .select('*', { count: 'exact', head: true })
      .or(`host_user_id.eq.${user.id},allowed_users.cs.{${user.id}}`)

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Sessions GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/collaboration/sessions - Create a new collaboration session
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

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
    const validatedData = createSessionSchema.parse(body)

    // Verify user has access to the document
    const { data: document, error: docError } = await supabase
      .from('user_documents')
      .select('id, user_id, title')
      .eq('id', validatedData.document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user can create sessions for this document
    const canCreateSession = document.user_id === user.id || 
                            await checkDocumentAccess(validatedData.document_id, user.id, ['edit'])

    if (!canCreateSession) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate access code for the session
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create the collaboration session
    const { data: session, error: sessionError } = await supabase
      .from('collaboration_sessions')
      .insert({
        ...validatedData,
        host_user_id: user.id,
        access_code: accessCode,
        status: 'active'
      })
      .select(`
        id,
        document_id,
        session_name,
        session_type,
        max_participants,
        is_public,
        access_code,
        status,
        started_at,
        settings,
        host_user:profiles!collaboration_sessions_host_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        document:user_documents!inner(
          id,
          title,
          document_type
        )
      `)
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Add the host as the first participant
    const { error: participantError } = await supabase
      .from('collaboration_participants')
      .insert({
        session_id: session.id,
        user_id: user.id,
        role: 'host',
        permission: 'admin',
        is_active: true
      })

    if (participantError) {
      console.error('Host participant creation error:', participantError)
      // Clean up the session if participant creation failed
      await supabase.from('collaboration_sessions').delete().eq('id', session.id)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'collaboration_session_created',
        resource_type: 'collaboration_session',
        resource_id: session.id,
        details: {
          document_id: validatedData.document_id,
          session_name: validatedData.session_name,
          session_type: validatedData.session_type
        }
      })

    return NextResponse.json({
      message: 'Collaboration session created successfully',
      session
    })

  } catch (error) {
    console.error('Sessions POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check document access
async function checkDocumentAccess(
  documentId: string, 
  userId: string, 
  requiredPermissions: string[] = ['view']
): Promise<boolean> {
  // Check if user owns the document
  const { data: document } = await supabase
    .from('user_documents')
    .select('user_id')
    .eq('id', documentId)
    .single()

  if (document?.user_id === userId) {
    return true
  }

  // Check if document is shared with user
  const { data: share } = await supabase
    .from('document_shares')
    .select('permission')
    .eq('document_id', documentId)
    .eq('shared_with', userId)
    .single()

  if (share && requiredPermissions.includes(share.permission)) {
    return true
  }

  return false
}

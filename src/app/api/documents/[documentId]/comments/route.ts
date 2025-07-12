import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  comment_type: z.enum(['general', 'suggestion', 'question', 'approval', 'rejection']).default('general'),
  page_number: z.number().optional(),
  position_data: z.object({}).optional(),
  highlighted_text: z.string().optional(),
  parent_comment_id: z.string().uuid().optional(),
  is_private: z.boolean().default(false),
  mentions: z.array(z.string().uuid()).default([]),
})

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
})

// GET /api/documents/[documentId]/comments - Get all comments for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const { documentId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const comment_type = searchParams.get('type')

    // Verify user has access to the document
    const { data: document, error: docError } = await supabase
      .from('user_documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if user has access (owner or shared with)
    const hasAccess = document.user_id === user.id || await checkDocumentAccess(documentId, user.id)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('document_comments')
      .select(`
        id,
        content,
        comment_type,
        page_number,
        position_data,
        highlighted_text,
        status,
        is_private,
        mentions,
        attachments,
        parent_comment_id,
        created_at,
        updated_at,
        resolved_at,
        user:profiles!document_comments_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        resolved_by_user:profiles!document_comments_resolved_by_fkey(
          id,
          full_name,
          email
        ),
        replies:document_comments!parent_comment_id(
          id,
          content,
          comment_type,
          status,
          created_at,
          user:profiles!document_comments_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('document_id', documentId)
      .is('parent_comment_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (comment_type) {
      query = query.eq('comment_type', comment_type)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: comments, error: commentsError } = await query

    if (commentsError) {
      console.error('Comments fetch error:', commentsError)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('document_comments')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .is('parent_comment_id', null)

    if (countError) {
      console.error('Comments count error:', countError)
    }

    return NextResponse.json({
      comments: comments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/documents/[documentId]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const { documentId } = params
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Verify user has access to the document
    const hasAccess = await checkDocumentAccess(documentId, user.id, ['edit', 'comment'])
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('document_comments')
      .insert({
        document_id: documentId,
        user_id: user.id,
        ...validatedData,
      })
      .select(`
        id,
        content,
        comment_type,
        page_number,
        position_data,
        highlighted_text,
        status,
        is_private,
        mentions,
        attachments,
        parent_comment_id,
        created_at,
        updated_at,
        user:profiles!document_comments_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('Comment creation error:', commentError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // TODO: Send notifications to mentioned users
    // TODO: Send real-time updates via WebSocket

    return NextResponse.json({
      message: 'Comment created successfully',
      comment
    })

  } catch (error) {
    console.error('Comments POST error:', error)
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

  // Check team access
  const { data: teamAccess } = await supabase
    .from('team_members')
    .select(`
      role,
      teams!inner(
        id,
        user_documents!inner(id)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('teams.user_documents.id', documentId)
    .single()

  return !!teamAccess
}

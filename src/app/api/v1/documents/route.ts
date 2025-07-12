import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext, validateSubscriptionTier } from '@/lib/api-middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().optional(),
  document_type: z.enum(['contract', 'agreement', 'letter', 'form', 'other']).default('other'),
  template_id: z.string().uuid().optional(),
  metadata: z.object({}).optional(),
  tags: z.array(z.string()).default([]),
  is_template: z.boolean().default(false),
})

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  document_type: z.enum(['contract', 'agreement', 'letter', 'form', 'other']).optional(),
  metadata: z.object({}).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'final', 'archived']).optional(),
})

// GET /api/v1/documents - List user's documents
async function getDocuments(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const search = searchParams.get('search')
  const document_type = searchParams.get('type')
  const status = searchParams.get('status')
  const tags = searchParams.get('tags')?.split(',')

  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  try {
    // Build query
    let query = supabase
      .from('user_documents')
      .select(`
        id,
        title,
        document_type,
        status,
        file_size,
        tags,
        created_at,
        updated_at,
        metadata
      `)
      .eq('user_id', context.user.id)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    if (document_type) {
      query = query.eq('document_type', document_type)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: documents, error } = await query

    if (error) {
      console.error('Documents fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', context.user.id)

    return NextResponse.json({
      success: true,
      data: {
        documents: documents || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: (count || 0) > page * limit,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/documents - Create a new document
async function createDocument(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createDocumentSchema.parse(body)

    // Check subscription limits for document creation
    if (context.user.subscription_tier === 'free') {
      const { count } = await supabase
        .from('user_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)

      if ((count || 0) >= 5) { // Free tier limit
        return NextResponse.json(
          { error: 'Document limit reached. Please upgrade your subscription.' },
          { status: 402 }
        )
      }
    }

    // Create the document
    const { data: document, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: context.user.id,
        title: validatedData.title,
        content: validatedData.content || '',
        document_type: validatedData.document_type,
        template_id: validatedData.template_id,
        metadata: validatedData.metadata || {},
        tags: validatedData.tags,
        is_template: validatedData.is_template,
        status: 'draft',
        file_size: (validatedData.content || '').length
      })
      .select(`
        id,
        title,
        document_type,
        status,
        file_size,
        tags,
        created_at,
        updated_at,
        metadata
      `)
      .single()

    if (error) {
      console.error('Document creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      )
    }

    // Create initial version
    await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        created_by: context.user.id,
        version_number: 1,
        version_name: 'Initial version',
        content_snapshot: {
          title: document.title,
          content: validatedData.content || '',
          metadata: document.metadata
        },
        file_size: document.file_size || 0,
        checksum: 'initial',
        is_major_version: true
      })

    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'Document created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Document creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getDocuments, {
  requiredPermissions: ['read'],
  rateLimit: 1000
})

export const POST = withApiMiddleware(createDocument, {
  requiredPermissions: ['write'],
  rateLimit: 100
})

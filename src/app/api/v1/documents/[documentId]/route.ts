import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext } from '@/lib/api-middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  document_type: z.enum(['contract', 'agreement', 'letter', 'form', 'other']).optional(),
  metadata: z.object({}).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'final', 'archived']).optional(),
})

// GET /api/v1/documents/[documentId] - Get a specific document
async function getDocument(
  request: NextRequest,
  context: ApiContext,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  const { documentId } = params
  const { searchParams } = new URL(request.url)
  const includeContent = searchParams.get('include_content') === 'true'
  const includeVersions = searchParams.get('include_versions') === 'true'
  const includeComments = searchParams.get('include_comments') === 'true'

  try {
    // Check document access
    const hasAccess = await checkDocumentAccess(documentId, context.user.id)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Build select query based on requested includes
    let selectFields = `
      id,
      title,
      document_type,
      status,
      file_size,
      tags,
      created_at,
      updated_at,
      metadata
    `

    if (includeContent) {
      selectFields += ', content'
    }

    const { data: document, error } = await supabase
      .from('user_documents')
      .select(selectFields)
      .eq('id', documentId)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const result: any = { document }

    // Include versions if requested
    if (includeVersions) {
      const { data: versions } = await supabase
        .from('document_versions')
        .select(`
          id,
          version_number,
          version_name,
          description,
          is_major_version,
          is_published,
          created_at,
          created_by:profiles!document_versions_created_by_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(10)

      result.versions = versions || []
    }

    // Include comments if requested
    if (includeComments) {
      const { data: comments } = await supabase
        .from('document_comments')
        .select(`
          id,
          content,
          comment_type,
          status,
          created_at,
          user:profiles!document_comments_user_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('document_id', documentId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20)

      result.comments = comments || []
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Document fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/documents/[documentId] - Update a document
async function updateDocument(
  request: NextRequest,
  context: ApiContext,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  const { documentId } = params

  try {
    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    // Check document access and ownership
    const hasAccess = await checkDocumentAccess(documentId, context.user.id, ['edit'])
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Get current document for version tracking
    const { data: currentDoc } = await supabase
      .from('user_documents')
      .select('title, content, version_number')
      .eq('id', documentId)
      .single()

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    if (validatedData.content) {
      updateData.file_size = validatedData.content.length
    }

    // Update the document
    const { data: document, error } = await supabase
      .from('user_documents')
      .update(updateData)
      .eq('id', documentId)
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
      console.error('Document update error:', error)
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      )
    }

    // Create new version if content changed significantly
    if (validatedData.content && validatedData.content !== currentDoc?.content) {
      const { data: lastVersion } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const nextVersionNumber = (lastVersion?.version_number || 0) + 1

      await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          created_by: context.user.id,
          version_number: nextVersionNumber,
          version_name: `Auto-save v${nextVersionNumber}`,
          content_snapshot: {
            title: document.title,
            content: validatedData.content,
            metadata: document.metadata
          },
          file_size: document.file_size || 0,
          checksum: generateChecksum(validatedData.content)
        })
    }

    return NextResponse.json({
      success: true,
      data: {
        document,
        message: 'Document updated successfully'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Document update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/documents/[documentId] - Delete a document
async function deleteDocument(
  request: NextRequest,
  context: ApiContext,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  const { documentId } = params

  try {
    // Check document ownership
    const { data: document } = await supabase
      .from('user_documents')
      .select('user_id, title')
      .eq('id', documentId)
      .single()

    if (!document || document.user_id !== context.user.id) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the document (cascade will handle related records)
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('Document deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document deleted successfully'
      }
    })

  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
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

  return share && share.permission && requiredPermissions.includes(share.permission)
}

function generateChecksum(content: string): string {
  let hash = 0
  if (content.length === 0) return hash.toString()
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(16)
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getDocument, {
  requiredPermissions: ['read'],
  rateLimit: 2000
})

export const PUT = withApiMiddleware(updateDocument, {
  requiredPermissions: ['write'],
  rateLimit: 500
})

export const DELETE = withApiMiddleware(deleteDocument, {
  requiredPermissions: ['write'],
  rateLimit: 100
})

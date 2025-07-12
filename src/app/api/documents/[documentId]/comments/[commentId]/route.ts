import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  status: z.enum(['open', 'resolved', 'dismissed']).optional(),
  comment_type: z.enum(['general', 'suggestion', 'question', 'approval', 'rejection']).optional(),
})

// GET /api/documents/[documentId]/comments/[commentId] - Get a specific comment
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string; commentId: string } }
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

    const { documentId, commentId } = params

    // Verify user has access to the document
    const hasAccess = await checkDocumentAccess(documentId, user.id)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get the comment with all related data
    const { data: comment, error: commentError } = await supabase
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
          updated_at,
          user:profiles!document_comments_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('id', commentId)
      .eq('document_id', documentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comment })

  } catch (error) {
    console.error('Comment GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[documentId]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string; commentId: string } }
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

    const { documentId, commentId } = params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Get the existing comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('document_comments')
      .select('user_id, document_id, status')
      .eq('id', commentId)
      .eq('document_id', documentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user can update this comment
    const canUpdate = existingComment.user_id === user.id || 
                     await checkDocumentAccess(documentId, user.id, ['edit', 'admin'])

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // If resolving/dismissing comment, add resolved info
    if (validatedData.status && validatedData.status !== 'open' && existingComment.status === 'open') {
      updateData.resolved_by = user.id
      updateData.resolved_at = new Date().toISOString()
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('document_comments')
      .update(updateData)
      .eq('id', commentId)
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
        )
      `)
      .single()

    if (updateError) {
      console.error('Comment update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      )
    }

    // Log the change
    await supabase
      .from('document_changes')
      .insert({
        document_id: documentId,
        user_id: user.id,
        change_type: 'comment_resolve',
        related_comment_id: commentId,
        change_metadata: {
          old_status: existingComment.status,
          new_status: validatedData.status,
          action: 'comment_updated'
        }
      })

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    })

  } catch (error) {
    console.error('Comment PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[documentId]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string; commentId: string } }
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

    const { documentId, commentId } = params

    // Get the existing comment to check ownership
    const { data: existingComment, error: fetchError } = await supabase
      .from('document_comments')
      .select('user_id, document_id')
      .eq('id', commentId)
      .eq('document_id', documentId)
      .single()

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user can delete this comment (owner or document owner/admin)
    const canDelete = existingComment.user_id === user.id || 
                     await checkDocumentAccess(documentId, user.id, ['edit', 'admin'])

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete the comment (this will cascade to replies)
    const { error: deleteError } = await supabase
      .from('document_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Comment delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Comment deleted successfully'
    })

  } catch (error) {
    console.error('Comment DELETE error:', error)
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

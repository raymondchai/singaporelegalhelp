import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['favorite', 'unfavorite', 'share', 'move', 'tag', 'delete', 'download']),
  document_ids: z.array(z.string()).min(1, 'At least one document ID is required'),
  target_folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  share_settings: z.object({
    access_level: z.enum(['team', 'shared', 'public']).optional(),
    expires_at: z.string().optional(),
  }).optional(),
})

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

    const body = await request.json()
    const validatedData = bulkActionSchema.parse(body)

    const { action, document_ids, target_folder, tags, share_settings } = validatedData

    // Verify all documents belong to the user
    const { data: documents, error: verifyError } = await supabase
      .from('user_documents')
      .select('id, document_name, file_url')
      .eq('user_id', user.id)
      .in('id', document_ids)

    if (verifyError) {
      console.error('Document verification error:', verifyError)
      return NextResponse.json(
        { error: 'Failed to verify documents' },
        { status: 500 }
      )
    }

    if (documents.length !== document_ids.length) {
      return NextResponse.json(
        { error: 'Some documents not found or not accessible' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let actionDescription = ''

    switch (action) {
      case 'favorite':
        updateData = { is_favorite: true }
        actionDescription = 'Added to favorites'
        break

      case 'unfavorite':
        updateData = { is_favorite: false }
        actionDescription = 'Removed from favorites'
        break

      case 'move':
        if (!target_folder) {
          return NextResponse.json(
            { error: 'Target folder is required for move action' },
            { status: 400 }
          )
        }
        updateData = { folder_path: target_folder }
        actionDescription = `Moved to ${target_folder}`
        break

      case 'tag':
        if (!tags || tags.length === 0) {
          return NextResponse.json(
            { error: 'Tags are required for tag action' },
            { status: 400 }
          )
        }
        updateData = { tags }
        actionDescription = `Tagged with: ${tags.join(', ')}`
        break

      case 'share':
        if (!share_settings?.access_level) {
          return NextResponse.json(
            { error: 'Access level is required for share action' },
            { status: 400 }
          )
        }
        updateData = { 
          access_level: share_settings.access_level,
          sharing_settings: {
            is_shared: true,
            expires_at: share_settings.expires_at,
          }
        }
        actionDescription = `Shared with ${share_settings.access_level} access`
        break

      case 'delete':
        // Handle deletion separately
        const { error: deleteError } = await supabase
          .from('user_documents')
          .delete()
          .eq('user_id', user.id)
          .in('id', document_ids)

        if (deleteError) {
          console.error('Bulk delete error:', deleteError)
          return NextResponse.json(
            { error: 'Failed to delete documents' },
            { status: 500 }
          )
        }

        actionDescription = 'Deleted'
        break

      case 'download':
        // For download, we'll return the file URLs
        const downloadUrls = await Promise.all(
          documents.map(async (doc) => {
            if (doc.file_url) {
              // Create signed URL for download
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('legal-documents')
                .createSignedUrl(doc.file_url, 300) // 5 minutes

              if (signedUrlError) {
                console.error('Signed URL error:', signedUrlError)
                return null
              }

              return {
                document_id: doc.id,
                document_name: doc.document_name,
                download_url: signedUrlData.signedUrl,
              }
            }
            return null
          })
        )

        const validDownloads = downloadUrls.filter(Boolean)

        return NextResponse.json({
          message: 'Download URLs generated',
          action: 'download',
          downloads: validDownloads,
          processed_count: validDownloads.length,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Apply updates for non-delete actions
    if (!['delete', 'download'].includes(action)) {
      const { error: updateError } = await supabase
        .from('user_documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .in('id', document_ids)

      if (updateError) {
        console.error('Bulk update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update documents' },
          { status: 500 }
        )
      }
    }

    // Log the bulk activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: `bulk_${action}`,
        resource_type: 'document',
        details: {
          document_ids,
          document_count: document_ids.length,
          action_description: actionDescription,
          target_folder,
          tags,
          share_settings,
        },
      })

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      action,
      processed_count: document_ids.length,
      action_description: actionDescription,
    })

  } catch (error) {
    console.error('Bulk action error:', error)
    
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

// Get bulk operation status
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

    // Get recent bulk operations from activity logs
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .like('action_type', 'bulk_%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (activitiesError) {
      console.error('Activities fetch error:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch bulk operation history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      recent_operations: activities || [],
    })

  } catch (error) {
    console.error('Bulk operations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

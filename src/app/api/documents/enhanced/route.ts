import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || '/'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const access_level = searchParams.get('access_level') || 'all'

    // Build query for documents
    let documentsQuery = supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', user.id)

    // Apply folder filter
    if (folder !== '/') {
      documentsQuery = documentsQuery.eq('folder_path', folder)
    }

    // Apply search filter
    if (search) {
      documentsQuery = documentsQuery.or(
        `document_name.ilike.%${search}%,tags.cs.{${search}}`
      )
    }

    // Apply type filter
    if (type !== 'all') {
      documentsQuery = documentsQuery.eq('document_type', type)
    }

    // Apply access level filter
    if (access_level !== 'all') {
      documentsQuery = documentsQuery.eq('access_level', access_level)
    }

    // Order by updated_at descending
    documentsQuery = documentsQuery.order('updated_at', { ascending: false })

    const { data: documents, error: documentsError } = await documentsQuery

    if (documentsError) {
      console.error('Documents fetch error:', documentsError)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // Get folder structure
    const { data: allDocuments, error: allDocsError } = await supabase
      .from('user_documents')
      .select('folder_path')
      .eq('user_id', user.id)

    if (allDocsError) {
      console.error('Folders fetch error:', allDocsError)
      return NextResponse.json(
        { error: 'Failed to fetch folders' },
        { status: 500 }
      )
    }

    // Extract unique folders and count documents
    const folderCounts: Record<string, number> = {}
    allDocuments.forEach(doc => {
      const path = doc.folder_path || '/'
      folderCounts[path] = (folderCounts[path] || 0) + 1
    })

    const folders = Object.entries(folderCounts)
      .filter(([path]) => path !== '/')
      .map(([path, count]) => ({
        path,
        name: path.split('/').pop() || path,
        document_count: count,
        created_at: new Date().toISOString(), // Placeholder
      }))

    // Get document statistics
    const stats = {
      total_documents: documents.length,
      by_type: documents.reduce((acc, doc) => {
        acc[doc.document_type] = (acc[doc.document_type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      by_access_level: documents.reduce((acc, doc) => {
        acc[doc.access_level] = (acc[doc.access_level] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      total_size: documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
      favorites_count: documents.filter(doc => doc.is_favorite).length,
    }

    return NextResponse.json({
      documents: documents || [],
      folders: folders || [],
      stats,
      current_folder: folder,
    })

  } catch (error) {
    console.error('Enhanced documents API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'create-folder') {
      const { folder_path, folder_name } = await request.json()

      // Validate folder path
      if (!folder_path || !folder_name) {
        return NextResponse.json(
          { error: 'Folder path and name are required' },
          { status: 400 }
        )
      }

      // For now, we'll just return success since folders are implicit in our schema
      // In a real implementation, you might want a separate folders table
      return NextResponse.json({
        message: 'Folder created successfully',
        folder: {
          path: `${folder_path}/${folder_name}`.replace('//', '/'),
          name: folder_name,
          document_count: 0,
          created_at: new Date().toISOString(),
        },
      })
    }

    if (action === 'update-document') {
      const { document_id, updates } = await request.json()

      const { data: updatedDocument, error: updateError } = await supabase
        .from('user_documents')
        .update(updates)
        .eq('id', document_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Document update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update document' },
          { status: 500 }
        )
      }

      // Log the activity
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action_type: 'document_updated',
          resource_type: 'document',
          resource_id: document_id,
          details: {
            updated_fields: Object.keys(updates),
          },
        })

      return NextResponse.json({
        message: 'Document updated successfully',
        document: updatedDocument,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Enhanced documents POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const document_id = searchParams.get('document_id')

    if (!document_id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Get document info before deletion
    const { data: document, error: fetchError } = await supabase
      .from('user_documents')
      .select('file_url, document_name')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', document_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Document deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'document_deleted',
        resource_type: 'document',
        resource_id: document_id,
        details: {
          document_name: document.document_name,
        },
      })

    return NextResponse.json({
      message: 'Document deleted successfully',
    })

  } catch (error) {
    console.error('Enhanced documents DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

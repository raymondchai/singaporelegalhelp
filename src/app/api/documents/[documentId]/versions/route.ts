import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createVersionSchema = z.object({
  version_name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  is_major_version: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

// GET /api/documents/[documentId]/versions - Get all versions for a document
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
    const limit = parseInt(searchParams.get('limit') || '20')

    // Verify user has access to the document
    const hasAccess = await checkDocumentAccess(documentId, user.id)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get document versions
    const { data: versions, error: versionsError } = await supabase
      .from('document_versions')
      .select(`
        id,
        version_number,
        version_name,
        description,
        file_size,
        checksum,
        is_major_version,
        is_published,
        tags,
        changes_summary,
        created_at,
        created_by:profiles!document_versions_created_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (versionsError) {
      console.error('Versions fetch error:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('document_versions')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)

    return NextResponse.json({
      versions: versions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Versions GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/documents/[documentId]/versions - Create a new version
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
    const validatedData = createVersionSchema.parse(body)

    // Verify user has edit access to the document
    const hasAccess = await checkDocumentAccess(documentId, user.id, ['edit'])
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get the current document to create a snapshot
    const { data: document, error: docError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Get the next version number
    const { data: lastVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1

    // Create the new version
    const { data: newVersion, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        created_by: user.id,
        version_number: nextVersionNumber,
        version_name: validatedData.version_name,
        description: validatedData.description,
        is_major_version: validatedData.is_major_version,
        is_published: validatedData.is_published,
        tags: validatedData.tags,
        content_snapshot: {
          title: document.title,
          content: document.content,
          metadata: document.metadata
        },
        file_size: document.file_size || 0,
        checksum: generateChecksum(document.content || ''),
        changes_summary: {
          additions: 0,
          deletions: 0,
          modifications: 1,
          total_changes: 1
        }
      })
      .select(`
        id,
        version_number,
        version_name,
        description,
        file_size,
        checksum,
        is_major_version,
        is_published,
        tags,
        changes_summary,
        created_at,
        created_by:profiles!document_versions_created_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single()

    if (versionError) {
      console.error('Version creation error:', versionError)
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      )
    }

    // Log the activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'document_version_created',
        resource_type: 'document',
        resource_id: documentId,
        details: {
          version_number: nextVersionNumber,
          version_name: validatedData.version_name,
          is_major_version: validatedData.is_major_version
        }
      })

    return NextResponse.json({
      message: 'Version created successfully',
      version: newVersion
    })

  } catch (error) {
    console.error('Versions POST error:', error)
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

// Helper function to generate a simple checksum
function generateChecksum(content: string): string {
  let hash = 0
  if (content.length === 0) return hash.toString()
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16)
}

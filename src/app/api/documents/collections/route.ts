import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's document collections
    const { data: collections, error } = await supabase
      .from('document_collections')
      .select(`
        id,
        name,
        description,
        color,
        icon,
        tags,
        is_shared,
        created_at,
        updated_at,
        collection_collaborators!inner(
          user_id,
          permission,
          user_profiles!inner(full_name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Collections fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      )
    }

    // Get document counts for each collection
    const collectionsWithCounts = await Promise.all(
      (collections || []).map(async (collection) => {
        const { count } = await supabase
          .from('user_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .contains('collections', [collection.id])

        return {
          ...collection,
          documentCount: count || 0,
          collaborators: collection.collection_collaborators?.map((collab: any) => ({
            userId: collab.user_id,
            name: collab.user_profiles.full_name,
            permission: collab.permission
          })) || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      collections: collectionsWithCounts
    })

  } catch (error) {
    console.error('Collections API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color, icon, tags, isShared } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Create new collection
    const { data: collection, error: createError } = await supabase
      .from('document_collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#3B82F6',
        icon: icon || 'folder',
        tags: tags || [],
        is_shared: isShared || false
      })
      .select()
      .single()

    if (createError) {
      console.error('Collection creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create collection' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'collection_created',
        metadata: {
          collection_id: collection.id,
          collection_name: collection.name
        }
      })

    return NextResponse.json({
      success: true,
      collection: {
        ...collection,
        documentCount: 0,
        collaborators: []
      }
    })

  } catch (error) {
    console.error('Collection creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { collectionId, updates } = body

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }

    // Update collection
    const { data: collection, error: updateError } = await supabase
      .from('document_collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Collection update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update collection' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'collection_updated',
        metadata: {
          collection_id: collectionId,
          updated_fields: Object.keys(updates)
        }
      })

    return NextResponse.json({
      success: true,
      collection
    })

  } catch (error) {
    console.error('Collection update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('id')

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }

    // Remove collection from all documents first
    await supabase
      .from('user_documents')
      .update({
        collections: supabase.rpc('array_remove', {
          array_col: 'collections',
          remove_val: collectionId
        })
      })
      .eq('user_id', user.id)
      .contains('collections', [collectionId])

    // Delete collection
    const { error: deleteError } = await supabase
      .from('document_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Collection deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete collection' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'collection_deleted',
        metadata: {
          collection_id: collectionId
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully'
    })

  } catch (error) {
    console.error('Collection deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

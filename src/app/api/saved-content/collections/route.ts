import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Collections API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Collections API: Missing authorization header')
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
      console.log('❌ Collections API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeItemCount = searchParams.get('include_item_count') === 'true'
    const parentId = searchParams.get('parent_id')
    const includeShared = searchParams.get('include_shared') === 'true'

    console.log('📚 Collections API: Fetching collections for user:', user.id)

    // Build the query
    let query = supabase
      .from('content_collections')
      .select(`
        id,
        name,
        description,
        color,
        icon,
        parent_collection_id,
        sort_order,
        is_smart_collection,
        smart_rules,
        visibility,
        is_default,
        tags,
        metadata,
        created_at,
        updated_at
      `)

    // Filter by parent collection if specified
    if (parentId) {
      if (parentId === 'root') {
        query = query.is('parent_collection_id', null)
      } else {
        query = query.eq('parent_collection_id', parentId)
      }
    }

    // Include shared collections if requested
    if (includeShared) {
      query = query.or(`user_id.eq.${user.id},visibility.in.(shared,public)`)
    } else {
      query = query.eq('user_id', user.id)
    }

    // Order by sort order and name
    query = query.order('sort_order', { ascending: true }).order('name', { ascending: true })

    const { data: collections, error: collectionsError } = await query

    if (collectionsError) {
      console.error('❌ Collections API: Error fetching collections:', collectionsError)
      
      // Check if table doesn't exist
      if (collectionsError.message?.includes('relation "content_collections" does not exist')) {
        // Create default collections for the user
        await supabase.rpc('create_default_collections', { p_user_id: user.id })
        
        return NextResponse.json({
          collections: [],
          message: 'Content collections table not created yet. Please run database migrations.'
        })
      }
      
      throw collectionsError
    }

    console.log('✅ Collections API: Found', collections?.length || 0, 'collections')

    // Get item counts if requested
    let collectionItemCounts: Record<string, number> = {}
    
    if (includeItemCount && collections && collections.length > 0) {
      const collectionIds = collections.map(c => c.id)
      
      const { data: countData, error: countError } = await supabase
        .from('saved_content_items')
        .select('collection_id')
        .in('collection_id', collectionIds)
        .eq('is_archived', false)
        
      if (!countError && countData) {
        collectionItemCounts = countData.reduce((acc, item) => {
          acc[item.collection_id] = (acc[item.collection_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Transform the data to match ContentCollection interface
    const transformedCollections = (collections || []).map(collection => ({
      id: collection.id,
      userId: user.id,
      parentCollectionId: collection.parent_collection_id,
      name: collection.name,
      description: collection.description || '',
      color: collection.color,
      icon: collection.icon,
      sortOrder: collection.sort_order,
      isSmartCollection: collection.is_smart_collection,
      smartRules: collection.smart_rules,
      visibility: collection.visibility,
      isDefault: collection.is_default,
      tags: collection.tags || [],
      itemCount: collectionItemCounts[collection.id] || 0,
      metadata: collection.metadata || {},
      createdAt: collection.created_at,
      updatedAt: collection.updated_at
    }))

    return NextResponse.json({
      collections: transformedCollections,
      count: transformedCollections.length
    })

  } catch (error: any) {
    console.error('❌ Collections API: Unexpected error:', error)
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
    console.log('📚 Collections API: Creating new collection')

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
      name,
      description,
      color = '#3B82F6',
      icon = 'folder',
      parentCollectionId,
      sortOrder = 0,
      isSmartCollection = false,
      smartRules,
      visibility = 'private',
      tags = [],
      metadata = {}
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Create the collection
    const { data: collection, error: collectionError } = await supabase
      .from('content_collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        color,
        icon,
        parent_collection_id: parentCollectionId,
        sort_order: sortOrder,
        is_smart_collection: isSmartCollection,
        smart_rules: smartRules,
        visibility,
        tags,
        metadata
      })
      .select()
      .single()

    if (collectionError) {
      console.error('❌ Collections API: Error creating collection:', collectionError)
      throw collectionError
    }

    console.log('✅ Collections API: Created collection:', collection.id)

    // Log activity
    await supabase.rpc('log_content_activity', {
      p_user_id: user.id,
      p_activity_type: 'collection_created',
      p_content_type: 'collection',
      p_content_id: collection.id,
      p_details: { collection_name: collection.name }
    })

    // Transform the data to match ContentCollection interface
    const transformedCollection = {
      id: collection.id,
      userId: user.id,
      parentCollectionId: collection.parent_collection_id,
      name: collection.name,
      description: collection.description || '',
      color: collection.color,
      icon: collection.icon,
      sortOrder: collection.sort_order,
      isSmartCollection: collection.is_smart_collection,
      smartRules: collection.smart_rules,
      visibility: collection.visibility,
      isDefault: collection.is_default || false,
      tags: collection.tags || [],
      itemCount: 0,
      metadata: collection.metadata || {},
      createdAt: collection.created_at,
      updatedAt: collection.updated_at
    }

    return NextResponse.json({
      collection: transformedCollection,
      message: 'Collection created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Collections API: Error creating collection:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create collection',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

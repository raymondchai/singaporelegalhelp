import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('💾 Saved Content Items API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Saved Content Items API: Missing authorization header')
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
      console.log('❌ Saved Content Items API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const collectionId = searchParams.get('collection_id')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const contentTypes = searchParams.get('content_types')?.split(',').filter(Boolean) || []
    const readStatus = searchParams.get('read_status') || ''
    const isFavorite = searchParams.get('is_favorite')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeAnnotations = searchParams.get('include_annotations') === 'true'

    console.log('💾 Saved Content Items API: Searching for user:', user.id)

    // Use the search function for advanced filtering
    const { data: items, error: itemsError } = await supabase.rpc('search_saved_content', {
      p_user_id: user.id,
      p_query: query,
      p_collection_ids: collectionId ? [collectionId] : [],
      p_tags: tags,
      p_content_types: contentTypes,
      p_read_status: readStatus,
      p_is_favorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : null,
      p_date_from: dateFrom ? new Date(dateFrom).toISOString() : null,
      p_date_to: dateTo ? new Date(dateTo).toISOString() : null,
      p_limit: limit,
      p_offset: offset
    })

    if (itemsError) {
      console.error('❌ Saved Content Items API: Error searching items:', itemsError)
      
      // Fallback to basic query if search function doesn't exist
      if (itemsError.message?.includes('function search_saved_content')) {
        const { data: fallbackItems, error: fallbackError } = await supabase
          .from('saved_content_items')
          .select(`
            id,
            title,
            description,
            content_type,
            content_id,
            external_url,
            custom_title,
            notes,
            tags,
            priority,
            is_favorite,
            is_archived,
            read_status,
            reading_progress,
            saved_at,
            last_accessed,
            metadata
          `)
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('saved_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)

        if (fallbackError) {
          throw fallbackError
        }

        return NextResponse.json({
          items: fallbackItems || [],
          count: fallbackItems?.length || 0,
          message: 'Using basic search - advanced search not available'
        })
      }
      
      throw itemsError
    }

    console.log('✅ Saved Content Items API: Found', items?.length || 0, 'items')

    // Get annotations if requested
    let annotations: any[] = []
    if (includeAnnotations && items && items.length > 0) {
      const itemIds = items.map((item: any) => item.id)
      
      const { data: annotationData, error: annotationError } = await supabase
        .from('content_annotations')
        .select('*')
        .in('saved_content_id', itemIds)
        .order('created_at', { ascending: true })

      if (!annotationError) {
        annotations = annotationData || []
      }
    }

    // Transform the data to match SavedContentItem interface
    const transformedItems = (items || []).map((item: any) => {
      const itemAnnotations = annotations.filter(ann => ann.saved_content_id === item.id)
      
      return {
        id: item.id,
        userId: user.id,
        collectionId: item.collection_id,
        contentType: item.content_type,
        contentId: item.content_id,
        externalUrl: item.external_url,
        title: item.title,
        description: item.description,
        contentPreview: item.content_preview,
        authorName: item.author_name,
        sourceName: item.source_name,
        customTitle: item.custom_title,
        notes: item.notes,
        tags: item.tags || [],
        priority: item.priority || 0,
        isFavorite: item.is_favorite || false,
        isArchived: item.is_archived || false,
        readStatus: item.read_status || 'unread',
        readingProgress: item.reading_progress || 0,
        savedAt: item.saved_at,
        lastAccessed: item.last_accessed,
        archivedAt: item.archived_at,
        collection: item.collection_name ? {
          id: item.collection_id,
          name: item.collection_name
        } : undefined,
        annotations: includeAnnotations ? itemAnnotations.map(ann => ({
          id: ann.id,
          userId: ann.user_id,
          savedContentId: ann.saved_content_id,
          annotationType: ann.annotation_type,
          content: ann.content,
          startPosition: ann.start_position,
          endPosition: ann.end_position,
          pageNumber: ann.page_number,
          sectionId: ann.section_id,
          color: ann.color,
          styleProperties: ann.style_properties,
          tags: ann.tags || [],
          isPrivate: ann.is_private,
          createdAt: ann.created_at,
          updatedAt: ann.updated_at
        })) : undefined,
        annotationCount: item.annotation_count || 0,
        relevanceScore: item.relevance_score,
        metadata: item.metadata || {}
      }
    })

    return NextResponse.json({
      items: transformedItems,
      count: transformedItems.length,
      hasMore: transformedItems.length === limit
    })

  } catch (error: any) {
    console.error('❌ Saved Content Items API: Unexpected error:', error)
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
    console.log('💾 Saved Content Items API: Creating new saved item')

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
      contentType,
      contentId,
      externalUrl,
      title,
      description,
      contentPreview,
      authorName,
      sourceName,
      collectionId,
      customTitle,
      notes = '',
      tags = [],
      priority = 0
    } = body

    // Validate required fields
    if (!contentType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, title' },
        { status: 400 }
      )
    }

    if (contentType !== 'external' && !contentId) {
      return NextResponse.json(
        { error: 'contentId is required for non-external content' },
        { status: 400 }
      )
    }

    if (contentType === 'external' && !externalUrl) {
      return NextResponse.json(
        { error: 'externalUrl is required for external content' },
        { status: 400 }
      )
    }

    // Check if already saved (for non-external content)
    if (contentType !== 'external' && contentId) {
      const { data: existing } = await supabase
        .from('saved_content_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_archived', false)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Content already saved' },
          { status: 409 }
        )
      }
    }

    // Create the saved content item
    const { data: item, error: itemError } = await supabase
      .from('saved_content_items')
      .insert({
        user_id: user.id,
        collection_id: collectionId,
        content_type: contentType,
        content_id: contentId,
        external_url: externalUrl,
        title: title.trim(),
        description: description?.trim() || '',
        content_preview: contentPreview?.trim() || '',
        author_name: authorName?.trim() || '',
        source_name: sourceName?.trim() || '',
        custom_title: customTitle?.trim() || '',
        notes: notes.trim(),
        tags,
        priority,
        is_favorite: false,
        is_archived: false,
        read_status: 'unread',
        reading_progress: 0
      })
      .select()
      .single()

    if (itemError) {
      console.error('❌ Saved Content Items API: Error creating item:', itemError)
      throw itemError
    }

    console.log('✅ Saved Content Items API: Created item:', item.id)

    // Log activity
    await supabase.rpc('log_content_activity', {
      p_user_id: user.id,
      p_activity_type: 'save',
      p_content_type: contentType,
      p_content_id: item.id,
      p_collection_id: collectionId,
      p_details: { title: item.title }
    })

    // Transform the data to match SavedContentItem interface
    const transformedItem = {
      id: item.id,
      userId: user.id,
      collectionId: item.collection_id,
      contentType: item.content_type,
      contentId: item.content_id,
      externalUrl: item.external_url,
      title: item.title,
      description: item.description,
      contentPreview: item.content_preview,
      authorName: item.author_name,
      sourceName: item.source_name,
      customTitle: item.custom_title,
      notes: item.notes,
      tags: item.tags || [],
      priority: item.priority || 0,
      isFavorite: item.is_favorite || false,
      isArchived: item.is_archived || false,
      readStatus: item.read_status || 'unread',
      readingProgress: item.reading_progress || 0,
      savedAt: item.saved_at,
      lastAccessed: item.last_accessed,
      archivedAt: item.archived_at,
      annotationCount: 0,
      metadata: item.metadata || {}
    }

    return NextResponse.json({
      item: transformedItem,
      message: 'Content saved successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Saved Content Items API: Error creating item:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save content',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

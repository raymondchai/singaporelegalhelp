import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🏷️ Tags API: Starting request')

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Tags API: Missing authorization header')
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
      console.log('❌ Tags API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const popular = searchParams.get('popular') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')

    console.log('🏷️ Tags API: Fetching tags for user:', user.id)

    let query = supabase
      .from('content_tags')
      .select(`
        id,
        name,
        description,
        color,
        category,
        parent_tag_id,
        sort_order,
        usage_count,
        last_used,
        is_system_tag,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)

    // Filter by category if specified
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by search term if specified
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Order by popularity or alphabetically
    if (popular) {
      query = query.order('usage_count', { ascending: false }).order('name', { ascending: true })
    } else {
      query = query.order('sort_order', { ascending: true }).order('name', { ascending: true })
    }

    // Apply limit
    query = query.limit(limit)

    const { data: tags, error: tagsError } = await query

    if (tagsError) {
      console.error('❌ Tags API: Error fetching tags:', tagsError)
      
      // Check if table doesn't exist
      if (tagsError.message?.includes('relation "content_tags" does not exist')) {
        return NextResponse.json({
          tags: [],
          message: 'Content tags table not created yet. Please run database migrations.'
        })
      }
      
      throw tagsError
    }

    console.log('✅ Tags API: Found', tags?.length || 0, 'tags')

    // Transform the data to match ContentTag interface
    const transformedTags = (tags || []).map(tag => ({
      id: tag.id,
      userId: user.id,
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      category: tag.category,
      parentTagId: tag.parent_tag_id,
      sortOrder: tag.sort_order,
      usageCount: tag.usage_count,
      lastUsed: tag.last_used,
      isSystemTag: tag.is_system_tag,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at
    }))

    return NextResponse.json({
      tags: transformedTags,
      count: transformedTags.length
    })

  } catch (error: any) {
    console.error('❌ Tags API: Unexpected error:', error)
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
    console.log('🏷️ Tags API: Creating new tag')

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
      color = '#6B7280',
      category = 'custom',
      parentTagId,
      sortOrder = 0
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    // Check if tag already exists for this user
    const { data: existing } = await supabase
      .from('content_tags')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim().toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      )
    }

    // Create the tag
    const { data: tag, error: tagError } = await supabase
      .from('content_tags')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        color,
        category,
        parent_tag_id: parentTagId,
        sort_order: sortOrder,
        usage_count: 0,
        is_system_tag: false
      })
      .select()
      .single()

    if (tagError) {
      console.error('❌ Tags API: Error creating tag:', tagError)
      throw tagError
    }

    console.log('✅ Tags API: Created tag:', tag.id)

    // Log activity
    await supabase.rpc('log_content_activity', {
      p_user_id: user.id,
      p_activity_type: 'tag_created',
      p_content_type: 'tag',
      p_content_id: tag.id,
      p_details: { tag_name: tag.name }
    })

    // Transform the data to match ContentTag interface
    const transformedTag = {
      id: tag.id,
      userId: user.id,
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      category: tag.category,
      parentTagId: tag.parent_tag_id,
      sortOrder: tag.sort_order,
      usageCount: tag.usage_count,
      lastUsed: tag.last_used,
      isSystemTag: tag.is_system_tag,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at
    }

    return NextResponse.json({
      tag: transformedTag,
      message: 'Tag created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Tags API: Error creating tag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create tag',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🏷️ Tags API: Updating tag')

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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    // Update the tag
    const { data: tag, error: updateError } = await supabase
      .from('content_tags')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the tag
      .select()
      .single()

    if (updateError) {
      console.error('❌ Tags API: Error updating tag:', updateError)
      throw updateError
    }

    console.log('✅ Tags API: Updated tag:', tag.id)

    // Transform the data to match ContentTag interface
    const transformedTag = {
      id: tag.id,
      userId: user.id,
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      category: tag.category,
      parentTagId: tag.parent_tag_id,
      sortOrder: tag.sort_order,
      usageCount: tag.usage_count,
      lastUsed: tag.last_used,
      isSystemTag: tag.is_system_tag,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at
    }

    return NextResponse.json({
      tag: transformedTag,
      message: 'Tag updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Tags API: Error updating tag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update tag',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🏷️ Tags API: Deleting tag')

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

    // Get tag ID from query parameters
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      )
    }

    // Delete the tag
    const { error: deleteError } = await supabase
      .from('content_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the tag

    if (deleteError) {
      console.error('❌ Tags API: Error deleting tag:', deleteError)
      throw deleteError
    }

    console.log('✅ Tags API: Deleted tag:', id)

    return NextResponse.json({
      message: 'Tag deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Tags API: Error deleting tag:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete tag',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

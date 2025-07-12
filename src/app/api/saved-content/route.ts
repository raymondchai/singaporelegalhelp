import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch user's saved content with full details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Fetch saved content with joined article/qa details
    const { data: savedContent, error } = await supabase
      .from('user_saved_content')
      .select(`
        id,
        content_type,
        content_id,
        collection_name,
        notes,
        saved_at
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved content' },
        { status: 500 }
      )
    }

    // Fetch full details for each saved item
    const enrichedContent = await Promise.all(
      (savedContent || []).map(async (item) => {
        let contentDetails = null

        if (item.content_type === 'article') {
          const { data: article } = await supabase
            .from('legal_articles')
            .select(`
              id,
              title,
              summary,
              content,
              category_id,
              slug,
              legal_categories(name, slug)
            `)
            .eq('id', item.content_id)
            .single()
          
          contentDetails = article
        } else if (item.content_type === 'qa') {
          const { data: qa } = await supabase
            .from('legal_qa')
            .select(`
              id,
              question,
              answer,
              category_id,
              legal_categories(name, slug)
            `)
            .eq('id', item.content_id)
            .single()
          
          contentDetails = qa
        }

        return {
          ...item,
          content_details: contentDetails
        }
      })
    )

    return NextResponse.json({
      success: true,
      savedContent: enrichedContent.filter(item => item.content_details !== null)
    })

  } catch (error: any) {
    console.error('Saved content API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save new content
export async function POST(request: NextRequest) {
  try {
    const { userId, contentType, contentId, collectionName = 'Default', notes = '' } = await request.json()

    if (!userId || !contentType || !contentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, contentType, contentId' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if already saved
    const { data: existing } = await supabase
      .from('user_saved_content')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Content already saved' },
        { status: 409 }
      )
    }

    // Save content
    const { data, error } = await supabase
      .from('user_saved_content')
      .insert([{
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        collection_name: collectionName,
        notes: notes
      }])
      .select()
      .single()

    if (error) {
      console.error('Error saving content:', error)
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      savedItem: data
    })

  } catch (error: any) {
    console.error('Save content API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove saved content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const savedItemId = searchParams.get('savedItemId')

    if (!userId || !savedItemId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, savedItemId' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Delete saved content item
    const { error } = await supabase
      .from('user_saved_content')
      .delete()
      .eq('id', savedItemId)
      .eq('user_id', userId) // Ensure user owns this saved item

    if (error) {
      console.error('Error removing saved content:', error)
      return NextResponse.json(
        { error: 'Failed to remove saved content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content removed from saved items'
    })

  } catch (error: any) {
    console.error('Remove saved content API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

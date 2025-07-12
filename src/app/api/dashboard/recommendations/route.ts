import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRecommendationEngine } from '@/lib/recommendations'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') // Optional filter by recommendation type

    // Generate recommendations
    const engine = createRecommendationEngine(user.id)
    let recommendations = await engine.generateRecommendations(limit)

    // Filter by type if specified
    if (type && ['article', 'qa', 'template', 'practice_area'].includes(type)) {
      recommendations = recommendations.filter(rec => rec.type === type)
    }

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length
    })

  } catch (error) {
    console.error('Recommendations API error:', error)
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
    const { action, recommendationId, contentId, contentType } = body

    // Handle recommendation interactions
    switch (action) {
      case 'view':
        await trackRecommendationInteraction(user.id, recommendationId, 'view', { contentId, contentType })
        break
      case 'bookmark':
        await trackRecommendationInteraction(user.id, recommendationId, 'bookmark', { contentId, contentType })
        await addToBookmarks(user.id, contentId, contentType)
        break
      case 'dismiss':
        await trackRecommendationInteraction(user.id, recommendationId, 'dismiss', { contentId, contentType })
        break
      case 'feedback':
        const { rating, feedback } = body
        await trackRecommendationFeedback(user.id, recommendationId, rating, feedback)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Recommendations interaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function trackRecommendationInteraction(
  userId: string,
  recommendationId: string,
  action: string,
  metadata: any
) {
  try {
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: `recommendation_${action}`,
        content_id: metadata.contentId,
        metadata: {
          recommendation_id: recommendationId,
          content_type: metadata.contentType,
          action,
          ...metadata
        }
      })
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error)
  }
}

async function addToBookmarks(userId: string, contentId: string, contentType: string) {
  try {
    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('user_saved_content')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (!existing) {
      await supabase
        .from('user_saved_content')
        .insert({
          user_id: userId,
          content_id: contentId,
          content_type: contentType,
          collection_name: 'Recommended'
        })
    }
  } catch (error) {
    console.error('Error adding to bookmarks:', error)
  }
}

async function trackRecommendationFeedback(
  userId: string,
  recommendationId: string,
  rating: number,
  feedback?: string
) {
  try {
    // Store feedback in a dedicated table (would need to create this table)
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: 'recommendation_feedback',
        metadata: {
          recommendation_id: recommendationId,
          rating,
          feedback
        }
      })
  } catch (error) {
    console.error('Error tracking recommendation feedback:', error)
  }
}

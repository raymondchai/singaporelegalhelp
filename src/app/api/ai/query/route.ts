import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { legalRAGService } from '@/lib/aixplain'

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { question, category, sessionId } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    // Verify user authentication with Supabase
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Rate limiting check (simple implementation)
    const rateLimitKey = `ai_query_${user.id}`
    const rateLimitWindow = 60 * 1000 // 1 minute
    const maxQueries = 10 // Max 10 queries per minute

    // Check recent queries
    const { data: recentQueries, error: queryError } = await supabase
      .from('ai_query_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - rateLimitWindow).toISOString())

    if (queryError) {
      console.error('Error checking rate limit:', queryError)
    } else if (recentQueries && recentQueries.length >= maxQueries) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before making another query.' },
        { status: 429 }
      )
    }

    // Process the AI query
    console.log(`Processing AI query from user ${user.id}: ${question}`)
    
    const response = await legalRAGService.queryLegalAssistant({
      question,
      category,
      userId: user.id,
      sessionId
    })

    // Log successful query
    console.log(`AI query completed for user ${user.id} with confidence ${response.confidence}`)

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error processing AI query:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const healthStatus = await legalRAGService.healthCheck()
    
    return NextResponse.json({
      service: 'AI Query Service',
      timestamp: new Date().toISOString(),
      ...healthStatus
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'AI Query Service',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { legalRAGService } from '@/lib/aixplain'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log(`Admin ${user.id} initializing AI knowledge base...`)

    // Initialize the RAG service
    await legalRAGService.initialize()

    console.log('AI knowledge base initialized successfully')

    return NextResponse.json({
      success: true,
      message: 'AI knowledge base initialized successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error initializing AI knowledge base:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize AI knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get initialization status
export async function GET() {
  try {
    const healthStatus = await legalRAGService.healthCheck()
    
    return NextResponse.json({
      service: 'AI Knowledge Base',
      timestamp: new Date().toISOString(),
      ...healthStatus
    })
  } catch (error) {
    return NextResponse.json(
      {
        service: 'AI Knowledge Base',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

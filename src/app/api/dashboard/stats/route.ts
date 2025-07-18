import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('📊 Dashboard Stats API: Starting request')
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('📊 Dashboard Stats API: Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get query parameter
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    console.log('📊 Dashboard Stats API: Request type:', type)

    // Handle different stat types
    switch (type) {
      case 'documents':
        return NextResponse.json({
          total: 0,
          recent: 0,
          uploads_this_month: 0
        })
        
      case 'chats':
        return NextResponse.json({
          total_sessions: 0,
          active_conversations: 0,
          messages_today: 0
        })
        
      case 'saved':
        return NextResponse.json({
          total_items: 0,
          bookmarks: 0,
          collections: 0
        })
        
      case 'activity':
        return NextResponse.json({
          recent_activities: [],
          login_count: 1,
          last_activity: new Date().toISOString()
        })
        
      default:
        // Default dashboard stats when no type specified
        return NextResponse.json({
          totalArticles: 21,
          totalQAs: 18,
          recentActivity: 0,
          bookmarkedContent: 0,
          subscriptionTier: 'enterprise',
          userSince: session.user.created_at,
          lastLogin: session.user.last_sign_in_at
        })
    }

  } catch (error) {
    console.error('💥 Dashboard Stats API: Critical error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

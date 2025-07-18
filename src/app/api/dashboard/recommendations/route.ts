import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  console.log('🎯 Recommendations API: Starting request')

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('🎯 Recommendations API: Authentication failed')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('🎯 Recommendations API: User authenticated:', session.user.id)

    // For now, return mock recommendations until tables are properly set up
    const recommendations = [
      {
        id: '1',
        title: 'Understanding Employment Law in Singapore',
        description: 'A comprehensive guide to employment rights and obligations in Singapore.',
        type: 'article' as const,
        category: 'Employment Law',
        categorySlug: 'employment-law',
        link: '/legal-categories/employment-law/articles/1',
        priority: 'high' as const
      },
      {
        id: '2',
        title: 'Family Law: Divorce Proceedings',
        description: 'Step-by-step guide to divorce proceedings in Singapore courts.',
        type: 'article' as const,
        category: 'Family Law',
        categorySlug: 'family-law',
        link: '/legal-categories/family-law/articles/2',
        priority: 'high' as const
      },
      {
        id: '3',
        title: 'What are my rights as a tenant?',
        description: 'Common questions about tenant rights and landlord obligations.',
        type: 'qa' as const,
        category: 'Property Law',
        categorySlug: 'property-law',
        link: '/legal-categories/property-law/qa/3',
        priority: 'medium' as const
      }
    ]

    console.log(`🎯 Recommendations API: Success - returning ${recommendations.length} recommendations`)
    return NextResponse.json(recommendations)

  } catch (error) {
    console.error('💥 Recommendations API: Critical error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

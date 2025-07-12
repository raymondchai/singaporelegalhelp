import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchQuery {
  query: string;
  category?: string;
  difficulty?: string;
  content_type?: 'article' | 'qa' | 'all';
  reading_time?: string;
  date_range?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'qa';
  category_name: string;
  category_id: string;
  difficulty?: string;
  relevance_score: number;
  highlight?: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startTime = Date.now();

  const query = searchParams.get('q') ?? searchParams.get('query');
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const content_type = searchParams.get('content_type') as 'article' | 'qa' | 'all' ?? 'all';
  const reading_time = searchParams.get('reading_time');
  const date_range = searchParams.get('date_range');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  // Validate query
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    // Get user ID from headers if available (for analytics)
    const userId = request.headers.get('x-user-id');

    // Convert category name to UUID if provided
    let categoryId: string | null = null;
    if (category) {
      const { data: categoryData } = await supabase
        .from('legal_categories')
        .select('id')
        .eq('name', category)
        .single();
      
      categoryId = categoryData?.id || null;
    }

    // Call the enhanced global search function
    const { data: results, error } = await supabase.rpc('global_search_enhanced', {
      search_term: query.trim(),
      search_category: categoryId,
      search_difficulty: difficulty ?? null,
      search_type: content_type,
      search_reading_time: reading_time ?? null,
      search_date_range: date_range ?? null,
      search_limit: limit,
      search_offset: offset
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Get total count for pagination (separate query without limit/offset)
    const { data: totalCountResult, error: countError } = await supabase.rpc('global_search_count', {
      search_term: query.trim(),
      search_category: categoryId,
      search_difficulty: difficulty ?? null,
      search_type: content_type,
      search_reading_time: reading_time ?? null,
      search_date_range: date_range ?? null
    });

    const totalCount = totalCountResult?.[0]?.total_count || results?.length || 0;
    const responseTime = Date.now() - startTime;

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Log search analytics
    try {
      await supabase.from('search_analytics').insert({
        query: query.trim(),
        results_count: totalCount,
        user_id: userId || null,
        search_filters: {
          category,
          difficulty,
          content_type,
          reading_time,
          date_range
        },
        response_time_ms: responseTime
      });
    } catch (analyticsError) {
      console.error('Analytics logging error:', analyticsError);
      // Don't fail the search if analytics fails
    }

    return NextResponse.json({
      results: results || [],
      total_count: totalCount,
      current_page: currentPage,
      total_pages: totalPages,
      has_next_page: hasNextPage,
      has_prev_page: hasPrevPage,
      results_per_page: limit,
      query: query.trim(),
      response_time_ms: responseTime,
      pagination: {
        current_page: currentPage,
        total_pages: totalPages,
        total_results: totalCount,
        results_per_page: limit,
        has_next: hasNextPage,
        has_prev: hasPrevPage,
        next_page: hasNextPage ? currentPage + 1 : null,
        prev_page: hasPrevPage ? currentPage - 1 : null
      },
      filters: {
        category,
        difficulty,
        content_type,
        reading_time,
        date_range
      }
    });

  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Handle search suggestions endpoint
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get popular search terms and similar queries
    const { data: popularQueries } = await supabase
      .from('search_analytics')
      .select('query')
      .ilike('query', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    // Remove duplicates and limit to 5 unique suggestions
    const uniqueQueries = Array.from(new Set(popularQueries?.map(item => item.query) || []));
    const suggestions = uniqueQueries.slice(0, 5);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

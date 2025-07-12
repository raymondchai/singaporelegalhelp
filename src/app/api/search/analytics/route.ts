import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchClickAnalytics {
  query: string;
  clicked_result_id: string;
  clicked_result_type: 'article' | 'qa';
  clicked_result_position?: number;
  user_id?: string;
  session_id?: string;
}

interface SearchSessionAnalytics {
  query: string;
  results_count: number;
  filters_used?: Record<string, any>;
  response_time_ms: number;
  user_id?: string;
  session_id?: string;
}

// POST - Track search result clicks and user interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      clicked_result_id, 
      clicked_result_type, 
      clicked_result_position,
      session_id 
    }: SearchClickAnalytics = body;

    // Get user ID from headers if available
    const userId = request.headers.get('x-user-id');

    // Validate required fields
    if (!query || !clicked_result_id || !clicked_result_type) {
      return NextResponse.json(
        { error: 'Missing required fields: query, clicked_result_id, clicked_result_type' },
        { status: 400 }
      );
    }

    // Log search result click (with graceful degradation)
    try {
      const { error: clickError } = await supabase
        .from('search_result_clicks')
        .insert({
          query: query.trim(),
          clicked_result_id,
          clicked_result_type,
          clicked_result_position: clicked_result_position || null,
          user_id: userId || null,
          session_id: session_id || null,
          clicked_at: new Date().toISOString()
        });

      if (clickError) {
        console.error('Search click analytics error (table may not exist):', clickError);
        // Don't fail the request if analytics table doesn't exist
      }
    } catch (tableError) {
      console.log('Search analytics table not available, skipping click tracking');
      // Gracefully handle missing table
    }

    // Update search analytics with click data
    try {
      await supabase.rpc('update_search_click_analytics', {
        search_query: query.trim(),
        result_id: clicked_result_id,
        result_type: clicked_result_type
      });
    } catch (updateError) {
      console.error('Search analytics update error:', updateError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Search analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve search analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let data: any = {};

    switch (type) {
      case 'popular-queries':
        // Get most popular search queries
        const { data: allQueries } = await supabase
          .from('search_analytics')
          .select('query')
          .gte('created_at', startDate);

        // Group queries manually
        const queryCount: Record<string, number> = {};
        allQueries?.forEach(item => {
          queryCount[item.query] = (queryCount[item.query] || 0) + 1;
        });

        const popularQueries = Object.entries(queryCount)
          .map(([query, search_count]) => ({ query, search_count }))
          .sort((a, b) => b.search_count - a.search_count)
          .slice(0, limit);

        data = { popular_queries: popularQueries || [] };
        break;

      case 'trending-queries':
        // Get trending search queries (recent increase in searches)
        const { data: trendingQueries } = await supabase
          .from('search_analytics')
          .select('query, created_at')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })
          .limit(limit * 5); // Get more data to analyze trends

        // Simple trending calculation based on recent frequency
        const queryFrequency: Record<string, number> = {};
        trendingQueries?.forEach(item => {
          queryFrequency[item.query] = (queryFrequency[item.query] || 0) + 1;
        });

        const trending = Object.entries(queryFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([query, count]) => ({ query, trend_score: count }));

        data = { trending_queries: trending };
        break;

      case 'click-through-rates':
        // Get click-through rates for search results
        const { data: ctrData } = await supabase.rpc('get_search_ctr_analytics', {
          days_back: days,
          result_limit: limit
        });

        data = { click_through_rates: ctrData || [] };
        break;

      case 'performance':
        // Get search performance metrics
        const { data: performanceData } = await supabase
          .from('search_analytics')
          .select('response_time_ms, results_count, created_at')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false });

        const avgResponseTime = performanceData && performanceData.length > 0
          ? performanceData.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / performanceData.length
          : 0;

        const avgResultsCount = performanceData && performanceData.length > 0
          ? performanceData.reduce((sum, item) => sum + (item.results_count || 0), 0) / performanceData.length
          : 0;

        data = {
          performance: {
            avg_response_time_ms: Math.round(avgResponseTime),
            avg_results_count: Math.round(avgResultsCount),
            total_searches: performanceData?.length || 0,
            period_days: days
          }
        };
        break;

      case 'summary':
      default:
        // Get comprehensive search analytics summary
        const [searches, clicks, topQueries] = await Promise.all([
          supabase
            .from('search_analytics')
            .select('id, response_time_ms, results_count')
            .gte('created_at', startDate),
          
          supabase
            .from('search_result_clicks')
            .select('id')
            .gte('clicked_at', startDate),
          
          supabase
            .from('search_analytics')
            .select('query')
            .gte('created_at', startDate)
            .limit(5)
        ]);

        const totalSearches = searches.data?.length || 0;
        const totalClicks = clicks.data?.length || 0;
        const summaryAvgResponseTime = searches.data && searches.data.length > 0
          ? searches.data.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / totalSearches
          : 0;

        data = {
          summary: {
            total_searches: totalSearches,
            total_clicks: totalClicks,
            click_through_rate: totalSearches > 0 ? (totalClicks / totalSearches * 100).toFixed(2) : '0.00',
            avg_response_time_ms: Math.round(summaryAvgResponseTime),
            period_days: days
          }
        };
        break;
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Search analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

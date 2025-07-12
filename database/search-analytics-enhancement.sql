-- =====================================================
-- Search Analytics Enhancement Schema
-- Singapore Legal Help Platform
-- =====================================================

-- Create search_result_clicks table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.search_result_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    clicked_result_id UUID NOT NULL,
    clicked_result_type VARCHAR(20) NOT NULL CHECK (clicked_result_type IN ('article', 'qa')),
    clicked_result_position INTEGER,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to search_analytics table if they don't exist
DO $$ 
BEGIN
    -- Add search_filters column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'search_analytics' AND column_name = 'search_filters') THEN
        ALTER TABLE public.search_analytics ADD COLUMN search_filters JSONB;
    END IF;
    
    -- Add session_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'search_analytics' AND column_name = 'session_id') THEN
        ALTER TABLE public.search_analytics ADD COLUMN session_id TEXT;
    END IF;
END $$;

-- Create search_user_history table for user search history
CREATE TABLE IF NOT EXISTS public.search_user_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    filters_used JSONB,
    search_timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_saved BOOLEAN DEFAULT FALSE,
    saved_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search_popular_queries table for trending analysis
CREATE TABLE IF NOT EXISTS public.search_popular_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT UNIQUE NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched TIMESTAMPTZ DEFAULT NOW(),
    trend_score DECIMAL(10,2) DEFAULT 0.0,
    category_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_query ON public.search_result_clicks(query);
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_clicked_at ON public.search_result_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_user_id ON public.search_result_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_result_clicks_result_type ON public.search_result_clicks(clicked_result_type);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON public.search_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_search_user_history_user_id ON public.search_user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_user_history_timestamp ON public.search_user_history(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_user_history_query ON public.search_user_history(query);

CREATE INDEX IF NOT EXISTS idx_search_popular_queries_count ON public.search_popular_queries(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_popular_queries_trend ON public.search_popular_queries(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_popular_queries_updated ON public.search_popular_queries(updated_at DESC);

-- Function to update search click analytics
CREATE OR REPLACE FUNCTION public.update_search_click_analytics(
    search_query TEXT,
    result_id UUID,
    result_type TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update popular queries table
    INSERT INTO public.search_popular_queries (query, search_count, last_searched)
    VALUES (search_query, 1, NOW())
    ON CONFLICT (query) 
    DO UPDATE SET 
        search_count = search_popular_queries.search_count + 1,
        last_searched = NOW(),
        updated_at = NOW();
        
    -- Calculate trend score (simple implementation)
    UPDATE public.search_popular_queries 
    SET trend_score = (
        search_count * 0.7 + 
        EXTRACT(EPOCH FROM (NOW() - last_searched)) / 3600 * 0.3
    )
    WHERE query = search_query;
END;
$$ LANGUAGE plpgsql;

-- Function to get search CTR analytics
CREATE OR REPLACE FUNCTION public.get_search_ctr_analytics(
    days_back INTEGER DEFAULT 7,
    result_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    query TEXT,
    total_searches BIGINT,
    total_clicks BIGINT,
    click_through_rate DECIMAL,
    avg_position DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH search_stats AS (
        SELECT 
            sa.query,
            COUNT(sa.id) as searches,
            COUNT(src.id) as clicks
        FROM public.search_analytics sa
        LEFT JOIN public.search_result_clicks src ON sa.query = src.query
        WHERE sa.created_at >= NOW() - INTERVAL '%s days' % days_back
        GROUP BY sa.query
    ),
    position_stats AS (
        SELECT 
            query,
            AVG(clicked_result_position) as avg_pos
        FROM public.search_result_clicks
        WHERE clicked_at >= NOW() - INTERVAL '%s days' % days_back
        AND clicked_result_position IS NOT NULL
        GROUP BY query
    )
    SELECT 
        ss.query,
        ss.searches,
        ss.clicks,
        CASE 
            WHEN ss.searches > 0 THEN ROUND((ss.clicks::DECIMAL / ss.searches * 100), 2)
            ELSE 0.00
        END as ctr,
        COALESCE(ps.avg_pos, 0.0) as avg_position
    FROM search_stats ss
    LEFT JOIN position_stats ps ON ss.query = ps.query
    WHERE ss.searches > 0
    ORDER BY ss.searches DESC, ctr DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending search queries
CREATE OR REPLACE FUNCTION public.get_trending_search_queries(
    days_back INTEGER DEFAULT 7,
    result_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    query TEXT,
    current_searches BIGINT,
    previous_searches BIGINT,
    trend_percentage DECIMAL,
    trend_direction TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            query,
            COUNT(*) as current_count
        FROM public.search_analytics
        WHERE created_at >= NOW() - INTERVAL '%s days' % days_back
        GROUP BY query
    ),
    previous_period AS (
        SELECT 
            query,
            COUNT(*) as previous_count
        FROM public.search_analytics
        WHERE created_at >= NOW() - INTERVAL '%s days' % (days_back * 2)
        AND created_at < NOW() - INTERVAL '%s days' % days_back
        GROUP BY query
    )
    SELECT 
        cp.query,
        cp.current_count,
        COALESCE(pp.previous_count, 0),
        CASE 
            WHEN COALESCE(pp.previous_count, 0) > 0 THEN 
                ROUND(((cp.current_count - pp.previous_count)::DECIMAL / pp.previous_count * 100), 2)
            ELSE 100.00
        END as trend_pct,
        CASE 
            WHEN cp.current_count > COALESCE(pp.previous_count, 0) THEN 'up'
            WHEN cp.current_count < COALESCE(pp.previous_count, 0) THEN 'down'
            ELSE 'stable'
        END as direction
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.query = pp.query
    WHERE cp.current_count >= 2  -- Only include queries with at least 2 searches
    ORDER BY trend_pct DESC, cp.current_count DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old search analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_search_analytics() RETURNS VOID AS $$
BEGIN
    -- Delete search analytics older than 1 year
    DELETE FROM public.search_analytics 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete search clicks older than 1 year
    DELETE FROM public.search_result_clicks 
    WHERE clicked_at < NOW() - INTERVAL '1 year';
    
    -- Delete user search history older than 6 months (except saved searches)
    DELETE FROM public.search_user_history 
    WHERE search_timestamp < NOW() - INTERVAL '6 months'
    AND is_saved = FALSE;
    
    -- Update trend scores for popular queries
    UPDATE public.search_popular_queries 
    SET trend_score = (
        search_count * 0.7 + 
        CASE 
            WHEN last_searched > NOW() - INTERVAL '7 days' THEN 30
            WHEN last_searched > NOW() - INTERVAL '30 days' THEN 10
            ELSE 0
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.search_result_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_popular_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_result_clicks (allow all reads, authenticated writes)
CREATE POLICY "Allow public read access to search clicks" ON public.search_result_clicks
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert search clicks" ON public.search_result_clicks
    FOR INSERT WITH CHECK (true);

-- RLS Policies for search_user_history (users can only see their own history)
CREATE POLICY "Users can view their own search history" ON public.search_user_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON public.search_user_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history" ON public.search_user_history
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for search_popular_queries (public read access)
CREATE POLICY "Allow public read access to popular queries" ON public.search_popular_queries
    FOR SELECT USING (true);

-- Function to get total search result count for pagination
CREATE OR REPLACE FUNCTION public.global_search_count(
    search_term TEXT,
    search_category UUID DEFAULT NULL,
    search_difficulty TEXT DEFAULT NULL,
    search_type TEXT DEFAULT 'all',
    search_reading_time TEXT DEFAULT NULL,
    search_date_range TEXT DEFAULT NULL
) RETURNS TABLE (total_count BIGINT) AS $$
DECLARE
    article_count BIGINT := 0;
    qa_count BIGINT := 0;
    date_filter TIMESTAMPTZ;
BEGIN
    -- Calculate date filter
    CASE search_date_range
        WHEN 'week' THEN date_filter := NOW() - INTERVAL '7 days';
        WHEN 'month' THEN date_filter := NOW() - INTERVAL '30 days';
        WHEN 'quarter' THEN date_filter := NOW() - INTERVAL '90 days';
        WHEN 'year' THEN date_filter := NOW() - INTERVAL '365 days';
        ELSE date_filter := NULL;
    END CASE;

    -- Count articles if needed
    IF search_type IN ('all', 'article') THEN
        SELECT COUNT(*) INTO article_count
        FROM public.legal_articles la
        LEFT JOIN public.legal_categories lc ON la.category_id = lc.id
        WHERE la.is_published = true
        AND (search_term IS NULL OR la.search_vector @@ plainto_tsquery('english', search_term))
        AND (search_category IS NULL OR la.category_id = search_category)
        AND (search_difficulty IS NULL OR la.difficulty = search_difficulty)
        AND (date_filter IS NULL OR la.created_at >= date_filter);
    END IF;

    -- Count Q&As if needed
    IF search_type IN ('all', 'qa') THEN
        SELECT COUNT(*) INTO qa_count
        FROM public.legal_qa lq
        LEFT JOIN public.legal_categories lc ON lq.category_id = lc.id
        WHERE lq.is_public = true
        AND lq.status = 'published'
        AND (search_term IS NULL OR lq.search_vector @@ plainto_tsquery('english', search_term))
        AND (search_category IS NULL OR lq.category_id = search_category)
        AND (search_difficulty IS NULL OR lq.difficulty = search_difficulty)
        AND (date_filter IS NULL OR lq.created_at >= date_filter);
    END IF;

    RETURN QUERY SELECT (article_count + qa_count);
END;
$$ LANGUAGE plpgsql;

-- Function to get search result page navigation
CREATE OR REPLACE FUNCTION public.get_search_pagination_info(
    total_results BIGINT,
    current_page INTEGER,
    results_per_page INTEGER
) RETURNS TABLE (
    total_pages INTEGER,
    has_next BOOLEAN,
    has_prev BOOLEAN,
    next_page INTEGER,
    prev_page INTEGER,
    start_result INTEGER,
    end_result INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CEIL(total_results::DECIMAL / results_per_page)::INTEGER as total_pages,
        current_page < CEIL(total_results::DECIMAL / results_per_page) as has_next,
        current_page > 1 as has_prev,
        CASE
            WHEN current_page < CEIL(total_results::DECIMAL / results_per_page)
            THEN current_page + 1
            ELSE NULL
        END as next_page,
        CASE
            WHEN current_page > 1
            THEN current_page - 1
            ELSE NULL
        END as prev_page,
        ((current_page - 1) * results_per_page + 1)::INTEGER as start_result,
        LEAST(current_page * results_per_page, total_results)::INTEGER as end_result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.search_result_clicks IS 'Tracks user clicks on search results for analytics';
COMMENT ON TABLE public.search_user_history IS 'Stores individual user search history and saved searches';
COMMENT ON TABLE public.search_popular_queries IS 'Aggregated popular search queries with trend analysis';

COMMENT ON FUNCTION public.update_search_click_analytics IS 'Updates search analytics when a user clicks on a search result';
COMMENT ON FUNCTION public.get_search_ctr_analytics IS 'Returns click-through rate analytics for search queries';
COMMENT ON FUNCTION public.get_trending_search_queries IS 'Returns trending search queries with growth metrics';
COMMENT ON FUNCTION public.cleanup_old_search_analytics IS 'Cleans up old search analytics data to maintain performance';
-- Function to parse and execute advanced search queries
CREATE OR REPLACE FUNCTION public.global_search_advanced(
    search_term TEXT,
    search_category UUID DEFAULT NULL,
    search_difficulty TEXT DEFAULT NULL,
    search_type TEXT DEFAULT 'all',
    search_reading_time TEXT DEFAULT NULL,
    search_date_range TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 20,
    search_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    category_name TEXT,
    category_id UUID,
    difficulty TEXT,
    relevance_score DECIMAL,
    highlight TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    date_filter TIMESTAMPTZ;
    parsed_query TEXT;
    must_terms TEXT[];
    must_not_terms TEXT[];
    should_terms TEXT[];
    field_searches JSONB := '{}';
BEGIN
    -- Calculate date filter
    CASE search_date_range
        WHEN 'week' THEN date_filter := NOW() - INTERVAL '7 days';
        WHEN 'month' THEN date_filter := NOW() - INTERVAL '30 days';
        WHEN 'quarter' THEN date_filter := NOW() - INTERVAL '90 days';
        WHEN 'year' THEN date_filter := NOW() - INTERVAL '365 days';
        ELSE date_filter := NULL;
    END CASE;

    -- Parse advanced search syntax
    -- Extract must terms (+term)
    must_terms := regexp_split_to_array(
        regexp_replace(search_term, '\+([^\s]+)', '\1', 'g'),
        '\s+'
    );

    -- Extract must not terms (-term)
    must_not_terms := regexp_split_to_array(
        regexp_replace(search_term, '\-([^\s]+)', '\1', 'g'),
        '\s+'
    );

    -- Extract field-specific searches (field:term)
    -- This is a simplified implementation - in production, you'd want more robust parsing

    -- For now, fall back to the existing search function with enhanced query processing
    parsed_query := regexp_replace(search_term, '[\+\-]', '', 'g');
    parsed_query := regexp_replace(parsed_query, '([a-z]+):', '', 'g');

    -- Use the existing global_search_enhanced function with processed query
    RETURN QUERY
    SELECT * FROM public.global_search_enhanced(
        parsed_query,
        search_category,
        search_difficulty,
        search_type,
        search_reading_time,
        search_date_range,
        search_limit,
        search_offset
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate and sanitize search queries
CREATE OR REPLACE FUNCTION public.sanitize_search_query(
    raw_query TEXT
) RETURNS TEXT AS $$
DECLARE
    sanitized TEXT;
BEGIN
    -- Remove potentially harmful characters
    sanitized := regexp_replace(raw_query, '[<>{}()\[\]\\]', '', 'g');

    -- Limit length
    sanitized := LEFT(sanitized, 500);

    -- Trim whitespace
    sanitized := TRIM(sanitized);

    -- Ensure minimum length
    IF LENGTH(sanitized) < 2 THEN
        RETURN NULL;
    END IF;

    RETURN sanitized;
END;
$$ LANGUAGE plpgsql;

-- Function to extract search intent and suggestions
CREATE OR REPLACE FUNCTION public.analyze_search_intent(
    search_query TEXT
) RETURNS TABLE (
    intent_type TEXT,
    confidence DECIMAL,
    suggested_filters JSONB,
    related_queries TEXT[]
) AS $$
DECLARE
    query_lower TEXT;
    legal_keywords TEXT[] := ARRAY[
        'contract', 'employment', 'property', 'family', 'criminal',
        'corporate', 'intellectual', 'immigration', 'tax', 'dispute'
    ];
    action_keywords TEXT[] := ARRAY[
        'how to', 'what is', 'can i', 'should i', 'when to', 'where to'
    ];
BEGIN
    query_lower := LOWER(search_query);

    -- Analyze for legal practice area intent
    FOR i IN 1..array_length(legal_keywords, 1) LOOP
        IF query_lower LIKE '%' || legal_keywords[i] || '%' THEN
            RETURN QUERY SELECT
                'practice_area'::TEXT,
                0.8::DECIMAL,
                jsonb_build_object('category', legal_keywords[i]),
                ARRAY[legal_keywords[i] || ' law', legal_keywords[i] || ' lawyer']::TEXT[];
            RETURN;
        END IF;
    END LOOP;

    -- Analyze for action intent
    FOR i IN 1..array_length(action_keywords, 1) LOOP
        IF query_lower LIKE action_keywords[i] || '%' THEN
            RETURN QUERY SELECT
                'how_to'::TEXT,
                0.7::DECIMAL,
                jsonb_build_object('content_type', 'article'),
                ARRAY['guide', 'tutorial', 'steps']::TEXT[];
            RETURN;
        END IF;
    END LOOP;

    -- Default intent
    RETURN QUERY SELECT
        'general'::TEXT,
        0.5::DECIMAL,
        '{}'::JSONB,
        ARRAY[]::TEXT[];
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.global_search_count IS 'Returns total count of search results for pagination';
COMMENT ON FUNCTION public.get_search_pagination_info IS 'Calculates pagination information for search results';
COMMENT ON FUNCTION public.global_search_advanced IS 'Handles advanced search queries with boolean operators and field-specific searches';
COMMENT ON FUNCTION public.sanitize_search_query IS 'Sanitizes and validates search queries for security';
COMMENT ON FUNCTION public.analyze_search_intent IS 'Analyzes search queries to determine user intent and provide suggestions';

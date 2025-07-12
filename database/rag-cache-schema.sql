-- RAG Cache Schema for Singapore Legal Help Platform
-- This table stores cached AI responses for performance optimization

-- Create RAG cache table
CREATE TABLE IF NOT EXISTS public.rag_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Query identification
    query_hash VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    category VARCHAR(50),
    
    -- Cached response data
    response JSONB NOT NULL,
    confidence DECIMAL(3,2),
    sources JSONB DEFAULT '[]'::jsonb,
    
    -- Cache metadata
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Performance tracking
    response_time_ms INTEGER,
    
    -- Constraints
    CONSTRAINT rag_cache_confidence_check CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT rag_cache_hit_count_check CHECK (hit_count >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_cache_query_hash ON public.rag_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_rag_cache_expires_at ON public.rag_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_rag_cache_hit_count ON public.rag_cache(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_rag_cache_category ON public.rag_cache(category);
CREATE INDEX IF NOT EXISTS idx_rag_cache_created_at ON public.rag_cache(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rag_cache_active_popular ON public.rag_cache(expires_at, hit_count DESC) 
    WHERE expires_at > NOW();

-- Full-text search index for question similarity
CREATE INDEX IF NOT EXISTS idx_rag_cache_question_fts ON public.rag_cache 
    USING gin(to_tsvector('english', question));

-- Enable Row Level Security (though cache is system-wide)
ALTER TABLE public.rag_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Cache is readable by all authenticated users but only system can write
CREATE POLICY "Cache readable by authenticated users" ON public.rag_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete cache entries
CREATE POLICY "Cache writable by service role" ON public.rag_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rag_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.rag_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('cache_cleanup', 'Cleaned ' || deleted_count || ' expired RAG cache entries', NOW());
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION public.get_rag_cache_stats()
RETURNS TABLE (
    total_entries BIGINT,
    active_entries BIGINT,
    expired_entries BIGINT,
    total_hits BIGINT,
    avg_confidence NUMERIC,
    cache_size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
        COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
        COALESCE(SUM(hit_count), 0) as total_hits,
        ROUND(AVG(confidence), 3) as avg_confidence,
        ROUND(pg_total_relation_size('public.rag_cache'::regclass) / 1024.0 / 1024.0, 2) as cache_size_mb
    FROM public.rag_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find similar cached queries
CREATE OR REPLACE FUNCTION public.find_similar_cached_queries(
    input_question TEXT,
    similarity_threshold REAL DEFAULT 0.3,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    similarity_score REAL,
    hit_count INTEGER,
    confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.question,
        ts_rank(to_tsvector('english', c.question), plainto_tsquery('english', input_question)) as similarity_score,
        c.hit_count,
        c.confidence
    FROM public.rag_cache c
    WHERE 
        c.expires_at > NOW()
        AND ts_rank(to_tsvector('english', c.question), plainto_tsquery('english', input_question)) > similarity_threshold
    ORDER BY similarity_score DESC, hit_count DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system logs table for monitoring (if not exists)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for system logs
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- Create a view for cache analytics
CREATE OR REPLACE VIEW public.rag_cache_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as cache_date,
    category,
    COUNT(*) as entries_created,
    AVG(confidence) as avg_confidence,
    SUM(hit_count) as total_hits,
    AVG(hit_count) as avg_hits_per_entry,
    COUNT(*) FILTER (WHERE hit_count > 0) as entries_with_hits,
    ROUND(
        (COUNT(*) FILTER (WHERE hit_count > 0)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as hit_rate_percentage
FROM public.rag_cache
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), category
ORDER BY cache_date DESC, category;

-- Grant permissions
GRANT SELECT ON public.rag_cache TO authenticated;
GRANT ALL ON public.rag_cache TO service_role;
GRANT SELECT ON public.rag_cache_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rag_cache_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_cached_queries(TEXT, REAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rag_cache() TO service_role;

-- Create scheduled job to clean expired cache entries (requires pg_cron extension)
-- This should be enabled by database admin
-- SELECT cron.schedule('cleanup-rag-cache', '0 */6 * * *', 'SELECT public.cleanup_expired_rag_cache();');

-- Add comments for documentation
COMMENT ON TABLE public.rag_cache IS 'Stores cached AI responses for performance optimization';
COMMENT ON COLUMN public.rag_cache.query_hash IS 'Hash of the normalized query for fast lookups';
COMMENT ON COLUMN public.rag_cache.response IS 'Complete AI response object in JSON format';
COMMENT ON COLUMN public.rag_cache.hit_count IS 'Number of times this cache entry has been accessed';
COMMENT ON COLUMN public.rag_cache.expires_at IS 'When this cache entry expires and should be cleaned up';
COMMENT ON FUNCTION public.cleanup_expired_rag_cache() IS 'Removes expired cache entries and returns count of deleted entries';
COMMENT ON FUNCTION public.get_rag_cache_stats() IS 'Returns comprehensive cache statistics for monitoring';
COMMENT ON VIEW public.rag_cache_analytics IS 'Daily analytics view for cache performance monitoring';

-- Insert some example data for testing (optional)
-- INSERT INTO public.rag_cache (query_hash, question, category, response, confidence, expires_at)
-- VALUES 
--     ('test_hash_1', 'What are employment rights in Singapore?', 'employment_law', 
--      '{"answer": "Employment rights in Singapore are governed by the Employment Act..."}', 
--      0.85, NOW() + INTERVAL '1 day'),
--     ('test_hash_2', 'How to register a company in Singapore?', 'business_law',
--      '{"answer": "To register a company in Singapore, you need to..."}',
--      0.92, NOW() + INTERVAL '1 day');

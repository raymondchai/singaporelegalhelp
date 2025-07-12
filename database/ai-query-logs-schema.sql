-- AI Query Logs Schema for Singapore Legal Help Platform
-- This table stores AI query analytics and monitoring data

-- Create AI query logs table
CREATE TABLE IF NOT EXISTS public.ai_query_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID,
    
    -- Query details
    question TEXT NOT NULL,
    category VARCHAR(50),
    
    -- Response metrics
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    sources_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT ai_query_logs_confidence_check CHECK (confidence >= 0 AND confidence <= 1)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user_id ON public.ai_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created_at ON public.ai_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_category ON public.ai_query_logs(category);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_confidence ON public.ai_query_logs(confidence);

-- Create composite index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user_time ON public.ai_query_logs(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own query logs
CREATE POLICY "Users can view own query logs" ON public.ai_query_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own query logs
CREATE POLICY "Users can insert own query logs" ON public.ai_query_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all query logs
CREATE POLICY "Admins can view all query logs" ON public.ai_query_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create a view for analytics (admin only)
CREATE OR REPLACE VIEW public.ai_query_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as query_date,
    category,
    COUNT(*) as total_queries,
    AVG(confidence) as avg_confidence,
    AVG(sources_count) as avg_sources,
    AVG(response_time_ms) as avg_response_time_ms,
    COUNT(DISTINCT user_id) as unique_users
FROM public.ai_query_logs
GROUP BY DATE_TRUNC('day', created_at), category
ORDER BY query_date DESC, category;

-- Grant access to the analytics view for admins only
CREATE POLICY "Admins can view query analytics" ON public.ai_query_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create function to clean up old query logs (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_query_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_query_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup weekly (requires pg_cron extension)
-- This is optional and should be enabled by database admin
-- SELECT cron.schedule('cleanup-ai-logs', '0 2 * * 0', 'SELECT public.cleanup_old_ai_query_logs();');

-- Insert some sample data for testing (optional)
-- INSERT INTO public.ai_query_logs (user_id, question, category, confidence, sources_count, response_time_ms)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000000', 'What are employment rights in Singapore?', 'employment_law', 0.85, 3, 1250),
--     ('00000000-0000-0000-0000-000000000000', 'How to register a company in Singapore?', 'business_law', 0.92, 5, 980);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.ai_query_logs TO authenticated;
GRANT SELECT ON public.ai_query_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_ai_query_logs() TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.ai_query_logs IS 'Stores AI query logs for analytics and monitoring';
COMMENT ON COLUMN public.ai_query_logs.confidence IS 'AI response confidence score (0.00 to 1.00)';
COMMENT ON COLUMN public.ai_query_logs.sources_count IS 'Number of sources used in the AI response';
COMMENT ON COLUMN public.ai_query_logs.response_time_ms IS 'Response time in milliseconds';
COMMENT ON VIEW public.ai_query_analytics IS 'Analytics view for AI query performance metrics';
COMMENT ON FUNCTION public.cleanup_old_ai_query_logs() IS 'Cleans up AI query logs older than 90 days';

-- Performance Monitoring and Analytics Schema
-- Singapore Legal Help Platform

-- Web Vitals Metrics Table
CREATE TABLE IF NOT EXISTS web_vitals_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(50) NOT NULL, -- CLS, FID, FCP, LCP, TTFB
    metric_value DECIMAL(10,3) NOT NULL,
    rating VARCHAR(20) NOT NULL, -- good, needs-improvement, poor
    delta DECIMAL(10,3),
    metric_id VARCHAR(100) NOT NULL,
    navigation_type VARCHAR(50),
    page_url TEXT NOT NULL,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web Vitals Daily Aggregates
CREATE TABLE IF NOT EXISTS web_vitals_daily_aggregates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    average_value DECIMAL(10,3) NOT NULL,
    min_value DECIMAL(10,3) NOT NULL,
    max_value DECIMAL(10,3) NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 0,
    good_count INTEGER NOT NULL DEFAULT 0,
    needs_improvement_count INTEGER NOT NULL DEFAULT 0,
    poor_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_name)
);

-- Performance Long Tasks
CREATE TABLE IF NOT EXISTS performance_longtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duration DECIMAL(10,2) NOT NULL,
    start_time DECIMAL(15,2),
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Layout Shifts
CREATE TABLE IF NOT EXISTS performance_layout_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_value DECIMAL(10,6) NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Custom Metrics
CREATE TABLE IF NOT EXISTS performance_custom_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,3) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Slow Resources
CREATE TABLE IF NOT EXISTS performance_slow_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_name TEXT NOT NULL,
    duration DECIMAL(10,2) NOT NULL,
    size_bytes BIGINT,
    resource_type VARCHAR(50),
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    stack TEXT,
    context VARCHAR(200),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    url TEXT NOT NULL,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    category VARCHAR(50) NOT NULL DEFAULT 'javascript', -- javascript, api, database, auth, payment, performance, security
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Metrics Daily Aggregates
CREATE TABLE IF NOT EXISTS error_metrics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    error_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, category, severity)
);

-- Performance Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_recorded_at ON web_vitals_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_user_id ON web_vitals_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_page_url ON web_vitals_metrics(page_url);

CREATE INDEX IF NOT EXISTS idx_web_vitals_daily_date ON web_vitals_daily_aggregates(date DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_daily_metric ON web_vitals_daily_aggregates(metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_longtasks_recorded_at ON performance_longtasks(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_longtasks_duration ON performance_longtasks(duration DESC);

CREATE INDEX IF NOT EXISTS idx_performance_layout_shifts_recorded_at ON performance_layout_shifts(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_layout_shifts_value ON performance_layout_shifts(shift_value DESC);

CREATE INDEX IF NOT EXISTS idx_performance_custom_metrics_recorded_at ON performance_custom_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_custom_metrics_name ON performance_custom_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_slow_resources_recorded_at ON performance_slow_resources(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_slow_resources_duration ON performance_slow_resources(duration DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_error_metrics_daily_date ON error_metrics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_error_metrics_daily_category ON error_metrics_daily(category);
CREATE INDEX IF NOT EXISTS idx_error_metrics_daily_severity ON error_metrics_daily(severity);

-- Row Level Security (RLS) Policies
ALTER TABLE web_vitals_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_longtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_layout_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_custom_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_slow_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Admin access policies (for monitoring dashboards)
CREATE POLICY "Admin can view all web vitals metrics" ON web_vitals_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all web vitals aggregates" ON web_vitals_daily_aggregates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all performance data" ON performance_longtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all layout shifts" ON performance_layout_shifts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all custom metrics" ON performance_custom_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all slow resources" ON performance_slow_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can view all error metrics" ON error_metrics_daily
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Service role policies (for API endpoints)
CREATE POLICY "Service role can insert web vitals" ON web_vitals_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage web vitals aggregates" ON web_vitals_daily_aggregates
    FOR ALL USING (true);

CREATE POLICY "Service role can insert performance data" ON performance_longtasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert layout shifts" ON performance_layout_shifts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert custom metrics" ON performance_custom_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert slow resources" ON performance_slow_resources
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage error metrics" ON error_metrics_daily
    FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE web_vitals_metrics IS 'Stores individual Web Vitals measurements from users';
COMMENT ON TABLE web_vitals_daily_aggregates IS 'Daily aggregated Web Vitals statistics for reporting';
COMMENT ON TABLE performance_longtasks IS 'Records JavaScript long tasks (>50ms) that block the main thread';
COMMENT ON TABLE performance_layout_shifts IS 'Tracks unexpected layout shifts that affect user experience';
COMMENT ON TABLE performance_custom_metrics IS 'Custom performance metrics defined by the application';
COMMENT ON TABLE performance_slow_resources IS 'Resources that take longer than 1 second to load';
COMMENT ON TABLE error_logs IS 'Comprehensive error logging with categorization and severity levels';
COMMENT ON TABLE error_metrics_daily IS 'Daily aggregated error statistics for monitoring dashboards';

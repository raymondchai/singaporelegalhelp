-- Saved Content Organization Schema
-- Singapore Legal Help Platform - Advanced Content Management
-- Comprehensive saved content organization with collections, tagging, annotations, sharing, and search

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- Enums for saved content organization
CREATE TYPE content_visibility AS ENUM ('private', 'shared', 'team', 'public');
CREATE TYPE annotation_type AS ENUM ('note', 'highlight', 'bookmark', 'comment', 'tag');
CREATE TYPE export_format AS ENUM ('pdf', 'docx', 'json', 'csv', 'html');
CREATE TYPE share_permission AS ENUM ('view', 'comment', 'edit', 'admin');

-- Enhanced Content Collections Table (extends existing document_collections)
CREATE TABLE IF NOT EXISTS public.content_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_collection_id UUID REFERENCES public.content_collections(id) ON DELETE CASCADE,
    
    -- Collection Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    
    -- Organization
    sort_order INTEGER DEFAULT 0,
    is_smart_collection BOOLEAN DEFAULT false,
    smart_rules JSONB, -- Rules for auto-adding content
    
    -- Visibility and Sharing
    visibility content_visibility DEFAULT 'private',
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Saved Content Table (replaces user_saved_content)
CREATE TABLE IF NOT EXISTS public.saved_content_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.content_collections(id) ON DELETE SET NULL,
    
    -- Content Reference
    content_type VARCHAR(50) NOT NULL, -- 'article', 'qa', 'document', 'template', 'external'
    content_id UUID, -- References to various content tables
    external_url TEXT, -- For external content
    
    -- Content Details (cached for performance)
    title TEXT NOT NULL,
    description TEXT,
    content_preview TEXT, -- First 500 chars for search
    author_name TEXT,
    source_name TEXT,
    
    -- Organization
    custom_title TEXT, -- User's custom title
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 0, -- 0=normal, 1=important, 2=urgent
    
    -- Status and Metadata
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    read_status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'reading', 'read'
    reading_progress INTEGER DEFAULT 0, -- Percentage read
    
    -- Timestamps
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Search and Performance
    search_vector tsvector, -- Full-text search
    metadata JSONB DEFAULT '{}'
);

-- Content Tags Management
CREATE TABLE IF NOT EXISTS public.content_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Tag Details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    
    -- Organization
    category VARCHAR(50), -- 'practice_area', 'priority', 'status', 'custom'
    parent_tag_id UUID REFERENCES public.content_tags(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    is_system_tag BOOLEAN DEFAULT false, -- System-generated tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Content Annotations System
CREATE TABLE IF NOT EXISTS public.content_annotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    saved_content_id UUID REFERENCES public.saved_content_items(id) ON DELETE CASCADE,
    
    -- Annotation Details
    annotation_type annotation_type NOT NULL,
    content TEXT NOT NULL,
    
    -- Position Information (for highlights, bookmarks)
    start_position INTEGER, -- Character position in content
    end_position INTEGER,
    page_number INTEGER, -- For PDF documents
    section_id TEXT, -- For structured content
    
    -- Visual Properties
    color VARCHAR(7) DEFAULT '#FBBF24',
    style_properties JSONB, -- Font, size, etc.
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Sharing System
CREATE TABLE IF NOT EXISTS public.content_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shared_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- What's being shared
    content_type VARCHAR(20) NOT NULL, -- 'item', 'collection', 'annotation'
    content_id UUID NOT NULL, -- References saved_content_items, content_collections, or content_annotations
    
    -- Sharing Details
    share_token VARCHAR(100) UNIQUE, -- For public sharing
    shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- For direct sharing
    permission share_permission DEFAULT 'view',
    
    -- Access Control
    expires_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT false,
    requires_login BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    
    -- Metadata
    share_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Saved Searches System
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Search Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}', -- Search filters and parameters
    
    -- Automation
    is_alert BOOLEAN DEFAULT false,
    alert_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    
    -- Results Tracking
    result_count INTEGER DEFAULT 0,
    last_result_count INTEGER DEFAULT 0,
    
    -- Metadata
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export History and Templates
CREATE TABLE IF NOT EXISTS public.content_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Export Details
    export_name VARCHAR(255) NOT NULL,
    export_format export_format NOT NULL,
    content_selection JSONB NOT NULL, -- What content was exported
    
    -- Export Configuration
    template_settings JSONB, -- Export template and formatting
    include_annotations BOOLEAN DEFAULT true,
    include_metadata BOOLEAN DEFAULT true,
    
    -- File Information
    file_path TEXT,
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE -- Auto-delete after expiry
);

-- Content Activity Logs
CREATE TABLE IF NOT EXISTS public.content_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- 'save', 'unsave', 'annotate', 'share', 'export', 'search'
    content_type VARCHAR(50),
    content_id UUID,
    
    -- Activity Context
    collection_id UUID REFERENCES public.content_collections(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_collections_user_id ON public.content_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_content_collections_parent ON public.content_collections(parent_collection_id);
CREATE INDEX IF NOT EXISTS idx_content_collections_visibility ON public.content_collections(visibility);

CREATE INDEX IF NOT EXISTS idx_saved_content_items_user_id ON public.saved_content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_items_collection ON public.saved_content_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_saved_content_items_content_type ON public.saved_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_saved_content_items_tags ON public.saved_content_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_saved_content_items_search ON public.saved_content_items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_saved_content_items_favorite ON public.saved_content_items(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_saved_content_items_archived ON public.saved_content_items(user_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_content_tags_user_id ON public.content_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_category ON public.content_tags(category);
CREATE INDEX IF NOT EXISTS idx_content_tags_usage ON public.content_tags(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_content_annotations_user_id ON public.content_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_content_annotations_content ON public.content_annotations(saved_content_id);
CREATE INDEX IF NOT EXISTS idx_content_annotations_type ON public.content_annotations(annotation_type);

CREATE INDEX IF NOT EXISTS idx_content_shares_shared_by ON public.content_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_content_shares_shared_with ON public.content_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_content_shares_token ON public.content_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_content_shares_public ON public.content_shares(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts ON public.saved_searches(user_id, is_alert) WHERE is_alert = true;

CREATE INDEX IF NOT EXISTS idx_content_exports_user_id ON public.content_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_content_exports_status ON public.content_exports(status);

CREATE INDEX IF NOT EXISTS idx_content_activity_logs_user_id ON public.content_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_activity_logs_type ON public.content_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_content_activity_logs_created ON public.content_activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_collections
CREATE POLICY "Users can manage their own collections" ON public.content_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared collections" ON public.content_collections
    FOR SELECT USING (
        auth.uid() = user_id OR
        visibility IN ('shared', 'public') OR
        EXISTS (
            SELECT 1 FROM public.content_shares
            WHERE content_type = 'collection'
            AND content_id = content_collections.id
            AND shared_with = auth.uid()
        )
    );

-- RLS Policies for saved_content_items
CREATE POLICY "Users can manage their own saved content" ON public.saved_content_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared content items" ON public.saved_content_items
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.content_shares
            WHERE content_type = 'item'
            AND content_id = saved_content_items.id
            AND shared_with = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.content_collections cc
            WHERE cc.id = saved_content_items.collection_id
            AND cc.visibility IN ('shared', 'public')
        )
    );

-- RLS Policies for content_tags
CREATE POLICY "Users can manage their own tags" ON public.content_tags
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for content_annotations
CREATE POLICY "Users can manage their own annotations" ON public.content_annotations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public annotations" ON public.content_annotations
    FOR SELECT USING (
        auth.uid() = user_id OR
        (is_private = false AND EXISTS (
            SELECT 1 FROM public.saved_content_items sci
            WHERE sci.id = content_annotations.saved_content_id
            AND EXISTS (
                SELECT 1 FROM public.content_shares
                WHERE content_type = 'item'
                AND content_id = sci.id
                AND shared_with = auth.uid()
            )
        ))
    );

-- RLS Policies for content_shares
CREATE POLICY "Users can manage shares they created" ON public.content_shares
    FOR ALL USING (auth.uid() = shared_by);

CREATE POLICY "Users can view shares directed to them" ON public.content_shares
    FOR SELECT USING (auth.uid() = shared_with OR auth.uid() = shared_by);

-- RLS Policies for saved_searches
CREATE POLICY "Users can manage their own saved searches" ON public.saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for content_exports
CREATE POLICY "Users can manage their own exports" ON public.content_exports
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for content_activity_logs
CREATE POLICY "Users can view their own activity logs" ON public.content_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.content_activity_logs
    FOR INSERT WITH CHECK (true);

-- Functions for saved content organization

-- Function to update search vector for full-text search
CREATE OR REPLACE FUNCTION update_saved_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.content_preview, '') || ' ' ||
        COALESCE(NEW.notes, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector updates
DROP TRIGGER IF EXISTS trigger_update_search_vector ON public.saved_content_items;
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON public.saved_content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_content_search_vector();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            UPDATE public.content_tags
            SET
                usage_count = usage_count + 1,
                last_used = NOW()
            WHERE user_id = NEW.user_id AND name = tag_name;
        END LOOP;
    END IF;

    -- Handle UPDATE (remove old tags)
    IF TG_OP = 'UPDATE' THEN
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            IF NOT (tag_name = ANY(NEW.tags)) THEN
                UPDATE public.content_tags
                SET usage_count = GREATEST(usage_count - 1, 0)
                WHERE user_id = OLD.user_id AND name = tag_name;
            END IF;
        END LOOP;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE public.content_tags
            SET usage_count = GREATEST(usage_count - 1, 0)
            WHERE user_id = OLD.user_id AND name = tag_name;
        END LOOP;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag usage updates
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON public.saved_content_items;
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON public.saved_content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- Function to create default collections for new users
CREATE OR REPLACE FUNCTION create_default_collections(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.content_collections (user_id, name, description, color, icon, is_default) VALUES
    (p_user_id, 'Favorites', 'Your favorite legal content', '#EF4444', 'heart', true),
    (p_user_id, 'To Read', 'Content saved for later reading', '#F59E0B', 'clock', false),
    (p_user_id, 'Research', 'Legal research materials', '#3B82F6', 'search', false),
    (p_user_id, 'Templates', 'Legal document templates', '#10B981', 'file-text', false)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content statistics for dashboard
CREATE OR REPLACE FUNCTION get_content_statistics(p_user_id UUID)
RETURNS TABLE (
    total_saved_items BIGINT,
    total_collections BIGINT,
    total_annotations BIGINT,
    total_tags BIGINT,
    items_this_week BIGINT,
    favorite_items BIGINT,
    unread_items BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.saved_content_items WHERE user_id = p_user_id AND is_archived = false) as total_saved_items,
        (SELECT COUNT(*) FROM public.content_collections WHERE user_id = p_user_id) as total_collections,
        (SELECT COUNT(*) FROM public.content_annotations WHERE user_id = p_user_id) as total_annotations,
        (SELECT COUNT(*) FROM public.content_tags WHERE user_id = p_user_id) as total_tags,
        (SELECT COUNT(*) FROM public.saved_content_items WHERE user_id = p_user_id AND saved_at >= NOW() - INTERVAL '7 days') as items_this_week,
        (SELECT COUNT(*) FROM public.saved_content_items WHERE user_id = p_user_id AND is_favorite = true) as favorite_items,
        (SELECT COUNT(*) FROM public.saved_content_items WHERE user_id = p_user_id AND read_status = 'unread') as unread_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search saved content with advanced filters
CREATE OR REPLACE FUNCTION search_saved_content(
    p_user_id UUID,
    p_query TEXT DEFAULT '',
    p_collection_ids UUID[] DEFAULT '{}',
    p_tags TEXT[] DEFAULT '{}',
    p_content_types TEXT[] DEFAULT '{}',
    p_read_status TEXT DEFAULT '',
    p_is_favorite BOOLEAN DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    content_type VARCHAR,
    tags TEXT[],
    is_favorite BOOLEAN,
    read_status VARCHAR,
    saved_at TIMESTAMP WITH TIME ZONE,
    collection_name VARCHAR,
    annotation_count BIGINT,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sci.id,
        sci.title,
        sci.description,
        sci.content_type,
        sci.tags,
        sci.is_favorite,
        sci.read_status,
        sci.saved_at,
        cc.name as collection_name,
        (SELECT COUNT(*) FROM public.content_annotations WHERE saved_content_id = sci.id) as annotation_count,
        CASE
            WHEN p_query = '' THEN 1.0
            ELSE ts_rank(sci.search_vector, plainto_tsquery('english', p_query))
        END as relevance_score
    FROM public.saved_content_items sci
    LEFT JOIN public.content_collections cc ON sci.collection_id = cc.id
    WHERE sci.user_id = p_user_id
    AND sci.is_archived = false
    AND (p_query = '' OR sci.search_vector @@ plainto_tsquery('english', p_query))
    AND (array_length(p_collection_ids, 1) IS NULL OR sci.collection_id = ANY(p_collection_ids))
    AND (array_length(p_tags, 1) IS NULL OR sci.tags && p_tags)
    AND (array_length(p_content_types, 1) IS NULL OR sci.content_type = ANY(p_content_types))
    AND (p_read_status = '' OR sci.read_status = p_read_status)
    AND (p_is_favorite IS NULL OR sci.is_favorite = p_is_favorite)
    AND (p_date_from IS NULL OR sci.saved_at >= p_date_from)
    AND (p_date_to IS NULL OR sci.saved_at <= p_date_to)
    ORDER BY
        CASE WHEN p_query = '' THEN sci.saved_at ELSE NULL END DESC,
        CASE WHEN p_query != '' THEN relevance_score ELSE NULL END DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular tags for user
CREATE OR REPLACE FUNCTION get_popular_tags(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    name VARCHAR,
    usage_count INTEGER,
    color VARCHAR,
    category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.name,
        ct.usage_count,
        ct.color,
        ct.category
    FROM public.content_tags ct
    WHERE ct.user_id = p_user_id
    AND ct.usage_count > 0
    ORDER BY ct.usage_count DESC, ct.name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log content activity
CREATE OR REPLACE FUNCTION log_content_activity(
    p_user_id UUID,
    p_activity_type VARCHAR,
    p_content_type VARCHAR DEFAULT NULL,
    p_content_id UUID DEFAULT NULL,
    p_collection_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.content_activity_logs (
        user_id,
        activity_type,
        content_type,
        content_id,
        collection_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_content_type,
        p_content_id,
        p_collection_id,
        p_details,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.content_exports
    WHERE expires_at < NOW()
    AND status = 'completed';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.content_collections TO authenticated;
GRANT ALL ON public.saved_content_items TO authenticated;
GRANT ALL ON public.content_tags TO authenticated;
GRANT ALL ON public.content_annotations TO authenticated;
GRANT ALL ON public.content_shares TO authenticated;
GRANT ALL ON public.saved_searches TO authenticated;
GRANT ALL ON public.content_exports TO authenticated;
GRANT ALL ON public.content_activity_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_default_collections TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION search_saved_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_tags TO authenticated;
GRANT EXECUTE ON FUNCTION log_content_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_exports TO authenticated;

-- Enhanced Document Management Schema
-- Singapore Legal Help Platform - Phase 2

-- Document Collections Table
CREATE TABLE IF NOT EXISTS public.document_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50) DEFAULT 'folder',
    tags TEXT[] DEFAULT '{}',
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Versions Table
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
    change_description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_latest_version BOOLEAN DEFAULT false,
    parent_version_id UUID REFERENCES public.document_versions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(document_id, version_number)
);

-- Collection Collaborators Table
CREATE TABLE IF NOT EXISTS public.collection_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.document_collections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, user_id)
);

-- Document Annotations Table
CREATE TABLE IF NOT EXISTS public.document_annotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    annotation_text TEXT NOT NULL,
    page_number INTEGER,
    position_x DECIMAL(10,6),
    position_y DECIMAL(10,6),
    annotation_type VARCHAR(20) DEFAULT 'note' CHECK (annotation_type IN ('note', 'highlight', 'comment')),
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Access History Table
CREATE TABLE IF NOT EXISTS public.document_access_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'edit', 'download', 'share', 'version_create')),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing user_documents table to support enhanced features
ALTER TABLE public.user_documents 
ADD COLUMN IF NOT EXISTS collections UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES public.user_documents(id),
ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS folder_path TEXT DEFAULT '/',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private' CHECK (access_level IN ('private', 'team', 'shared', 'public')),
ADD COLUMN IF NOT EXISTS sharing_settings JSONB DEFAULT '{"is_shared": false, "public_link": null}',
ADD COLUMN IF NOT EXISTS document_description TEXT,
ADD COLUMN IF NOT EXISTS document_content JSONB,
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS variables JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_collections_user_id ON public.document_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_latest ON public.document_versions(document_id, is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_collection_collaborators_collection_id ON public.collection_collaborators(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_collaborators_user_id ON public.collection_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_document_annotations_document_id ON public.document_annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_history_document_id ON public.document_access_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_history_user_id ON public.document_access_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_collections ON public.user_documents USING GIN(collections);
CREATE INDEX IF NOT EXISTS idx_user_documents_folder_path ON public.user_documents(folder_path);
CREATE INDEX IF NOT EXISTS idx_user_documents_access_level ON public.user_documents(access_level);

-- Enable Row Level Security
ALTER TABLE public.document_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_collections
CREATE POLICY "Users can manage their own collections" ON public.document_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared collections" ON public.document_collections
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (is_shared = true AND EXISTS (
            SELECT 1 FROM public.collection_collaborators 
            WHERE collection_id = document_collections.id 
            AND user_id = auth.uid()
        ))
    );

-- RLS Policies for document_versions
CREATE POLICY "Users can manage versions of their documents" ON public.document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_documents 
            WHERE id = document_versions.document_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for collection_collaborators
CREATE POLICY "Collection owners can manage collaborators" ON public.collection_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.document_collections 
            WHERE id = collection_collaborators.collection_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Collaborators can view their own records" ON public.collection_collaborators
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for document_annotations
CREATE POLICY "Users can manage annotations on accessible documents" ON public.document_annotations
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_documents 
            WHERE id = document_annotations.document_id 
            AND (
                user_id = auth.uid() OR
                access_level IN ('shared', 'public') OR
                EXISTS (
                    SELECT 1 FROM public.document_shares 
                    WHERE document_id = user_documents.id 
                    AND shared_with = auth.uid()
                )
            )
        )
    );

-- RLS Policies for document_access_history
CREATE POLICY "Users can view access history of their documents" ON public.document_access_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_documents 
            WHERE id = document_access_history.document_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert access history" ON public.document_access_history
    FOR INSERT WITH CHECK (true);

-- Functions for enhanced document management

-- Function to update document version
CREATE OR REPLACE FUNCTION update_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the main document record when a new version is created
    IF NEW.is_latest_version = true THEN
        -- Mark other versions as not latest
        UPDATE public.document_versions 
        SET is_latest_version = false 
        WHERE document_id = NEW.document_id 
        AND id != NEW.id;
        
        -- Update main document record
        UPDATE public.user_documents 
        SET 
            version_number = NEW.version_number,
            file_path = NEW.file_path,
            file_size = NEW.file_size,
            updated_at = NOW()
        WHERE id = NEW.document_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document version updates
DROP TRIGGER IF EXISTS trigger_update_document_version ON public.document_versions;
CREATE TRIGGER trigger_update_document_version
    AFTER INSERT OR UPDATE ON public.document_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_document_version();

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.document_access_history (
        document_id,
        user_id,
        access_type,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_document_id,
        p_user_id,
        p_access_type,
        p_ip_address,
        p_user_agent,
        p_metadata
    );
    
    -- Update last_accessed timestamp on main document
    UPDATE public.user_documents 
    SET last_accessed = NOW() 
    WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document collection statistics
CREATE OR REPLACE FUNCTION get_collection_stats(p_user_id UUID)
RETURNS TABLE (
    collection_id UUID,
    collection_name VARCHAR,
    document_count BIGINT,
    total_size BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.name,
        COUNT(ud.id) as doc_count,
        COALESCE(SUM(ud.file_size), 0) as total_size,
        MAX(ud.updated_at) as last_updated
    FROM public.document_collections dc
    LEFT JOIN public.user_documents ud ON dc.id = ANY(ud.collections)
    WHERE dc.user_id = p_user_id
    GROUP BY dc.id, dc.name
    ORDER BY dc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.document_collections TO authenticated;
GRANT ALL ON public.document_versions TO authenticated;
GRANT ALL ON public.collection_collaborators TO authenticated;
GRANT ALL ON public.document_annotations TO authenticated;
GRANT ALL ON public.document_access_history TO authenticated;
GRANT EXECUTE ON FUNCTION log_document_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_stats TO authenticated;

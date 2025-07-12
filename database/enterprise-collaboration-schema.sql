-- Enterprise Collaboration Schema
-- Singapore Legal Help Platform - Enterprise Features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENHANCED TEAM COLLABORATION FEATURES
-- =====================================================

-- Document Comments and Annotations System
CREATE TABLE IF NOT EXISTS public.document_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
    
    -- Comment Content
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'question', 'approval', 'rejection')),
    
    -- Position and Context
    page_number INTEGER,
    position_data JSONB, -- For precise positioning in document
    highlighted_text TEXT,
    
    -- Status and Resolution
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    is_private BOOLEAN DEFAULT false,
    mentions UUID[] DEFAULT '{}', -- Array of user IDs mentioned
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Collaboration Sessions
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    
    -- Session Details
    host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 10,
    session_type VARCHAR(20) DEFAULT 'edit' CHECK (session_type IN ('view', 'edit', 'review', 'meeting')),
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    access_code VARCHAR(20),
    allowed_users UUID[] DEFAULT '{}',
    
    -- Session Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'paused', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    settings JSONB DEFAULT '{
        "allow_anonymous": false,
        "require_approval": true,
        "enable_chat": true,
        "enable_voice": false,
        "auto_save_interval": 30
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration Session Participants
CREATE TABLE IF NOT EXISTS public.collaboration_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Participation Details
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host', 'moderator', 'participant', 'observer')),
    permission VARCHAR(20) DEFAULT 'edit' CHECK (permission IN ('view', 'comment', 'edit', 'admin')),
    
    -- Session Activity
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Cursor and Presence
    cursor_position JSONB,
    current_page INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'away', 'offline')),
    
    UNIQUE(session_id, user_id)
);

-- Document Version Control System
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Version Details
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255),
    description TEXT,
    
    -- Content Storage
    content_snapshot JSONB, -- Full document content at this version
    file_path TEXT, -- Path to stored file version
    file_size BIGINT,
    checksum VARCHAR(64), -- For integrity verification
    
    -- Change Tracking
    changes_summary JSONB, -- Summary of changes from previous version
    parent_version_id UUID REFERENCES public.document_versions(id),
    merge_source_version_id UUID REFERENCES public.document_versions(id),
    
    -- Status
    is_major_version BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(document_id, version_number)
);

-- Document Change Log for Detailed Tracking
CREATE TABLE IF NOT EXISTS public.document_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES public.document_versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.collaboration_sessions(id) ON DELETE SET NULL,
    
    -- Change Details
    change_type VARCHAR(30) NOT NULL CHECK (change_type IN (
        'text_insert', 'text_delete', 'text_replace', 'format_change',
        'image_insert', 'image_delete', 'table_insert', 'table_modify',
        'comment_add', 'comment_resolve', 'approval_request', 'approval_given'
    )),
    
    -- Change Location
    page_number INTEGER,
    position_start INTEGER,
    position_end INTEGER,
    
    -- Change Content
    old_content TEXT,
    new_content TEXT,
    change_metadata JSONB DEFAULT '{}',
    
    -- Context
    change_reason TEXT,
    related_comment_id UUID REFERENCES public.document_comments(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Assignment and Workflow System
CREATE TABLE IF NOT EXISTS public.document_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Task Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(30) DEFAULT 'general' CHECK (task_type IN (
        'general', 'review', 'approval', 'edit', 'research', 'verification', 'translation'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status and Progress
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),

    -- Context
    related_comment_id UUID REFERENCES public.document_comments(id),
    related_section TEXT,
    checklist JSONB DEFAULT '[]', -- Array of checklist items

    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Communication and Chat
CREATE TABLE IF NOT EXISTS public.team_chat_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Channel Details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type VARCHAR(20) DEFAULT 'general' CHECK (channel_type IN ('general', 'project', 'document', 'announcement')),

    -- Access Control
    is_private BOOLEAN DEFAULT false,
    allowed_members UUID[] DEFAULT '{}',

    -- Settings
    is_archived BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{
        "notifications_enabled": true,
        "file_sharing_enabled": true,
        "external_sharing_enabled": false
    }',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Chat Messages
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID REFERENCES public.team_chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,

    -- Message Content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'document', 'system')),

    -- Attachments and Media
    attachments JSONB DEFAULT '[]',
    mentions UUID[] DEFAULT '{}',

    -- Message Status
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,

    -- Reactions and Interactions
    reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Role-Based Access Control
CREATE TABLE IF NOT EXISTS public.team_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,

    -- Document Permissions
    can_create_documents BOOLEAN DEFAULT false,
    can_edit_all_documents BOOLEAN DEFAULT false,
    can_delete_documents BOOLEAN DEFAULT false,
    can_share_documents BOOLEAN DEFAULT false,
    can_export_documents BOOLEAN DEFAULT false,

    -- Team Management Permissions
    can_invite_members BOOLEAN DEFAULT false,
    can_remove_members BOOLEAN DEFAULT false,
    can_manage_roles BOOLEAN DEFAULT false,
    can_manage_team_settings BOOLEAN DEFAULT false,

    -- Collaboration Permissions
    can_create_sessions BOOLEAN DEFAULT false,
    can_moderate_sessions BOOLEAN DEFAULT false,
    can_assign_tasks BOOLEAN DEFAULT false,
    can_approve_documents BOOLEAN DEFAULT false,

    -- Administrative Permissions
    can_view_analytics BOOLEAN DEFAULT false,
    can_manage_billing BOOLEAN DEFAULT false,
    can_access_audit_logs BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(team_id, role)
);

-- Document Approval Workflow
CREATE TABLE IF NOT EXISTS public.document_approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES public.document_versions(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Approval Details
    approval_type VARCHAR(30) DEFAULT 'general' CHECK (approval_type IN (
        'general', 'legal_review', 'compliance_check', 'final_approval', 'publication'
    )),

    -- Workflow
    required_approvers UUID[] NOT NULL,
    current_approver UUID REFERENCES public.profiles(id),
    approval_order INTEGER DEFAULT 1,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Comments and Feedback
    approval_notes TEXT,
    rejection_reason TEXT,
    feedback JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Approval Records
CREATE TABLE IF NOT EXISTS public.approval_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    approval_id UUID REFERENCES public.document_approvals(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Approval Decision
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'abstained')),
    comments TEXT,
    conditions TEXT, -- Any conditions for approval

    -- Timing
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    UNIQUE(approval_id, approver_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_records ENABLE ROW LEVEL SECURITY;

-- Document Comments Policies
CREATE POLICY "Users can view comments on accessible documents" ON public.document_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_documents ud
            WHERE ud.id = document_comments.document_id
            AND (
                ud.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.document_shares ds
                    WHERE ds.document_id = ud.id AND ds.shared_with = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM public.team_members tm
                    JOIN public.user_documents ud2 ON ud2.user_id = tm.user_id
                    WHERE tm.user_id = auth.uid() AND tm.status = 'active'
                    AND ud2.id = ud.id
                )
            )
        )
    );

CREATE POLICY "Users can create comments on accessible documents" ON public.document_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.user_documents ud
            WHERE ud.id = document_comments.document_id
            AND (
                ud.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.document_shares ds
                    WHERE ds.document_id = ud.id AND ds.shared_with = auth.uid()
                    AND ds.permission IN ('edit', 'comment')
                )
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON public.document_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Collaboration Sessions Policies
CREATE POLICY "Users can view sessions they participate in" ON public.collaboration_sessions
    FOR SELECT USING (
        host_user_id = auth.uid() OR
        auth.uid() = ANY(allowed_users) OR
        EXISTS (
            SELECT 1 FROM public.collaboration_participants cp
            WHERE cp.session_id = collaboration_sessions.id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create collaboration sessions" ON public.collaboration_sessions
    FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Session hosts can update their sessions" ON public.collaboration_sessions
    FOR UPDATE USING (auth.uid() = host_user_id);

-- Collaboration Participants Policies
CREATE POLICY "Users can view participants in their sessions" ON public.collaboration_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.collaboration_sessions cs
            WHERE cs.id = collaboration_participants.session_id
            AND cs.host_user_id = auth.uid()
        )
    );

-- Document Versions Policies
CREATE POLICY "Users can view versions of accessible documents" ON public.document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_documents ud
            WHERE ud.id = document_versions.document_id
            AND (
                ud.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.document_shares ds
                    WHERE ds.document_id = ud.id AND ds.shared_with = auth.uid()
                )
            )
        )
    );

-- Document Tasks Policies
CREATE POLICY "Users can view tasks assigned to them or created by them" ON public.document_tasks
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_documents ud
            WHERE ud.id = document_tasks.document_id AND ud.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks on their documents" ON public.document_tasks
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.user_documents ud
            WHERE ud.id = document_tasks.document_id AND ud.user_id = auth.uid()
        )
    );

-- Team Chat Policies
CREATE POLICY "Team members can view team chat channels" ON public.team_chat_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_chat_channels.team_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

CREATE POLICY "Team members can view team chat messages" ON public.team_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_chat_channels tcc
            JOIN public.team_members tm ON tm.team_id = tcc.team_id
            WHERE tcc.id = team_chat_messages.channel_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Document Comments Indexes
CREATE INDEX idx_document_comments_document_id ON public.document_comments(document_id);
CREATE INDEX idx_document_comments_user_id ON public.document_comments(user_id);
CREATE INDEX idx_document_comments_status ON public.document_comments(status);
CREATE INDEX idx_document_comments_created_at ON public.document_comments(created_at DESC);

-- Collaboration Sessions Indexes
CREATE INDEX idx_collaboration_sessions_document_id ON public.collaboration_sessions(document_id);
CREATE INDEX idx_collaboration_sessions_host_user_id ON public.collaboration_sessions(host_user_id);
CREATE INDEX idx_collaboration_sessions_status ON public.collaboration_sessions(status);

-- Document Versions Indexes
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_version_number ON public.document_versions(document_id, version_number);
CREATE INDEX idx_document_versions_created_at ON public.document_versions(created_at DESC);

-- Document Changes Indexes
CREATE INDEX idx_document_changes_document_id ON public.document_changes(document_id);
CREATE INDEX idx_document_changes_version_id ON public.document_changes(version_id);
CREATE INDEX idx_document_changes_user_id ON public.document_changes(user_id);
CREATE INDEX idx_document_changes_created_at ON public.document_changes(created_at DESC);

-- Document Tasks Indexes
CREATE INDEX idx_document_tasks_document_id ON public.document_tasks(document_id);
CREATE INDEX idx_document_tasks_assigned_to ON public.document_tasks(assigned_to);
CREATE INDEX idx_document_tasks_status ON public.document_tasks(status);
CREATE INDEX idx_document_tasks_due_date ON public.document_tasks(due_date);

-- Team Chat Indexes
CREATE INDEX idx_team_chat_channels_team_id ON public.team_chat_channels(team_id);
CREATE INDEX idx_team_chat_messages_channel_id ON public.team_chat_messages(channel_id);
CREATE INDEX idx_team_chat_messages_created_at ON public.team_chat_messages(created_at DESC);

-- =====================================================
-- API USAGE TRACKING AND ANALYTICS
-- =====================================================

-- API Usage Logs for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES public.enterprise_api_keys(id) ON DELETE SET NULL,

    -- Request Details
    endpoint TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_size BIGINT,
    response_size BIGINT,

    -- Error Information
    error_message TEXT,
    error_code VARCHAR(50),

    -- Metadata
    request_id UUID DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Billing and Usage
    billable_operation BOOLEAN DEFAULT true,
    operation_cost DECIMAL(10,6) DEFAULT 0
);

-- API Rate Limiting Tracking
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- user_id, api_key_id, or IP
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('user', 'api_key', 'ip')),

    -- Rate Limit Details
    endpoint_pattern TEXT,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    limit_exceeded_count INTEGER DEFAULT 0,

    -- Status
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(identifier, endpoint_pattern, window_start)
);

-- Webhook Configurations
CREATE TABLE IF NOT EXISTS public.webhook_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Webhook Details
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret_key VARCHAR(255), -- For webhook signature verification

    -- Event Configuration
    events TEXT[] NOT NULL, -- Array of event types to listen for
    is_active BOOLEAN DEFAULT true,

    -- Retry Configuration
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,

    -- Status and Statistics
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    webhook_id UUID REFERENCES public.webhook_configurations(id) ON DELETE CASCADE,

    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,

    -- Delivery Details
    delivery_attempt INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),

    -- HTTP Details
    http_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,

    -- Timing
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Error Information
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Documentation Sections
CREATE TABLE IF NOT EXISTS public.api_documentation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Documentation Structure
    section_name VARCHAR(255) NOT NULL,
    parent_section_id UUID REFERENCES public.api_documentation(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,

    -- Content
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Markdown content

    -- API Specification
    endpoint_path TEXT,
    http_method VARCHAR(10),
    request_schema JSONB,
    response_schema JSONB,
    example_request JSONB,
    example_response JSONB,

    -- Metadata
    is_public BOOLEAN DEFAULT true,
    required_permissions TEXT[] DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR API ANALYTICS
-- =====================================================

-- API Usage Logs Indexes
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_timestamp ON public.api_usage_logs(timestamp DESC);
CREATE INDEX idx_api_usage_logs_status_code ON public.api_usage_logs(status_code);

-- API Rate Limits Indexes
CREATE INDEX idx_api_rate_limits_identifier ON public.api_rate_limits(identifier);
CREATE INDEX idx_api_rate_limits_window ON public.api_rate_limits(window_start, window_end);

-- Webhook Indexes
CREATE INDEX idx_webhook_configurations_user_id ON public.webhook_configurations(user_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_attempted_at ON public.webhook_deliveries(attempted_at DESC);

-- =====================================================
-- ENTERPRISE DASHBOARD AND ANALYTICS
-- =====================================================

-- Enterprise Organizations for multi-tenant management
CREATE TABLE IF NOT EXISTS public.enterprise_organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Organization Details
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,

    -- Contact Information
    primary_contact_email TEXT NOT NULL,
    primary_contact_name TEXT,
    phone_number TEXT,
    address JSONB,

    -- Subscription and Billing
    subscription_tier subscription_tier_enum DEFAULT 'enterprise',
    billing_email TEXT,
    tax_id VARCHAR(50),
    billing_address JSONB,

    -- Settings and Configuration
    settings JSONB DEFAULT '{
        "sso_enabled": false,
        "api_access_enabled": true,
        "custom_branding": false,
        "data_retention_months": 24,
        "security_level": "standard"
    }',

    -- Limits and Quotas
    max_users INTEGER DEFAULT 100,
    max_api_calls_per_month INTEGER DEFAULT 100000,
    max_storage_gb INTEGER DEFAULT 1000,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Members (linking users to organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Role and Permissions
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    invited_by UUID REFERENCES public.profiles(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Department and Team
    department VARCHAR(100),
    team VARCHAR(100),
    job_title VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, user_id)
);

-- Security Audit Logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL CHECK (event_category IN (
        'authentication', 'authorization', 'data_access', 'configuration',
        'user_management', 'api_access', 'billing', 'security'
    )),

    -- Event Data
    resource_type VARCHAR(50),
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'failure', 'blocked')),

    -- Context Information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    api_key_id UUID REFERENCES public.enterprise_api_keys(id) ON DELETE SET NULL,

    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB DEFAULT '[]',

    -- Additional Data
    details JSONB DEFAULT '{}',
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS public.compliance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Report Details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'gdpr', 'pdpa', 'sox', 'iso27001', 'custom'
    )),
    report_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Time Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Report Data
    report_data JSONB NOT NULL,
    summary JSONB,
    findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'reviewed', 'approved', 'archived')),

    -- File Information
    file_path TEXT,
    file_size BIGINT,
    file_format VARCHAR(10) DEFAULT 'pdf',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics Aggregations
CREATE TABLE IF NOT EXISTS public.usage_analytics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Date
    date DATE NOT NULL,

    -- Usage Metrics
    api_calls INTEGER DEFAULT 0,
    documents_created INTEGER DEFAULT 0,
    documents_accessed INTEGER DEFAULT 0,
    collaboration_sessions INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,

    -- Performance Metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,

    -- Feature Usage
    features_used JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, user_id, date)
);

-- Billing and Usage Tracking
CREATE TABLE IF NOT EXISTS public.billing_usage_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Billing Period
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Usage Metrics
    total_api_calls BIGINT DEFAULT 0,
    total_storage_gb DECIMAL(10,2) DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,

    -- Costs
    base_cost_sgd DECIMAL(10,2) DEFAULT 0,
    usage_cost_sgd DECIMAL(10,2) DEFAULT 0,
    total_cost_sgd DECIMAL(10,2) DEFAULT 0,

    -- Overage Charges
    api_overage_calls BIGINT DEFAULT 0,
    api_overage_cost_sgd DECIMAL(10,2) DEFAULT 0,
    storage_overage_gb DECIMAL(10,2) DEFAULT 0,
    storage_overage_cost_sgd DECIMAL(10,2) DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'invoiced', 'paid')),
    invoice_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, billing_period_start)
);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Metric Details
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'counter', 'gauge', 'histogram', 'summary'
    )),

    -- Values
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(20),

    -- Labels and Tags
    labels JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Thresholds
    warning_threshold DECIMAL(15,6),
    critical_threshold DECIMAL(15,6),

    -- Status
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),

    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for time-series queries
    INDEX (metric_name, recorded_at DESC),
    INDEX (recorded_at DESC)
);

-- =====================================================
-- RLS POLICIES FOR ENTERPRISE DASHBOARD
-- =====================================================

-- Enable RLS on enterprise tables
ALTER TABLE public.enterprise_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;

-- Enterprise Organizations Policies
CREATE POLICY "Organization members can view their organization" ON public.enterprise_organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = enterprise_organizations.id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can update their organization" ON public.enterprise_organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = enterprise_organizations.id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Organization Members Policies
CREATE POLICY "Organization members can view other members" ON public.organization_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage members" ON public.organization_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Security Audit Logs Policies
CREATE POLICY "Organization admins can view audit logs" ON public.security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = security_audit_logs.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Compliance Reports Policies
CREATE POLICY "Organization members can view compliance reports" ON public.compliance_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = compliance_reports.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Usage Analytics Policies
CREATE POLICY "Organization members can view usage analytics" ON public.usage_analytics_daily
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = usage_analytics_daily.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'manager')
            AND om.status = 'active'
        )
    );

-- Billing Records Policies
CREATE POLICY "Organization admins can view billing records" ON public.billing_usage_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = billing_usage_records.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- System Health Metrics (Admin only)
CREATE POLICY "Super admins can view system health metrics" ON public.system_health_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

-- =====================================================
-- INDEXES FOR ENTERPRISE DASHBOARD
-- =====================================================

-- Enterprise Organizations Indexes
CREATE INDEX idx_enterprise_organizations_slug ON public.enterprise_organizations(slug);
CREATE INDEX idx_enterprise_organizations_status ON public.enterprise_organizations(status);
CREATE INDEX idx_enterprise_organizations_subscription_tier ON public.enterprise_organizations(subscription_tier);

-- Organization Members Indexes
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);
CREATE INDEX idx_organization_members_status ON public.organization_members(status);

-- Security Audit Logs Indexes
CREATE INDEX idx_security_audit_logs_org_id ON public.security_audit_logs(organization_id);
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_risk_level ON public.security_audit_logs(risk_level);

-- Compliance Reports Indexes
CREATE INDEX idx_compliance_reports_org_id ON public.compliance_reports(organization_id);
CREATE INDEX idx_compliance_reports_type ON public.compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_status ON public.compliance_reports(status);
CREATE INDEX idx_compliance_reports_period ON public.compliance_reports(period_start, period_end);

-- Usage Analytics Indexes
CREATE INDEX idx_usage_analytics_daily_org_id ON public.usage_analytics_daily(organization_id);
CREATE INDEX idx_usage_analytics_daily_user_id ON public.usage_analytics_daily(user_id);
CREATE INDEX idx_usage_analytics_daily_date ON public.usage_analytics_daily(date DESC);
CREATE INDEX idx_usage_analytics_daily_org_date ON public.usage_analytics_daily(organization_id, date DESC);

-- Billing Usage Records Indexes
CREATE INDEX idx_billing_usage_records_org_id ON public.billing_usage_records(organization_id);
CREATE INDEX idx_billing_usage_records_period ON public.billing_usage_records(billing_period_start, billing_period_end);
CREATE INDEX idx_billing_usage_records_status ON public.billing_usage_records(status);

-- =====================================================
-- SECURITY AND COMPLIANCE FEATURES
-- =====================================================

-- SSO Configuration
CREATE TABLE IF NOT EXISTS public.sso_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- SSO Provider Details
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('saml', 'oidc', 'oauth2', 'azure_ad', 'google_workspace')),
    provider_name VARCHAR(255) NOT NULL,

    -- Configuration
    issuer_url TEXT,
    sso_url TEXT NOT NULL,
    certificate TEXT,
    metadata_url TEXT,

    -- OIDC/OAuth2 specific
    client_id VARCHAR(255),
    client_secret_encrypted TEXT, -- Encrypted client secret
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,

    -- SAML specific
    entity_id VARCHAR(255),
    x509_certificate TEXT,

    -- Attribute Mapping
    attribute_mapping JSONB DEFAULT '{
        "email": "email",
        "first_name": "given_name",
        "last_name": "family_name",
        "display_name": "name",
        "groups": "groups"
    }',

    -- Settings
    is_active BOOLEAN DEFAULT false,
    auto_provision_users BOOLEAN DEFAULT true,
    default_role VARCHAR(20) DEFAULT 'member',
    allowed_domains TEXT[] DEFAULT '{}',

    -- Security
    enforce_sso BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Encryption Keys Management
CREATE TABLE IF NOT EXISTS public.encryption_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Key Details
    key_name VARCHAR(255) NOT NULL,
    key_type VARCHAR(50) NOT NULL CHECK (key_type IN ('aes256', 'rsa2048', 'rsa4096', 'ed25519')),
    key_purpose VARCHAR(50) NOT NULL CHECK (key_purpose IN ('data_encryption', 'document_signing', 'api_signing', 'backup_encryption')),

    -- Key Material (encrypted)
    encrypted_key_material TEXT NOT NULL,
    key_fingerprint VARCHAR(128) NOT NULL,

    -- Key Lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    rotated_from UUID REFERENCES public.encryption_keys(id),

    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,

    UNIQUE(organization_id, key_name)
);

-- GDPR/PDPA Data Processing Records
CREATE TABLE IF NOT EXISTS public.data_processing_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Data Subject
    data_subject_id UUID, -- Could reference profiles or be external
    data_subject_email TEXT,
    data_subject_type VARCHAR(50) DEFAULT 'user' CHECK (data_subject_type IN ('user', 'client', 'employee', 'vendor')),

    -- Processing Details
    processing_purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL CHECK (legal_basis IN (
        'consent', 'contract', 'legal_obligation', 'vital_interests',
        'public_task', 'legitimate_interests'
    )),
    data_categories TEXT[] NOT NULL, -- e.g., ['personal_data', 'financial_data', 'health_data']

    -- Data Lifecycle
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retention_period_months INTEGER,
    scheduled_deletion_at TIMESTAMP WITH TIME ZONE,

    -- Consent Management
    consent_given BOOLEAN DEFAULT false,
    consent_given_at TIMESTAMP WITH TIME ZONE,
    consent_withdrawn_at TIMESTAMP WITH TIME ZONE,
    consent_method VARCHAR(50), -- 'explicit', 'implicit', 'opt_in', 'opt_out'

    -- Processing Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'deleted', 'anonymized')),

    -- Metadata
    source_system VARCHAR(100),
    processing_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Subject Rights Requests (GDPR Article 15-22)
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Request Details
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'restrict_processing',
        'data_portability', 'object_processing', 'withdraw_consent'
    )),

    -- Data Subject Information
    data_subject_email TEXT NOT NULL,
    data_subject_name TEXT,
    identity_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50),

    -- Request Content
    request_description TEXT,
    specific_data_requested TEXT[],

    -- Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected', 'partially_completed'
    )),
    assigned_to UUID REFERENCES public.profiles(id),

    -- Response
    response_provided_at TIMESTAMP WITH TIME ZONE,
    response_method VARCHAR(50), -- 'email', 'secure_download', 'postal'
    response_notes TEXT,

    -- Compliance Tracking
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE, -- 30 days from receipt
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit Trail
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Monitoring and Alerts
CREATE TABLE IF NOT EXISTS public.compliance_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Alert Details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'data_retention_expiry', 'consent_expiry', 'access_request_overdue',
        'security_breach', 'unauthorized_access', 'data_export_large',
        'compliance_deadline', 'audit_required'
    )),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Alert Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT,

    -- Related Resources
    related_resource_type VARCHAR(50),
    related_resource_id UUID,

    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
    acknowledged_by UUID REFERENCES public.profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Timing
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Breach Incident Management
CREATE TABLE IF NOT EXISTS public.data_breach_incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,

    -- Incident Details
    incident_title VARCHAR(255) NOT NULL,
    incident_description TEXT NOT NULL,
    breach_type VARCHAR(50) NOT NULL CHECK (breach_type IN (
        'unauthorized_access', 'data_theft', 'accidental_disclosure',
        'system_compromise', 'insider_threat', 'third_party_breach'
    )),

    -- Affected Data
    affected_data_types TEXT[] NOT NULL,
    estimated_affected_records INTEGER,
    data_sensitivity VARCHAR(20) CHECK (data_sensitivity IN ('low', 'medium', 'high', 'critical')),

    -- Timeline
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE,
    contained_at TIMESTAMP WITH TIME ZONE,

    -- Impact Assessment
    impact_assessment TEXT,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

    -- Response Actions
    immediate_actions_taken TEXT,
    containment_measures TEXT,
    notification_required BOOLEAN DEFAULT false,
    authorities_notified BOOLEAN DEFAULT false,
    authorities_notified_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) DEFAULT 'investigating' CHECK (status IN (
        'investigating', 'contained', 'resolved', 'closed'
    )),

    -- Assignment
    incident_manager UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES public.profiles(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES FOR SECURITY AND COMPLIANCE
-- =====================================================

-- Enable RLS on security and compliance tables
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_breach_incidents ENABLE ROW LEVEL SECURITY;

-- SSO Configurations Policies
CREATE POLICY "Organization admins can manage SSO configurations" ON public.sso_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = sso_configurations.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Encryption Keys Policies
CREATE POLICY "Organization admins can manage encryption keys" ON public.encryption_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = encryption_keys.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Data Processing Records Policies
CREATE POLICY "Organization members can view data processing records" ON public.data_processing_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = data_processing_records.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage data processing records" ON public.data_processing_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = data_processing_records.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'manager')
            AND om.status = 'active'
        )
    );

-- Data Subject Requests Policies
CREATE POLICY "Organization members can view data subject requests" ON public.data_subject_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = data_subject_requests.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization admins can manage data subject requests" ON public.data_subject_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = data_subject_requests.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'manager')
            AND om.status = 'active'
        )
    );

-- Compliance Alerts Policies
CREATE POLICY "Organization members can view compliance alerts" ON public.compliance_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = compliance_alerts.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Data Breach Incidents Policies (Restricted access)
CREATE POLICY "Organization admins can manage data breach incidents" ON public.data_breach_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = data_breach_incidents.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- =====================================================
-- INDEXES FOR SECURITY AND COMPLIANCE
-- =====================================================

-- SSO Configurations Indexes
CREATE INDEX idx_sso_configurations_org_id ON public.sso_configurations(organization_id);
CREATE INDEX idx_sso_configurations_provider ON public.sso_configurations(provider);
CREATE INDEX idx_sso_configurations_active ON public.sso_configurations(is_active);

-- Encryption Keys Indexes
CREATE INDEX idx_encryption_keys_org_id ON public.encryption_keys(organization_id);
CREATE INDEX idx_encryption_keys_purpose ON public.encryption_keys(key_purpose);
CREATE INDEX idx_encryption_keys_status ON public.encryption_keys(status);
CREATE INDEX idx_encryption_keys_expires_at ON public.encryption_keys(expires_at);

-- Data Processing Records Indexes
CREATE INDEX idx_data_processing_records_org_id ON public.data_processing_records(organization_id);
CREATE INDEX idx_data_processing_records_subject_email ON public.data_processing_records(data_subject_email);
CREATE INDEX idx_data_processing_records_status ON public.data_processing_records(status);
CREATE INDEX idx_data_processing_records_deletion_date ON public.data_processing_records(scheduled_deletion_at);
CREATE INDEX idx_data_processing_records_legal_basis ON public.data_processing_records(legal_basis);

-- Data Subject Requests Indexes
CREATE INDEX idx_data_subject_requests_org_id ON public.data_subject_requests(organization_id);
CREATE INDEX idx_data_subject_requests_email ON public.data_subject_requests(data_subject_email);
CREATE INDEX idx_data_subject_requests_type ON public.data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_due_date ON public.data_subject_requests(due_date);

-- Compliance Alerts Indexes
CREATE INDEX idx_compliance_alerts_org_id ON public.compliance_alerts(organization_id);
CREATE INDEX idx_compliance_alerts_type ON public.compliance_alerts(alert_type);
CREATE INDEX idx_compliance_alerts_severity ON public.compliance_alerts(severity);
CREATE INDEX idx_compliance_alerts_status ON public.compliance_alerts(status);
CREATE INDEX idx_compliance_alerts_due_date ON public.compliance_alerts(due_date);

-- Data Breach Incidents Indexes
CREATE INDEX idx_data_breach_incidents_org_id ON public.data_breach_incidents(organization_id);
CREATE INDEX idx_data_breach_incidents_type ON public.data_breach_incidents(breach_type);
CREATE INDEX idx_data_breach_incidents_status ON public.data_breach_incidents(status);
CREATE INDEX idx_data_breach_incidents_discovered_at ON public.data_breach_incidents(discovered_at DESC);
CREATE INDEX idx_data_breach_incidents_risk_level ON public.data_breach_incidents(risk_level);

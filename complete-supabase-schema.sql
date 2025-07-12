-- =====================================================
-- Singapore Legal Help Platform - Complete Database Schema
-- Phase 3A: Advanced Authentication & User Management
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS FOR TYPE SAFETY
-- =====================================================

-- User types enum
CREATE TYPE user_type_enum AS ENUM ('individual', 'business', 'law_firm', 'corporate');

-- Team role enum
CREATE TYPE team_role_enum AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- Document sharing permission enum
CREATE TYPE sharing_permission_enum AS ENUM ('view', 'comment', 'edit', 'admin');

-- Verification status enum
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'failed', 'expired');

-- Subscription tier enum (Enhanced for Phase 6A)
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'basic_individual', 'premium_individual', 'professional', 'enterprise');

-- Subscription status enum
CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');

-- Billing cycle enum
CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'annual');

-- Payment method enum
CREATE TYPE payment_method_enum AS ENUM ('stripe', 'nets', 'paynow', 'grabpay', 'corporate_invoice');

-- Payment status enum
CREATE TYPE payment_status_enum AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'cancelled', 'processing');

-- Usage resource enum
CREATE TYPE usage_resource_enum AS ENUM ('document_generation', 'ai_query', 'storage_gb', 'team_member', 'api_call', 'template_access');

-- Discount type enum
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed_amount');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Enhanced User profiles table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,

    -- Personal Information
    full_name TEXT NOT NULL,
    display_name TEXT,
    date_of_birth DATE,
    avatar_url TEXT,

    -- Contact Information
    phone_number TEXT,
    address_street TEXT,
    address_unit TEXT,
    address_postal_code TEXT CHECK (address_postal_code ~ '^[0-9]{6}$'),
    address_country TEXT DEFAULT 'Singapore',

    -- User Classification
    user_type user_type_enum DEFAULT 'individual',
    subscription_tier subscription_tier_enum DEFAULT 'free',

    -- Singapore-specific Information
    singapore_nric TEXT UNIQUE CHECK (singapore_nric ~* '^[STFG][0-9]{7}[A-Z]$'),
    singapore_uen TEXT UNIQUE CHECK (singapore_uen ~* '^[0-9]{8,10}[A-Z]$'),

    -- Business Information (for business users)
    company_name TEXT,
    business_registration_number TEXT,
    industry_sector TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),

    -- Platform Preferences
    practice_areas_interest TEXT[],
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    language_preference TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Asia/Singapore',
    document_retention_days INTEGER DEFAULT 365,

    -- Verification & Compliance
    singapore_validation_status verification_status_enum DEFAULT 'pending',
    identity_verified_at TIMESTAMP WITH TIME ZONE,
    pdpa_consent_date TIMESTAMP WITH TIME ZONE,
    terms_accepted_date TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_date TIMESTAMP WITH TIME ZONE,

    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table for business collaboration
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    team_description TEXT,
    team_type TEXT DEFAULT 'business' CHECK (team_type IN ('business', 'law_firm', 'department')),
    max_members INTEGER DEFAULT 10,
    settings JSONB DEFAULT '{"allow_external_sharing": false, "require_approval": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role team_role_enum DEFAULT 'member',
    permissions JSONB DEFAULT '{"can_invite": false, "can_manage_documents": false}',
    invited_by UUID REFERENCES public.user_profiles(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    UNIQUE(team_id, user_id)
);

-- Enhanced document management table
CREATE TABLE public.user_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    template_id UUID, -- References legal_document_templates if generated from template

    -- Document Information
    document_name TEXT NOT NULL,
    document_description TEXT,
    document_type TEXT NOT NULL,
    category TEXT,
    tags TEXT[],

    -- File Information
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    file_hash TEXT, -- For duplicate detection

    -- Document Content & Metadata
    document_content JSONB, -- Structured content for generated documents
    form_data JSONB, -- Original form data used to generate document
    variables JSONB, -- Template variables if applicable

    -- Version Control
    version_number INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES public.user_documents(id),
    is_latest_version BOOLEAN DEFAULT true,

    -- Organization
    folder_path TEXT DEFAULT '/',
    is_favorite BOOLEAN DEFAULT false,

    -- Sharing & Collaboration
    sharing_settings JSONB DEFAULT '{"is_shared": false, "public_link": null}',
    access_level TEXT DEFAULT 'private' CHECK (access_level IN ('private', 'team', 'shared', 'public')),

    -- Processing Status
    upload_status TEXT CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'completed',
    aixplain_document_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sharing table for granular permissions
CREATE TABLE public.document_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    permission sharing_permission_enum DEFAULT 'view',
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, shared_with)
);

-- Document public links for external sharing
CREATE TABLE public.document_public_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.user_documents(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    link_token TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Optional password protection
    permission sharing_permission_enum DEFAULT 'view',
    expires_at TIMESTAMP WITH TIME ZONE,
    max_access_count INTEGER,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDPA Compliance and Audit Tables
CREATE TABLE public.user_consent_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('pdpa', 'marketing', 'analytics', 'cookies')),
    consent_given BOOLEAN NOT NULL,
    consent_version TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    consent_method TEXT CHECK (consent_method IN ('registration', 'explicit', 'update')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity audit logs
CREATE TABLE public.user_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for enhanced security tracking
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    location_info JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication backup codes
CREATE TABLE public.user_2fa_backup_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Q&A categories (updated reference)
CREATE TABLE public.legal_qa_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Q&A questions (updated reference)
CREATE TABLE public.legal_qa_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_qa_categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    ai_response JSONB,
    status TEXT CHECK (status IN ('pending', 'answered', 'reviewed')) DEFAULT 'pending',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced Payment transactions
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),

    -- Payment Provider Details
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    stripe_invoice_id TEXT,
    nets_transaction_id TEXT,
    paynow_reference TEXT,
    grabpay_transaction_id TEXT,

    -- Transaction Details
    amount_sgd DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SGD',
    payment_method payment_method_enum NOT NULL,
    status payment_status_enum DEFAULT 'pending',

    -- Billing Information
    billing_reason TEXT, -- 'subscription_create', 'subscription_cycle', 'subscription_update', 'one_time'
    invoice_number TEXT UNIQUE,
    tax_amount_sgd DECIMAL(10,2) DEFAULT 0,
    discount_amount_sgd DECIMAL(10,2) DEFAULT 0,

    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced chat sessions
CREATE TABLE public.user_chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT,
    aixplain_session_id TEXT,
    message_count INTEGER DEFAULT 0,
    is_shared BOOLEAN DEFAULT false,
    sharing_settings JSONB DEFAULT '{"team_access": false}',
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced chat messages
CREATE TABLE public.user_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.user_chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    attachments JSONB, -- For document references
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced User subscriptions with comprehensive billing features
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tier subscription_tier_enum NOT NULL,
    status subscription_status_enum DEFAULT 'active',
    billing_cycle billing_cycle_enum DEFAULT 'monthly',

    -- Stripe Integration
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    stripe_price_id TEXT,

    -- NETS Integration
    nets_subscription_id TEXT UNIQUE,
    nets_customer_id TEXT,

    -- Billing Periods
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,

    -- Cancellation Management
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Pricing & Discounts
    base_amount_sgd DECIMAL(10,2) NOT NULL,
    discount_amount_sgd DECIMAL(10,2) DEFAULT 0,
    final_amount_sgd DECIMAL(10,2) NOT NULL,
    promotional_code_id UUID REFERENCES public.promotional_codes(id),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking for billing and limits enforcement
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),

    -- Usage Details
    resource_type usage_resource_enum NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_cost_sgd DECIMAL(10,4) DEFAULT 0, -- For usage-based billing

    -- Context Information
    resource_id UUID, -- ID of the specific resource (document, query, etc.)
    team_id UUID REFERENCES public.teams(id), -- If usage is team-related

    -- Billing Period
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotional codes and discounts
CREATE TABLE public.promotional_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Code Details
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Discount Configuration
    discount_type discount_type_enum NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL, -- Percentage (0-100) or fixed amount in SGD
    max_discount_amount_sgd DECIMAL(10,2), -- Maximum discount for percentage codes

    -- Usage Limits
    max_uses INTEGER, -- NULL for unlimited
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,

    -- Validity Period
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Applicability
    applicable_tiers subscription_tier_enum[] DEFAULT '{}',
    applicable_billing_cycles billing_cycle_enum[] DEFAULT '{}',
    minimum_amount_sgd DECIMAL(10,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_by UUID REFERENCES public.user_profiles(id), -- Admin who created the code
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotional code usage tracking
CREATE TABLE public.promotional_code_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    promotional_code_id UUID REFERENCES public.promotional_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),

    -- Usage Details
    discount_amount_sgd DECIMAL(10,2) NOT NULL,
    original_amount_sgd DECIMAL(10,2) NOT NULL,
    final_amount_sgd DECIMAL(10,2) NOT NULL,

    -- Metadata
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Subscription change history for audit trail
CREATE TABLE public.subscription_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    -- Change Details
    change_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'reactivated', 'payment_failed'
    from_tier subscription_tier_enum,
    to_tier subscription_tier_enum,
    from_billing_cycle billing_cycle_enum,
    to_billing_cycle billing_cycle_enum,

    -- Financial Impact
    prorated_amount_sgd DECIMAL(10,2) DEFAULT 0,
    refund_amount_sgd DECIMAL(10,2) DEFAULT 0,

    -- Context
    reason TEXT,
    initiated_by UUID REFERENCES public.user_profiles(id), -- User who initiated the change

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer invoices for enterprise billing
CREATE TABLE public.customer_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),

    -- Invoice Details
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal_sgd DECIMAL(10,2) NOT NULL,
    tax_amount_sgd DECIMAL(10,2) DEFAULT 0,
    discount_amount_sgd DECIMAL(10,2) DEFAULT 0,
    total_amount_sgd DECIMAL(10,2) NOT NULL,

    -- Status
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',

    -- Payment Information
    payment_terms INTEGER DEFAULT 30, -- Days
    payment_method payment_method_enum,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- File Storage
    pdf_url TEXT,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription tier features configuration
CREATE TABLE public.subscription_tier_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier subscription_tier_enum NOT NULL UNIQUE,

    -- Core Limits
    articles_access TEXT DEFAULT 'unlimited', -- 'limited', 'unlimited', or number
    document_templates_per_month INTEGER, -- NULL for unlimited
    ai_queries_per_month INTEGER, -- NULL for unlimited
    document_storage_gb INTEGER, -- NULL for unlimited
    document_retention_months INTEGER, -- NULL for unlimited
    team_members_limit INTEGER, -- NULL for unlimited

    -- Feature Flags
    team_collaboration BOOLEAN DEFAULT false,
    custom_templates BOOLEAN DEFAULT false,
    advanced_analytics BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    white_labeling BOOLEAN DEFAULT false,
    client_portal BOOLEAN DEFAULT false,
    compliance_reporting BOOLEAN DEFAULT false,
    custom_workflows BOOLEAN DEFAULT false,
    version_history BOOLEAN DEFAULT false,

    -- Document Formats
    supported_formats TEXT[] DEFAULT '{"pdf"}', -- pdf, docx, txt

    -- Pricing
    monthly_price_sgd DECIMAL(10,2) NOT NULL DEFAULT 0,
    annual_price_sgd DECIMAL(10,2) NOT NULL DEFAULT 0,
    annual_discount_percentage DECIMAL(5,2) DEFAULT 0,

    -- Metadata
    description TEXT,
    features_json JSONB DEFAULT '{}', -- Additional flexible features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise API keys for API access
CREATE TABLE public.enterprise_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    -- Key Details
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL, -- In production, store hashed version

    -- Permissions and Access
    permissions TEXT[] DEFAULT '{}', -- e.g., ['read', 'write', 'admin']
    rate_limit_per_hour INTEGER DEFAULT 1000,

    -- Status and Expiry
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User saved content for bookmarking
CREATE TABLE public.user_saved_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'qa', 'document', 'template')),
    content_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX idx_user_profiles_singapore_nric ON public.user_profiles(singapore_nric);
CREATE INDEX idx_user_profiles_singapore_uen ON public.user_profiles(singapore_uen);
CREATE INDEX idx_user_profiles_verification_status ON public.user_profiles(singapore_validation_status);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Teams indexes
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_teams_team_type ON public.teams(team_type);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
CREATE INDEX idx_team_members_status ON public.team_members(status);

-- Documents indexes
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_team_id ON public.user_documents(team_id);
CREATE INDEX idx_user_documents_status ON public.user_documents(upload_status);
CREATE INDEX idx_user_documents_created_at ON public.user_documents(created_at);
CREATE INDEX idx_user_documents_folder_path ON public.user_documents(folder_path);
CREATE INDEX idx_user_documents_document_type ON public.user_documents(document_type);
CREATE INDEX idx_user_documents_is_favorite ON public.user_documents(is_favorite);
CREATE INDEX idx_user_documents_access_level ON public.user_documents(access_level);

-- Document sharing indexes
CREATE INDEX idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX idx_document_shares_shared_with ON public.document_shares(shared_with);
CREATE INDEX idx_document_public_links_document_id ON public.document_public_links(document_id);
CREATE INDEX idx_document_public_links_token ON public.document_public_links(link_token);

-- Compliance and audit indexes
CREATE INDEX idx_user_consent_records_user_id ON public.user_consent_records(user_id);
CREATE INDEX idx_user_consent_records_type ON public.user_consent_records(consent_type);
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Legacy table indexes (updated references)
CREATE INDEX idx_legal_qa_questions_user_id ON public.legal_qa_questions(user_id);
CREATE INDEX idx_legal_qa_questions_category ON public.legal_qa_questions(category_id);
CREATE INDEX idx_legal_qa_questions_created_at ON public.legal_qa_questions(created_at);
CREATE INDEX idx_legal_qa_questions_status ON public.legal_qa_questions(status);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_stripe_id ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);
CREATE INDEX idx_user_chat_sessions_updated_at ON public.user_chat_sessions(updated_at);
CREATE INDEX idx_user_chat_messages_session_id ON public.user_chat_messages(session_id);
CREATE INDEX idx_user_chat_messages_created_at ON public.user_chat_messages(created_at);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_saved_content_user_id ON public.user_saved_content(user_id);
CREATE INDEX idx_user_saved_content_type ON public.user_saved_content(content_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_qa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        auth.uid() = owner_id OR
        auth.uid() IN (SELECT user_id FROM public.team_members WHERE team_id = id AND status = 'active')
    );

CREATE POLICY "Team owners can manage their teams" ON public.teams
    FOR ALL USING (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Users can view team members of their teams" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR
        team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active')
    );

CREATE POLICY "Team owners and admins can manage members" ON public.team_members
    FOR ALL USING (
        team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR
        (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager')))
    );

-- Documents policies (comprehensive access control)
CREATE POLICY "Users can view accessible documents" ON public.user_documents
    FOR SELECT USING (
        -- Own documents
        auth.uid() = user_id OR
        -- Team documents (if team member)
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
        )) OR
        -- Shared documents
        id IN (SELECT document_id FROM public.document_shares WHERE shared_with = auth.uid()) OR
        -- Public documents
        access_level = 'public'
    );

CREATE POLICY "Users can insert own documents" ON public.user_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accessible documents" ON public.user_documents
    FOR UPDATE USING (
        -- Own documents
        auth.uid() = user_id OR
        -- Team documents with edit permission
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin', 'manager')
        )) OR
        -- Shared documents with edit permission
        id IN (SELECT document_id FROM public.document_shares
               WHERE shared_with = auth.uid() AND permission IN ('edit', 'admin'))
    );

CREATE POLICY "Users can delete own documents" ON public.user_documents
    FOR DELETE USING (
        auth.uid() = user_id OR
        -- Team owners can delete team documents
        (team_id IS NOT NULL AND team_id IN (
            SELECT id FROM public.teams WHERE owner_id = auth.uid()
        ))
    );

-- Document sharing policies
CREATE POLICY "Users can view shares for their documents" ON public.document_shares
    FOR SELECT USING (
        auth.uid() = shared_by OR
        auth.uid() = shared_with OR
        document_id IN (SELECT id FROM public.user_documents WHERE user_id = auth.uid())
    );

CREATE POLICY "Document owners can manage shares" ON public.document_shares
    FOR ALL USING (
        document_id IN (SELECT id FROM public.user_documents WHERE user_id = auth.uid())
    );

-- Document public links policies
CREATE POLICY "Users can manage public links for their documents" ON public.document_public_links
    FOR ALL USING (
        document_id IN (SELECT id FROM public.user_documents WHERE user_id = auth.uid())
    );

-- Compliance and audit policies
CREATE POLICY "Users can view own consent records" ON public.user_consent_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent records" ON public.user_consent_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.user_activity_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log activities

CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own 2FA codes" ON public.user_2fa_backup_codes
    FOR ALL USING (auth.uid() = user_id);

-- Legal Q&A categories policies (public read access)
CREATE POLICY "Anyone can view active categories" ON public.legal_qa_categories
    FOR SELECT USING (is_active = true);

-- Q&A policies
CREATE POLICY "Users can view own questions and public questions" ON public.legal_qa_questions
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own questions" ON public.legal_qa_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON public.legal_qa_questions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment policies
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat policies (updated for new table names)
CREATE POLICY "Users can view accessible chats" ON public.user_chat_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
        ))
    );

CREATE POLICY "Users can insert own chats" ON public.user_chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accessible chats" ON public.user_chat_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR
        (team_id IS NOT NULL AND team_id IN (
            SELECT team_id FROM public.team_members
            WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin', 'manager')
        ))
    );

CREATE POLICY "Users can delete own chats" ON public.user_chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view accessible messages" ON public.user_chat_messages
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.user_chat_sessions
            WHERE user_id = auth.uid() OR
            (team_id IS NOT NULL AND team_id IN (
                SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
            ))
        )
    );

CREATE POLICY "Users can insert messages in accessible chats" ON public.user_chat_messages
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM public.user_chat_sessions WHERE user_id = auth.uid()
        )
    );

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved content policies
CREATE POLICY "Users can manage own saved content" ON public.user_saved_content
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user registration (updated for new table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        terms_accepted_date,
        privacy_policy_accepted_date
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_action_type TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate Singapore NRIC
CREATE OR REPLACE FUNCTION public.validate_singapore_nric(nric TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    weights INTEGER[] := ARRAY[2, 7, 6, 5, 4, 3, 2];
    letters_st TEXT[] := ARRAY['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
    letters_fg TEXT[] := ARRAY['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
    sum_val INTEGER := 0;
    i INTEGER;
    check_letter TEXT;
    expected_letter TEXT;
BEGIN
    -- Check format
    IF nric !~ '^[STFG][0-9]{7}[A-Z]$' THEN
        RETURN FALSE;
    END IF;

    -- Calculate checksum
    FOR i IN 1..7 LOOP
        sum_val := sum_val + (substring(nric, i+1, 1)::INTEGER * weights[i]);
    END LOOP;

    check_letter := substring(nric, 9, 1);

    -- Determine expected letter based on prefix
    IF substring(nric, 1, 1) IN ('S', 'T') THEN
        expected_letter := letters_st[(sum_val % 11) + 1];
    ELSE
        expected_letter := letters_fg[(sum_val % 11) + 1];
    END IF;

    RETURN check_letter = expected_letter;
END;
$$ LANGUAGE plpgsql;

-- Function to validate Singapore UEN
CREATE OR REPLACE FUNCTION public.validate_singapore_uen(uen TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic format validation for UEN
    RETURN uen ~ '^[0-9]{8,10}[A-Z]$';
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_documents_updated_at ON public.user_documents;
CREATE TRIGGER update_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_chat_sessions_updated_at ON public.user_chat_sessions;
CREATE TRIGGER update_user_chat_sessions_updated_at
    BEFORE UPDATE ON public.user_chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INITIAL DATA & SEED DATA
-- =====================================================

-- Insert initial legal categories
INSERT INTO public.legal_qa_categories (name, description, icon_name, order_index) VALUES
('Business Law', 'Company incorporation, contracts, compliance', 'building-2', 1),
('Employment Law', 'Employment contracts, workplace rights, disputes', 'users', 2),
('Property Law', 'Real estate, leases, property transactions', 'home', 3),
('Family Law', 'Divorce, custody, matrimonial matters', 'heart', 4),
('Criminal Law', 'Criminal charges, defense, legal procedures', 'scale', 5),
('Intellectual Property', 'Trademarks, patents, copyright protection', 'lightbulb', 6),
('Immigration Law', 'Work permits, PR applications, citizenship', 'plane', 7),
('Tax Law', 'Tax compliance, GST, corporate taxation', 'calculator', 8)
ON CONFLICT DO NOTHING;

-- Create admin users (for testing and administration)
-- Note: These will be created when users actually sign up with these emails
-- The trigger will automatically create profiles for them

-- =====================================================
-- MIGRATION HELPERS
-- =====================================================

-- Function to migrate existing profiles data (if needed)
CREATE OR REPLACE FUNCTION public.migrate_profiles_to_user_profiles()
RETURNS VOID AS $$
BEGIN
    -- This function can be used to migrate data from old profiles table
    -- to new user_profiles table if needed during deployment

    -- Example migration (uncomment if needed):
    /*
    INSERT INTO public.user_profiles (
        id, email, full_name, phone_number, user_type, subscription_tier,
        singapore_nric, singapore_uen, created_at, updated_at
    )
    SELECT
        id, email, full_name, phone,
        user_type::user_type_enum,
        subscription_status::subscription_tier_enum,
        singapore_nric, law_firm_uen, created_at, updated_at
    FROM public.profiles
    ON CONFLICT (id) DO NOTHING;
    */

    RAISE NOTICE 'Migration function ready. Uncomment and modify as needed.';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's team memberships
CREATE OR REPLACE FUNCTION public.get_user_teams(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    role team_role_enum,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tm.team_id,
        t.team_name,
        tm.role,
        tm.status
    FROM public.team_members tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE tm.user_id = p_user_id AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access document
CREATE OR REPLACE FUNCTION public.can_user_access_document(p_user_id UUID, p_document_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    doc_record RECORD;
BEGIN
    SELECT user_id, team_id, access_level INTO doc_record
    FROM public.user_documents
    WHERE id = p_document_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Owner access
    IF doc_record.user_id = p_user_id THEN
        RETURN TRUE;
    END IF;

    -- Public access
    IF doc_record.access_level = 'public' THEN
        RETURN TRUE;
    END IF;

    -- Team access
    IF doc_record.team_id IS NOT NULL AND doc_record.access_level = 'team' THEN
        IF EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = doc_record.team_id
            AND user_id = p_user_id
            AND status = 'active'
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- Shared access
    IF EXISTS (
        SELECT 1 FROM public.document_shares
        WHERE document_id = p_document_id
        AND shared_with = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 6A: MONETIZATION RLS POLICIES
-- =====================================================

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (true); -- Allow system to track usage

-- Promotional codes policies (read-only for users)
CREATE POLICY "Users can view active promotional codes" ON public.promotional_codes
    FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

-- Promotional code usage policies
CREATE POLICY "Users can view own promo usage" ON public.promotional_code_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promo usage" ON public.promotional_code_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscription changes policies
CREATE POLICY "Users can view own subscription changes" ON public.subscription_changes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscription changes" ON public.subscription_changes
    FOR INSERT WITH CHECK (true); -- Allow system to log changes

-- Customer invoices policies
CREATE POLICY "Users can view own invoices" ON public.customer_invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Subscription tier features (public read)
CREATE POLICY "Anyone can view subscription features" ON public.subscription_tier_features
    FOR SELECT USING (true);

-- Enterprise API keys policies
CREATE POLICY "Users can view own API keys" ON public.enterprise_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON public.enterprise_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.enterprise_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PHASE 6A: SUBSCRIPTION TIER FEATURES SEED DATA
-- =====================================================

-- Insert default subscription tier features
INSERT INTO public.subscription_tier_features (
    tier, articles_access, document_templates_per_month, ai_queries_per_month,
    document_storage_gb, document_retention_months, team_members_limit,
    team_collaboration, custom_templates, advanced_analytics, priority_support,
    api_access, white_labeling, client_portal, compliance_reporting,
    custom_workflows, version_history, supported_formats,
    monthly_price_sgd, annual_price_sgd, annual_discount_percentage, description
) VALUES
-- Free Tier
('free', 'limited', 3, 5, 1, 1, 1, false, false, false, false, false, false, false, false, false, false,
 '{"pdf"}', 0, 0, 0, 'Basic legal assistance for individuals'),

-- Basic Individual Tier
('basic_individual', 'unlimited', 15, 50, 5, 6, 1, false, false, false, false, false, false, false, false, false, false,
 '{"pdf", "docx"}', 29, 290, 17, 'Essential legal tools for individuals'),

-- Premium Individual Tier
('premium_individual', 'unlimited', NULL, 200, 20, 12, 3, true, false, false, false, false, false, false, false, false, true,
 '{"pdf", "docx", "txt"}', 79, 790, 17, 'Advanced legal assistance with team features'),

-- Professional/Law Firm Tier
('professional', 'unlimited', NULL, NULL, 100, 24, 10, true, true, false, true, false, false, true, true, false, true,
 '{"pdf", "docx", "txt"}', 199, 1990, 17, 'Complete solution for legal professionals'),

-- Enterprise Tier
('enterprise', 'unlimited', NULL, NULL, NULL, NULL, NULL, true, true, true, true, true, true, true, true, true, true,
 '{"pdf", "docx", "txt"}', 499, 4990, 17, 'Full-featured enterprise legal platform')
ON CONFLICT (tier) DO NOTHING;

-- =====================================================
-- PHASE 6A: DATABASE FUNCTIONS
-- =====================================================

-- Function to increment promotional code usage
CREATE OR REPLACE FUNCTION public.increment_promo_usage(promo_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.promotional_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription with features
CREATE OR REPLACE FUNCTION public.get_user_subscription_with_features(user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    tier subscription_tier_enum,
    status subscription_status_enum,
    billing_cycle billing_cycle_enum,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.id,
        us.tier,
        us.status,
        us.billing_cycle,
        us.current_period_start,
        us.current_period_end,
        to_jsonb(stf.*) - 'id' - 'tier' - 'created_at' - 'updated_at' as features
    FROM public.user_subscriptions us
    LEFT JOIN public.subscription_tier_features stf ON stf.tier = us.tier
    WHERE us.user_id = get_user_subscription_with_features.user_id
    AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    user_id UUID,
    resource_type usage_resource_enum,
    requested_quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_usage INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    percentage_used NUMERIC
) AS $$
DECLARE
    subscription_record RECORD;
    current_period_usage INTEGER;
    resource_limit INTEGER;
BEGIN
    -- Get user's active subscription with features
    SELECT * INTO subscription_record
    FROM public.get_user_subscription_with_features(user_id);

    IF NOT FOUND THEN
        -- Default to free tier if no subscription
        SELECT * INTO subscription_record
        FROM public.subscription_tier_features
        WHERE tier = 'free';
    END IF;

    -- Get resource limit based on type
    CASE resource_type
        WHEN 'document_generation' THEN
            resource_limit := (subscription_record.features->>'document_templates_per_month')::INTEGER;
        WHEN 'ai_query' THEN
            resource_limit := (subscription_record.features->>'ai_queries_per_month')::INTEGER;
        WHEN 'storage_gb' THEN
            resource_limit := (subscription_record.features->>'document_storage_gb')::INTEGER;
        WHEN 'team_member' THEN
            resource_limit := (subscription_record.features->>'team_members_limit')::INTEGER;
        WHEN 'api_call' THEN
            resource_limit := CASE WHEN (subscription_record.features->>'api_access')::BOOLEAN THEN NULL ELSE 0 END;
        WHEN 'template_access' THEN
            resource_limit := CASE
                WHEN subscription_record.features->>'articles_access' = 'unlimited' THEN NULL
                ELSE (subscription_record.features->>'articles_access')::INTEGER
            END;
        ELSE
            resource_limit := 0;
    END CASE;

    -- If unlimited, always allow
    IF resource_limit IS NULL THEN
        RETURN QUERY SELECT TRUE, 0, -1, -1, 0.0;
        RETURN;
    END IF;

    -- Get current usage for billing period
    SELECT COALESCE(SUM(quantity), 0) INTO current_period_usage
    FROM public.usage_tracking
    WHERE usage_tracking.user_id = check_usage_limit.user_id
    AND usage_tracking.resource_type = check_usage_limit.resource_type
    AND usage_tracking.tracked_at >= subscription_record.current_period_start
    AND usage_tracking.tracked_at <= subscription_record.current_period_end;

    -- Calculate results
    RETURN QUERY SELECT
        (current_period_usage + requested_quantity) <= resource_limit,
        current_period_usage,
        resource_limit,
        GREATEST(0, resource_limit - current_period_usage),
        CASE WHEN resource_limit > 0 THEN (current_period_usage::NUMERIC / resource_limit::NUMERIC) * 100 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

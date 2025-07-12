-- =====================================================
-- PHASE 6A DEPLOYMENT SCRIPT
-- Singapore Legal Help Platform - Monetization System
-- =====================================================

-- This script deploys all Phase 6A monetization features
-- Run this against your Supabase database to enable the new subscription system

-- =====================================================
-- 1. CREATE NEW ENUMS
-- =====================================================

-- Update subscription tier enum
ALTER TYPE subscription_tier_enum ADD VALUE IF NOT EXISTS 'basic_individual';
ALTER TYPE subscription_tier_enum ADD VALUE IF NOT EXISTS 'premium_individual';
ALTER TYPE subscription_tier_enum ADD VALUE IF NOT EXISTS 'professional';

-- Create new enums for Phase 6A
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'annual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('stripe', 'nets', 'paynow', 'grabpay', 'corporate_invoice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'cancelled', 'processing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE usage_resource_enum AS ENUM ('document_generation', 'ai_query', 'storage_gb', 'team_member', 'api_call', 'template_access');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Update user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle billing_cycle_enum DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS nets_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nets_customer_id TEXT,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS base_amount_sgd DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_amount_sgd DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount_sgd DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS promotional_code_id UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update payment_transactions table
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.user_subscriptions(id),
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS paynow_reference TEXT,
ADD COLUMN IF NOT EXISTS grabpay_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS billing_reason TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tax_amount_sgd DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount_sgd DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Rename amount to amount_sgd for consistency
DO $$ BEGIN
    ALTER TABLE public.payment_transactions RENAME COLUMN amount TO amount_sgd;
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- Update payment_method column type
ALTER TABLE public.payment_transactions 
ALTER COLUMN payment_method TYPE payment_method_enum USING payment_method::payment_method_enum;

-- Update status column type
ALTER TABLE public.payment_transactions 
ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;

-- =====================================================
-- 3. CREATE NEW TABLES
-- =====================================================

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    resource_type usage_resource_enum NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_cost_sgd DECIMAL(10,4) DEFAULT 0,
    
    resource_id UUID,
    team_id UUID,
    
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}',
    tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotional codes table
CREATE TABLE IF NOT EXISTS public.promotional_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    discount_type discount_type_enum NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount_sgd DECIMAL(10,2),
    
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    applicable_tiers subscription_tier_enum[] DEFAULT '{}',
    applicable_billing_cycles billing_cycle_enum[] DEFAULT '{}',
    minimum_amount_sgd DECIMAL(10,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES public.user_profiles(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotional code usage tracking
CREATE TABLE IF NOT EXISTS public.promotional_code_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    promotional_code_id UUID REFERENCES public.promotional_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    discount_amount_sgd DECIMAL(10,2) NOT NULL,
    original_amount_sgd DECIMAL(10,2) NOT NULL,
    final_amount_sgd DECIMAL(10,2) NOT NULL,
    
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Subscription change history
CREATE TABLE IF NOT EXISTS public.subscription_changes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    change_type TEXT NOT NULL,
    from_tier subscription_tier_enum,
    to_tier subscription_tier_enum,
    from_billing_cycle billing_cycle_enum,
    to_billing_cycle billing_cycle_enum,
    
    prorated_amount_sgd DECIMAL(10,2) DEFAULT 0,
    refund_amount_sgd DECIMAL(10,2) DEFAULT 0,
    
    reason TEXT,
    initiated_by UUID REFERENCES public.user_profiles(id),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer invoices for enterprise billing
CREATE TABLE IF NOT EXISTS public.customer_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    subtotal_sgd DECIMAL(10,2) NOT NULL,
    tax_amount_sgd DECIMAL(10,2) DEFAULT 0,
    discount_amount_sgd DECIMAL(10,2) DEFAULT 0,
    total_amount_sgd DECIMAL(10,2) NOT NULL,
    
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    
    payment_terms INTEGER DEFAULT 30,
    payment_method payment_method_enum,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    pdf_url TEXT,
    
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription tier features configuration
CREATE TABLE IF NOT EXISTS public.subscription_tier_features (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier subscription_tier_enum NOT NULL UNIQUE,
    
    articles_access TEXT DEFAULT 'unlimited',
    document_templates_per_month INTEGER,
    ai_queries_per_month INTEGER,
    document_storage_gb INTEGER,
    document_retention_months INTEGER,
    team_members_limit INTEGER,
    
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
    
    supported_formats TEXT[] DEFAULT '{"pdf"}',
    
    monthly_price_sgd DECIMAL(10,2) NOT NULL DEFAULT 0,
    annual_price_sgd DECIMAL(10,2) NOT NULL DEFAULT 0,
    annual_discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    description TEXT,
    features_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise API keys
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    
    permissions TEXT[] DEFAULT '{}',
    rate_limit_per_hour INTEGER DEFAULT 1000,
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Usage tracking policies
CREATE POLICY IF NOT EXISTS "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (true);

-- Promotional codes policies
CREATE POLICY IF NOT EXISTS "Users can view active promotional codes" ON public.promotional_codes
    FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

-- Promotional code usage policies
CREATE POLICY IF NOT EXISTS "Users can view own promo usage" ON public.promotional_code_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own promo usage" ON public.promotional_code_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscription changes policies
CREATE POLICY IF NOT EXISTS "Users can view own subscription changes" ON public.subscription_changes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert subscription changes" ON public.subscription_changes
    FOR INSERT WITH CHECK (true);

-- Customer invoices policies
CREATE POLICY IF NOT EXISTS "Users can view own invoices" ON public.customer_invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Subscription tier features (public read)
CREATE POLICY IF NOT EXISTS "Anyone can view subscription features" ON public.subscription_tier_features
    FOR SELECT USING (true);

-- Enterprise API keys policies
CREATE POLICY IF NOT EXISTS "Users can view own API keys" ON public.enterprise_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own API keys" ON public.enterprise_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own API keys" ON public.enterprise_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. DEPLOYMENT COMPLETE
-- =====================================================

-- Insert success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 6A Monetization System deployed successfully!';
    RAISE NOTICE 'New features available:';
    RAISE NOTICE '- Enhanced 5-tier subscription system';
    RAISE NOTICE '- Usage tracking and enforcement';
    RAISE NOTICE '- Promotional codes and discounts';
    RAISE NOTICE '- Enterprise billing and API access';
    RAISE NOTICE '- Business intelligence analytics';
END $$;

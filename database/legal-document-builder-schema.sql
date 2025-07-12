-- =====================================================
-- LEGAL DOCUMENT BUILDER DATABASE SCHEMA
-- Singapore Legal Help Platform - Document Builder Extension
-- Date: 2025-07-07
-- =====================================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- LEGAL DOCUMENT BUILDER TABLES
-- =====================================================

-- 1. Legal Document Templates (Core metadata)
CREATE TABLE public.legal_document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- employment, business, property, family, corporate
    subcategory VARCHAR(100),
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('docx', 'doc')),
    
    -- Pricing & Access
    subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')) DEFAULT 'free',
    price_sgd DECIMAL(10,2) DEFAULT 0.00,
    
    -- Template Configuration
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')) DEFAULT 'basic',
    estimated_time_minutes INTEGER DEFAULT 15,
    
    -- Singapore Compliance
    singapore_compliant BOOLEAN DEFAULT true,
    legal_review_required BOOLEAN DEFAULT true,
    
    -- Status & Workflow
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'under_review', 'approved', 'published', 'archived')) DEFAULT 'draft',
    
    -- Metadata
    created_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Template Content (File content and processing)
CREATE TABLE public.template_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    
    -- Content Storage
    content_text TEXT, -- Extracted text content
    content_json JSONB, -- Structured content for processing
    
    -- Variable Extraction
    variables_detected JSONB, -- Auto-detected variables from template
    variables_configured JSONB, -- Admin-configured variables
    
    -- Processing Status
    processing_status VARCHAR(20) NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Template Variables (Reusable variable library)
CREATE TABLE public.template_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Variable Definition
    variable_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'full_name', 'nric_number'
    display_label VARCHAR(255) NOT NULL, -- e.g., 'Full Name', 'NRIC Number'
    variable_type VARCHAR(20) NOT NULL CHECK (variable_type IN ('text', 'textarea', 'email', 'date', 'select', 'number', 'phone')),
    
    -- Validation Rules
    is_required BOOLEAN DEFAULT false,
    validation_pattern TEXT, -- Regex pattern for validation
    validation_message TEXT, -- Custom validation error message
    
    -- Select Options (for select type)
    select_options JSONB, -- Array of options for select fields
    
    -- Categorization
    category VARCHAR(50) NOT NULL CHECK (category IN ('personal', 'company', 'legal', 'financial', 'custom')),
    
    -- Singapore-Specific Validation
    singapore_validation BOOLEAN DEFAULT false, -- Uses Singapore-specific patterns
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Template Usage Analytics
CREATE TABLE public.template_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Usage Details
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'download', 'generate', 'purchase')),
    
    -- Document Generation Details (for generate action)
    generated_format VARCHAR(10) CHECK (generated_format IN ('pdf', 'docx')),
    variables_used JSONB, -- Variables and values used in generation
    
    -- Payment Information (for purchase action)
    payment_transaction_id UUID REFERENCES public.payment_transactions(id),
    amount_paid DECIMAL(10,2),
    
    -- Session Information
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Template indexes
CREATE INDEX idx_legal_document_templates_category ON public.legal_document_templates(category);
CREATE INDEX idx_legal_document_templates_status ON public.legal_document_templates(status);
CREATE INDEX idx_legal_document_templates_tier ON public.legal_document_templates(subscription_tier);
CREATE INDEX idx_legal_document_templates_created_at ON public.legal_document_templates(created_at);

-- Content indexes
CREATE INDEX idx_template_content_template_id ON public.template_content(template_id);
CREATE INDEX idx_template_content_processing_status ON public.template_content(processing_status);

-- Variables indexes
CREATE INDEX idx_template_variables_category ON public.template_variables(category);
CREATE INDEX idx_template_variables_type ON public.template_variables(variable_type);
CREATE INDEX idx_template_variables_usage_count ON public.template_variables(usage_count DESC);

-- Usage analytics indexes
CREATE INDEX idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON public.template_usage(user_id);
CREATE INDEX idx_template_usage_action_type ON public.template_usage(action_type);
CREATE INDEX idx_template_usage_created_at ON public.template_usage(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.legal_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- Template policies (Admin access for management, public read for published)
CREATE POLICY "Admin can manage all templates" ON public.legal_document_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

CREATE POLICY "Users can view published templates" ON public.legal_document_templates
    FOR SELECT USING (status = 'published');

-- Template content policies (Admin only)
CREATE POLICY "Admin can manage template content" ON public.template_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

-- Template variables policies (Admin manage, users read)
CREATE POLICY "Admin can manage variables" ON public.template_variables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

CREATE POLICY "Users can view variables" ON public.template_variables
    FOR SELECT USING (true);

-- Usage analytics policies
CREATE POLICY "Users can view own usage" ON public.template_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.template_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all usage" ON public.template_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

-- =====================================================
-- INITIAL DATA - SINGAPORE TEMPLATE VARIABLES
-- =====================================================

-- Personal Information Variables
INSERT INTO public.template_variables (variable_name, display_label, variable_type, is_required, validation_pattern, validation_message, category, singapore_validation, description) VALUES
('full_name', 'Full Name', 'text', true, '^[A-Za-z\\s]+$', 'Please enter a valid full name', 'personal', false, 'Full legal name of the individual'),
('nric_number', 'NRIC Number', 'text', true, '^[STFG][0-9]{7}[A-Z]$', 'Please enter a valid Singapore NRIC (e.g., S1234567A)', 'personal', true, 'Singapore NRIC/FIN number'),
('address', 'Address', 'textarea', true, '', '', 'personal', false, 'Full residential or business address'),
('phone_number', 'Phone Number', 'phone', true, '^[0-9]{8}$', 'Please enter a valid 8-digit Singapore phone number', 'personal', true, 'Singapore phone number (8 digits)'),
('email_address', 'Email Address', 'email', true, '^[^@]+@[^@]+\\.[^@]+$', 'Please enter a valid email address', 'personal', false, 'Email address for correspondence');

-- Company Information Variables
INSERT INTO public.template_variables (variable_name, display_label, variable_type, is_required, validation_pattern, validation_message, select_options, category, singapore_validation, description) VALUES
('company_name', 'Company Name', 'text', true, '^[A-Za-z0-9\\s&.,()-]+$', 'Please enter a valid company name', null, 'company', false, 'Official registered company name'),
('uen_number', 'UEN Number', 'text', true, '^[0-9]{8}[A-Z]$|^[0-9]{9}[A-Z]$|^[0-9]{10}[A-Z]$', 'Please enter a valid Singapore UEN number', null, 'company', true, 'Singapore Unique Entity Number'),
('registered_address', 'Registered Address', 'textarea', true, '', '', null, 'company', false, 'Official registered business address'),
('business_type', 'Business Type', 'select', true, '', '', '["Private Limited Company", "Public Limited Company", "Partnership", "Sole Proprietorship", "Limited Liability Partnership"]', 'company', false, 'Type of business entity'),
('director_names', 'Director Names', 'textarea', false, '', '', null, 'company', false, 'Names of company directors (one per line)');

-- Legal Terms Variables
INSERT INTO public.template_variables (variable_name, display_label, variable_type, is_required, validation_pattern, validation_message, select_options, category, singapore_validation, description) VALUES
('contract_date', 'Contract Date', 'date', true, '', '', null, 'legal', false, 'Date when the contract is signed'),
('governing_law', 'Governing Law', 'select', true, '', '', '["Singapore", "Malaysia", "Hong Kong", "United Kingdom", "Other"]', 'legal', false, 'Which country''s laws govern this contract'),
('jurisdiction', 'Jurisdiction', 'select', true, '', '', '["Singapore Courts", "SIAC Arbitration", "SIMC Mediation", "Other"]', 'legal', true, 'Dispute resolution jurisdiction'),
('termination_notice', 'Termination Notice Period', 'select', false, '', '', '["1 month", "2 months", "3 months", "6 months", "1 year"]', 'legal', false, 'Required notice period for contract termination'),
('dispute_resolution', 'Dispute Resolution Method', 'select', true, '', '', '["Mediation", "Arbitration", "Court Proceedings", "Mediation then Arbitration"]', 'legal', false, 'Preferred method for resolving disputes');

-- Financial Variables
INSERT INTO public.template_variables (variable_name, display_label, variable_type, is_required, validation_pattern, validation_message, select_options, category, singapore_validation, description) VALUES
('contract_value', 'Contract Value (SGD)', 'number', false, '^[0-9]+(\\.[0-9]{1,2})?$', 'Please enter a valid amount in SGD', null, 'financial', false, 'Total value of the contract in Singapore Dollars'),
('payment_terms', 'Payment Terms', 'select', false, '', '', '["Net 30 days", "Net 15 days", "Net 7 days", "Upon completion", "50% upfront, 50% on completion", "Monthly installments"]', 'financial', false, 'Payment schedule and terms'),
('late_payment_interest', 'Late Payment Interest Rate (%)', 'number', false, '^[0-9]+(\\.[0-9]{1,2})?$', 'Please enter a valid interest rate', null, 'financial', false, 'Annual interest rate for late payments');

-- Update usage counts for commonly used variables
UPDATE public.template_variables SET usage_count = 45 WHERE variable_name = 'company_name';
UPDATE public.template_variables SET usage_count = 38 WHERE variable_name = 'contract_date';
UPDATE public.template_variables SET usage_count = 35 WHERE variable_name = 'full_name';
UPDATE public.template_variables SET usage_count = 32 WHERE variable_name = 'nric_number';
UPDATE public.template_variables SET usage_count = 28 WHERE variable_name = 'email_address';
UPDATE public.template_variables SET usage_count = 25 WHERE variable_name = 'phone_number';
UPDATE public.template_variables SET usage_count = 22 WHERE variable_name = 'uen_number';
UPDATE public.template_variables SET usage_count = 18 WHERE variable_name = 'address';
UPDATE public.template_variables SET usage_count = 15 WHERE variable_name = 'governing_law';
UPDATE public.template_variables SET usage_count = 12 WHERE variable_name = 'jurisdiction';

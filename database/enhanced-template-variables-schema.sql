-- Enhanced Template Variables Schema
-- Singapore Legal Help Platform - Document Builder Enhancement
-- Adds conditional logic, dependent fields, and advanced validation

-- Add new columns to existing template_variables table
ALTER TABLE public.template_variables 
ADD COLUMN IF NOT EXISTS conditional_logic JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dependent_on VARCHAR(100),
ADD COLUMN IF NOT EXISTS show_when_value TEXT,
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS help_text TEXT,
ADD COLUMN IF NOT EXISTS placeholder_text TEXT,
ADD COLUMN IF NOT EXISTS field_group VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create template variable groups table for better organization
CREATE TABLE IF NOT EXISTS public.template_variable_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name VARCHAR(50) NOT NULL UNIQUE,
    display_label VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_collapsible BOOLEAN DEFAULT false,
    is_expanded_by_default BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default variable groups
INSERT INTO public.template_variable_groups (group_name, display_label, description, sort_order) VALUES
('personal', 'Personal Information', 'Basic personal details and identification', 1),
('business', 'Business Information', 'Company and business-related details', 2),
('employment', 'Employment Details', 'Work-related information and terms', 3),
('property', 'Property Information', 'Real estate and property details', 4),
('financial', 'Financial Terms', 'Payment, loan, and financial information', 5),
('legal', 'Legal Terms', 'Legal clauses and compliance information', 6),
('singapore_specific', 'Singapore Compliance', 'Singapore-specific requirements and validations', 7)
ON CONFLICT (group_name) DO NOTHING;

-- Create template conditional rules table
CREATE TABLE IF NOT EXISTS public.template_conditional_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    variable_name VARCHAR(100) NOT NULL,
    condition_type VARCHAR(20) CHECK (condition_type IN ('show_if', 'hide_if', 'require_if', 'validate_if')) NOT NULL,
    trigger_variable VARCHAR(100) NOT NULL,
    trigger_operator VARCHAR(10) CHECK (trigger_operator IN ('equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty')) NOT NULL,
    trigger_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template validation rules table
CREATE TABLE IF NOT EXISTS public.template_validation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variable_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) CHECK (rule_type IN ('regex', 'min_length', 'max_length', 'min_value', 'max_value', 'singapore_nric', 'singapore_uen', 'singapore_phone', 'singapore_postal', 'custom')) NOT NULL,
    rule_value TEXT,
    error_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Singapore-specific validation rules
INSERT INTO public.template_validation_rules (variable_name, rule_type, rule_value, error_message) VALUES
('nric_number', 'singapore_nric', '^[STFG][0-9]{7}[A-Z]$', 'Please enter a valid Singapore NRIC (e.g., S1234567A)'),
('company_uen', 'singapore_uen', '^[0-9]{8,10}[A-Z]$', 'Please enter a valid Singapore UEN (8-10 digits followed by a letter)'),
('phone_number', 'singapore_phone', '^[689][0-9]{7}$', 'Please enter a valid 8-digit Singapore phone number'),
('postal_code', 'singapore_postal', '^[0-9]{6}$', 'Please enter a valid 6-digit Singapore postal code'),
('interest_rate', 'max_value', '4.0', 'Interest rate cannot exceed 4% per month as per Moneylenders Act'),
('notice_period_days', 'min_value', '1', 'Notice period must be at least 1 day as per Employment Act')
ON CONFLICT DO NOTHING;

-- Create template field dependencies table
CREATE TABLE IF NOT EXISTS public.template_field_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_field VARCHAR(100) NOT NULL,
    child_field VARCHAR(100) NOT NULL,
    dependency_type VARCHAR(20) CHECK (dependency_type IN ('show_when', 'hide_when', 'require_when', 'calculate_from')) NOT NULL,
    condition_value TEXT,
    calculation_formula TEXT, -- For calculated fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_field, child_field, dependency_type)
);

-- Insert common field dependencies
INSERT INTO public.template_field_dependencies (parent_field, child_field, dependency_type, condition_value) VALUES
('work_permit_type', 'cpf_contribution', 'show_when', 'Singapore Citizen,PR'),
('property_type', 'hdb_block_number', 'show_when', 'HDB Flat'),
('loan_amount', 'monthly_payment', 'calculate_from', 'loan_amount * (interest_rate/100/12) / (1 - (1 + interest_rate/100/12)^(-repayment_period_months))'),
('employment_type', 'notice_period_days', 'require_when', 'Permanent'),
('company_type', 'company_uen', 'require_when', 'Private Limited,Public Limited')
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_conditional_rules_template_id ON public.template_conditional_rules(template_id);
CREATE INDEX IF NOT EXISTS idx_template_conditional_rules_variable ON public.template_conditional_rules(variable_name);
CREATE INDEX IF NOT EXISTS idx_template_validation_rules_variable ON public.template_validation_rules(variable_name);
CREATE INDEX IF NOT EXISTS idx_template_field_dependencies_parent ON public.template_field_dependencies(parent_field);
CREATE INDEX IF NOT EXISTS idx_template_field_dependencies_child ON public.template_field_dependencies(child_field);

-- Add RLS policies
ALTER TABLE public.template_variable_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_conditional_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_field_dependencies ENABLE ROW LEVEL SECURITY;

-- Variable groups - readable by all authenticated users
CREATE POLICY "Variable groups are viewable by authenticated users" ON public.template_variable_groups
    FOR SELECT USING (auth.role() = 'authenticated');

-- Conditional rules - readable by all, writable by admins
CREATE POLICY "Conditional rules are viewable by authenticated users" ON public.template_conditional_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Conditional rules are manageable by admins" ON public.template_conditional_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Validation rules - readable by all, writable by admins
CREATE POLICY "Validation rules are viewable by authenticated users" ON public.template_validation_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Validation rules are manageable by admins" ON public.template_validation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Field dependencies - readable by all, writable by admins
CREATE POLICY "Field dependencies are viewable by authenticated users" ON public.template_field_dependencies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field dependencies are manageable by admins" ON public.template_field_dependencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Create function to get template variables with conditional logic
CREATE OR REPLACE FUNCTION get_template_variables_with_logic(template_id_param UUID)
RETURNS TABLE (
    variable_name VARCHAR,
    display_label VARCHAR,
    variable_type VARCHAR,
    is_required BOOLEAN,
    validation_pattern TEXT,
    validation_message TEXT,
    select_options JSONB,
    category VARCHAR,
    singapore_validation BOOLEAN,
    description TEXT,
    conditional_logic JSONB,
    dependent_on VARCHAR,
    show_when_value TEXT,
    validation_rules JSONB,
    help_text TEXT,
    placeholder_text TEXT,
    field_group VARCHAR,
    sort_order INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tv.variable_name,
        tv.display_label,
        tv.variable_type,
        tv.is_required,
        tv.validation_pattern,
        tv.validation_message,
        tv.select_options,
        tv.category,
        tv.singapore_validation,
        tv.description,
        tv.conditional_logic,
        tv.dependent_on,
        tv.show_when_value,
        tv.validation_rules,
        tv.help_text,
        tv.placeholder_text,
        tv.field_group,
        tv.sort_order
    FROM public.template_variables tv
    WHERE tv.is_active = true
    ORDER BY tv.field_group, tv.sort_order, tv.display_label;
END;
$$;

-- Create document generation history table
CREATE TABLE IF NOT EXISTS public.document_generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Generation Details
    variables JSONB NOT NULL DEFAULT '{}',
    output_format VARCHAR(10) CHECK (output_format IN ('docx', 'pdf')) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',

    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_size BIGINT,
    generation_time_ms INTEGER,

    -- Status
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'processing')) DEFAULT 'success',
    error_message TEXT,

    -- Indexes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document versions table for version control
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Version Information
    version_number VARCHAR(20) NOT NULL,
    parent_version_id UUID REFERENCES public.document_versions(id),

    -- Document Data
    variables JSONB NOT NULL DEFAULT '{}',
    generated_content BYTEA, -- Store generated document
    output_format VARCHAR(10) CHECK (output_format IN ('docx', 'pdf')) NOT NULL,
    filename VARCHAR(255) NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT true,
    notes TEXT,

    UNIQUE(template_id, user_id, version_number)
);

-- Create bulk generation jobs table
CREATE TABLE IF NOT EXISTS public.bulk_generation_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Job Details
    job_name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES public.legal_document_templates(id) ON DELETE CASCADE,
    output_format VARCHAR(10) CHECK (output_format IN ('docx', 'pdf')) NOT NULL,

    -- Bulk Data
    variables_list JSONB NOT NULL DEFAULT '[]', -- Array of variable sets
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER DEFAULT 0,
    failed_documents INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Results
    generated_files JSONB DEFAULT '[]', -- Array of generated file info

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_generation_history_user_id ON public.document_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_document_generation_history_template_id ON public.document_generation_history(template_id);
CREATE INDEX IF NOT EXISTS idx_document_generation_history_generated_at ON public.document_generation_history(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_versions_template_user ON public.document_versions(template_id, user_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_current ON public.document_versions(is_current) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_bulk_generation_jobs_user_id ON public.bulk_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_generation_jobs_status ON public.bulk_generation_jobs(status);

-- Add RLS policies
ALTER TABLE public.document_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Generation history policies
CREATE POLICY "Users can view their own generation history" ON public.document_generation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history" ON public.document_generation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all generation history" ON public.document_generation_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Document versions policies
CREATE POLICY "Users can manage their own document versions" ON public.document_versions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all document versions" ON public.document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Bulk generation jobs policies
CREATE POLICY "Users can manage their own bulk jobs" ON public.bulk_generation_jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bulk jobs" ON public.bulk_generation_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
    );

-- Create function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update usage count in template_usage table
    INSERT INTO public.template_usage (template_id, usage_type, usage_date)
    VALUES (template_id, 'generation', NOW())
    ON CONFLICT DO NOTHING;

    -- You could also update a counter in the templates table if needed
    -- UPDATE public.legal_document_templates
    -- SET usage_count = COALESCE(usage_count, 0) + 1
    -- WHERE id = template_id;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.template_variable_groups IS 'Organizes template variables into logical groups for better UX';
COMMENT ON TABLE public.template_conditional_rules IS 'Defines conditional logic for showing/hiding/requiring fields';
COMMENT ON TABLE public.template_validation_rules IS 'Advanced validation rules for template variables';
COMMENT ON TABLE public.template_field_dependencies IS 'Defines dependencies between template fields';
COMMENT ON TABLE public.document_generation_history IS 'Tracks all document generation activities for analytics and history';
COMMENT ON TABLE public.document_versions IS 'Stores document versions for version control and comparison';
COMMENT ON TABLE public.bulk_generation_jobs IS 'Manages bulk document generation jobs for enterprise users';
COMMENT ON FUNCTION get_template_variables_with_logic IS 'Returns template variables with enhanced conditional logic and validation';
COMMENT ON FUNCTION increment_template_usage IS 'Increments template usage statistics for analytics';

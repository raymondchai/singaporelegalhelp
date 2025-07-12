// =====================================================
// Phase 6A: Enhanced Subscription Configuration
// Singapore Legal Help Platform - Monetization System
// =====================================================

export type SubscriptionTier = 'free' | 'basic_individual' | 'premium_individual' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentMethod = 'stripe' | 'nets' | 'paynow' | 'grabpay' | 'corporate_invoice';

// Subscription tier feature interface
export interface SubscriptionFeatures {
  // Core Limits
  articles_access: 'limited' | 'unlimited' | number;
  document_templates_per_month: number | 'unlimited';
  ai_queries_per_month: number | 'unlimited';
  document_storage_gb: number | 'unlimited';
  document_retention_months: number | 'unlimited';
  team_members_limit: number | 'unlimited';
  
  // Feature Flags
  team_collaboration: boolean;
  custom_templates: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  api_access: boolean;
  white_labeling: boolean;
  client_portal: boolean;
  compliance_reporting: boolean;
  custom_workflows: boolean;
  version_history: boolean;
  
  // Document Formats
  supported_formats: ('pdf' | 'docx' | 'txt')[];
  
  // Support Level
  support_level: 'community' | 'email' | 'priority_email' | 'phone' | 'dedicated';
  support_response_time: string;
}

// Pricing configuration
export interface PricingConfig {
  monthly_price_sgd: number;
  annual_price_sgd: number;
  annual_discount_percentage: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
  currency: 'SGD';
}

// Complete subscription tier configuration
export interface SubscriptionTierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  tagline: string;
  popular?: boolean;
  features: SubscriptionFeatures;
  pricing: PricingConfig;
  target_audience: string[];
  use_cases: string[];
}

// Enhanced subscription tiers configuration
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic legal assistance for individuals',
    tagline: 'Get started with essential legal tools',
    features: {
      articles_access: 'limited', // 10 articles per month
      document_templates_per_month: 3,
      ai_queries_per_month: 5,
      document_storage_gb: 1,
      document_retention_months: 1,
      team_members_limit: 1,
      team_collaboration: false,
      custom_templates: false,
      advanced_analytics: false,
      priority_support: false,
      api_access: false,
      white_labeling: false,
      client_portal: false,
      compliance_reporting: false,
      custom_workflows: false,
      version_history: false,
      supported_formats: ['pdf'],
      support_level: 'community',
      support_response_time: 'Best effort'
    },
    pricing: {
      monthly_price_sgd: 0,
      annual_price_sgd: 0,
      annual_discount_percentage: 0,
      currency: 'SGD'
    },
    target_audience: ['Individuals', 'Students', 'First-time users'],
    use_cases: ['Basic legal research', 'Simple document creation', 'Legal education']
  },

  basic_individual: {
    id: 'basic_individual',
    name: 'Basic Individual',
    description: 'Essential legal tools for individuals',
    tagline: 'Perfect for personal legal needs',
    features: {
      articles_access: 'unlimited',
      document_templates_per_month: 15,
      ai_queries_per_month: 50,
      document_storage_gb: 5,
      document_retention_months: 6,
      team_members_limit: 1,
      team_collaboration: false,
      custom_templates: false,
      advanced_analytics: false,
      priority_support: false,
      api_access: false,
      white_labeling: false,
      client_portal: false,
      compliance_reporting: false,
      custom_workflows: false,
      version_history: false,
      supported_formats: ['pdf', 'docx'],
      support_level: 'email',
      support_response_time: '48 hours'
    },
    pricing: {
      monthly_price_sgd: 29,
      annual_price_sgd: 290,
      annual_discount_percentage: 17,
      stripe_price_id_monthly: 'price_basic_individual_monthly_sgd',
      stripe_price_id_annual: 'price_basic_individual_annual_sgd',
      currency: 'SGD'
    },
    target_audience: ['Individuals', 'Freelancers', 'Small business owners'],
    use_cases: ['Personal legal matters', 'Contract review', 'Legal compliance']
  },

  premium_individual: {
    id: 'premium_individual',
    name: 'Premium Individual',
    description: 'Advanced legal assistance with team features',
    tagline: 'Enhanced features for power users',
    popular: true,
    features: {
      articles_access: 'unlimited',
      document_templates_per_month: 'unlimited',
      ai_queries_per_month: 200,
      document_storage_gb: 20,
      document_retention_months: 12,
      team_members_limit: 3,
      team_collaboration: true,
      custom_templates: false,
      advanced_analytics: false,
      priority_support: false,
      api_access: false,
      white_labeling: false,
      client_portal: false,
      compliance_reporting: false,
      custom_workflows: false,
      version_history: true,
      supported_formats: ['pdf', 'docx', 'txt'],
      support_level: 'priority_email',
      support_response_time: '24 hours'
    },
    pricing: {
      monthly_price_sgd: 79,
      annual_price_sgd: 790,
      annual_discount_percentage: 17,
      stripe_price_id_monthly: 'price_premium_individual_monthly_sgd',
      stripe_price_id_annual: 'price_premium_individual_annual_sgd',
      currency: 'SGD'
    },
    target_audience: ['Professionals', 'Small teams', 'Consultants'],
    use_cases: ['Team collaboration', 'Advanced document management', 'Regular legal work']
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Complete solution for legal professionals',
    tagline: 'Built for law firms and legal teams',
    features: {
      articles_access: 'unlimited',
      document_templates_per_month: 'unlimited',
      ai_queries_per_month: 'unlimited',
      document_storage_gb: 100,
      document_retention_months: 24,
      team_members_limit: 10,
      team_collaboration: true,
      custom_templates: true,
      advanced_analytics: false,
      priority_support: true,
      api_access: false,
      white_labeling: false,
      client_portal: true,
      compliance_reporting: true,
      custom_workflows: false,
      version_history: true,
      supported_formats: ['pdf', 'docx', 'txt'],
      support_level: 'phone',
      support_response_time: '4 hours'
    },
    pricing: {
      monthly_price_sgd: 199,
      annual_price_sgd: 1990,
      annual_discount_percentage: 17,
      stripe_price_id_monthly: 'price_professional_monthly_sgd',
      stripe_price_id_annual: 'price_professional_annual_sgd',
      currency: 'SGD'
    },
    target_audience: ['Law firms', 'Legal departments', 'Professional services'],
    use_cases: ['Client management', 'Professional document creation', 'Team workflows']
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-featured enterprise legal platform',
    tagline: 'Complete solution for large organizations',
    features: {
      articles_access: 'unlimited',
      document_templates_per_month: 'unlimited',
      ai_queries_per_month: 'unlimited',
      document_storage_gb: 'unlimited',
      document_retention_months: 'unlimited',
      team_members_limit: 'unlimited',
      team_collaboration: true,
      custom_templates: true,
      advanced_analytics: true,
      priority_support: true,
      api_access: true,
      white_labeling: true,
      client_portal: true,
      compliance_reporting: true,
      custom_workflows: true,
      version_history: true,
      supported_formats: ['pdf', 'docx', 'txt'],
      support_level: 'dedicated',
      support_response_time: '1 hour'
    },
    pricing: {
      monthly_price_sgd: 499,
      annual_price_sgd: 4990,
      annual_discount_percentage: 17,
      stripe_price_id_monthly: 'price_enterprise_monthly_sgd',
      stripe_price_id_annual: 'price_enterprise_annual_sgd',
      currency: 'SGD'
    },
    target_audience: ['Large corporations', 'Government agencies', 'Enterprise legal teams'],
    use_cases: ['Enterprise compliance', 'Custom integrations', 'White-label solutions']
  }
};

// Helper functions
export function getSubscriptionTier(tierId: SubscriptionTier): SubscriptionTierConfig {
  return SUBSCRIPTION_TIERS[tierId];
}

export function formatPrice(amount: number, currency: string = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateAnnualSavings(tier: SubscriptionTierConfig): number {
  const monthlyTotal = tier.pricing.monthly_price_sgd * 12;
  const annualPrice = tier.pricing.annual_price_sgd;
  return monthlyTotal - annualPrice;
}

export function getFeatureLimit(features: SubscriptionFeatures, featureKey: keyof SubscriptionFeatures): string {
  const value = features[featureKey];
  if (value === 'unlimited') return 'Unlimited';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

// Usage tracking types
export interface UsageData {
  document_generation: number;
  ai_query: number;
  storage_gb: number;
  team_member: number;
  api_call: number;
  template_access: number;
}

export interface UsageLimits {
  document_generation: number | 'unlimited';
  ai_query: number | 'unlimited';
  storage_gb: number | 'unlimited';
  team_member: number | 'unlimited';
  api_call: number | 'unlimited';
  template_access: number | 'unlimited';
}

/**
 * Enhanced Zod Validation Schemas for Singapore Legal Help Platform
 * Provides comprehensive validation for forms, API requests, and data structures
 * Fixed: Removed duplicates, enhanced admin features, consistent naming
 */

import { z } from 'zod';

// Singapore-specific validation patterns
export const SINGAPORE_PATTERNS = {
  NRIC: /^[STFG][0-9]{7}[A-Z]$/,
  UEN: /^[0-9]{8,10}[A-Z]$/,
  PHONE: /^[689][0-9]{7}$/,
  POSTAL_CODE: /^[0-9]{6}$/,
} as const;

// Common validation schemas
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(255, 'Email address too long');

export const phoneSchema = z.string()
  .transform(val => val.replace(/\D/g, ''))
  .refine(val => SINGAPORE_PATTERNS.PHONE.test(val), 'Please enter a valid 8-digit Singapore phone number');

export const nricSchema = z.string()
  .transform(val => val.toUpperCase().trim())
  .refine(val => SINGAPORE_PATTERNS.NRIC.test(val), 'Please enter a valid NRIC (e.g., S1234567A)');

export const uenSchema = z.string()
  .transform(val => val.toUpperCase().trim())
  .refine(val => SINGAPORE_PATTERNS.UEN.test(val), 'Please enter a valid UEN number');

export const postalCodeSchema = z.string()
  .regex(SINGAPORE_PATTERNS.POSTAL_CODE, 'Please enter a valid 6-digit postal code');

// Enhanced password schema with security requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
  .regex(/^(?=.*[!@#$%^&*])/, 'Password must contain at least one special character');

// Template Variable Schema
export const templateVariableSchema = z.object({
  id: z.string().uuid().optional(),
  variable_name: z.string()
    .min(1, 'Variable name is required')
    .max(50, 'Variable name too long')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Variable name must be valid identifier'),
  display_label: z.string().min(1, 'Display label is required').max(100, 'Display label too long'),
  variable_type: z.enum(['text', 'textarea', 'email', 'date', 'select', 'number', 'phone', 'nric', 'uen', 'currency']),
  category: z.enum(['personal', 'company', 'financial', 'legal']).default('personal'),
  is_required: z.boolean().default(false),
  default_value: z.string().optional(),
  validation_pattern: z.string().optional(),
  validation_message: z.string().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  select_options: z.array(z.string()).max(20, 'Too many options').optional(),
  singapore_validation: z.string().optional(),
  max_length: z.number().min(1).max(10000).optional(),
  min_length: z.number().min(0).optional(),
});

// Enhanced Template Schema
export const templateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Template title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  subcategory: z.string().max(50, 'Subcategory too long').optional(),
  subscription_tier: z.enum(['free', 'basic', 'basic_individual', 'premium', 'premium_individual', 'professional', 'enterprise']).default('free'),
  price_sgd: z.number().min(0, 'Price cannot be negative').max(10000, 'Price too high'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('easy'),
  estimated_time_minutes: z.number().min(1, 'Time must be at least 1 minute').max(480, 'Time too long'),
  file_type: z.string().max(10, 'File type too long').default('docx'),
  singapore_compliant: z.boolean().default(true),
  legal_review_required: z.boolean().default(true),
  status: z.enum(['draft', 'under_review', 'approved', 'published', 'archived']).default('draft'),
  created_by: z.string().uuid('Invalid user ID'),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
});

// Document Generation Schema
export const documentGenerationSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  formData: z.record(z.string(), z.any()),
  format: z.enum(['pdf', 'docx']).default('pdf'),
  userId: z.string().uuid('Invalid user ID').optional(),
});

// Multi-step Registration Schemas

// Step 1: Basic Account Information (base schema)
const registrationStep1BaseSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name too long'),
  user_type: z.enum(['individual', 'business', 'law_firm', 'corporate']).default('individual'),
});

// Step 1: With password confirmation validation
export const registrationStep1Schema = registrationStep1BaseSchema.refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// Step 2: Contact Information
export const registrationStep2Schema = z.object({
  phone_number: phoneSchema,
  address_street: z.string().min(5, 'Street address is required').max(200, 'Address too long'),
  address_unit: z.string().max(20, 'Unit number too long').optional(),
  address_postal_code: postalCodeSchema,
  address_country: z.string().default('Singapore'),
});

// Step 3: Singapore Identity Verification
export const registrationStep3Schema = z.object({
  singapore_nric: nricSchema.optional(),
  singapore_uen: uenSchema.optional(),
  date_of_birth: z.string().optional().refine(
    (val) => !val || new Date(val) < new Date(),
    'Date of birth must be in the past'
  ),
}).refine(
  (data) => data.singapore_nric || data.singapore_uen,
  {
    message: 'Either NRIC (for individuals) or UEN (for businesses) is required',
    path: ['singapore_nric'],
  }
);

// Step 4: Business Information (conditional)
export const registrationStep4Schema = z.object({
  company_name: z.string().min(2, 'Company name is required').max(200, 'Company name too long'),
  business_registration_number: z.string().max(50, 'Registration number too long').optional(),
  industry_sector: z.string().max(100, 'Industry sector too long').optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
});

// Step 5: Preferences & Compliance
export const registrationStep5Schema = z.object({
  practice_areas_interest: z.array(z.string()).max(10, 'Too many practice areas selected').optional(),
  notification_preferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).default({ email: true, sms: false, push: true }),
  language_preference: z.enum(['en', 'zh', 'ms', 'ta']).default('en'),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacy_policy_accepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  pdpa_consent: z.boolean().refine(val => val === true, 'PDPA consent is required'),
  marketing_consent: z.boolean().default(false),
});

// Complete Registration Schema (simplified to avoid ZodEffects merge issues)
export const completeRegistrationSchema = z.object({
  // Step 1: Basic Account Information
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name too long'),
  user_type: z.enum(['individual', 'business', 'law_firm', 'corporate']).default('individual'),

  // Step 2: Contact Information
  phone_number: phoneSchema,
  address_street: z.string().min(5, 'Street address is required').max(200, 'Address too long'),
  address_unit: z.string().max(20, 'Unit number too long').optional(),
  address_postal: z.string().regex(/^[0-9]{6}$/, 'Invalid Singapore postal code'),
  address_city: z.string().default('Singapore'),
  address_country: z.string().default('Singapore'),

  // Step 3: Singapore-specific fields (optional)
  singapore_nric: nricSchema.optional(),
  singapore_uen: uenSchema.optional(),

  // Step 5: PDPA Consent
  pdpa_consent: z.boolean().refine(val => val === true, 'PDPA consent is required'),
  marketing_consent: z.boolean().default(false),
  terms_accepted: z.boolean().refine(val => val === true, 'Terms and conditions must be accepted'),
  privacy_policy_accepted: z.boolean().refine(val => val === true, 'Privacy policy must be accepted'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// Legacy Registration Schema (for backward compatibility)
export const userRegistrationSchema = registrationStep1Schema;

// SINGLE User Profile Update Schema - NO DUPLICATES
export const userProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name too long').optional(),
  display_name: z.string().max(50, 'Display name too long').optional(),
  phone_number: phoneSchema.optional(),
  date_of_birth: z.string().optional(),
  address_street: z.string().max(200, 'Address too long').optional(),
  address_unit: z.string().max(20, 'Unit number too long').optional(),
  address_postal_code: postalCodeSchema.optional(),
  address_country: z.string().default('Singapore').optional(),
  company_name: z.string().max(200, 'Company name too long').optional(),
  business_registration_number: z.string().max(50, 'Registration number too long').optional(),
  industry_sector: z.string().max(100, 'Industry sector too long').optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  practice_areas_interest: z.array(z.string()).max(10, 'Too many practice areas selected').optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }).optional(),
  language_preference: z.enum(['en', 'zh', 'ms', 'ta']).optional(),
  singapore_nric: nricSchema.optional(),
  singapore_uen: uenSchema.optional(),
  user_type: z.enum(['individual', 'business', 'law_firm', 'corporate']).optional(),
});

// Admin and Subscription Schemas

// Admin User Schema
export const adminUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['super_admin', 'admin', 'support', 'analytics']),
  permissions: z.array(z.string()).max(20, 'Too many permissions'),
  granted_by: z.string().uuid('Invalid granted_by user ID'),
  expires_at: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
});

// Subscription Management Schema
export const subscriptionSchema = z.object({
  tier: z.enum(['free', 'basic', 'basic_individual', 'premium', 'premium_individual', 'professional', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'annual']).default('monthly'),
  promotional_code: z.string().max(50, 'Promo code too long').optional(),
  payment_method: z.enum(['stripe', 'nets', 'paynow', 'grabpay', 'corporate_invoice']).optional(),
});

// Usage Tracking Schema
export const usageTrackingSchema = z.object({
  resource_type: z.enum(['document_generation', 'ai_query', 'storage_gb', 'team_member', 'api_call', 'template_access']),
  quantity: z.number().min(1).default(1),
  resource_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Promotional Code Schema
export const promotionalCodeSchema = z.object({
  code: z.string().min(3, 'Code too short').max(20, 'Code too long').regex(/^[A-Z0-9]+$/, 'Code must be alphanumeric'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number().min(0.01, 'Discount must be positive').max(10000, 'Discount too large'),
  max_uses: z.number().min(1).optional(),
  max_uses_per_user: z.number().min(1).default(1),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  applicable_tiers: z.array(z.enum(['basic_individual', 'premium_individual', 'professional', 'enterprise'])).optional(),
  minimum_amount_sgd: z.number().min(0).default(0),
});

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  phone_number: phoneSchema.optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  inquiry_type: z.enum(['general', 'technical', 'billing', 'legal', 'partnership']).default('general'),
  company_name: z.string().max(200, 'Company name too long').optional(),
});

// Search Schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  category: z.string().max(50, 'Category too long').optional(),
  content_type: z.enum(['all', 'articles', 'qa', 'templates']).default('all'),
  subscription_tier: z.enum(['all', 'free', 'basic', 'premium', 'enterprise']).default('all'),
  difficulty_level: z.enum(['all', 'easy', 'medium', 'hard']).default('all'),
  price_range: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Chat Message Schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
  context: z.string().max(1000, 'Context too long').optional(),
  session_id: z.string().uuid().optional(),
});

// API Response Schema Generator
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
      status: z.number().optional(),
      details: z.record(z.string(), z.any()).optional(),
      timestamp: z.string().datetime().optional(),
    }).optional(),
    message: z.string().optional(),
    pagination: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      hasMore: z.boolean(),
    }).optional(),
  });

// Template Variable Form Data Schema Generator
export const createTemplateVariableFormSchema = (variables: TemplateVariable[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  variables.forEach(variable => {
    let fieldSchema: z.ZodTypeAny = z.string();

    // Apply type-specific validation
    switch (variable.variable_type) {
      case 'email':
        fieldSchema = emailSchema;
        break;
      case 'phone':
        fieldSchema = phoneSchema;
        break;
      case 'nric':
        fieldSchema = nricSchema;
        break;
      case 'uen':
        fieldSchema = uenSchema;
        break;
      case 'number':
        fieldSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Please enter a valid number');
        break;
      case 'currency':
        fieldSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid amount');
        break;
      case 'date':
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date');
        break;
      case 'select':
        if (variable.select_options && variable.select_options.length > 0) {
          fieldSchema = z.enum(variable.select_options as [string, ...string[]]);
        }
        break;
      case 'textarea':
        fieldSchema = z.string().max(2000, 'Text too long');
        break;
      default:
        fieldSchema = z.string();
    }

    // Apply length constraints for string types
    if (variable.min_length && 'min' in fieldSchema) {
      fieldSchema = (fieldSchema as any).min(variable.min_length, `Minimum ${variable.min_length} characters`);
    }
    if (variable.max_length && 'max' in fieldSchema) {
      fieldSchema = (fieldSchema as any).max(variable.max_length, `Maximum ${variable.max_length} characters`);
    }

    // Apply custom validation pattern
    if (variable.validation_pattern) {
      try {
        const regex = new RegExp(variable.validation_pattern);
        fieldSchema = z.string().regex(regex, variable.validation_message || `Invalid format for ${variable.display_label}`);
      } catch (error) {
        console.warn('Invalid regex pattern:', variable.validation_pattern);
      }
    }

    // Make field optional if not required
    if (!variable.is_required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[variable.variable_name] = fieldSchema;
  });

  return z.object(schemaObject);
};

// Export TypeScript types
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type Template = z.infer<typeof templateSchema>;
export type DocumentGeneration = z.infer<typeof documentGenerationSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type UsageTracking = z.infer<typeof usageTrackingSchema>;
export type PromotionalCode = z.infer<typeof promotionalCodeSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Validation helper functions
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}

// Singapore validation helper functions
export const singaporeValidationHelpers = {
  validateNRIC: (nric: string): boolean => SINGAPORE_PATTERNS.NRIC.test(nric.toUpperCase()),
  validateUEN: (uen: string): boolean => SINGAPORE_PATTERNS.UEN.test(uen.toUpperCase()),
  validatePhone: (phone: string): boolean => SINGAPORE_PATTERNS.PHONE.test(phone.replace(/\D/g, '')),
  validatePostalCode: (postal: string): boolean => SINGAPORE_PATTERNS.POSTAL_CODE.test(postal),
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 8 ? `+65 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}` : phone;
  },
};
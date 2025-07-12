import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get admin user ID - using raymond.chai@8atoms.com as the admin user
const ADMIN_USER_ID = '0f713749-080a-4e4f-bab3-07bf10a6e348';

const sampleTemplates = [
  {
    title: 'Employment Contract Template',
    description: 'Comprehensive employment contract template compliant with Singapore Employment Act. Includes salary, benefits, termination clauses, and confidentiality agreements.',
    category: 'Employment Law',
    subcategory: 'Employment Contracts',
    file_name: 'employment-contract-template.docx',
    file_path: 'templates/employment/employment-contract-template.docx',
    file_size: 45000,
    file_type: 'docx',
    subscription_tier: 'basic',
    price_sgd: 25.00,
    difficulty_level: 'intermediate',
    estimated_time_minutes: 20,
    singapore_compliant: true,
    legal_review_required: true,
    status: 'published',
    created_by: ADMIN_USER_ID
  },
  {
    title: 'Tenancy Agreement (HDB)',
    description: 'Standard tenancy agreement for HDB flats in Singapore. Covers rental terms, deposit, utilities, and tenant obligations under HDB regulations.',
    category: 'Property Law',
    subcategory: 'Rental Agreements',
    file_name: 'hdb-tenancy-agreement.docx',
    file_path: 'templates/property/hdb-tenancy-agreement.docx',
    file_size: 38000,
    file_type: 'docx',
    subscription_tier: 'free',
    price_sgd: 0,
    difficulty_level: 'basic',
    estimated_time_minutes: 15,
    singapore_compliant: true,
    legal_review_required: false,
    status: 'published',
    created_by: ADMIN_USER_ID
  },
  {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Mutual non-disclosure agreement for business discussions and partnerships. Protects confidential information and trade secrets.',
    category: 'Corporate Law',
    subcategory: 'Business Agreements',
    file_name: 'mutual-nda-template.docx',
    file_path: 'templates/corporate/mutual-nda-template.docx',
    file_size: 32000,
    file_type: 'docx',
    subscription_tier: 'free',
    price_sgd: 0,
    difficulty_level: 'basic',
    estimated_time_minutes: 10,
    singapore_compliant: true,
    legal_review_required: false,
    status: 'published',
    created_by: ADMIN_USER_ID
  },
  {
    title: 'Service Agreement Template',
    description: 'Professional service agreement template for consultants and service providers. Includes scope of work, payment terms, and liability clauses.',
    category: 'Contract Law',
    subcategory: 'Service Contracts',
    file_name: 'service-agreement-template.docx',
    file_path: 'templates/contracts/service-agreement-template.docx',
    file_size: 42000,
    file_type: 'docx',
    subscription_tier: 'basic',
    price_sgd: 30.00,
    difficulty_level: 'intermediate',
    estimated_time_minutes: 25,
    singapore_compliant: true,
    legal_review_required: true,
    status: 'published',
    created_by: ADMIN_USER_ID
  },
  {
    title: 'Will and Testament Template',
    description: 'Last will and testament template for Singapore residents. Includes asset distribution, executor appointment, and guardianship provisions.',
    category: 'Family Law',
    subcategory: 'Estate Planning',
    file_name: 'will-testament-template.docx',
    file_path: 'templates/family/will-testament-template.docx',
    file_size: 35000,
    file_type: 'docx',
    subscription_tier: 'premium',
    price_sgd: 50.00,
    difficulty_level: 'advanced',
    estimated_time_minutes: 45,
    singapore_compliant: true,
    legal_review_required: true,
    status: 'published',
    created_by: ADMIN_USER_ID
  },
  {
    title: 'Power of Attorney Form',
    description: 'General power of attorney form for financial and legal matters. Allows appointed person to act on behalf of the principal.',
    category: 'Family Law',
    subcategory: 'Legal Documents',
    file_name: 'power-of-attorney-form.docx',
    file_path: 'templates/family/power-of-attorney-form.docx',
    file_size: 28000,
    file_type: 'docx',
    subscription_tier: 'basic',
    price_sgd: 20.00,
    difficulty_level: 'intermediate',
    estimated_time_minutes: 20,
    singapore_compliant: true,
    legal_review_required: true,
    status: 'published',
    created_by: ADMIN_USER_ID
  }
];

const sampleVariables = [
  // Personal Information Variables
  {
    variable_name: 'full_name',
    display_label: 'Full Name',
    variable_type: 'text',
    is_required: true,
    category: 'personal',
    singapore_validation: false,
    validation_pattern: '^[A-Za-z\\s]+$',
    validation_message: 'Please enter a valid full name',
    description: 'Enter your full legal name as per NRIC'
  },
  {
    variable_name: 'nric_number',
    display_label: 'NRIC Number',
    variable_type: 'text',
    is_required: true,
    category: 'personal',
    singapore_validation: true,
    validation_pattern: '^[STFG][0-9]{7}[A-Z]$',
    validation_message: 'Please enter a valid Singapore NRIC (e.g., S1234567A)',
    description: 'Enter NRIC in format S1234567A'
  },
  {
    variable_name: 'email_address',
    display_label: 'Email Address',
    variable_type: 'email',
    is_required: true,
    category: 'personal',
    singapore_validation: false,
    description: 'Enter a valid email address'
  },
  {
    variable_name: 'phone_number',
    display_label: 'Phone Number',
    variable_type: 'phone',
    is_required: true,
    category: 'personal',
    singapore_validation: true,
    validation_pattern: '^[689][0-9]{7}$',
    validation_message: 'Please enter a valid 8-digit Singapore phone number',
    description: 'Enter 8-digit Singapore phone number'
  },
  {
    variable_name: 'address',
    display_label: 'Address',
    variable_type: 'textarea',
    is_required: true,
    category: 'personal',
    singapore_validation: false,
    description: 'Enter your full residential address'
  },
  {
    variable_name: 'date_of_birth',
    display_label: 'Date of Birth',
    variable_type: 'date',
    is_required: false,
    category: 'personal',
    singapore_validation: false,
    description: 'Select your date of birth'
  },

  // Company Information Variables
  {
    variable_name: 'company_name',
    display_label: 'Company Name',
    variable_type: 'text',
    is_required: false,
    category: 'company',
    singapore_validation: false,
    validation_pattern: '^[A-Za-z0-9\\s&.,()-]+$',
    validation_message: 'Please enter a valid company name',
    description: 'Enter registered company name'
  },
  {
    variable_name: 'uen_number',
    display_label: 'UEN Number',
    variable_type: 'text',
    is_required: false,
    category: 'company',
    singapore_validation: true,
    validation_pattern: '^[0-9]{8}[A-Z]$|^[0-9]{9}[A-Z]$|^[0-9]{10}[A-Z]$',
    validation_message: 'Please enter a valid Singapore UEN number',
    description: 'Enter UEN number (e.g., 201234567A)'
  },
  {
    variable_name: 'company_address',
    display_label: 'Company Address',
    variable_type: 'textarea',
    is_required: false,
    category: 'company',
    singapore_validation: false,
    description: 'Enter registered company address'
  },

  // Contract Terms Variables
  {
    variable_name: 'contract_date',
    display_label: 'Contract Date',
    variable_type: 'date',
    is_required: true,
    category: 'financial',
    singapore_validation: false,
    description: 'Select the contract effective date'
  },
  {
    variable_name: 'contract_value',
    display_label: 'Contract Value (SGD)',
    variable_type: 'number',
    is_required: false,
    category: 'financial',
    singapore_validation: false,
    validation_pattern: '^[0-9]+(\\.[0-9]{1,2})?$',
    validation_message: 'Please enter a valid amount in SGD',
    description: 'Enter contract value in Singapore Dollars'
  },
  {
    variable_name: 'payment_terms',
    display_label: 'Payment Terms',
    variable_type: 'select',
    is_required: false,
    category: 'financial',
    singapore_validation: false,
    select_options: ["Net 30 days", "Net 15 days", "Upon completion", "Monthly", "Quarterly"],
    description: 'Select payment terms'
  },

  // Legal Terms Variables
  {
    variable_name: 'governing_law',
    display_label: 'Governing Law',
    variable_type: 'select',
    is_required: true,
    category: 'legal',
    singapore_validation: false,
    select_options: ["Singapore", "Malaysia", "Other"],
    description: 'Select governing law jurisdiction'
  },
  {
    variable_name: 'dispute_resolution',
    display_label: 'Dispute Resolution',
    variable_type: 'select',
    is_required: false,
    category: 'legal',
    singapore_validation: true,
    select_options: ["Singapore Courts", "Arbitration", "Mediation"],
    description: 'Select dispute resolution method'
  }
];

// POST - Seed sample templates and variables
export async function POST(request: NextRequest) {
  try {
    const results = {
      templates: { created: 0, errors: [] as string[] },
      variables: { created: 0, errors: [] as string[] },
      template_content: { created: 0, errors: [] as string[] }
    };

    // Clear existing sample data first to avoid duplicates
    console.log('Clearing existing sample data...');

    // Delete existing template content
    await supabaseAdmin
      .from('template_content')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Delete existing templates
    await supabaseAdmin
      .from('legal_document_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    // Delete existing variables
    await supabaseAdmin
      .from('template_variables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    console.log('Existing data cleared successfully');

    // Insert sample templates
    for (const template of sampleTemplates) {
      try {
        const { data: insertedTemplate, error } = await supabaseAdmin
          .from('legal_document_templates')
          .insert(template)
          .select('id')
          .single();

        if (error) {
          results.templates.errors.push(`Template "${template.title}": ${error.message}`);
        } else {
          results.templates.created++;
          
          // Create template content record
          await supabaseAdmin
            .from('template_content')
            .insert({
              template_id: insertedTemplate.id,
              processing_status: 'completed'
            });
          results.template_content.created++;
        }
      } catch (error) {
        results.templates.errors.push(`Template "${template.title}": ${error}`);
      }
    }

    // Insert sample variables
    for (const variable of sampleVariables) {
      try {
        const { error } = await supabaseAdmin
          .from('template_variables')
          .insert(variable);

        if (error) {
          results.variables.errors.push(`Variable "${variable.variable_name}": ${error.message}`);
        } else {
          results.variables.created++;
        }
      } catch (error) {
        results.variables.errors.push(`Variable "${variable.variable_name}": ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data seeded successfully',
      results
    });

  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      { error: 'Failed to seed sample data' },
      { status: 500 }
    );
  }
}

// GET - Check if sample data exists
export async function GET(request: NextRequest) {
  try {
    const { data: templates } = await supabaseAdmin
      .from('legal_document_templates')
      .select('id, title')
      .limit(10);

    const { data: variables } = await supabaseAdmin
      .from('template_variables')
      .select('id, variable_name')
      .limit(10);

    return NextResponse.json({
      templates_count: templates?.length || 0,
      variables_count: variables?.length || 0,
      templates: templates || [],
      variables: variables || []
    });

  } catch (error) {
    console.error('Check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check sample data' },
      { status: 500 }
    );
  }
}

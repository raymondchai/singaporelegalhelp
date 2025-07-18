// Centralized Law Areas Configuration for Singapore Legal Help Platform
// Complete mapping of all existing law areas with their specifications

import { 
  Heart, 
  Scale, 
  Home, 
  Users, 
  Building, 
  Lightbulb, 
  Plane, 
  Calculator,
  Shield,
  FileText,
  Briefcase,
  Globe
} from 'lucide-react'

export interface LawAreaConfig {
  categoryId: string
  categoryName: string
  categorySlug: string
  description: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
  href: string
  importEndpoint: string
  hasExistingContent: boolean
  specializedFields: {
    articles: Array<{
      name: string
      type: 'text' | 'select' | 'checkbox' | 'textarea'
      label: string
      options?: string[]
      required?: boolean
      helpText?: string
    }>
    qas: Array<{
      name: string
      type: 'text' | 'select' | 'checkbox' | 'textarea'
      label: string
      options?: string[]
      required?: boolean
      helpText?: string
    }>
  }
}

export const LAW_AREAS_CONFIG: Record<string, LawAreaConfig> = {
  'family-law': {
    categoryId: '8ec7d509-45be-4416-94bc-4e58dd6bc7cc',
    categoryName: 'Family Law',
    categorySlug: 'family-law',
    description: 'Divorce, custody, matrimonial matters',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    href: '/admin/content/family-law',
    importEndpoint: '/api/admin/import-enhanced-family-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'family_law_area',
          type: 'select',
          label: 'Family Law Area',
          options: ['Divorce', 'Child Custody', 'Matrimonial Assets', 'Maintenance', 'Family Violence', 'Adoption', 'Marriage', 'General'],
          required: true
        },
        {
          name: 'singapore_family_court_compliance',
          type: 'checkbox',
          label: 'Family Court Compliant',
          required: true
        },
        {
          name: 'includes_2024_updates',
          type: 'checkbox',
          label: 'Includes 2024 Updates'
        },
        {
          name: 'covers_dma_provisions',
          type: 'checkbox',
          label: 'Covers DMA Provisions'
        },
        {
          name: 'parenting_guidance_included',
          type: 'checkbox',
          label: 'Parenting Guidance'
        }
      ],
      qas: [
        {
          name: 'family_category',
          type: 'select',
          label: 'Family Category',
          options: ['Divorce & Separation', 'Child Custody', 'Matrimonial Assets', 'Maintenance', 'Family Violence', 'Adoption', 'Marriage', 'General'],
          required: true
        },
        {
          name: 'urgency_level',
          type: 'select',
          label: 'Urgency Level',
          options: ['Low', 'Medium', 'High', 'Emergency'],
          required: true
        },
        {
          name: 'includes_practical_guidance',
          type: 'checkbox',
          label: 'Practical Guidance'
        },
        {
          name: 'singapore_specific',
          type: 'checkbox',
          label: 'Singapore Specific'
        }
      ]
    }
  },

  'criminal-law': {
    categoryId: '0047f44c-0869-432e-9b25-a20dbabe53fb',
    categoryName: 'Criminal Law',
    categorySlug: 'criminal-law',
    description: 'Criminal charges, defense, legal procedures',
    icon: Scale,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    href: '/admin/content/criminal-law',
    importEndpoint: '/api/admin/import-criminal-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'criminal_case_type',
          type: 'select',
          label: 'Criminal Case Type',
          options: ['General', 'White Collar', 'Violent Crime', 'Drug Offences', 'Traffic Offences', 'Regulatory'],
          required: true
        },
        {
          name: 'severity_level',
          type: 'select',
          label: 'Severity Level',
          options: ['Summary', 'District Court', 'High Court', 'Court of Appeal'],
          required: true
        },
        {
          name: 'legal_complexity',
          type: 'select',
          label: 'Legal Complexity',
          options: ['Basic rights', 'Procedural', 'Advanced defense', 'Appeals'],
          required: true
        },
        {
          name: 'singapore_cpc_compliance',
          type: 'checkbox',
          label: 'Singapore CPC Compliant'
        },
        {
          name: 'legal_disclaimer_included',
          type: 'checkbox',
          label: 'Legal Disclaimer Included'
        }
      ],
      qas: [
        {
          name: 'criminal_category',
          type: 'select',
          label: 'Criminal Category',
          options: ['Arrest & Rights', 'Court Procedures', 'Bail & Remand', 'Sentencing', 'Appeals', 'General'],
          required: true
        },
        {
          name: 'urgency_level',
          type: 'select',
          label: 'Urgency Level',
          options: ['Low', 'Medium', 'High', 'Emergency'],
          required: true
        },
        {
          name: 'procedural_guidance',
          type: 'checkbox',
          label: 'Procedural Guidance'
        }
      ]
    }
  },

  'property-law': {
    categoryId: '4e8ce92f-a63c-4719-9d73-2f28966c45be',
    categoryName: 'Property Law',
    categorySlug: 'property-law',
    description: 'Real estate, leases, property transactions',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    href: '/admin/content/property-law',
    importEndpoint: '/api/admin/import-property-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'property_type',
          type: 'select',
          label: 'Property Type',
          options: ['HDB', 'Private Residential', 'Commercial', 'Industrial', 'Mixed Development', 'General'],
          required: true
        },
        {
          name: 'transaction_type',
          type: 'select',
          label: 'Transaction Type',
          options: ['Purchase', 'Sale', 'Rental', 'Development', 'Investment', 'General'],
          required: true
        },
        {
          name: 'includes_ura_guidelines',
          type: 'checkbox',
          label: 'Includes URA Guidelines'
        },
        {
          name: 'covers_foreign_ownership',
          type: 'checkbox',
          label: 'Covers Foreign Ownership'
        },
        {
          name: 'stamp_duty_guidance',
          type: 'checkbox',
          label: 'Stamp Duty Guidance'
        }
      ],
      qas: [
        {
          name: 'property_category',
          type: 'select',
          label: 'Property Category',
          options: ['HDB Matters', 'Private Property', 'Commercial Property', 'Landlord-Tenant', 'Property Investment', 'General'],
          required: true
        },
        {
          name: 'complexity_level',
          type: 'select',
          label: 'Complexity Level',
          options: ['Basic', 'Intermediate', 'Advanced', 'Expert'],
          required: true
        },
        {
          name: 'includes_cost_estimates',
          type: 'checkbox',
          label: 'Includes Cost Estimates'
        }
      ]
    }
  },

  'employment-law': {
    categoryId: '9e1378f4-c4c9-4296-b8a4-508699f63a88',
    categoryName: 'Employment Law',
    categorySlug: 'employment-law',
    description: 'Employment contracts, workplace rights, disputes',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    href: '/admin/content/employment-law',
    importEndpoint: '/api/admin/import-employment-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'employment_area',
          type: 'select',
          label: 'Employment Area',
          options: ['Employment Rights', 'Termination', 'Workplace Safety', 'Discrimination', 'Foreign Workers', 'CPF Matters', 'General'],
          required: true
        },
        {
          name: 'mom_compliance',
          type: 'checkbox',
          label: 'MOM Compliance'
        },
        {
          name: 'includes_employment_act',
          type: 'checkbox',
          label: 'Includes Employment Act'
        },
        {
          name: 'cpf_guidance_included',
          type: 'checkbox',
          label: 'CPF Guidance Included'
        }
      ],
      qas: [
        {
          name: 'employment_category',
          type: 'select',
          label: 'Employment Category',
          options: ['Employee Rights', 'Employer Obligations', 'Workplace Disputes', 'Termination', 'Foreign Workers', 'General'],
          required: true
        },
        {
          name: 'urgency_level',
          type: 'select',
          label: 'Urgency Level',
          options: ['Low', 'Medium', 'High', 'Urgent'],
          required: true
        }
      ]
    }
  },

  'contract-law': {
    categoryId: '098b68ea-a042-4245-bd3b-5562c166edb6',
    categoryName: 'Contract Law',
    categorySlug: 'contract-law',
    description: 'Business contracts and agreements',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    href: '/admin/content/contract-law',
    importEndpoint: '/api/admin/import-contract-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'contract_type',
          type: 'select',
          label: 'Contract Type',
          options: ['Business Contracts', 'Service Agreements', 'Employment Contracts', 'Sale Agreements', 'Partnership', 'General'],
          required: true
        },
        {
          name: 'singapore_law_compliance',
          type: 'checkbox',
          label: 'Singapore Law Compliant'
        },
        {
          name: 'includes_templates',
          type: 'checkbox',
          label: 'Includes Templates'
        }
      ],
      qas: [
        {
          name: 'contract_category',
          type: 'select',
          label: 'Contract Category',
          options: ['Formation', 'Performance', 'Breach', 'Remedies', 'Termination', 'General'],
          required: true
        }
      ]
    }
  },

  'intellectual-property': {
    categoryId: '64f9abe4-f1c2-4eb6-9d11-6f107ab9def1',
    categoryName: 'Intellectual Property',
    categorySlug: 'intellectual-property',
    description: 'Trademarks, patents, copyright protection',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    href: '/admin/content/intellectual-property',
    importEndpoint: '/api/admin/import-ip-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'ip_type',
          type: 'select',
          label: 'IP Type',
          options: ['Patent', 'Trademark', 'Copyright', 'Trade Secret', 'General'],
          required: true
        },
        {
          name: 'includes_ipos',
          type: 'checkbox',
          label: 'Includes IPOS Procedures'
        },
        {
          name: 'international_scope',
          type: 'checkbox',
          label: 'International Scope'
        },
        {
          name: 'business_focus',
          type: 'select',
          label: 'Business Focus',
          options: ['Startup', 'SME', 'Enterprise', 'Individual', 'General'],
          required: true
        }
      ],
      qas: [
        {
          name: 'ip_category',
          type: 'select',
          label: 'IP Category',
          options: ['Patents', 'Trademarks', 'Copyright', 'Trade Secrets', 'Enforcement', 'General'],
          required: true
        }
      ]
    }
  },

  'immigration-law': {
    categoryId: '57559a93-bb72-4833-8ad5-75e1dbc2e275',
    categoryName: 'Immigration Law',
    categorySlug: 'immigration-law',
    description: 'Work permits, PR applications, citizenship',
    icon: Plane,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    href: '/admin/content/immigration-law',
    importEndpoint: '/api/admin/import-immigration-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'immigration_type',
          type: 'select',
          label: 'Immigration Type',
          options: ['Work Passes', 'Permanent Residence', 'Citizenship', 'Student Passes', 'Dependent Passes', 'General'],
          required: true
        },
        {
          name: 'ica_compliance',
          type: 'checkbox',
          label: 'ICA Compliance'
        },
        {
          name: 'mom_requirements',
          type: 'checkbox',
          label: 'MOM Requirements'
        }
      ],
      qas: [
        {
          name: 'immigration_category',
          type: 'select',
          label: 'Immigration Category',
          options: ['Work Permits', 'PR Applications', 'Citizenship', 'Student Matters', 'Family Reunification', 'General'],
          required: true
        }
      ]
    }
  },

  'personal-injury': {
    categoryId: '61463ecd-fdf9-4b76-84ab-d0824ee2144f',
    categoryName: 'Personal Injury',
    categorySlug: 'personal-injury',
    description: 'Personal injury claims and compensation',
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    href: '/admin/content/personal-injury',
    importEndpoint: '/api/admin/import-personal-injury-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'injury_type',
          type: 'select',
          label: 'Injury Type',
          options: ['Medical', 'Motor Vehicle', 'Workplace', 'General', 'International'],
          required: true
        },
        {
          name: 'severity_level',
          type: 'select',
          label: 'Severity Level',
          options: ['Minor', 'Moderate', 'Severe', 'Catastrophic'],
          required: true
        },
        {
          name: 'compensation_range',
          type: 'text',
          label: 'Compensation Range',
          helpText: 'e.g., $5,000 - $50,000'
        },
        {
          name: 'medical_terminology_verified',
          type: 'checkbox',
          label: 'Medical Terminology Verified'
        },
        {
          name: 'insurance_compliance_checked',
          type: 'checkbox',
          label: 'Insurance Compliance Checked'
        }
      ],
      qas: [
        {
          name: 'injury_category',
          type: 'select',
          label: 'Injury Category',
          options: ['Medical Negligence', 'Motor Accidents', 'Workplace Injuries', 'General PI', 'Legal Process'],
          required: true
        },
        {
          name: 'urgency_level',
          type: 'select',
          label: 'Urgency Level',
          options: ['Low', 'Medium', 'High', 'Emergency'],
          required: true
        }
      ]
    }
  },

  'debt-bankruptcy': {
    categoryId: '8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d',
    categoryName: 'Debt & Bankruptcy',
    categorySlug: 'debt-bankruptcy',
    description: 'Debt recovery, bankruptcy proceedings',
    icon: Calculator,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    href: '/admin/content/debt-bankruptcy',
    importEndpoint: '/api/admin/import-debt-bankruptcy-law',
    hasExistingContent: true,
    specializedFields: {
      articles: [
        {
          name: 'debt_type',
          type: 'select',
          label: 'Debt Type',
          options: ['Personal Debt', 'Business Debt', 'Secured Debt', 'Unsecured Debt', 'General'],
          required: true
        },
        {
          name: 'bankruptcy_stage',
          type: 'select',
          label: 'Bankruptcy Stage',
          options: ['Pre-bankruptcy', 'Filing', 'Administration', 'Discharge', 'General'],
          required: true
        },
        {
          name: 'includes_court_procedures',
          type: 'checkbox',
          label: 'Includes Court Procedures'
        }
      ],
      qas: [
        {
          name: 'debt_category',
          type: 'select',
          label: 'Debt Category',
          options: ['Debt Recovery', 'Bankruptcy Process', 'Creditor Rights', 'Debtor Protection', 'General'],
          required: true
        }
      ]
    }
  }
}

export const getAllLawAreas = () => Object.values(LAW_AREAS_CONFIG)
export const getLawAreaBySlug = (slug: string) => LAW_AREAS_CONFIG[slug]
export const getLawAreaById = (id: string) => Object.values(LAW_AREAS_CONFIG).find(area => area.categoryId === id)

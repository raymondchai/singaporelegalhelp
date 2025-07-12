// Personal Injury Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 61463ecd-fdf9-4b76-84ab-d0824ee2144f

// DATABASE CONFIGURATION
export const personalInjuryLawDatabaseConfig = {
  categoryId: "61463ecd-fdf9-4b76-84ab-d0824ee2144f",
  categoryName: "Personal Injury",
  categorySlug: "personal-injury",
  
  tables: {
    articles: "legal_articles",
    qas: "legal_qa",
    categories: "legal_categories"
  },
  
  requiredFields: {
    articles: [
      "id", "category_id", "title", "slug", "summary", "content",
      "content_type", "difficulty_level", "tags", "reading_time_minutes",
      "is_featured", "is_published", "author_name", "seo_title",
      "seo_description", "view_count", "created_at", "updated_at"
    ],
    qas: [
      "id", "category_id", "user_id", "question", "answer", "ai_response",
      "tags", "difficulty_level", "is_featured", "is_public", "status",
      "helpful_votes", "view_count", "created_at", "updated_at"
    ]
  }
};

// CURRENT CONTENT STATUS
export const personalInjuryCurrentStatus = {
  existing: {
    articles: {
      count: 3,
      titles: [
        "Personal Injury Claims in Singapore: Complete Guide",
        "Motor Vehicle Accident Claims in Singapore", 
        "Medical Negligence Claims in Singapore"
      ]
    },
    qas: {
      count: 3,
      questions: [
        "How long do I have to file a personal injury claim in Singapore?",
        "What compensation can I claim for a motor vehicle accident?",
        "Do I need a lawyer for my personal injury claim?"
      ]
    }
  },
  target: {
    articles: 8,
    qas: 20
  },
  needed: {
    articles: 5,
    qas: 17
  }
};

// CONTENT ARCHITECTURE PLAN - 5 ADDITIONAL ARTICLES
export const personalInjuryArticlePlan = [
  {
    id: 4,
    title: "Medical Negligence Claims in Singapore: Patient Rights & Remedies",
    slug: "medical-negligence-patient-rights-remedies",
    summary: "Comprehensive guide to medical malpractice claims, hospital negligence, and patient compensation rights in Singapore",
    focus: "Medical malpractice, hospital negligence, patient compensation rights",
    keywords: ["medical negligence Singapore", "malpractice claims", "patient rights", "hospital negligence", "medical compensation"],
    targetLength: "2500+ words",
    difficulty: "advanced",
    sections: [
      "Types of medical negligence in Singapore",
      "Legal standards for medical care",
      "Proving medical negligence",
      "Compensation calculation methods",
      "Hospital vs private practice claims",
      "Medical tribunal procedures"
    ],
    tags: ["medical negligence", "patient rights", "hospital claims", "medical malpractice", "healthcare law"]
  },
  {
    id: 5,
    title: "Motor Vehicle Accident Claims: Insurance & Compensation Guide",
    slug: "motor-vehicle-accident-insurance-compensation",
    summary: "Complete guide to traffic accident claims, insurance procedures, third-party liability, and compensation in Singapore",
    focus: "Traffic accidents, insurance claims, third-party liability, compensation",
    keywords: ["car accident claims Singapore", "motor insurance", "traffic accident compensation", "third party claims", "vehicle accident"],
    targetLength: "2500+ words",
    difficulty: "intermediate",
    sections: [
      "Immediate accident procedures",
      "Insurance claim processes",
      "Fault determination methods",
      "Compensation calculation",
      "Third-party liability rules",
      "Uninsured driver scenarios"
    ],
    tags: ["motor accidents", "car insurance", "traffic claims", "vehicle compensation", "accident procedures"]
  },
  {
    id: 6,
    title: "Workplace Injury Claims: Employee Rights & Workers' Compensation",
    slug: "workplace-injury-employee-rights-compensation",
    summary: "Essential guide to work-related injury claims, employer liability, MOM procedures, and workers' compensation in Singapore",
    focus: "Work-related injuries, employer liability, MOM procedures, compensation",
    keywords: ["workplace injury Singapore", "workers compensation", "employer liability", "work injury claims", "MOM procedures"],
    targetLength: "2500+ words",
    difficulty: "intermediate",
    sections: [
      "Work Injury Compensation Act coverage",
      "Employer duties and liability",
      "MOM claim procedures",
      "Common law vs statutory claims",
      "Compensation calculation methods",
      "Return to work considerations"
    ],
    tags: ["workplace injury", "workers compensation", "employer liability", "MOM claims", "work safety"]
  },
  {
    id: 7,
    title: "Personal Injury Litigation: Court Procedures & Damage Assessment",
    slug: "personal-injury-litigation-court-procedures",
    summary: "Comprehensive guide to personal injury court procedures, litigation process, damage calculations, and legal representation in Singapore",
    focus: "Court procedures, litigation process, damage calculations, legal representation",
    keywords: ["personal injury lawsuit Singapore", "damage assessment", "litigation process", "court procedures", "injury compensation"],
    targetLength: "2500+ words",
    difficulty: "advanced",
    sections: [
      "Pre-litigation procedures",
      "Court filing requirements",
      "Evidence collection and presentation",
      "Damage assessment methodologies",
      "Settlement negotiations",
      "Trial procedures and outcomes"
    ],
    tags: ["personal injury litigation", "court procedures", "damage assessment", "legal proceedings", "injury lawsuits"]
  },
  {
    id: 8,
    title: "International Personal Injury: Cross-Border Claims & Jurisdiction",
    slug: "international-personal-injury-cross-border-claims",
    summary: "Specialized guide to international personal injury claims, tourist accidents, expat injuries, and cross-border jurisdiction issues in Singapore",
    focus: "Tourist injuries, expat accidents, international jurisdiction, insurance coverage",
    keywords: ["international injury claims", "tourist accident Singapore", "cross-border compensation", "expat injury claims", "international jurisdiction"],
    targetLength: "2500+ words",
    difficulty: "advanced",
    sections: [
      "Jurisdiction determination",
      "International insurance coverage",
      "Tourist and visitor claims",
      "Expat injury procedures",
      "Cross-border enforcement",
      "Diplomatic considerations"
    ],
    tags: ["international claims", "tourist accidents", "expat injuries", "cross-border law", "international jurisdiction"]
  }
];

// Q&A FRAMEWORK DESIGN - 17 ADDITIONAL Q&AS
export const personalInjuryQAPlan = {
  medicalNegligence: [
    {
      question: "How do I prove medical negligence in Singapore?",
      difficulty: "advanced",
      tags: ["medical negligence", "proof", "legal standards"],
      focus: "Legal standards, evidence requirements, expert testimony"
    },
    {
      question: "What compensation can I get for medical malpractice?",
      difficulty: "intermediate", 
      tags: ["medical compensation", "damages", "malpractice"],
      focus: "Compensation types, calculation methods, typical awards"
    },
    {
      question: "How long do I have to file a medical negligence claim?",
      difficulty: "beginner",
      tags: ["time limits", "medical claims", "limitation period"],
      focus: "Statutory time limits, discovery rule, exceptions"
    },
    {
      question: "Can I sue a government hospital for negligence?",
      difficulty: "advanced",
      tags: ["government hospital", "public healthcare", "negligence claims"],
      focus: "Government liability, special procedures, sovereign immunity"
    }
  ],
  motorAccidents: [
    {
      question: "What should I do immediately after a car accident?",
      difficulty: "beginner",
      tags: ["car accident", "immediate steps", "accident procedures"],
      focus: "Emergency procedures, documentation, insurance notification"
    },
    {
      question: "How is fault determined in motor vehicle accidents?",
      difficulty: "intermediate",
      tags: ["fault determination", "liability", "accident investigation"],
      focus: "Investigation process, evidence evaluation, liability rules"
    },
    {
      question: "Can I claim if the accident was partly my fault?",
      difficulty: "intermediate",
      tags: ["contributory negligence", "partial fault", "compensation"],
      focus: "Contributory negligence rules, compensation reduction"
    },
    {
      question: "What if the other driver has no insurance?",
      difficulty: "intermediate",
      tags: ["uninsured driver", "compensation", "insurance coverage"],
      focus: "Uninsured driver scenarios, alternative compensation sources"
    }
  ],
  workplaceInjuries: [
    {
      question: "Am I covered for injuries that happen at work?",
      difficulty: "beginner",
      tags: ["work injury coverage", "workers compensation", "employment"],
      focus: "Coverage scope, eligibility requirements, exclusions"
    },
    {
      question: "Can I sue my employer for workplace injuries?",
      difficulty: "intermediate",
      tags: ["employer liability", "workplace injury", "legal action"],
      focus: "Common law claims, statutory compensation, employer negligence"
    },
    {
      question: "What's the difference between work injury compensation and personal injury claims?",
      difficulty: "intermediate",
      tags: ["work injury", "personal injury", "compensation types"],
      focus: "Statutory vs common law claims, compensation differences"
    },
    {
      question: "How long does a work injury claim take to process?",
      difficulty: "beginner",
      tags: ["work injury", "claim processing", "timeline"],
      focus: "Processing timelines, MOM procedures, payment schedules"
    }
  ],
  generalPersonalInjury: [
    {
      question: "How much compensation can I expect for my injury?",
      difficulty: "intermediate",
      tags: ["compensation amount", "damages", "injury assessment"],
      focus: "Compensation factors, calculation methods, typical ranges"
    },
    {
      question: "Should I accept the first settlement offer?",
      difficulty: "intermediate",
      tags: ["settlement", "negotiation", "legal advice"],
      focus: "Settlement evaluation, negotiation strategies, legal consultation"
    },
    {
      question: "Can I claim for psychological trauma from an accident?",
      difficulty: "intermediate",
      tags: ["psychological trauma", "mental health", "compensation"],
      focus: "Psychiatric injury claims, evidence requirements, compensation"
    }
  ],
  legalProcess: [
    {
      question: "Do I need a lawyer for my personal injury claim?",
      difficulty: "beginner",
      tags: ["legal representation", "lawyer", "legal advice"],
      focus: "When to engage lawyers, cost considerations, self-representation"
    },
    {
      question: "How long does a personal injury case take in Singapore?",
      difficulty: "beginner",
      tags: ["case timeline", "litigation duration", "legal process"],
      focus: "Typical timelines, factors affecting duration, court procedures"
    }
  ]
};

// CONTENT VALIDATION RULES
export const personalInjuryContentValidation = {
  articles: {
    minWordCount: 2500,
    requiredSections: [
      "Introduction",
      "Legal Framework",
      "Practical Guidance",
      "Compensation Details",
      "Procedures and Timeline",
      "Conclusion"
    ],
    mandatoryKeywords: {
      medical: ["medical negligence", "patient rights", "hospital liability", "medical malpractice"],
      motor: ["motor vehicle", "traffic accident", "insurance claim", "third party liability"],
      workplace: ["workplace injury", "employer liability", "WICA", "MOM procedures"],
      litigation: ["court procedures", "damage assessment", "settlement", "litigation process"],
      international: ["cross-border", "international jurisdiction", "tourist claims", "expat injuries"]
    },
    seoRequirements: {
      titleLength: "50-60 characters",
      metaDescription: "150-160 characters",
      keywordDensity: "1-2%",
      headingStructure: "H1, H2, H3 hierarchy"
    }
  },

  qas: {
    minAnswerLength: 300,
    maxAnswerLength: 800,
    requiredElements: [
      "Direct answer to question",
      "Legal basis or authority",
      "Practical steps or guidance",
      "Important considerations or warnings"
    ],
    difficultyLevels: {
      beginner: "Basic concepts, simple language, practical focus",
      intermediate: "Some legal terminology, procedural details, moderate complexity",
      advanced: "Complex legal concepts, technical procedures, expert-level guidance"
    }
  }
};

// IMPORT CONFIGURATION
export const personalInjuryImportConfig = {
  batchSize: 5,

  articles: {
    dataFormat: "JSON array",
    requiredFields: [
      "title", "slug", "summary", "content", "difficulty_level",
      "tags", "reading_time_minutes", "is_featured", "is_published"
    ],
    autoGeneratedFields: [
      "id", "category_id", "author_name", "seo_title", "seo_description",
      "view_count", "created_at", "updated_at"
    ],
    validationRules: "Apply personalInjuryContentValidation.articles",
    processingOrder: "Sequential with validation"
  },

  qas: {
    dataFormat: "JSON array",
    requiredFields: [
      "question", "answer", "difficulty_level", "tags",
      "is_featured", "is_public"
    ],
    autoGeneratedFields: [
      "id", "category_id", "user_id", "ai_response", "status",
      "helpful_votes", "view_count", "created_at", "updated_at"
    ],
    validationRules: "Apply personalInjuryContentValidation.qas",
    processingOrder: "Sequential with validation"
  },

  importAPI: {
    endpoint: "/api/admin/import-personal-injury-law",
    method: "POST",
    authentication: "Admin service role key",
    responseFormat: {
      success: "boolean",
      message: "string",
      results: {
        articles: {
          created: "number",
          total: "number",
          errors: "string[]"
        },
        qas: {
          created: "number",
          total: "number",
          errors: "string[]"
        }
      }
    }
  }
};

// ADMIN INTERFACE SPECIFICATIONS
export const personalInjuryAdminSpecs = {
  customFields: {
    articles: [
      {
        name: "injury_type",
        type: "select",
        options: ["Medical", "Motor Vehicle", "Workplace", "General", "International"],
        required: true
      },
      {
        name: "compensation_range",
        type: "text",
        placeholder: "e.g., $5,000 - $50,000",
        required: false
      },
      {
        name: "medical_terminology_check",
        type: "checkbox",
        label: "Medical terminology verified",
        required: true
      }
    ],
    qas: [
      {
        name: "injury_category",
        type: "select",
        options: ["Medical Negligence", "Motor Accidents", "Workplace Injuries", "General PI", "Legal Process"],
        required: true
      },
      {
        name: "urgency_level",
        type: "select",
        options: ["Low", "Medium", "High", "Emergency"],
        required: true
      }
    ]
  },

  validationChecks: [
    "Medical terminology accuracy",
    "Compensation calculation correctness",
    "Insurance procedure compliance",
    "Legal citation verification",
    "Cross-reference validation"
  ],

  workflowSteps: [
    "Content creation/editing",
    "Medical-legal review",
    "Compensation verification",
    "SEO optimization",
    "Publication approval"
  ]
};

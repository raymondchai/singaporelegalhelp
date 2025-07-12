// Debt & Bankruptcy Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d

// DATABASE CONFIGURATION
export const debtBankruptcyLawDatabaseConfig = {
  categoryId: "8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d",
  categoryName: "Debt & Bankruptcy",
  categorySlug: "debt-bankruptcy",

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

// CONTENT STRATEGY
export const debtBankruptcyContentStrategy = {
  totalArticles: 8,
  totalQAs: 20,
  targetWordCount: 2500,
  readingTimeRange: [18, 25],
  difficultyLevels: ["basic", "intermediate", "advanced"],

  primaryKeywords: [
    "debt recovery Singapore",
    "personal bankruptcy Singapore",
    "corporate insolvency Singapore",
    "debt collection procedures",
    "bankruptcy discharge Singapore",
    "creditor rights Singapore",
    "debt restructuring Singapore",
    "winding up procedures Singapore"
  ],

  secondaryKeywords: [
    "Singapore Bankruptcy Act",
    "Companies Act insolvency",
    "debt enforcement Singapore",
    "bankruptcy alternatives",
    "voluntary arrangement",
    "scheme of arrangement",
    "liquidation procedures",
    "director duties insolvency"
  ]
};

// ARTICLE TEMPLATES
export const debtBankruptcyArticleTemplates = {
  personalBankruptcyArticle: {
    titlePattern: "Personal Bankruptcy in Singapore: [Process/Guide/Rights]",
    summaryTemplate: "Comprehensive guide to personal bankruptcy in Singapore covering [key areas] including [specific elements] and [practical applications].",
    contentStructure: [
      "Introduction to Personal Bankruptcy in Singapore",
      "Legal Framework and Bankruptcy Act Provisions",
      "Step-by-Step Bankruptcy Process",
      "Eligibility Criteria and Requirements",
      "Consequences and Restrictions",
      "Discharge Process and Timeline",
      "Alternatives to Bankruptcy",
      "Rights and Obligations",
      "Case Studies and Examples",
      "Professional Guidance and Next Steps"
    ],
    targetAudience: "Individuals facing financial difficulties, debtors, financial advisors",
    businessValue: "high",
    seoFocus: "personal bankruptcy procedures and consequences"
  },

  corporateInsolvencyArticle: {
    titlePattern: "Corporate Insolvency in Singapore: [Procedures/Guide/Rights]",
    summaryTemplate: "Complete guide to corporate insolvency procedures in Singapore covering [key areas] including [specific elements] and [practical applications].",
    contentStructure: [
      "Introduction to Corporate Insolvency in Singapore",
      "Companies Act Insolvency Provisions",
      "Types of Insolvency Procedures",
      "Winding Up Process and Requirements",
      "Director Duties and Liabilities",
      "Creditor Rights and Procedures",
      "Liquidation and Asset Distribution",
      "Cross-Border Insolvency Issues",
      "Case Studies and Precedents",
      "Professional Guidance and Legal Requirements"
    ],
    targetAudience: "Business owners, directors, corporate lawyers, creditors",
    businessValue: "very high",
    seoFocus: "corporate insolvency and winding up procedures"
  },

  debtRecoveryArticle: {
    titlePattern: "Debt Recovery in Singapore: [Legal/Procedures/Rights]",
    summaryTemplate: "Comprehensive guide to debt recovery procedures in Singapore covering [key areas] including [specific elements] and [enforcement mechanisms].",
    contentStructure: [
      "Introduction to Debt Recovery in Singapore",
      "Legal Framework for Debt Collection",
      "Pre-Legal Debt Recovery Methods",
      "Court Procedures for Debt Recovery",
      "Enforcement Mechanisms and Remedies",
      "Garnishee Proceedings and Asset Seizure",
      "International Debt Recovery",
      "Debtor Protection and Rights",
      "Cost Considerations and Strategies",
      "Professional Services and Legal Guidance"
    ],
    targetAudience: "Creditors, businesses, debt collection agencies, legal professionals",
    businessValue: "very high",
    seoFocus: "debt collection procedures and creditor rights"
  }
};

// Q&A FRAMEWORK
export const debtBankruptcyQAFramework = {
  personalBankruptcyQAs: [
    {
      category: "Bankruptcy Process",
      questions: [
        "What are the requirements to file for personal bankruptcy in Singapore?",
        "How long does the bankruptcy process take in Singapore?",
        "What happens to my assets when I declare bankruptcy?",
        "Can I travel overseas while bankrupt in Singapore?",
        "How do I get discharged from bankruptcy in Singapore?"
      ]
    },
    {
      category: "Bankruptcy Consequences",
      questions: [
        "What are the restrictions during bankruptcy in Singapore?",
        "Can I start a business while bankrupt?",
        "How does bankruptcy affect my employment in Singapore?",
        "What debts are not discharged in bankruptcy?",
        "Can my family members be affected by my bankruptcy?"
      ]
    }
  ],

  corporateInsolvencyQAs: [
    {
      category: "Corporate Winding Up",
      questions: [
        "What are the grounds for winding up a company in Singapore?",
        "How do I apply for voluntary winding up of my company?",
        "What are director duties during company insolvency?",
        "How are company assets distributed in liquidation?",
        "Can a wound-up company be restored in Singapore?"
      ]
    }
  ],

  debtRecoveryQAs: [
    {
      category: "Debt Collection",
      questions: [
        "What are the legal steps to recover unpaid debts in Singapore?",
        "How do I obtain a judgment for debt recovery?",
        "What enforcement options are available for debt collection?",
        "Can I recover legal costs in debt collection cases?",
        "How do I collect debts from overseas debtors?"
      ]
    }
  ]
};

// SEO METADATA TEMPLATES
export const debtBankruptcySEOTemplates = {
  titleFormats: [
    "[Primary Keyword] in Singapore: [Benefit/Guide Type]",
    "[Action] Your [Asset]: Singapore [Legal Area] Guide",
    "Singapore [Legal Topic]: [Comprehensive/Essential] [Guide/Strategy]"
  ],

  descriptionFormats: [
    "Complete guide to [topic] in Singapore. Learn about [key benefit 1], [key benefit 2], and [key benefit 3]. Expert legal guidance for [target audience].",
    "Navigate [legal process] in Singapore with confidence. Understand [requirement 1], [requirement 2], and [outcome]. Professional legal advice included.",
    "Master [legal area] procedures in Singapore. Discover [strategy 1], [strategy 2], and [best practice]. Singapore law compliance guaranteed."
  ],

  keywordDensity: {
    primary: "1.5-2.5%",
    secondary: "0.8-1.2%",
    longTail: "0.5-0.8%"
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

// CURRENT STATUS ANALYSIS
export const debtBankruptcyLawCurrentStatus = {
  categoryDetails: {
    id: "8f2e5c4d-9b1a-4e6f-8c3d-2a7b9e5f1c8d",
    name: "Debt & Bankruptcy",
    description: "Debt recovery, bankruptcy procedures, corporate insolvency, and creditor rights",
    icon: "credit-card",
    color: "#f59e0b",
    sortOrder: 9,
    isActive: true
  },
  
  existingContent: {
    articles: {
      count: 0,
      target: 8,
      remaining: 8,
      existing: []
    },
    qas: {
      count: 0,
      target: 20,
      remaining: 20,
      existing: []
    }
  },
  
  contentGap: {
    articles: 8,
    qas: 20,
    totalWordCount: 20000, // 8 articles × 2500 words each
    estimatedReadingTime: 160 // 8 articles × 20 minutes each
  }
};

// CONTENT SPECIALIZATIONS
export const debtBankruptcyContentSpecializations = {
  insolvencyTypes: [
    "Personal Bankruptcy",
    "Corporate Insolvency", 
    "Voluntary Liquidation",
    "Compulsory Liquidation",
    "Judicial Management",
    "Schemes of Arrangement"
  ],
  
  debtCategories: [
    "Secured Debts",
    "Unsecured Debts", 
    "Priority Debts",
    "Contingent Debts",
    "Disputed Debts"
  ],
  
  legalProcedures: [
    "Statutory Demand",
    "Bankruptcy Application",
    "Winding Up Petition",
    "Debt Recovery Action",
    "Asset Seizure",
    "Garnishment Orders"
  ],
  
  stakeholderTypes: [
    "Individual Debtors",
    "Corporate Debtors",
    "Secured Creditors",
    "Unsecured Creditors",
    "Liquidators",
    "Judicial Managers"
  ]
};

// CONTENT VALIDATION FRAMEWORK
export const debtBankruptcyContentValidation = {
  articles: {
    minimumWordCount: 2500,
    requiredSections: [
      "Legal Framework",
      "Procedures and Requirements", 
      "Rights and Obligations",
      "Practical Considerations",
      "Professional Advice"
    ],
    legalAccuracyChecks: [
      "Bankruptcy Act compliance",
      "Companies Act provisions",
      "Court procedures accuracy",
      "Statutory requirements",
      "Professional standards"
    ],
    singaporeSpecificElements: [
      "Local court procedures",
      "Singapore statutory provisions",
      "Local case law references",
      "Government agency procedures",
      "Professional body requirements"
    ]
  },
  
  qas: {
    minimumCharacterCount: 500,
    responseStructure: [
      "Direct answer",
      "Legal basis",
      "Practical implications",
      "Professional advice recommendation"
    ],
    difficultyLevels: {
      beginner: "Basic concepts and general procedures",
      intermediate: "Specific procedures and requirements",
      advanced: "Complex legal issues and strategic considerations"
    }
  }
};

// SEO AND MARKETING CONFIGURATION
export const debtBankruptcySEOConfig = {
  primaryKeywords: [
    "debt recovery Singapore",
    "bankruptcy Singapore", 
    "corporate insolvency Singapore",
    "debt collection Singapore",
    "liquidation Singapore",
    "creditor rights Singapore"
  ],
  
  secondaryKeywords: {
    personal: ["personal bankruptcy", "debt relief", "bankruptcy discharge", "debt management"],
    corporate: ["company winding up", "judicial management", "corporate restructuring", "insolvency procedures"],
    recovery: ["debt enforcement", "statutory demand", "garnishment", "asset seizure"],
    legal: ["bankruptcy law", "insolvency law", "creditor protection", "debtor rights"]
  },
  
  localSEOTerms: [
    "Singapore", "Singapore courts", "Singapore law", "Singapore business",
    "High Court Singapore", "State Courts Singapore", "ACRA", "Official Assignee"
  ]
};

// BUSINESS INTELLIGENCE METRICS
export const debtBankruptcyBusinessMetrics = {
  targetAudience: {
    primary: ["SME Business Owners", "Individual Debtors", "Corporate Directors"],
    secondary: ["Legal Professionals", "Financial Institutions", "Debt Collection Agencies"],
    tertiary: ["Accountants", "Business Advisors", "Insolvency Practitioners"]
  },
  
  contentPerformanceKPIs: [
    "Article engagement time",
    "Q&A helpfulness ratings", 
    "Search ranking positions",
    "Conversion to consultation requests",
    "User return rates"
  ],
  
  businessValue: {
    leadGeneration: "High - Financial distress creates urgent legal needs",
    brandAuthority: "High - Complex area requiring specialized expertise", 
    userRetention: "Medium - Situational but recurring business needs",
    crossSelling: "High - Links to corporate law, employment law, property law"
  }
};

// TECHNICAL IMPLEMENTATION SPECS
export const debtBankruptcyTechnicalSpecs = {
  adminInterface: {
    specializedFields: [
      "Insolvency type classification",
      "Debt category tagging",
      "Stakeholder type identification",
      "Urgency level assessment",
      "Professional referral flags"
    ],
    
    contentManagement: [
      "Batch import for debt/bankruptcy content",
      "Legal accuracy validation",
      "Singapore law compliance checking",
      "Professional disclaimer management",
      "Cross-reference linking"
    ]
  },
  
  userInterface: {
    mobileOptimization: "Critical - Users often access during financial crises",
    searchFunctionality: "Enhanced filtering by debt type and stakeholder",
    emergencyAccess: "Quick access to urgent procedures and contacts",
    professionalReferrals: "Integration with qualified insolvency practitioners"
  },
  
  dataStructure: {
    articleMetadata: [
      "insolvency_type", "debt_category", "stakeholder_type", 
      "urgency_level", "professional_referral_required"
    ],
    qaMetadata: [
      "scenario_type", "stakeholder_role", "urgency_level",
      "follow_up_required", "professional_advice_needed"
    ]
  }
};

const debtBankruptcyLawTechnicalSpecs = {
  debtBankruptcyLawDatabaseConfig,
  debtBankruptcyLawCurrentStatus,
  debtBankruptcyContentSpecializations,
  debtBankruptcyContentValidation,
  debtBankruptcySEOConfig,
  debtBankruptcyBusinessMetrics,
  debtBankruptcyTechnicalSpecs
};

export default debtBankruptcyLawTechnicalSpecs;

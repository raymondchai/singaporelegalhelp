// Employment Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 9e1378f4-c4c9-4296-b8a4-508699f63a88

// DATABASE CONFIGURATION
export const employmentLawDatabaseConfig = {
  categoryId: "9e1378f4-c4c9-4296-b8a4-508699f63a88",
  categoryName: "Employment Law",
  categorySlug: "employment-law",
  
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

// CURRENT STATUS ANALYSIS
export const employmentLawCurrentStatus = {
  categoryDetails: {
    id: "9e1378f4-c4c9-4296-b8a4-508699f63a88",
    name: "Employment Law",
    description: "Employment contracts, workplace rights, disputes",
    icon: "users",
    color: "#3b82f6",
    sortOrder: 2,
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
  }
};

// CONTENT CREATION SPECIFICATIONS
export const employmentLawContentSpecs = {
  articles: [
    {
      title: "Employment Rights and Obligations in Singapore",
      slug: "employment-rights-obligations-singapore",
      summary: "Comprehensive guide to employee and employer rights under Singapore's Employment Act, including working hours, leave entitlements, and statutory benefits.",
      contentType: "guide",
      difficultyLevel: "beginner",
      estimatedReadingTime: 18,
      tags: ["employment act", "employee rights", "working hours", "leave entitlement", "statutory benefits"],
      isFeatured: true,
      seoTitle: "Employment Rights and Obligations in Singapore - Complete Guide 2024",
      seoDescription: "Learn about employment rights and obligations in Singapore under the Employment Act. Covers working hours, leave, benefits, and employer duties."
    },
    {
      title: "Wrongful Termination and Unfair Dismissal",
      slug: "wrongful-termination-unfair-dismissal-singapore",
      summary: "Understanding wrongful termination, unfair dismissal procedures, notice periods, and compensation claims under Singapore employment law.",
      contentType: "guide",
      difficultyLevel: "intermediate",
      estimatedReadingTime: 22,
      tags: ["wrongful termination", "unfair dismissal", "notice period", "compensation", "employment disputes"],
      isFeatured: true,
      seoTitle: "Wrongful Termination and Unfair Dismissal in Singapore - Legal Guide",
      seoDescription: "Complete guide to wrongful termination and unfair dismissal in Singapore. Learn about notice periods, compensation, and legal remedies."
    },
    {
      title: "Workplace Discrimination and Harassment",
      slug: "workplace-discrimination-harassment-singapore",
      summary: "Legal framework for addressing workplace discrimination and harassment in Singapore, including complaint procedures and protection measures.",
      contentType: "guide",
      difficultyLevel: "intermediate",
      estimatedReadingTime: 20,
      tags: ["workplace discrimination", "harassment", "equal opportunity", "complaint procedures", "protection measures"],
      isFeatured: false,
      seoTitle: "Workplace Discrimination and Harassment Laws in Singapore",
      seoDescription: "Understanding workplace discrimination and harassment laws in Singapore. Learn about complaint procedures and legal protections."
    },
    {
      title: "Employment Contracts and Terms of Service",
      slug: "employment-contracts-terms-service-singapore",
      summary: "Essential guide to employment contracts in Singapore, including mandatory clauses, terms of service, and contract variations.",
      contentType: "guide",
      difficultyLevel: "beginner",
      estimatedReadingTime: 16,
      tags: ["employment contract", "terms of service", "contract clauses", "contract variation", "employment terms"],
      isFeatured: false,
      seoTitle: "Employment Contracts and Terms of Service in Singapore - Legal Guide",
      seoDescription: "Complete guide to employment contracts in Singapore. Learn about mandatory clauses, terms of service, and contract requirements."
    },
    {
      title: "Work Pass and Foreign Worker Regulations",
      slug: "work-pass-foreign-worker-regulations-singapore",
      summary: "Comprehensive guide to work passes, foreign worker regulations, and employment obligations for international workers in Singapore.",
      contentType: "guide",
      difficultyLevel: "intermediate",
      estimatedReadingTime: 24,
      tags: ["work pass", "foreign worker", "employment pass", "work permit", "MOM regulations"],
      isFeatured: true,
      seoTitle: "Work Pass and Foreign Worker Regulations in Singapore - 2024 Guide",
      seoDescription: "Complete guide to work passes and foreign worker regulations in Singapore. Covers Employment Pass, Work Permit, and MOM requirements."
    },
    {
      title: "CPF, Benefits, and Employment Insurance",
      slug: "cpf-benefits-employment-insurance-singapore",
      summary: "Understanding CPF contributions, employee benefits, and employment insurance requirements under Singapore employment law.",
      contentType: "guide",
      difficultyLevel: "beginner",
      estimatedReadingTime: 19,
      tags: ["cpf", "employee benefits", "employment insurance", "contributions", "statutory benefits"],
      isFeatured: false,
      seoTitle: "CPF, Benefits, and Employment Insurance in Singapore - Complete Guide",
      seoDescription: "Learn about CPF contributions, employee benefits, and employment insurance requirements in Singapore employment law."
    },
    {
      title: "Workplace Safety and Compensation Claims",
      slug: "workplace-safety-compensation-claims-singapore",
      summary: "Guide to workplace safety regulations, injury compensation, and claims procedures under Singapore's Workplace Safety and Health Act.",
      contentType: "guide",
      difficultyLevel: "intermediate",
      estimatedReadingTime: 21,
      tags: ["workplace safety", "compensation claims", "work injury", "WSH act", "safety regulations"],
      isFeatured: false,
      seoTitle: "Workplace Safety and Compensation Claims in Singapore - Legal Guide",
      seoDescription: "Complete guide to workplace safety and compensation claims in Singapore. Learn about WSH Act requirements and injury claims."
    },
    {
      title: "Trade Unions and Industrial Relations",
      slug: "trade-unions-industrial-relations-singapore",
      summary: "Understanding trade unions, collective bargaining, and industrial relations framework in Singapore employment law.",
      contentType: "guide",
      difficultyLevel: "advanced",
      estimatedReadingTime: 17,
      tags: ["trade unions", "industrial relations", "collective bargaining", "union rights", "labor relations"],
      isFeatured: false,
      seoTitle: "Trade Unions and Industrial Relations in Singapore - Legal Framework",
      seoDescription: "Guide to trade unions and industrial relations in Singapore. Learn about collective bargaining and union rights."
    }
  ],

  qas: [
    // Employment Rights and Basic Questions
    {
      question: "What are the basic employment rights guaranteed under Singapore's Employment Act?",
      tags: ["employment act", "basic rights", "employee protection"],
      difficultyLevel: "beginner",
      isFeatured: true
    },
    {
      question: "How many hours can an employee work per week in Singapore?",
      tags: ["working hours", "overtime", "employment act"],
      difficultyLevel: "beginner",
      isFeatured: false
    },
    {
      question: "What is the minimum notice period for termination in Singapore?",
      tags: ["notice period", "termination", "employment contract"],
      difficultyLevel: "beginner",
      isFeatured: true
    },
    {
      question: "Can my employer terminate me without cause in Singapore?",
      tags: ["termination", "wrongful dismissal", "employment protection"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "What annual leave entitlements do employees have in Singapore?",
      tags: ["annual leave", "vacation", "employee benefits"],
      difficultyLevel: "beginner",
      isFeatured: false
    },

    // Workplace Disputes and Discrimination
    {
      question: "How do I file a complaint for workplace discrimination in Singapore?",
      tags: ["workplace discrimination", "complaint procedure", "equal opportunity"],
      difficultyLevel: "intermediate",
      isFeatured: true
    },
    {
      question: "What constitutes sexual harassment in the workplace under Singapore law?",
      tags: ["sexual harassment", "workplace harassment", "protection measures"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "Can I be fired for filing a workplace complaint in Singapore?",
      tags: ["retaliation", "whistleblower protection", "employment protection"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "What should I do if I'm being bullied at work in Singapore?",
      tags: ["workplace bullying", "harassment", "complaint procedure"],
      difficultyLevel: "beginner",
      isFeatured: false
    },
    {
      question: "How is pregnancy discrimination handled in Singapore workplaces?",
      tags: ["pregnancy discrimination", "maternity protection", "equal opportunity"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },

    // Foreign Workers and Work Passes
    {
      question: "What are the different types of work passes available in Singapore?",
      tags: ["work pass", "employment pass", "work permit", "foreign worker"],
      difficultyLevel: "beginner",
      isFeatured: true
    },
    {
      question: "Can I change jobs while on an Employment Pass in Singapore?",
      tags: ["employment pass", "job change", "work pass transfer"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "What happens if my work pass expires while I'm employed?",
      tags: ["work pass expiry", "renewal", "employment status"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "Can foreign workers join trade unions in Singapore?",
      tags: ["foreign workers", "trade unions", "union membership"],
      difficultyLevel: "advanced",
      isFeatured: false
    },

    // CPF and Benefits
    {
      question: "How much CPF contribution must my employer make in Singapore?",
      tags: ["cpf contribution", "employer obligations", "statutory benefits"],
      difficultyLevel: "beginner",
      isFeatured: true
    },
    {
      question: "What happens to my CPF if I lose my job in Singapore?",
      tags: ["cpf", "unemployment", "benefits"],
      difficultyLevel: "beginner",
      isFeatured: false
    },
    {
      question: "Can I withdraw my CPF contributions if I leave Singapore permanently?",
      tags: ["cpf withdrawal", "permanent departure", "foreign worker"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },

    // Workplace Safety and Compensation
    {
      question: "What should I do if I'm injured at work in Singapore?",
      tags: ["work injury", "compensation", "workplace safety"],
      difficultyLevel: "beginner",
      isFeatured: true
    },
    {
      question: "How much compensation can I claim for a work-related injury?",
      tags: ["work injury compensation", "claims", "WSH act"],
      difficultyLevel: "intermediate",
      isFeatured: false
    },
    {
      question: "Can I sue my employer for workplace negligence in Singapore?",
      tags: ["workplace negligence", "employer liability", "legal action"],
      difficultyLevel: "advanced",
      isFeatured: false
    }
  ]
};

// SINGAPORE EMPLOYMENT LAW FOCUS AREAS
export const singaporeEmploymentLawFocus = {
  keyLegislation: [
    "Employment Act (Chapter 91)",
    "Workplace Safety and Health Act",
    "Industrial Relations Act",
    "Trade Unions Act",
    "Central Provident Fund Act",
    "Employment of Foreign Manpower Act"
  ],
  
  keyAuthorities: [
    "Ministry of Manpower (MOM)",
    "Workplace Safety and Health Council",
    "Central Provident Fund Board",
    "Industrial Arbitration Court",
    "Employment Claims Tribunals"
  ],
  
  commonWorkplaceIssues: [
    "Wrongful termination disputes",
    "Salary and overtime claims",
    "Workplace discrimination",
    "Work pass violations",
    "CPF contribution disputes",
    "Workplace safety violations"
  ]
};

// IP Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 64f9abe4-f1c2-4eb6-9d11-6f107ab9def1

// DATABASE CONFIGURATION
export const ipLawDatabaseConfig = {
  categoryId: "64f9abe4-f1c2-4eb6-9d11-6f107ab9def1",
  categoryName: "Intellectual Property",
  categorySlug: "intellectual-property",
  
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

// ARTICLE TEMPLATES
export const ipArticleTemplates = {
  patentArticle: {
    titlePattern: "[Topic] for Singapore Businesses: [Benefit/Focus]",
    summaryTemplate: "Comprehensive guide to [topic] in Singapore covering [key areas] including [specific elements] and [practical applications].",
    contentStructure: [
      "Introduction to [Topic] in Singapore",
      "Legal Framework and IPOS Procedures", 
      "Step-by-Step Process Guide",
      "Costs and Timeline Analysis",
      "Requirements and Eligibility",
      "Strategic Considerations",
      "International Implications",
      "Common Mistakes and Best Practices",
      "Case Studies and Examples",
      "Professional Guidance and Next Steps"
    ],
    requiredSections: [
      "IPOS procedures",
      "Cost breakdown",
      "Timeline information",
      "Singapore-specific requirements",
      "International considerations",
      "Professional advice recommendation"
    ]
  },
  
  trademarkArticle: {
    titlePattern: "[Topic]: [Action/Benefit] Your [Asset/Goal]",
    summaryTemplate: "Essential guide to [topic] in Singapore covering [protection methods], [procedures], and [strategic considerations] for [target audience].",
    contentStructure: [
      "Introduction to [Topic] Strategy",
      "Singapore Trademark System Overview",
      "Registration Process and Requirements",
      "Classification and Filing Strategy",
      "International Protection Options",
      "Enforcement and Monitoring",
      "Brand Management Best Practices",
      "Common Challenges and Solutions",
      "Cost-Benefit Analysis",
      "Future-Proofing Your Brand"
    ],
    requiredSections: [
      "IPOS registration process",
      "Madrid Protocol information",
      "Enforcement mechanisms",
      "Cost analysis",
      "Brand protection strategy"
    ]
  },
  
  digitalIPArticle: {
    titlePattern: "Digital IP Protection: [Specific Area] & [Application]",
    summaryTemplate: "Comprehensive guide to protecting [digital assets] in Singapore including [protection methods], [enforcement strategies], and [compliance requirements].",
    contentStructure: [
      "Digital IP Landscape in Singapore",
      "Types of Digital IP Protection",
      "Copyright for Digital Content",
      "Software and Technology Protection",
      "Online Enforcement Strategies",
      "International Digital IP Issues",
      "Emerging Technology Considerations",
      "Compliance and Risk Management",
      "Best Practices for Digital Businesses",
      "Future Trends and Developments"
    ],
    requiredSections: [
      "Singapore digital IP laws",
      "Technology-specific guidance",
      "Online enforcement options",
      "International considerations",
      "Emerging technology issues"
    ]
  }
};

// SEO METADATA TEMPLATES
export const ipSEOTemplates = {
  titleFormats: [
    "[Primary Keyword] in Singapore: [Benefit/Guide Type]",
    "[Action] Your [Asset]: Singapore [Legal Area] Guide",
    "Singapore [Legal Topic]: [Comprehensive/Essential] [Guide/Strategy]"
  ],
  
  metaDescriptionTemplate: "[Action verb] [primary keyword] in Singapore. [Key benefit]. [Authority statement]. [Call to action]. [Character count: 150-160]",
  
  primaryKeywords: {
    patent: ["Singapore patents", "IPOS patent", "patent application Singapore", "patent registration"],
    trademark: ["Singapore trademark", "IPOS trademark", "trademark registration", "brand protection Singapore"],
    copyright: ["Singapore copyright", "digital copyright", "copyright protection", "content protection"],
    general: ["IP law Singapore", "intellectual property", "IP protection", "IP registration"]
  },
  
  secondaryKeywords: {
    patent: ["patent costs", "patent timeline", "patent search", "patent strategy", "patent licensing"],
    trademark: ["trademark costs", "brand protection", "trademark infringement", "international trademark"],
    copyright: ["copyright duration", "digital rights", "content licensing", "copyright enforcement"],
    general: ["IP enforcement", "IP valuation", "IP due diligence", "IP licensing", "IP strategy"]
  },
  
  localSEOTerms: [
    "Singapore", "IPOS", "Singapore law", "Singapore business", "Singapore legal",
    "Asia Pacific", "ASEAN", "regional hub", "Singapore courts"
  ]
};

// CONTENT VALIDATION RULES
export const ipContentValidation = {
  articles: {
    title: {
      minLength: 10,
      maxLength: 100,
      mustInclude: ["Singapore", "IP topic keyword"],
      pattern: /^[A-Z][^:]*:[^:]*$/,
      seoOptimized: true
    },
    
    summary: {
      minLength: 50,
      maxLength: 300,
      mustInclude: ["Singapore", "comprehensive", "guide"],
      keywordDensity: "1-3%",
      readabilityScore: "B+ or higher"
    },
    
    content: {
      minLength: 2000,
      targetLength: 2500,
      maxLength: 4000,
      requiredSections: [
        "Introduction",
        "Legal Framework",
        "Process/Procedures", 
        "Costs and Timeline",
        "Best Practices",
        "Conclusion"
      ],
      mustInclude: [
        "IPOS reference",
        "Singapore-specific information",
        "Practical guidance",
        "Professional advice recommendation"
      ],
      keywordDensity: "0.5-2%",
      readabilityScore: "B or higher"
    },
    
    tags: {
      minCount: 3,
      maxCount: 8,
      mustInclude: ["singapore", "ip category"],
      format: "lowercase, hyphenated"
    },
    
    seoFields: {
      seoTitle: {
        maxLength: 60,
        mustInclude: ["primary keyword"],
        unique: true
      },
      seoDescription: {
        minLength: 120,
        maxLength: 160,
        mustInclude: ["primary keyword", "call to action"],
        unique: true
      }
    }
  },
  
  qas: {
    question: {
      minLength: 10,
      maxLength: 200,
      format: "Question format with ?",
      mustInclude: ["Singapore context"],
      naturalLanguage: true
    },
    
    answer: {
      minLength: 100,
      maxLength: 400,
      structure: [
        "Direct answer",
        "Singapore-specific details",
        "Practical guidance",
        "Professional advice note"
      ],
      mustInclude: [
        "Singapore law reference",
        "Actionable information",
        "Next steps or recommendations"
      ],
      tone: "Professional but accessible"
    },
    
    tags: {
      minCount: 2,
      maxCount: 6,
      relevantToQuestion: true,
      includeCategory: true
    }
  }
};

// BATCH IMPORT STRUCTURE
export const ipBatchImportStructure = {
  articles: {
    dataFormat: "JSON array",
    requiredFields: [
      "title", "summary", "content", "difficulty_level", 
      "tags", "is_featured", "is_published"
    ],
    autoGeneratedFields: [
      "id", "category_id", "slug", "reading_time_minutes",
      "author_name", "view_count", "created_at", "updated_at"
    ],
    validationRules: "Apply ipContentValidation.articles",
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
    validationRules: "Apply ipContentValidation.qas",
    processingOrder: "Sequential with validation"
  },
  
  importAPI: {
    endpoint: "/api/admin/import-ip-law",
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

// ADMIN INTERFACE CUSTOMIZATION
export const ipAdminInterfaceSpecs = {
  pageLocation: "/admin/content/ip-law",
  
  specializedFields: {
    ipType: {
      type: "select",
      options: ["Patent", "Trademark", "Copyright", "Trade Secret", "General"],
      required: true,
      helpText: "Select the primary IP type for this content"
    },
    
    iposReference: {
      type: "checkbox",
      label: "Includes IPOS procedures",
      required: true,
      helpText: "Content must reference relevant IPOS procedures"
    },
    
    internationalScope: {
      type: "checkbox",
      label: "Includes international considerations",
      required: false,
      helpText: "Check if content covers international IP aspects"
    },
    
    businessFocus: {
      type: "select",
      options: ["Startup", "SME", "Enterprise", "Individual", "General"],
      required: true,
      helpText: "Primary target audience for this content"
    }
  },
  
  validationMessages: {
    wordCount: "IP Law articles must be at least 2000 words for comprehensive coverage",
    iposReference: "Content must include relevant IPOS procedures and requirements",
    singaporeContext: "Content must be specific to Singapore IP law and practice",
    practicalGuidance: "Content must provide actionable guidance for readers"
  },
  
  contentSuggestions: {
    patents: [
      "Include IPOS patent application timeline",
      "Mention patent search requirements", 
      "Discuss international filing options",
      "Reference recent Singapore patent cases"
    ],
    trademarks: [
      "Include trademark class selection guidance",
      "Mention Madrid Protocol options",
      "Discuss enforcement mechanisms",
      "Reference IPOS examination process"
    ],
    copyright: [
      "Clarify automatic protection in Singapore",
      "Discuss moral rights provisions",
      "Include digital content considerations",
      "Reference international copyright treaties"
    ]
  }
};

// QUALITY ASSURANCE CHECKLIST
export const ipQualityChecklist = {
  legalAccuracy: [
    "Singapore IP law compliance verified",
    "IPOS procedures accurately described",
    "Current legal requirements referenced",
    "Professional legal advice disclaimer included"
  ],
  
  contentQuality: [
    "Minimum word count met (2000+ for articles)",
    "Clear structure with proper headings",
    "Practical examples and guidance provided",
    "Singapore-specific context throughout"
  ],
  
  seoOptimization: [
    "Primary keywords naturally integrated",
    "Meta descriptions within character limits",
    "Header structure optimized (H1, H2, H3)",
    "Internal linking to related content"
  ],
  
  userExperience: [
    "Content accessible to target audience",
    "Clear call-to-action provided",
    "Professional tone maintained",
    "Mobile-friendly formatting"
  ],
  
  businessValue: [
    "Addresses real user needs and questions",
    "Supports business objectives",
    "Enhances platform authority",
    "Drives qualified traffic and leads"
  ]
};

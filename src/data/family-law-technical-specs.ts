// Family Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 8ec7d509-45be-4416-94bc-4e58dd6bc7cc

// DATABASE CONFIGURATION
export const familyLawDatabaseConfig = {
  categoryId: "8ec7d509-45be-4416-94bc-4e58dd6bc7cc",
  categoryName: "Family Law",
  categorySlug: "family-law",
  
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

// CONTENT SPECIFICATIONS
export const familyLawContentSpecs = {
  articles: {
    targetCount: 8,
    wordCountRange: [2000, 3000],
    readingTimeRange: [15, 25],
    difficultyLevels: ["beginner", "intermediate", "advanced"],
    contentTypes: ["guide", "overview", "procedure"],
    requiredTags: ["family-law", "singapore", "women-charter"]
  },
  
  qas: {
    targetCount: 20,
    wordCountRange: [300, 500],
    difficultyLevels: ["beginner", "intermediate", "advanced"],
    requiredTags: ["family-law", "singapore"]
  }
};

// SINGAPORE-SPECIFIC REQUIREMENTS
export const singaporeFamilyLawRequirements = {
  legalFramework: [
    "Women's Charter (Cap. 353)",
    "Family Justice Act 2014",
    "Guardianship of Infants Act",
    "Adoption of Children Act",
    "Maintenance of Parents Act"
  ],
  
  courts: [
    "Family Justice Courts",
    "Family Court",
    "Youth Court",
    "Syariah Court (for Muslim marriages)"
  ],
  
  procedures: [
    "Mediation requirements",
    "Counselling mandates",
    "Child welfare assessments",
    "Financial disclosure obligations"
  ],
  
  culturalConsiderations: [
    "Multi-racial family dynamics",
    "Religious marriage considerations",
    "Cross-border custody issues",
    "International adoption procedures"
  ]
};

// CONTENT STRUCTURE TEMPLATE
export const familyLawContentTemplate = {
  articleStructure: {
    introduction: "Brief overview and importance",
    legalFramework: "Relevant Singapore laws and regulations",
    procedures: "Step-by-step process guidance",
    requirements: "Documentation and eligibility criteria",
    costs: "Fee structures and financial considerations",
    timeline: "Expected duration and key milestones",
    alternatives: "Mediation and alternative dispute resolution",
    professionalAdvice: "When to consult a lawyer",
    resources: "Useful contacts and further information",
    conclusion: "Key takeaways and next steps"
  },
  
  qaStructure: {
    question: "Clear, specific question",
    answer: "Comprehensive response with practical guidance",
    legalBasis: "Reference to relevant laws",
    practicalTips: "Actionable advice",
    warnings: "Important considerations or risks",
    nextSteps: "Recommended follow-up actions"
  }
};

// SEO OPTIMIZATION
export const familyLawSEO = {
  primaryKeywords: [
    "divorce singapore",
    "child custody singapore",
    "matrimonial assets",
    "family law singapore",
    "adoption singapore",
    "domestic violence protection",
    "maintenance singapore",
    "prenuptial agreement"
  ],
  
  secondaryKeywords: [
    "women's charter",
    "family court singapore",
    "syariah court",
    "hdb divorce",
    "cpf division",
    "international custody",
    "family mediation",
    "child support"
  ],
  
  contentOptimization: {
    titleLength: [50, 60],
    metaDescriptionLength: [150, 160],
    headingStructure: ["H1", "H2", "H3"],
    keywordDensity: [1, 3],
    internalLinking: true,
    localSEO: true
  }
};

// QUALITY ASSURANCE CHECKLIST
export const familyLawQualityChecklist = {
  content: [
    "Accurate legal information",
    "Singapore-specific context",
    "Sensitive and empathetic tone",
    "Clear procedural guidance",
    "Updated legal references",
    "Cultural sensitivity",
    "Plain English usage",
    "Comprehensive coverage"
  ],
  
  technical: [
    "Proper categorization",
    "SEO optimization",
    "Mobile responsiveness",
    "Search functionality",
    "Related content linking",
    "Database integration",
    "Performance optimization",
    "Error handling"
  ],
  
  compliance: [
    "Legal accuracy verification",
    "Professional disclaimers",
    "Privacy considerations",
    "Ethical guidelines",
    "Cultural appropriateness",
    "Accessibility standards",
    "Content moderation",
    "Regular updates"
  ]
};

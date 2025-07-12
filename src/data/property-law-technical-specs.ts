// Property Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 4e8ce92f-a63c-4719-9d73-2f28966c45be

// DATABASE CONFIGURATION
export const propertyLawDatabaseConfig = {
  categoryId: "4e8ce92f-a63c-4719-9d73-2f28966c45be",
  categoryName: "Property Law",
  categorySlug: "property-law",
  
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

// SINGAPORE PROPERTY LAW FRAMEWORK
export const singaporePropertyLaws = {
  primaryLegislation: [
    {
      name: "Land Titles Act",
      description: "Governs land registration and title systems",
      keyProvisions: ["Title registration", "Indefeasibility", "Caveats", "Dealings"]
    },
    {
      name: "Housing Development Act",
      description: "Regulates HDB housing and public housing matters",
      keyProvisions: ["HDB eligibility", "Resale procedures", "Ethnic integration", "Minimum occupation period"]
    },
    {
      name: "Property Tax Act",
      description: "Property taxation and assessment",
      keyProvisions: ["Annual value assessment", "Tax rates", "Exemptions", "Appeals"]
    },
    {
      name: "Building Control Act",
      description: "Building construction and safety standards",
      keyProvisions: ["Building permits", "Safety requirements", "Inspections", "Compliance"]
    },
    {
      name: "Planning Act",
      description: "Urban planning and development control",
      keyProvisions: ["Development control", "Planning permissions", "URA guidelines", "Land use"]
    }
  ],
  
  regulatoryBodies: [
    {
      name: "Urban Redevelopment Authority (URA)",
      role: "Urban planning and development control",
      website: "https://www.ura.gov.sg"
    },
    {
      name: "Housing & Development Board (HDB)",
      role: "Public housing development and management",
      website: "https://www.hdb.gov.sg"
    },
    {
      name: "Building and Construction Authority (BCA)",
      role: "Building standards and construction regulation",
      website: "https://www.bca.gov.sg"
    },
    {
      name: "Singapore Land Authority (SLA)",
      role: "Land administration and survey",
      website: "https://www.sla.gov.sg"
    }
  ]
};

// PROPERTY TRANSACTION COSTS
export const propertyTransactionCosts = {
  stampDuty: {
    buyerStampDuty: [
      { range: "First $180,000", rate: "1%" },
      { range: "Next $180,000", rate: "2%" },
      { range: "Next $640,000", rate: "3%" },
      { range: "Remaining amount", rate: "4%" }
    ],
    additionalBuyerStampDuty: {
      singaporeCitizens: [
        { property: "First", rate: "0%" },
        { property: "Second", rate: "17%" },
        { property: "Third and subsequent", rate: "25%" }
      ],
      permanentResidents: [
        { property: "First", rate: "5%" },
        { property: "Second and subsequent", rate: "25%" }
      ],
      foreigners: [
        { property: "First", rate: "30%" },
        { property: "Second and subsequent", rate: "35%" }
      ]
    },
    sellerStampDuty: [
      { holdingPeriod: "Up to 1 year", rate: "12%" },
      { holdingPeriod: "More than 1 year up to 2 years", rate: "8%" },
      { holdingPeriod: "More than 2 years up to 3 years", rate: "4%" },
      { holdingPeriod: "More than 3 years", rate: "0%" }
    ]
  },
  
  legalFees: {
    conveyancing: "$2,000 - $3,000",
    propertySearch: "$300 - $500",
    titleInvestigation: "$500 - $800",
    mortgageDocumentation: "$800 - $1,200"
  },
  
  otherCosts: {
    surveyFees: "$500 - $1,500",
    valuationFees: "$300 - $800",
    insurancePremiums: "0.1% - 0.3% of property value",
    agentCommission: "1% - 2% of property value"
  }
};

// CONTENT STRUCTURE TEMPLATE
export const propertyLawContentTemplate = {
  articleStructure: {
    introduction: "Brief overview and importance",
    legalFramework: "Relevant Singapore laws and regulations",
    procedures: "Step-by-step process guidance",
    requirements: "Documentation and eligibility criteria",
    costs: "Fee structures and financial considerations",
    timeline: "Expected duration and key milestones",
    commonIssues: "Typical problems and solutions",
    professionalAdvice: "When to consult a lawyer",
    resources: "Useful contacts and further information",
    conclusion: "Key takeaways and next steps"
  },
  
  qaStructure: {
    question: "Clear, specific question",
    answer: "Comprehensive answer with legal basis",
    practicalAdvice: "Actionable guidance",
    relatedTopics: "Links to related content",
    disclaimer: "Legal disclaimer and professional advice recommendation"
  }
};

// SEO AND CONTENT OPTIMIZATION
export const propertyLawSEO = {
  primaryKeywords: [
    "Singapore property law",
    "HDB purchase guide",
    "Private property investment",
    "Property conveyancing Singapore",
    "Landlord tenant rights",
    "Property disputes Singapore",
    "Foreign property ownership",
    "Strata title management"
  ],
  
  secondaryKeywords: [
    "ABSD rates Singapore",
    "Property stamp duty",
    "HDB eligibility criteria",
    "Property development law",
    "URA guidelines",
    "Building Control Act",
    "Property tax Singapore",
    "Real estate legal advice"
  ],
  
  contentTargets: {
    minimumWordCount: 2000,
    targetWordCount: 2500,
    readingTimeTarget: "18-22 minutes",
    difficultyLevels: ["beginner", "intermediate", "advanced"]
  }
};

// INTEGRATION REQUIREMENTS
export const integrationRequirements = {
  documentBuilder: {
    propertyTemplates: [
      "Sale and Purchase Agreement",
      "Tenancy Agreement",
      "Option to Purchase",
      "Letter of Intent",
      "Property Management Agreement"
    ],
    integrationPoints: [
      "Article content linking to relevant templates",
      "Template suggestions based on article topic",
      "Cross-referencing between content and documents"
    ]
  },
  
  lawyerReferral: {
    specializations: [
      "Property conveyancing",
      "Property disputes",
      "Real estate development",
      "Strata title matters",
      "Foreign investment compliance"
    ]
  },
  
  searchOptimization: {
    facetedSearch: [
      "Property type (HDB, private, commercial)",
      "Transaction type (purchase, sale, rental)",
      "Legal issue type (disputes, compliance, documentation)",
      "User type (individual, business, foreign investor)"
    ]
  }
};

export default {
  propertyLawDatabaseConfig,
  singaporePropertyLaws,
  propertyTransactionCosts,
  propertyLawContentTemplate,
  propertyLawSEO,
  integrationRequirements
};

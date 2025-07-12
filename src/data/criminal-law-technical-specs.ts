// Criminal Law Technical Specifications for Singapore Legal Help Platform
// Category ID: 0047f44c-0869-432e-9b25-a20dbabe53fb

// DATABASE CONFIGURATION
export const criminalLawDatabaseConfig = {
  categoryId: "0047f44c-0869-432e-9b25-a20dbabe53fb",
  categoryName: "Criminal Law",
  categorySlug: "criminal-law",
  
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
export const criminalLawCurrentStatus = {
  categoryDetails: {
    id: "0047f44c-0869-432e-9b25-a20dbabe53fb",
    name: "Criminal Law",
    description: "Criminal charges, court proceedings, and legal defense",
    icon: "shield",
    color: "#dc2626",
    sortOrder: 5,
    isActive: true
  },
  
  existingContent: {
    articles: {
      count: 1,
      target: 8,
      remaining: 7,
      existing: [
        {
          id: "242b34ae-594c-406e-9265-445f315025ea",
          title: "Criminal Defense Rights in Singapore",
          slug: "criminal-defense-rights-singapore",
          contentType: "guide",
          difficultyLevel: "intermediate",
          readingTime: 16,
          tags: ["criminal defense", "police rights", "court procedures", "legal representation"]
        }
      ]
    },
    
    qas: {
      count: 3,
      target: 20,
      remaining: 17,
      existing: [
        {
          id: "3d5c5c78-9493-407d-b1cd-f891d84b9c0b",
          question: "Do I need a lawyer if I'm arrested in Singapore?",
          tags: ["criminal arrest", "legal representation", "police questioning"],
          difficultyLevel: "beginner"
        },
        {
          id: "5a527ccb-60e6-484c-855e-98ea674c300f",
          question: "What should I do if police want to search my property?",
          tags: ["police search", "search warrant", "property rights"],
          difficultyLevel: "intermediate"
        },
        {
          id: "4588f793-a950-4419-8f72-2e65eaf470ba",
          question: "Can I get bail while facing criminal charges?",
          tags: ["criminal bail", "bail application", "pre-trial detention"],
          difficultyLevel: "intermediate"
        }
      ]
    }
  }
};

// CONTENT ARCHITECTURE PLAN - 7 ADDITIONAL ARTICLES
export const criminalLawArticlesPlan = [
  {
    title: "Criminal Court Procedures in Singapore: From Charge to Trial",
    slug: "criminal-court-procedures-singapore-charge-trial",
    summary: "Complete guide to Singapore's criminal justice process, court hierarchy, and procedural rights from initial charge through trial proceedings",
    contentType: "comprehensive-guide",
    difficultyLevel: "intermediate",
    tags: ["singapore criminal court", "court procedures", "criminal trial process", "criminal justice system"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Criminal Court Procedures Singapore: Complete Guide to Trial Process",
    seoDescription: "Understand Singapore's criminal court procedures from charge to trial. Expert guide covering court hierarchy, procedural rights, and trial process.",
    keyTopics: [
      "Singapore court hierarchy for criminal cases",
      "Criminal procedure code requirements",
      "Pre-trial procedures and hearings",
      "Trial process and evidence rules",
      "Sentencing procedures and appeals"
    ]
  },
  
  {
    title: "Criminal Defense Strategies: Protecting Your Rights",
    slug: "criminal-defense-strategies-protecting-rights-singapore",
    summary: "Essential criminal defense strategies and tactics for protecting your legal rights in Singapore criminal proceedings",
    contentType: "strategy-guide",
    difficultyLevel: "advanced",
    tags: ["criminal defense singapore", "legal rights", "defense strategies", "criminal lawyer"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Criminal Defense Strategies Singapore: Protect Your Legal Rights",
    seoDescription: "Expert criminal defense strategies for Singapore. Learn how to protect your rights, challenge evidence, and build strong defense cases.",
    keyTopics: [
      "Building effective defense strategies",
      "Evidence challenges and exclusions",
      "Witness examination techniques",
      "Plea bargaining considerations",
      "Mitigation and sentencing factors"
    ]
  },
  
  {
    title: "White Collar Crime in Singapore: Business & Financial Offenses",
    slug: "white-collar-crime-singapore-business-financial-offenses",
    summary: "Comprehensive guide to white collar crimes in Singapore including corporate fraud, financial crimes, and regulatory offenses",
    contentType: "specialized-guide",
    difficultyLevel: "advanced",
    tags: ["white collar crime singapore", "corporate fraud", "financial crimes", "business offenses"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "White Collar Crime Singapore: Business & Financial Offenses Guide",
    seoDescription: "Complete guide to white collar crimes in Singapore. Understand corporate fraud, financial crimes, penalties, and defense strategies.",
    keyTopics: [
      "Types of white collar crimes in Singapore",
      "Corporate fraud and embezzlement",
      "Securities and financial crimes",
      "Regulatory compliance offenses",
      "Penalties and enforcement actions"
    ]
  },

  {
    title: "Drug Offenses and Penalties: Singapore's Strict Laws",
    slug: "drug-offenses-penalties-singapore-strict-laws",
    summary: "Understanding Singapore's strict drug laws, penalties for drug trafficking and possession, and legal consequences",
    contentType: "legal-guide",
    difficultyLevel: "intermediate",
    tags: ["singapore drug laws", "drug trafficking penalties", "drug offenses", "drug possession"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Singapore Drug Laws: Offenses, Penalties & Legal Consequences",
    seoDescription: "Complete guide to Singapore's drug laws. Understand drug offenses, trafficking penalties, possession charges, and legal defenses.",
    keyTopics: [
      "Singapore's Misuse of Drugs Act",
      "Drug trafficking vs possession charges",
      "Mandatory death penalty provisions",
      "Drug rehabilitation programs",
      "Legal defenses for drug charges"
    ]
  },

  {
    title: "Violence and Assault Charges: Understanding the Law",
    slug: "violence-assault-charges-understanding-singapore-law",
    summary: "Comprehensive guide to assault charges, domestic violence laws, and self-defense provisions in Singapore",
    contentType: "legal-guide",
    difficultyLevel: "intermediate",
    tags: ["assault charges singapore", "violence offenses", "domestic violence", "self defense laws"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Assault Charges Singapore: Violence Offenses & Legal Defense",
    seoDescription: "Understand assault charges and violence offenses in Singapore. Learn about domestic violence laws, penalties, and self-defense provisions.",
    keyTopics: [
      "Types of assault charges in Singapore",
      "Domestic violence protection orders",
      "Self-defense legal provisions",
      "Penalties for violence offenses",
      "Victim compensation and support"
    ]
  },

  {
    title: "Property Crimes: Theft, Fraud & Cybercrime",
    slug: "property-crimes-theft-fraud-cybercrime-singapore",
    summary: "Complete guide to property crimes in Singapore including theft, burglary, fraud, cybercrime, and property damage offenses",
    contentType: "comprehensive-guide",
    difficultyLevel: "intermediate",
    tags: ["property crimes singapore", "theft charges", "cybercrime laws", "fraud offenses"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Property Crimes Singapore: Theft, Fraud & Cybercrime Laws",
    seoDescription: "Comprehensive guide to property crimes in Singapore. Understand theft, fraud, cybercrime laws, penalties, and legal defenses.",
    keyTopics: [
      "Theft and burglary charges",
      "Fraud and cheating offenses",
      "Cybercrime and computer misuse",
      "Property damage and vandalism",
      "Restitution and compensation orders"
    ]
  },

  {
    title: "Traffic Offenses and Road Safety: Legal Consequences",
    slug: "traffic-offenses-road-safety-legal-consequences-singapore",
    summary: "Understanding traffic violations, dangerous driving charges, and road safety laws in Singapore with legal consequences",
    contentType: "practical-guide",
    difficultyLevel: "beginner",
    tags: ["traffic offenses singapore", "dangerous driving", "road safety laws", "driving license"],
    targetWordCount: 2500,
    readingTimeMinutes: 18,
    seoTitle: "Traffic Offenses Singapore: Road Safety Laws & Legal Consequences",
    seoDescription: "Complete guide to traffic offenses in Singapore. Understand dangerous driving charges, penalties, license suspension, and legal defenses.",
    keyTopics: [
      "Common traffic violations and penalties",
      "Dangerous and reckless driving charges",
      "Drink driving and drug driving laws",
      "License suspension and disqualification",
      "Traffic court procedures and appeals"
    ]
  }
];

// Q&A FRAMEWORK DESIGN - 17 ADDITIONAL Q&AS
export const criminalLawQAsPlan = {
  arrestAndRights: [
    {
      question: "What should I do if I'm arrested in Singapore?",
      tags: ["criminal arrest", "police procedures", "legal rights"],
      difficultyLevel: "beginner",
      category: "Arrest & Rights",
      keyPoints: [
        "Remain calm and cooperative",
        "Exercise right to remain silent",
        "Request legal representation immediately",
        "Understand police questioning procedures",
        "Know your rights during detention"
      ]
    },
    {
      question: "What are my rights during police questioning?",
      tags: ["police questioning", "legal rights", "criminal investigation"],
      difficultyLevel: "beginner",
      category: "Arrest & Rights",
      keyPoints: [
        "Right to remain silent",
        "Right to legal counsel",
        "Protection against self-incrimination",
        "Recording of statements",
        "Challenging admissibility of statements"
      ]
    },
    {
      question: "How long can police detain me without charge?",
      tags: ["police detention", "criminal procedure", "legal rights"],
      difficultyLevel: "intermediate",
      category: "Arrest & Rights",
      keyPoints: [
        "48-hour detention limit without charge",
        "Extension procedures for serious crimes",
        "Habeas corpus applications",
        "Detention conditions and rights",
        "Legal remedies for unlawful detention"
      ]
    }
  ],

  courtProcess: [
    {
      question: "Can I represent myself in criminal court?",
      tags: ["self representation", "criminal court", "legal proceedings"],
      difficultyLevel: "intermediate",
      category: "Court Process",
      keyPoints: [
        "Right to self-representation",
        "Risks of proceeding without counsel",
        "Court assistance for unrepresented accused",
        "Legal aid availability",
        "When legal representation is mandatory"
      ]
    },
    {
      question: "What's the difference between summary and indictable offenses?",
      tags: ["criminal offenses", "court procedures", "legal classification"],
      difficultyLevel: "intermediate",
      category: "Court Process",
      keyPoints: [
        "Summary offense characteristics",
        "Indictable offense procedures",
        "Court jurisdiction differences",
        "Penalty limitations",
        "Trial procedures for each type"
      ]
    },
    {
      question: "How does plea bargaining work in Singapore?",
      tags: ["plea bargaining", "criminal negotiation", "court procedures"],
      difficultyLevel: "advanced",
      category: "Court Process",
      keyPoints: [
        "Plea bargaining process in Singapore",
        "Charge reduction negotiations",
        "Sentence recommendations",
        "Court approval requirements",
        "Strategic considerations"
      ]
    },
    {
      question: "Can I appeal my criminal conviction?",
      tags: ["criminal appeal", "conviction appeal", "appellate court"],
      difficultyLevel: "advanced",
      category: "Court Process",
      keyPoints: [
        "Grounds for criminal appeals",
        "Appeal filing procedures and deadlines",
        "High Court appeal process",
        "Court of Appeal procedures",
        "Legal representation for appeals"
      ]
    }
  ],

  legalRepresentation: [
    {
      question: "What happens if I can't afford a lawyer?",
      tags: ["legal aid", "criminal defense", "legal representation"],
      difficultyLevel: "beginner",
      category: "Legal Representation",
      keyPoints: [
        "Legal Aid Bureau services",
        "Means test requirements",
        "Assigned counsel scheme",
        "Pro bono legal services",
        "Court-appointed representation"
      ]
    },
    {
      question: "Do I need a lawyer for minor offenses?",
      tags: ["minor offenses", "legal representation", "criminal charges"],
      difficultyLevel: "beginner",
      category: "Legal Representation",
      keyPoints: [
        "Benefits of legal representation",
        "Self-representation risks",
        "Cost-benefit analysis",
        "Complexity of legal procedures",
        "Long-term consequences consideration"
      ]
    },
    {
      question: "How do I choose a criminal defense lawyer?",
      tags: ["criminal lawyer", "legal representation", "lawyer selection"],
      difficultyLevel: "intermediate",
      category: "Legal Representation",
      keyPoints: [
        "Experience in criminal law",
        "Track record and specialization",
        "Fee structures and costs",
        "Communication and availability",
        "Bar association resources"
      ]
    }
  ],

  penaltiesAndConsequences: [
    {
      question: "What are the consequences of a criminal record?",
      tags: ["criminal record", "legal consequences", "employment impact"],
      difficultyLevel: "intermediate",
      category: "Penalties & Consequences",
      keyPoints: [
        "Employment background checks",
        "Professional licensing impacts",
        "Travel restrictions",
        "Immigration consequences",
        "Social and personal effects"
      ]
    },
    {
      question: "How do I get a criminal record expunged?",
      tags: ["criminal record expungement", "record sealing", "legal rehabilitation"],
      difficultyLevel: "advanced",
      category: "Penalties & Consequences",
      keyPoints: [
        "Spent conviction scheme",
        "Eligibility requirements",
        "Application procedures",
        "Waiting periods",
        "Limitations and exceptions"
      ]
    },
    {
      question: "What's the difference between probation and community service?",
      tags: ["probation", "community service", "alternative sentencing"],
      difficultyLevel: "intermediate",
      category: "Penalties & Consequences",
      keyPoints: [
        "Probation conditions and supervision",
        "Community service requirements",
        "Breach consequences",
        "Completion procedures",
        "Record implications"
      ]
    }
  ],

  specificOffenses: [
    {
      question: "What are the penalties for drug trafficking in Singapore?",
      tags: ["drug trafficking", "singapore drug laws", "criminal penalties"],
      difficultyLevel: "advanced",
      category: "Specific Offenses",
      keyPoints: [
        "Mandatory death penalty thresholds",
        "Drug trafficking vs possession",
        "Presumption provisions",
        "Alternative sentencing conditions",
        "Legal defenses available"
      ]
    },
    {
      question: "Can criminal charges be dropped or withdrawn?",
      tags: ["charge withdrawal", "criminal prosecution", "case dismissal"],
      difficultyLevel: "intermediate",
      category: "Specific Offenses",
      keyPoints: [
        "Prosecutorial discretion",
        "Insufficient evidence scenarios",
        "Victim withdrawal impact",
        "Plea negotiation outcomes",
        "Court dismissal procedures"
      ]
    },
    {
      question: "Can I be charged for something that happened overseas?",
      tags: ["extraterritorial jurisdiction", "overseas crimes", "international law"],
      difficultyLevel: "advanced",
      category: "Specific Offenses",
      keyPoints: [
        "Singapore's extraterritorial laws",
        "Extradition procedures",
        "Dual criminality requirements",
        "Diplomatic immunity considerations",
        "International cooperation treaties"
      ]
    }
  ]
};

// TECHNICAL PREPARATION FRAMEWORK
export const criminalLawTechnicalPreparation = {
  articleTemplates: {
    standardFields: {
      categoryId: "0047f44c-0869-432e-9b25-a20dbabe53fb",
      contentType: "guide",
      authorName: "Singapore Legal Help",
      isFeatured: true,
      isPublished: true,
      viewCount: 0
    },

    seoConfiguration: {
      titlePrefix: "Singapore Criminal Law:",
      descriptionTemplate: "Expert guide to {topic} in Singapore. Understand legal procedures, rights, penalties, and defense strategies.",
      keywordFocus: [
        "singapore criminal law",
        "criminal defense singapore",
        "criminal charges singapore",
        "singapore court procedures"
      ]
    },

    legalDisclaimers: {
      criminalLawDisclaimer: "This information is for educational purposes only and does not constitute legal advice. Criminal law matters require professional legal representation. Consult a qualified criminal defense lawyer for specific legal advice.",
      urgencyNotice: "If you are facing criminal charges or have been arrested, seek immediate legal assistance. Time-sensitive legal rights may be affected by delays.",
      confidentialityReminder: "Do not discuss your case details publicly or on social media. Protect your legal interests by consulting with a lawyer confidentially."
    }
  },

  batchImportStructure: {
    articlesJsonTemplate: {
      categoryId: "0047f44c-0869-432e-9b25-a20dbabe53fb",
      batchSize: 7,
      validationRules: {
        minWordCount: 2500,
        requiredTags: ["singapore criminal law"],
        mandatoryFields: ["title", "slug", "summary", "content", "seo_title", "seo_description"]
      }
    },

    qasJsonTemplate: {
      categoryId: "0047f44c-0869-432e-9b25-a20dbabe53fb",
      batchSize: 17,
      validationRules: {
        minAnswerLength: 500,
        requiredStatus: "published",
        mandatoryFields: ["question", "answer", "tags", "difficulty_level"]
      }
    }
  }
};

// CONTENT VALIDATION RULES
export const criminalLawValidationRules = {
  articles: {
    minimumWordCount: 2500,
    requiredSections: [
      "Introduction",
      "Legal Framework",
      "Practical Applications",
      "Key Considerations",
      "Conclusion"
    ],
    complianceChecks: [
      "Singapore Criminal Procedure Code accuracy",
      "Current penalty structures",
      "Proper legal disclaimers",
      "Professional tone and language"
    ]
  },

  qas: {
    minimumAnswerLength: 500,
    requiredElements: [
      "Direct answer to question",
      "Legal context and background",
      "Practical steps or advice",
      "When to seek professional help"
    ],
    accuracyRequirements: [
      "Current Singapore law references",
      "Accurate procedural information",
      "Appropriate legal disclaimers",
      "Clear and accessible language"
    ]
  }
};

// BUSINESS STRATEGY FRAMEWORK
export const criminalLawBusinessStrategy = {
  contentPositioning: {
    primaryAudience: [
      "Individuals facing criminal charges",
      "Family members of accused persons",
      "Business owners dealing with regulatory issues",
      "Legal professionals seeking references"
    ],

    competitiveAdvantages: [
      "Singapore-specific criminal law focus",
      "Comprehensive coverage of procedures",
      "Practical guidance for real situations",
      "Professional legal network connections"
    ],

    seoStrategy: {
      primaryKeywords: [
        "singapore criminal lawyer",
        "criminal defense singapore",
        "criminal charges singapore",
        "singapore criminal court"
      ],
      longTailKeywords: [
        "what to do if arrested singapore",
        "criminal defense strategies singapore",
        "singapore drug trafficking penalties",
        "criminal court procedures singapore"
      ]
    }
  },

  userJourneyMapping: {
    awarenessStage: [
      "Understanding criminal charges",
      "Knowing legal rights",
      "Recognizing need for legal help"
    ],
    considerationStage: [
      "Comparing legal options",
      "Understanding court procedures",
      "Evaluating defense strategies"
    ],
    decisionStage: [
      "Choosing legal representation",
      "Preparing for court proceedings",
      "Making informed legal decisions"
    ]
  }
};

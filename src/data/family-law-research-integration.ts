// Family Law Research Integration Helper
// Tool to help integrate PDF research into existing family law content

import { familyLawDatabaseConfig } from './family-law-technical-specs';

// INTEGRATION TEMPLATE FOR NEW ARTICLES
export const newArticleTemplate = {
  category_id: familyLawDatabaseConfig.categoryId,
  title: "", // Extract from your PDF
  slug: "", // Auto-generated from title
  summary: "", // 150-200 word summary
  content: "", // Full article content (2000-3000 words)
  content_type: "guide", // or "overview", "procedure"
  difficulty_level: "intermediate", // "beginner", "intermediate", "advanced"
  tags: ["family-law", "singapore", "women-charter"], // Add specific tags
  reading_time_minutes: 20, // Calculate based on word count
  is_featured: false,
  is_published: true,
  author_name: "Singapore Legal Help Team",
  seo_title: "", // SEO optimized title
  seo_description: "", // 150-160 characters
  view_count: 0
};

// INTEGRATION TEMPLATE FOR NEW Q&As
export const newQATemplate = {
  category_id: familyLawDatabaseConfig.categoryId,
  user_id: null,
  question: "", // Extract from your PDF
  answer: "", // Comprehensive answer (300-500 words)
  ai_response: null,
  tags: ["family-law", "singapore"], // Add specific tags
  difficulty_level: "intermediate",
  is_featured: false,
  is_public: true,
  status: "approved",
  helpful_votes: 0,
  view_count: 0
};

// CONTENT EXTRACTION GUIDELINES
export const extractionGuidelines = {
  articles: {
    structure: {
      introduction: "Brief overview and importance",
      legalFramework: "Relevant Singapore laws (Women's Charter, etc.)",
      procedures: "Step-by-step process guidance",
      requirements: "Documentation and eligibility criteria",
      costs: "Fee structures and financial considerations",
      timeline: "Expected duration and key milestones",
      alternatives: "Mediation and alternative dispute resolution",
      professionalAdvice: "When to consult a lawyer",
      resources: "Useful contacts and further information",
      conclusion: "Key takeaways and next steps"
    },
    formatting: {
      headings: "Use ## for main sections, ### for subsections",
      lists: "Use bullet points for procedures and requirements",
      emphasis: "Use **bold** for important terms",
      links: "Include relevant internal and external links"
    }
  },
  
  qas: {
    questionTypes: [
      "Procedural questions (How to...)",
      "Legal requirements (What documents...)",
      "Cost-related questions (How much...)",
      "Timeline questions (How long...)",
      "Rights and obligations (Can I...)",
      "Specific scenarios (What if...)"
    ],
    answerStructure: {
      directAnswer: "Start with a clear, direct answer",
      explanation: "Provide detailed explanation with legal context",
      procedures: "Include step-by-step guidance if applicable",
      considerations: "Mention important considerations or exceptions",
      nextSteps: "Suggest next steps or professional consultation"
    }
  }
};

// SINGAPORE-SPECIFIC FOCUS AREAS
export const singaporeSpecificAreas = [
  "Women's Charter provisions",
  "Family Justice Courts procedures",
  "CPF and matrimonial assets",
  "HDB flat ownership issues",
  "Maintenance calculations",
  "Child custody arrangements",
  "Syariah Court matters",
  "Cross-border family issues",
  "Adoption procedures",
  "Domestic violence protection"
];

// CONTENT QUALITY CHECKLIST
export const qualityChecklist = {
  accuracy: [
    "All legal references are current and accurate",
    "Singapore-specific laws and procedures are correctly cited",
    "Contact information and resources are up-to-date"
  ],
  completeness: [
    "All major aspects of the topic are covered",
    "Practical guidance is provided alongside legal theory",
    "Common scenarios and exceptions are addressed"
  ],
  clarity: [
    "Language is accessible to non-lawyers",
    "Technical terms are explained",
    "Examples and scenarios are provided"
  ],
  structure: [
    "Content follows the established template",
    "Headings and subheadings are logical",
    "Information flows in a logical sequence"
  ]
};

export default {
  newArticleTemplate,
  newQATemplate,
  extractionGuidelines,
  singaporeSpecificAreas,
  qualityChecklist
};

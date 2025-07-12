// Enhanced Query Processing for Singapore Legal RAG System
// Implements intent recognition, context analysis, and query optimization

export interface QueryIntent {
  type: 'question' | 'procedure' | 'definition' | 'requirement' | 'cost' | 'timeline' | 'document'
  confidence: number
  category: string
  entities: string[]
  urgency: 'low' | 'medium' | 'high'
}

export interface ProcessedQuery {
  originalQuery: string
  cleanedQuery: string
  intent: QueryIntent
  keywords: string[]
  synonyms: string[]
  context: string[]
  suggestedCategories: string[]
}

export class LegalQueryProcessor {
  private readonly intentPatterns = {
    question: [
      /^(what|how|when|where|why|which|who)/i,
      /(is it|can i|should i|do i need)/i,
      /\?$/
    ],
    procedure: [
      /(how to|steps to|process for|procedure)/i,
      /(apply|register|file|submit)/i,
      /(obtain|get|acquire)/i
    ],
    definition: [
      /(what is|define|meaning of|definition)/i,
      /(means|refers to|stands for)/i
    ],
    requirement: [
      /(requirements|criteria|conditions|qualifications)/i,
      /(need to|must|required|mandatory)/i,
      /(eligible|qualify)/i
    ],
    cost: [
      /(cost|fee|price|charge|payment)/i,
      /(how much|expensive|affordable)/i,
      /(budget|financial)/i
    ],
    timeline: [
      /(how long|duration|time|timeline)/i,
      /(when|deadline|period)/i,
      /(fast|quick|urgent)/i
    ],
    document: [
      /(document|form|certificate|license|permit)/i,
      /(paperwork|filing|submission)/i,
      /(template|sample)/i
    ]
  }

  private readonly categoryKeywords = {
    'employment_law': [
      'employment', 'work', 'job', 'employee', 'employer', 'salary', 'wage',
      'termination', 'resignation', 'leave', 'overtime', 'cpf', 'mom',
      'work permit', 'foreign worker', 'discrimination', 'harassment'
    ],
    'business_law': [
      'business', 'company', 'corporation', 'partnership', 'sole proprietorship',
      'acra', 'registration', 'license', 'compliance', 'director', 'shareholder',
      'incorporation', 'startup', 'sme', 'enterprise'
    ],
    'property_law': [
      'property', 'real estate', 'hdb', 'condo', 'landed', 'lease', 'rent',
      'purchase', 'sale', 'mortgage', 'loan', 'stamp duty', 'conveyancing',
      'title', 'ownership', 'tenant', 'landlord'
    ],
    'family_law': [
      'marriage', 'divorce', 'custody', 'maintenance', 'alimony', 'prenup',
      'adoption', 'family', 'spouse', 'children', 'domestic violence',
      'separation', 'matrimonial', 'syariah'
    ],
    'criminal_law': [
      'criminal', 'crime', 'police', 'court', 'charge', 'arrest', 'bail',
      'sentence', 'fine', 'prison', 'probation', 'appeal', 'lawyer',
      'defense', 'prosecution', 'guilty', 'innocent'
    ],
    'intellectual_property': [
      'trademark', 'patent', 'copyright', 'ip', 'intellectual property',
      'brand', 'invention', 'design', 'ipos', 'registration', 'infringement',
      'licensing', 'royalty'
    ],
    'immigration_law': [
      'immigration', 'visa', 'work permit', 'pr', 'permanent resident',
      'citizenship', 'ica', 'foreigner', 'expat', 'dependent', 'sponsor',
      'renewal', 'application'
    ],
    'tax_law': [
      'tax', 'gst', 'income tax', 'corporate tax', 'iras', 'filing',
      'deduction', 'exemption', 'penalty', 'audit', 'compliance'
    ]
  }

  private readonly urgencyIndicators = {
    high: ['urgent', 'emergency', 'asap', 'immediately', 'deadline', 'court date', 'summons'],
    medium: ['soon', 'quickly', 'fast', 'priority', 'important'],
    low: ['general', 'information', 'curious', 'planning', 'future']
  }

  processQuery(query: string): ProcessedQuery {
    const cleanedQuery = this.cleanQuery(query)
    const keywords = this.extractKeywords(cleanedQuery)
    const intent = this.detectIntent(cleanedQuery)
    const synonyms = this.generateSynonyms(keywords)
    const context = this.extractContext(cleanedQuery)
    const suggestedCategories = this.suggestCategories(cleanedQuery, keywords)

    return {
      originalQuery: query,
      cleanedQuery,
      intent,
      keywords,
      synonyms,
      context,
      suggestedCategories
    }
  }

  private cleanQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\?]/g, ' ') // Remove special characters except ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
    ])

    return query
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 15) // Limit to top 15 keywords
  }

  private detectIntent(query: string): QueryIntent {
    let bestMatch = { type: 'question' as const, confidence: 0.3 }
    
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      let confidence = 0
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          confidence += 0.3
        }
      }
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { type: intentType as any, confidence }
      }
    }

    // Detect category
    let category = 'general'
    let categoryConfidence = 0
    for (const [cat, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => query.includes(keyword)).length
      const confidence = matches / keywords.length
      if (confidence > categoryConfidence) {
        category = cat
        categoryConfidence = confidence
      }
    }

    // Extract entities (Singapore-specific terms)
    const entities = this.extractEntities(query)

    // Detect urgency
    const urgency = this.detectUrgency(query)

    return {
      type: bestMatch.type,
      confidence: Math.min(bestMatch.confidence, 0.95),
      category,
      entities,
      urgency
    }
  }

  private extractEntities(query: string): string[] {
    const singaporeEntities = [
      'singapore', 'sg', 'acra', 'mom', 'ica', 'iras', 'hdb', 'ura', 'cpf', 'ipos',
      'family justice courts', 'state courts', 'high court', 'court of appeal',
      'ministry of law', 'attorney general', 'law society'
    ]

    return singaporeEntities.filter(entity => query.includes(entity))
  }

  private detectUrgency(query: string): 'low' | 'medium' | 'high' {
    for (const [level, indicators] of Object.entries(this.urgencyIndicators)) {
      if (indicators.some(indicator => query.includes(indicator))) {
        return level as 'low' | 'medium' | 'high'
      }
    }
    return 'low'
  }

  private generateSynonyms(keywords: string[]): string[] {
    const synonymMap: Record<string, string[]> = {
      'company': ['corporation', 'business', 'firm', 'enterprise'],
      'employee': ['worker', 'staff', 'personnel'],
      'salary': ['wage', 'pay', 'compensation', 'remuneration'],
      'house': ['home', 'property', 'residence', 'dwelling'],
      'buy': ['purchase', 'acquire', 'obtain'],
      'sell': ['dispose', 'transfer', 'convey'],
      'divorce': ['separation', 'dissolution', 'annulment'],
      'child': ['minor', 'offspring', 'dependent'],
      'court': ['tribunal', 'judiciary', 'legal proceedings']
    }

    const synonyms: string[] = []
    for (const keyword of keywords) {
      if (synonymMap[keyword]) {
        synonyms.push(...synonymMap[keyword])
      }
    }
    return Array.from(new Set(synonyms)) // Remove duplicates
  }

  private extractContext(query: string): string[] {
    const context: string[] = []
    
    // Add Singapore context
    context.push('singapore law', 'singapore legal system')
    
    // Add specific legal context based on query
    if (query.includes('court')) {
      context.push('singapore courts', 'legal proceedings')
    }
    if (query.includes('government') || query.includes('ministry')) {
      context.push('singapore government', 'public sector')
    }
    
    return context
  }

  private suggestCategories(query: string, keywords: string[]): string[] {
    const suggestions: Array<{ category: string; score: number }> = []
    
    for (const [category, categoryKeywords] of Object.entries(this.categoryKeywords)) {
      let score = 0
      
      // Direct keyword matches
      for (const keyword of keywords) {
        if (categoryKeywords.includes(keyword)) {
          score += 2
        }
      }
      
      // Partial matches
      for (const categoryKeyword of categoryKeywords) {
        if (query.includes(categoryKeyword)) {
          score += 1
        }
      }
      
      if (score > 0) {
        suggestions.push({ category, score })
      }
    }
    
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.category)
  }
}

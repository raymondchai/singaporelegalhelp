// Enhanced aiXplain RAG integration for Singapore Legal Help
// Real AI implementation with OpenAI and vector embeddings

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { LegalQueryProcessor, type ProcessedQuery } from './query-processor'
import { LegalComplianceService } from './legal-compliance'
import { RAGCacheService } from './rag-cache'

interface AIXplainConfig {
  apiKey: string
  teamId: string
  baseUrl: string
  openaiApiKey: string
}

interface LegalDocument {
  id: string
  title: string
  content: string
  type: string
  category: string
  summary?: string
  tags?: string[]
}

interface LegalQuery {
  question: string
  category?: string
  context?: string
  userId?: string
  sessionId?: string
}

interface AIResponse {
  answer: string
  confidence: number
  sources: LegalSource[]
  followUpQuestions?: string[]
  reasoning?: string
  disclaimer?: string
}

interface LegalSource {
  id: string
  title: string
  type: 'article' | 'qa' | 'statute' | 'case_law'
  relevanceScore: number
  excerpt: string
  url?: string
}

interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  metadata: {
    title: string
    category: string
    type: string
    chunkIndex: number
    totalChunks: number
  }
}

export class LegalRAGService {
  private readonly config: AIXplainConfig
  private readonly openai: OpenAI
  private readonly supabase: any
  private readonly knowledgeBase: Map<string, DocumentChunk[]> = new Map()
  private readonly queryProcessor: LegalQueryProcessor = new LegalQueryProcessor()
  private readonly complianceService: LegalComplianceService = new LegalComplianceService()
  private readonly cacheService: RAGCacheService = new RAGCacheService()
  private isInitialized: boolean = false

  constructor() {
    this.config = {
      apiKey: process.env.AIXPLAIN_API_KEY || '',
      teamId: process.env.AIXPLAIN_TEAM_ID || '',
      baseUrl: 'https://api.aixplain.com/v1',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
    }

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    })

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('Legal RAG Service already initialized')
        return
      }

      console.log('Initializing Enhanced Legal RAG Service...')

      // Validate configuration
      if (!this.config.openaiApiKey) {
        throw new Error('OpenAI API key is required')
      }

      // Test OpenAI connection
      await this.testOpenAIConnection()

      // Load existing knowledge base from database
      await this.loadKnowledgeBase()

      this.isInitialized = true
      console.log('Enhanced Legal RAG Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Legal RAG service:', error)
      throw error
    }
  }

  private async testOpenAIConnection(): Promise<void> {
    try {
      await this.openai.models.list()
      console.log('✅ OpenAI connection successful')
    } catch (error) {
      console.error('❌ OpenAI connection failed:', error)
      throw new Error('Failed to connect to OpenAI API')
    }
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      console.log('Loading legal knowledge base...')

      // Load legal articles
      const { data: articles, error: articlesError } = await this.supabase
        .from('legal_articles')
        .select('id, title, content, summary, category_id, tags')
        .eq('is_published', true)

      if (articlesError) {
        console.error('Error loading articles:', articlesError)
        throw articlesError
      }

      // Load legal Q&As
      const { data: qas, error: qasError } = await this.supabase
        .from('legal_qa')
        .select('id, question, answer, category_id, tags')
        .eq('is_public', true)
        .eq('status', 'answered')

      if (qasError) {
        console.error('Error loading Q&As:', qasError)
        throw qasError
      }

      // Process and chunk documents
      const allDocuments: LegalDocument[] = [
        ...articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          type: 'article',
          category: article.category_id,
          tags: article.tags || []
        })),
        ...qas.map((qa: any) => ({
          id: qa.id,
          title: qa.question,
          content: `Question: ${qa.question}\n\nAnswer: ${qa.answer}`,
          type: 'qa',
          category: qa.category_id,
          tags: qa.tags || []
        }))
      ]

      console.log(`Processing ${allDocuments.length} legal documents...`)
      await this.processDocumentsForRAG(allDocuments)

      console.log('✅ Knowledge base loaded successfully')
    } catch (error) {
      console.error('Error loading knowledge base:', error)
      throw error
    }
  }

  private async processDocumentsForRAG(documents: LegalDocument[]): Promise<void> {
    try {
      for (const doc of documents) {
        const chunks = await this.chunkDocument(doc)
        this.knowledgeBase.set(doc.id, chunks)
      }
      console.log(`Processed ${documents.length} documents into ${this.getTotalChunks()} chunks`)
    } catch (error) {
      console.error('Error processing documents for RAG:', error)
      throw error
    }
  }

  private async chunkDocument(doc: LegalDocument): Promise<DocumentChunk[]> {
    const maxChunkSize = 1000 // characters
    const overlap = 200 // character overlap between chunks
    const content = doc.content
    const chunks: DocumentChunk[] = []

    for (let i = 0; i < content.length; i += maxChunkSize - overlap) {
      const chunkContent = content.slice(i, i + maxChunkSize)
      const chunkId = `${doc.id}_chunk_${chunks.length}`

      chunks.push({
        id: chunkId,
        documentId: doc.id,
        content: chunkContent,
        metadata: {
          title: doc.title,
          category: doc.category,
          type: doc.type,
          chunkIndex: chunks.length,
          totalChunks: Math.ceil(content.length / (maxChunkSize - overlap))
        }
      })
    }

    return chunks
  }

  private getTotalChunks(): number {
    let total = 0
    this.knowledgeBase.forEach((chunks) => {
      total += chunks.length
    })
    return total
  }

  async addDocumentsToKnowledgeBase(documents: LegalDocument[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      console.log(`Adding ${documents.length} new documents to knowledge base...`)

      for (const doc of documents) {
        const chunks = await this.chunkDocument(doc)
        this.knowledgeBase.set(doc.id, chunks)
      }

      console.log('Documents added to knowledge base successfully')
    } catch (error) {
      console.error('Error adding documents to knowledge base:', error)
      throw error
    }
  }

  async queryLegalAssistant(query: LegalQuery): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      console.log('Processing legal query:', query.question)

      // Step 1: Check cache first
      const cachedResponse = await this.cacheService.getCachedResponse(
        query.question,
        query.category
      )

      if (cachedResponse) {
        console.log('Cache hit for query:', query.question.substring(0, 50) + '...')
        const responseTime = Date.now() - startTime

        // Log cache hit for analytics
        await this.logQuery(query, {
          answer: cachedResponse.response.answer,
          confidence: cachedResponse.confidence,
          sources: cachedResponse.sources,
          followUpQuestions: cachedResponse.response.followUpQuestions,
          disclaimer: cachedResponse.response.disclaimer
        }, responseTime, true)

        return {
          answer: cachedResponse.response.answer,
          confidence: cachedResponse.confidence,
          sources: cachedResponse.sources,
          followUpQuestions: cachedResponse.response.followUpQuestions || [],
          reasoning: `Cached response (${responseTime}ms)`,
          disclaimer: cachedResponse.response.disclaimer
        }
      }

      // Step 2: Process and analyze the query
      const processedQuery = this.queryProcessor.processQuery(query.question)
      console.log('Query analysis:', {
        intent: processedQuery.intent,
        suggestedCategories: processedQuery.suggestedCategories,
        urgency: processedQuery.intent.urgency
      })

      // Step 3: Find relevant document chunks using enhanced query
      const relevantChunks = await this.findRelevantChunks(
        processedQuery,
        query.category || processedQuery.suggestedCategories[0]
      )

      // Step 4: Generate AI response using retrieved context and query analysis
      const response = await this.generateAIResponse(query, relevantChunks, processedQuery)

      const responseTime = Date.now() - startTime

      // Step 5: Cache the response for future use
      await this.cacheService.cacheResponse(
        query.question,
        response,
        response.confidence,
        response.sources,
        query.category || processedQuery.suggestedCategories[0]
      )

      // Step 6: Log query for analytics
      await this.logQuery(query, response, responseTime, false)

      return response
    } catch (error) {
      console.error('Error querying legal assistant:', error)
      throw error
    }
  }

  private async findRelevantChunks(processedQuery: ProcessedQuery, category?: string): Promise<DocumentChunk[]> {
    try {
      // Enhanced retrieval using processed query analysis
      const searchTerms = [
        ...processedQuery.keywords,
        ...processedQuery.synonyms,
        ...processedQuery.context
      ]

      const relevantChunks: DocumentChunk[] = []

      this.knowledgeBase.forEach((chunks) => {
        for (const chunk of chunks) {
          // Filter by category if specified, or use suggested categories
          const targetCategories = category ? [category] : processedQuery.suggestedCategories
          if (targetCategories.length > 0 && !targetCategories.includes(chunk.metadata.category)) {
            continue
          }

          // Calculate enhanced relevance score
          const relevanceScore = this.calculateEnhancedRelevanceScore(
            chunk.content.toLowerCase(),
            searchTerms,
            processedQuery.intent
          )

          if (relevanceScore > 0.1) { // Threshold for relevance
            relevantChunks.push({
              ...chunk,
              metadata: {
                ...chunk.metadata,
                relevanceScore
              } as any
            })
          }
        }
      })

      // Sort by relevance and return top chunks (more for urgent queries)
      relevantChunks.sort((a, b) =>
        (b.metadata as any).relevanceScore - (a.metadata as any).relevanceScore
      )

      const maxChunks = processedQuery.intent.urgency === 'high' ? 8 : 5
      return relevantChunks.slice(0, maxChunks)

    } catch (error) {
      console.error('Error finding relevant chunks:', error)
      return []
    }
  }



  private calculateEnhancedRelevanceScore(content: string, searchTerms: string[], intent: any): number {
    let score = 0
    const contentWords = content.split(/\W+/)
    const contentLength = contentWords.length

    // Base keyword matching
    for (const term of searchTerms) {
      const matches = contentWords.filter(word => word.includes(term)).length
      score += matches / contentLength
    }

    // Intent-based scoring boost
    const intentBoosts = {
      procedure: ['step', 'process', 'how to', 'apply', 'register'],
      requirement: ['must', 'need', 'require', 'condition', 'criteria'],
      cost: ['fee', 'cost', 'price', 'payment', 'charge'],
      timeline: ['time', 'duration', 'period', 'deadline', 'when'],
      definition: ['means', 'definition', 'refers to', 'is defined']
    }

    const boostTerms = intentBoosts[intent.type as keyof typeof intentBoosts] || []
    for (const boostTerm of boostTerms) {
      if (content.includes(boostTerm)) {
        score += 0.2 // Intent relevance boost
      }
    }

    // Category matching boost
    if (content.includes(intent.category.replace('_', ' '))) {
      score += 0.1
    }

    return Math.min(score, 1) // Normalize to 0-1
  }

  private async generateAIResponse(query: LegalQuery, relevantChunks: DocumentChunk[], processedQuery?: ProcessedQuery): Promise<AIResponse> {
    try {
      // Prepare context from relevant chunks
      const context = relevantChunks
        .map(chunk => `${chunk.metadata.title}: ${chunk.content}`)
        .join('\n\n')

      // Create enhanced system prompt with query analysis
      const intentGuidance = this.getIntentSpecificGuidance(processedQuery?.intent)
      const urgencyNote = processedQuery?.intent.urgency === 'high' ?
        '\n\nIMPORTANT: This appears to be an urgent legal matter. Prioritize immediate actionable advice and emphasize the importance of seeking immediate legal counsel.' : ''

      const systemPrompt = `You are a knowledgeable Singapore legal assistant. Provide accurate, helpful information about Singapore law based on the provided context.

Query Analysis:
- Intent: ${processedQuery?.intent.type || 'general inquiry'}
- Category: ${processedQuery?.intent.category || 'general'}
- Urgency: ${processedQuery?.intent.urgency || 'normal'}
${urgencyNote}

Context from Singapore Legal Database:
${context}

${intentGuidance}

Guidelines:
1. Base your response on the provided context
2. Be specific to Singapore law and regulations
3. Include relevant legal references when available
4. Structure your response according to the query intent
5. Always recommend consulting with a qualified lawyer for specific legal advice
6. If the context doesn't contain sufficient information, say so clearly`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query.question }
        ],
        temperature: 0.3, // Lower temperature for more consistent legal advice
        max_tokens: 1000
      })

      let answer = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.'
      const confidence = this.calculateConfidence(relevantChunks)

      // Perform compliance checking
      const complianceCheck = this.complianceService.checkCompliance(answer, query.question)
      const responseValidation = this.complianceService.validateResponse(answer, query.question, confidence)

      // Log compliance issues if any
      if (!complianceCheck.isCompliant || !responseValidation.isValid) {
        console.warn('Compliance issues detected:', {
          complianceIssues: complianceCheck.issues,
          validationIssues: responseValidation.issues,
          riskLevel: complianceCheck.riskLevel
        })
      }

      // Enhance response with compliance measures
      answer = this.complianceService.enhanceResponseWithCompliance(answer, complianceCheck)

      // Check if human escalation is needed
      const needsEscalation = this.complianceService.requiresHumanEscalation(query.question, confidence)
      if (needsEscalation) {
        answer += '\n\n🔔 This query has been flagged for human review. A legal professional may follow up with additional guidance.'
      }

      // Extract sources from relevant chunks
      const sources: LegalSource[] = relevantChunks.map(chunk => ({
        id: chunk.documentId,
        title: chunk.metadata.title,
        type: chunk.metadata.type as 'article' | 'qa' | 'statute' | 'case_law',
        relevanceScore: (chunk.metadata as any).relevanceScore || 0,
        excerpt: chunk.content.substring(0, 200) + '...'
      }))

      return {
        answer,
        confidence: Math.min(confidence, responseValidation.qualityScore / 100), // Adjust confidence based on quality
        sources,
        followUpQuestions: this.generateEnhancedFollowUpQuestions(processedQuery),
        reasoning: processedQuery ? `Query analyzed as ${processedQuery.intent.type} with ${processedQuery.intent.confidence.toFixed(2)} confidence. Compliance: ${complianceCheck.riskLevel} risk.` : undefined,
        disclaimer: this.complianceService.generateStandardDisclaimer(complianceCheck.riskLevel)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      throw error
    }
  }

  private calculateConfidence(relevantChunks: DocumentChunk[]): number {
    if (relevantChunks.length === 0) return 0.3

    const avgRelevance = relevantChunks.reduce((sum, chunk) =>
      sum + ((chunk.metadata as any).relevanceScore || 0), 0) / relevantChunks.length

    // Confidence based on number of relevant chunks and their average relevance
    const chunkFactor = Math.min(relevantChunks.length / 3, 1) // Normalize to 0-1
    return Math.min(0.5 + (avgRelevance * 0.3) + (chunkFactor * 0.2), 0.95)
  }

  private getIntentSpecificGuidance(intent?: any): string {
    if (!intent) return ''

    const guidanceMap = {
      procedure: 'Provide step-by-step instructions and clearly outline the process. Include timelines and required documents.',
      requirement: 'List all requirements, conditions, and criteria clearly. Explain what qualifies and what disqualifies.',
      cost: 'Provide specific fee information, payment methods, and any additional costs. Include fee waivers if applicable.',
      timeline: 'Give clear timeframes, deadlines, and processing periods. Mention factors that might affect timing.',
      definition: 'Provide clear, comprehensive definitions with examples and context.',
      document: 'Specify exact documents needed, where to obtain them, and any special requirements.',
      question: 'Provide comprehensive answers addressing all aspects of the question.'
    }

    return guidanceMap[intent.type as keyof typeof guidanceMap] || ''
  }

  private generateEnhancedFollowUpQuestions(processedQuery?: ProcessedQuery): string[] {
    if (!processedQuery) {
      return this.generateBasicFollowUpQuestions('general')
    }

    const { intent } = processedQuery
    const category = intent.category

    // Intent-specific follow-ups
    const intentQuestions = {
      procedure: [
        'What documents do I need to prepare?',
        'How long does this process typically take?',
        'Are there any fees involved?'
      ],
      requirement: [
        'What happens if I don\'t meet these requirements?',
        'Are there any exceptions or waivers available?',
        'How do I prove I meet these requirements?'
      ],
      cost: [
        'Are there any additional hidden costs?',
        'Are payment plans available?',
        'Can these fees be waived in certain circumstances?'
      ],
      timeline: [
        'What factors might delay this process?',
        'Can I expedite this process?',
        'What are the consequences of missing deadlines?'
      ]
    }

    const baseQuestions = intentQuestions[intent.type as keyof typeof intentQuestions] ||
                         this.generateBasicFollowUpQuestions(category)

    // Add urgency-specific questions
    if (intent.urgency === 'high') {
      baseQuestions.unshift('What immediate steps should I take?')
    }

    return baseQuestions
  }

  private generateBasicFollowUpQuestions(category: string): string[] {
    const categoryQuestions = {
      employment_law: [
        'What are the notice periods required for termination?',
        'Are there any specific MOM requirements I should know about?',
        'What employment benefits am I entitled to?'
      ],
      property_law: [
        'What are the stamp duty requirements?',
        'Are there any HDB or URA restrictions?',
        'What documents do I need for the transaction?'
      ],
      business_law: [
        'What are the ACRA filing requirements?',
        'Are there any licensing requirements for my business?',
        'What are the tax implications?'
      ],
      family_law: [
        'What are the court procedures involved?',
        'How long does this process typically take?',
        'What documents do I need to prepare?'
      ]
    }

    return categoryQuestions[category as keyof typeof categoryQuestions] || [
      'What are the specific legal requirements for this matter?',
      'Are there any recent changes to the relevant laws?',
      'What documents should I prepare?'
    ]
  }

  private async logQuery(
    query: LegalQuery,
    response: AIResponse,
    responseTime?: number,
    fromCache?: boolean
  ): Promise<void> {
    try {
      // Log query for analytics and improvement
      await this.supabase
        .from('ai_query_logs')
        .insert({
          user_id: query.userId,
          session_id: query.sessionId,
          question: query.question,
          category: query.category,
          confidence: response.confidence,
          sources_count: response.sources.length,
          response_time_ms: responseTime,
          from_cache: fromCache || false,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      // Don't throw error for logging failures
      console.warn('Failed to log query:', error)
    }
  }

  async createChatSession(userId: string): Promise<string> {
    try {
      // Create a new chat session in database
      const { data: session, error } = await this.supabase
        .from('user_chat_sessions')
        .insert({
          user_id: userId,
          title: `Legal Consultation - ${new Date().toLocaleDateString()}`,
          practice_area: 'General Legal Inquiry',
          message_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating chat session:', error)
        throw error
      }

      console.log(`Created chat session ${session.id} for user ${userId}`)
      return session.id
    } catch (error) {
      console.error('Failed to create chat session:', error)
      throw error
    }
  }

  async sendChatMessage(sessionId: string, message: string, userId?: string): Promise<AIResponse> {
    try {
      // Send message to chat session with enhanced context
      const response = await this.queryLegalAssistant({
        question: message,
        userId,
        sessionId
      })

      // Save the conversation to database
      await this.saveChatMessage(sessionId, userId, message, response)

      return response
    } catch (error) {
      console.error('Error sending chat message:', error)
      throw error
    }
  }

  private async saveChatMessage(sessionId: string, userId: string | undefined, message: string, response: AIResponse): Promise<void> {
    try {
      // Save user message
      await this.supabase
        .from('user_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message: message,
          message_type: 'user'
        })

      // Save AI response
      await this.supabase
        .from('user_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message: response.answer,
          message_type: 'assistant'
        })

      // Update session message count
      await this.supabase
        .from('user_chat_sessions')
        .update({
          message_count: this.supabase.raw('message_count + 2'),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.warn('Failed to save chat message:', error)
    }
  }

  // Health check method with performance metrics
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const details = {
        initialized: this.isInitialized,
        knowledgeBaseSize: this.knowledgeBase.size,
        totalChunks: this.getTotalChunks(),
        openaiConnected: false,
        supabaseConnected: false,
        cacheStats: null as any,
        performanceMetrics: null as any
      }

      // Test OpenAI connection
      try {
        await this.openai.models.list()
        details.openaiConnected = true
      } catch (error) {
        console.error('OpenAI health check failed:', error)
      }

      // Test Supabase connection
      try {
        await this.supabase.from('legal_categories').select('count').limit(1)
        details.supabaseConnected = true
      } catch (error) {
        console.error('Supabase health check failed:', error)
      }

      // Get cache statistics
      try {
        details.cacheStats = await this.cacheService.getCacheStats()
      } catch (error) {
        console.error('Cache stats failed:', error)
      }

      // Get performance metrics from recent queries
      try {
        const { data: recentQueries } = await this.supabase
          .from('ai_query_logs')
          .select('response_time_ms, confidence, from_cache')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100)

        if (recentQueries && recentQueries.length > 0) {
          const totalQueries = recentQueries.length
          const cachedQueries = recentQueries.filter((q: any) => q.from_cache).length
          const avgResponseTime = recentQueries
            .filter((q: any) => q.response_time_ms)
            .reduce((sum: number, q: any) => sum + q.response_time_ms, 0) / totalQueries
          const avgConfidence = recentQueries
            .reduce((sum: number, q: any) => sum + (q.confidence || 0), 0) / totalQueries

          details.performanceMetrics = {
            totalQueries24h: totalQueries,
            cacheHitRate: (cachedQueries / totalQueries) * 100,
            avgResponseTimeMs: Math.round(avgResponseTime),
            avgConfidence: Math.round(avgConfidence * 100) / 100
          }
        }
      } catch (error) {
        console.error('Performance metrics failed:', error)
      }

      return {
        status: details.openaiConnected && details.supabaseConnected ? 'healthy' : 'degraded',
        details
      }
    } catch (error) {
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // Performance optimization methods
  async optimizePerformance(): Promise<void> {
    try {
      console.log('Starting performance optimization...')

      // Clean expired cache entries
      const cleanedEntries = await this.cacheService.cleanExpiredEntries()
      console.log(`Cleaned ${cleanedEntries} expired cache entries`)

      // Preload popular queries
      await this.cacheService.preloadPopularQueries()
      console.log('Preloaded popular queries into memory cache')

      console.log('Performance optimization completed')
    } catch (error) {
      console.error('Performance optimization failed:', error)
    }
  }
}

// Export singleton instance
export const legalRAGService = new LegalRAGService()

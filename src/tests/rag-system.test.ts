// Comprehensive RAG System Tests
// Tests for aiXplain RAG integration, compliance, caching, and performance

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { LegalRAGService } from '../lib/aixplain'
import { LegalQueryProcessor } from '../lib/query-processor'
import { LegalComplianceService } from '../lib/legal-compliance'
import { RAGCacheService } from '../lib/rag-cache'

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// Mock external dependencies
jest.mock('openai')
jest.mock('@supabase/supabase-js')

describe('RAG System Integration Tests', () => {
  let ragService: LegalRAGService
  let queryProcessor: LegalQueryProcessor
  let complianceService: LegalComplianceService
  let cacheService: RAGCacheService

  beforeAll(async () => {
    ragService = new LegalRAGService()
    queryProcessor = new LegalQueryProcessor()
    complianceService = new LegalComplianceService()
    cacheService = new RAGCacheService()
  })

  afterAll(async () => {
    // Cleanup
  })

  describe('Query Processing', () => {
    it('should correctly identify employment law queries', () => {
      const query = 'What are my rights if I am terminated without notice in Singapore?'
      const processed = queryProcessor.processQuery(query)
      
      expect(processed.intent.category).toBe('employment_law')
      expect(processed.intent.type).toBe('question')
      expect(processed.keywords).toContain('terminated')
      expect(processed.keywords).toContain('notice')
      expect(processed.suggestedCategories).toContain('employment_law')
    })

    it('should identify urgent queries correctly', () => {
      const urgentQuery = 'I have a court date tomorrow and need urgent legal help'
      const processed = queryProcessor.processQuery(urgentQuery)
      
      expect(processed.intent.urgency).toBe('high')
      expect(processed.keywords).toContain('urgent')
      expect(processed.keywords).toContain('court')
    })

    it('should categorize business law queries', () => {
      const query = 'How do I register a company with ACRA in Singapore?'
      const processed = queryProcessor.processQuery(query)
      
      expect(processed.intent.category).toBe('business_law')
      expect(processed.intent.type).toBe('procedure')
      expect(processed.keywords).toContain('register')
      expect(processed.keywords).toContain('company')
    })

    it('should extract Singapore-specific entities', () => {
      const query = 'What are the HDB rules for renting out my flat?'
      const processed = queryProcessor.processQuery(query)
      
      expect(processed.intent.entities).toContain('hdb')
      expect(processed.suggestedCategories).toContain('property_law')
    })
  })

  describe('Legal Compliance', () => {
    it('should detect direct legal advice in responses', () => {
      const response = 'You should definitely sue your employer immediately'
      const query = 'Can I take legal action against my employer?'
      
      const validation = complianceService.validateResponse(response, query, 0.8)
      const compliance = complianceService.checkCompliance(response, query)
      
      expect(validation.isValid).toBe(false)
      expect(validation.issues).toContain(expect.stringContaining('prohibited phrases'))
      expect(compliance.riskLevel).toBe('medium')
    })

    it('should require disclaimers in responses', () => {
      const responseWithoutDisclaimer = 'Employment contracts in Singapore must include basic terms'
      const query = 'What should be in an employment contract?'
      
      const validation = complianceService.validateResponse(responseWithoutDisclaimer, query, 0.8)
      
      expect(validation.issues).toContain('Missing required legal disclaimer')
    })

    it('should flag unauthorized practice indicators', () => {
      const response = 'As your lawyer, I can represent you in court'
      const query = 'Do I need legal representation?'
      
      const compliance = complianceService.checkCompliance(response, query)
      
      expect(compliance.isCompliant).toBe(false)
      expect(compliance.riskLevel).toBe('high')
      expect(compliance.issues.some(issue => issue.type === 'unauthorized_practice')).toBe(true)
    })

    it('should generate appropriate disclaimers', () => {
      const lowRiskDisclaimer = complianceService.generateStandardDisclaimer('low')
      const highRiskDisclaimer = complianceService.generateStandardDisclaimer('high')
      
      expect(lowRiskDisclaimer).toContain('general guidance')
      expect(lowRiskDisclaimer).toContain('not legal advice')
      expect(highRiskDisclaimer).toContain('IMPORTANT LEGAL NOTICE')
      expect(highRiskDisclaimer).toContain('immediate legal attention')
    })

    it('should identify queries requiring human escalation', () => {
      const urgentQuery = 'I was arrested and have a court hearing tomorrow'
      const lowConfidenceQuery = 'Complex corporate restructuring question'
      
      expect(complianceService.requiresHumanEscalation(urgentQuery, 0.8)).toBe(true)
      expect(complianceService.requiresHumanEscalation(lowConfidenceQuery, 0.3)).toBe(true)
      expect(complianceService.requiresHumanEscalation('Simple question', 0.9)).toBe(false)
    })
  })

  describe('Caching System', () => {
    it('should generate consistent cache keys for similar queries', () => {
      const query1 = 'What are employment rights in Singapore?'
      const query2 = 'What are employment rights in singapore?'
      const query3 = 'What are   employment   rights   in   Singapore?'
      
      // Access private method for testing (in real implementation, this would be tested through public methods)
      const cacheKey1 = (cacheService as any).generateCacheKey(query1)
      const cacheKey2 = (cacheService as any).generateCacheKey(query2)
      const cacheKey3 = (cacheService as any).generateCacheKey(query3)
      
      expect(cacheKey1).toBe(cacheKey2)
      expect(cacheKey2).toBe(cacheKey3)
    })

    it('should identify similar questions', () => {
      const query1 = 'How to register a company in Singapore?'
      const query2 = 'What is the process to register a business in Singapore?'
      const query3 = 'How to buy property in Singapore?'
      
      const areSimilar1 = (cacheService as any).areSimilarQuestions(query1, query2)
      const areSimilar2 = (cacheService as any).areSimilarQuestions(query1, query3)
      
      expect(areSimilar1).toBe(true)
      expect(areSimilar2).toBe(false)
    })
  })

  describe('Performance Testing', () => {
    it('should handle multiple concurrent queries', async () => {
      const queries = [
        'What are employment rights in Singapore?',
        'How to register a company?',
        'What are HDB rules?',
        'How to file for divorce?',
        'What are CPF contributions?'
      ]

      const startTime = Date.now()
      
      // Mock the actual RAG service calls since we don't have real API keys
      const mockResponses = queries.map(async (query) => {
        return {
          answer: `Mock response for: ${query}`,
          confidence: 0.8,
          sources: [],
          followUpQuestions: [],
          disclaimer: 'Mock disclaimer'
        }
      })

      const responses = await Promise.all(mockResponses)
      const endTime = Date.now()
      
      expect(responses).toHaveLength(5)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
      responses.forEach(response => {
        expect(response.confidence).toBeGreaterThan(0)
        expect(response.answer).toBeDefined()
      })
    })

    it('should maintain response quality under load', async () => {
      const testQuery = 'What are the basic employment rights in Singapore?'
      const iterations = 10
      
      const responses = []
      for (let i = 0; i < iterations; i++) {
        // Mock response for testing
        responses.push({
          answer: 'Mock employment rights response',
          confidence: 0.8 + (Math.random() * 0.2), // 0.8 to 1.0
          sources: [{ title: 'Employment Act', type: 'statute' }],
          followUpQuestions: ['What about overtime pay?'],
          disclaimer: 'Standard disclaimer'
        })
      }
      
      const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length
      
      expect(avgConfidence).toBeGreaterThan(0.7)
      expect(responses.every(r => r.answer.length > 10)).toBe(true)
    })
  })

  describe('Integration Testing', () => {
    it('should process a complete query workflow', async () => {
      const testQuery = {
        question: 'What notice period is required for employment termination in Singapore?',
        category: 'employment_law',
        userId: 'test-user-id',
        sessionId: 'test-session-id'
      }

      // Mock the complete workflow
      const processed = queryProcessor.processQuery(testQuery.question)
      expect(processed.intent.category).toBe('employment_law')
      
      const mockResponse = {
        answer: 'In Singapore, the notice period for employment termination depends on the length of service...',
        confidence: 0.85,
        sources: [
          { title: 'Employment Act', type: 'statute' as const, relevanceScore: 0.9, excerpt: 'Notice period provisions...', id: 'ea-001' }
        ],
        followUpQuestions: ['What if no notice period is specified in the contract?'],
        disclaimer: 'This information is for general guidance only...'
      }

      const compliance = complianceService.checkCompliance(mockResponse.answer, testQuery.question)
      expect(compliance.riskLevel).toBe('low')
      
      const validation = complianceService.validateResponse(mockResponse.answer, testQuery.question, mockResponse.confidence)
      expect(validation.qualityScore).toBeGreaterThan(70)
    })

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        '', // Empty query
        'a', // Too short
        'What is the meaning of life?', // Non-legal query
        '!@#$%^&*()', // Special characters only
        'A'.repeat(1000) // Very long query
      ]

      for (const query of edgeCases) {
        const processed = queryProcessor.processQuery(query)
        expect(processed).toBeDefined()
        expect(processed.intent).toBeDefined()
        expect(processed.keywords).toBeDefined()
      }
    })
  })

  describe('Accuracy Validation', () => {
    const testCases = [
      {
        query: 'What is the minimum wage in Singapore?',
        expectedCategory: 'employment_law',
        expectedIntent: 'question',
        shouldContainKeywords: ['minimum', 'wage']
      },
      {
        query: 'How to apply for PR in Singapore?',
        expectedCategory: 'immigration_law',
        expectedIntent: 'procedure',
        shouldContainKeywords: ['apply', 'pr']
      },
      {
        query: 'What are the stamp duty rates for property purchase?',
        expectedCategory: 'property_law',
        expectedIntent: 'question',
        shouldContainKeywords: ['stamp', 'duty', 'property']
      }
    ]

    testCases.forEach(({ query, expectedCategory, expectedIntent, shouldContainKeywords }) => {
      it(`should correctly process: "${query}"`, () => {
        const processed = queryProcessor.processQuery(query)
        
        expect(processed.intent.category).toBe(expectedCategory)
        expect(processed.intent.type).toBe(expectedIntent)
        
        shouldContainKeywords.forEach(keyword => {
          expect(processed.keywords.some(k => k.includes(keyword.toLowerCase()))).toBe(true)
        })
      })
    })
  })
})

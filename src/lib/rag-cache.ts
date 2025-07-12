// RAG System Caching and Performance Optimization
// Implements intelligent caching for AI responses and query optimization

import { createClient } from '@supabase/supabase-js'

export interface CacheEntry {
  id: string
  queryHash: string
  question: string
  response: any
  confidence: number
  sources: any[]
  hitCount: number
  lastAccessed: string
  createdAt: string
  expiresAt: string
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  averageResponseTime: number
  cacheSize: number
  topQueries: Array<{
    question: string
    hitCount: number
  }>
}

export class RAGCacheService {
  private readonly supabase: any
  private readonly memoryCache: Map<string, CacheEntry> = new Map()
  private readonly maxMemoryCacheSize = 1000
  private readonly defaultTTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Generate cache key from query
  private generateCacheKey(question: string, category?: string): string {
    const normalizedQuestion = question.toLowerCase().trim().replace(/\s+/g, ' ')
    const keyData = category ? `${normalizedQuestion}:${category}` : normalizedQuestion
    
    // Simple hash function for cache key
    let hash = 0
    for (let i = 0; i < keyData.length; i++) {
      const char = keyData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `rag_cache_${Math.abs(hash).toString(36)}`
  }

  // Check if two questions are similar enough to share cache
  private areSimilarQuestions(q1: string, q2: string): boolean {
    const normalize = (q: string) => q.toLowerCase().replace(/[^\w\s]/g, '').trim()
    const norm1 = normalize(q1)
    const norm2 = normalize(q2)
    
    // Simple similarity check - can be enhanced with more sophisticated algorithms
    const words1 = new Set(norm1.split(/\s+/))
    const words2 = new Set(norm2.split(/\s+/))
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)))
    const union = new Set([...Array.from(words1), ...Array.from(words2)])
    
    const similarity = intersection.size / union.size
    return similarity > 0.7 // 70% similarity threshold
  }

  // Get cached response
  async getCachedResponse(question: string, category?: string): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(question, category)
    
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(cacheKey)
      if (memoryEntry && new Date(memoryEntry.expiresAt) > new Date()) {
        // Update hit count and last accessed
        memoryEntry.hitCount++
        memoryEntry.lastAccessed = new Date().toISOString()
        
        // Update database asynchronously
        this.updateCacheHit(memoryEntry.id).catch(console.error)
        
        return memoryEntry
      }

      // Check database cache
      const { data: cacheEntry, error } = await this.supabase
        .from('rag_cache')
        .select('*')
        .eq('query_hash', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !cacheEntry) {
        // Try to find similar questions
        return await this.findSimilarCachedResponse(question, category)
      }

      // Convert to CacheEntry format
      const entry: CacheEntry = {
        id: cacheEntry.id,
        queryHash: cacheEntry.query_hash,
        question: cacheEntry.question,
        response: cacheEntry.response,
        confidence: cacheEntry.confidence,
        sources: cacheEntry.sources || [],
        hitCount: cacheEntry.hit_count,
        lastAccessed: new Date().toISOString(),
        createdAt: cacheEntry.created_at,
        expiresAt: cacheEntry.expires_at
      }

      // Add to memory cache
      this.addToMemoryCache(entry)
      
      // Update hit count
      await this.updateCacheHit(entry.id)
      
      return entry
    } catch (error) {
      console.error('Error getting cached response:', error)
      return null
    }
  }

  // Find similar cached responses
  private async findSimilarCachedResponse(question: string, category?: string): Promise<CacheEntry | null> {
    try {
      // Get recent cache entries for similarity comparison
      const { data: recentEntries, error } = await this.supabase
        .from('rag_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .limit(50)

      if (error || !recentEntries) {
        return null
      }

      // Find most similar question
      for (const entry of recentEntries) {
        if (this.areSimilarQuestions(question, entry.question)) {
          const cacheEntry: CacheEntry = {
            id: entry.id,
            queryHash: entry.query_hash,
            question: entry.question,
            response: entry.response,
            confidence: entry.confidence * 0.9, // Slightly reduce confidence for similar matches
            sources: entry.sources || [],
            hitCount: entry.hit_count,
            lastAccessed: new Date().toISOString(),
            createdAt: entry.created_at,
            expiresAt: entry.expires_at
          }

          // Update hit count for similar match
          await this.updateCacheHit(entry.id)
          
          return cacheEntry
        }
      }

      return null
    } catch (error) {
      console.error('Error finding similar cached response:', error)
      return null
    }
  }

  // Cache new response
  async cacheResponse(
    question: string, 
    response: any, 
    confidence: number, 
    sources: any[], 
    category?: string,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(question, category)
    const expiresAt = new Date(Date.now() + (ttl || this.defaultTTL))
    
    try {
      const cacheEntry = {
        query_hash: cacheKey,
        question,
        response,
        confidence,
        sources,
        category,
        hit_count: 0,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }

      // Save to database
      const { data, error } = await this.supabase
        .from('rag_cache')
        .insert(cacheEntry)
        .select()
        .single()

      if (error) {
        console.error('Error caching response:', error)
        return
      }

      // Add to memory cache
      const memoryEntry: CacheEntry = {
        id: data.id,
        queryHash: cacheKey,
        question,
        response,
        confidence,
        sources,
        hitCount: 0,
        lastAccessed: new Date().toISOString(),
        createdAt: data.created_at,
        expiresAt: expiresAt.toISOString()
      }

      this.addToMemoryCache(memoryEntry)
    } catch (error) {
      console.error('Error caching response:', error)
    }
  }

  // Add entry to memory cache with size management
  private addToMemoryCache(entry: CacheEntry): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const oldestKey = Array.from(this.memoryCache.keys())[0]
      this.memoryCache.delete(oldestKey)
    }

    this.memoryCache.set(entry.queryHash, entry)
  }

  // Update cache hit count
  private async updateCacheHit(cacheId: string): Promise<void> {
    try {
      await this.supabase
        .from('rag_cache')
        .update({ 
          hit_count: this.supabase.raw('hit_count + 1'),
          last_accessed: new Date().toISOString()
        })
        .eq('id', cacheId)
    } catch (error) {
      console.error('Error updating cache hit:', error)
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<CacheStats> {
    try {
      // Get total entries
      const { count: totalEntries } = await this.supabase
        .from('rag_cache')
        .select('*', { count: 'exact', head: true })

      // Get hit rate data
      const { data: hitData } = await this.supabase
        .from('rag_cache')
        .select('hit_count')
        .gt('hit_count', 0)

      const totalHits = hitData?.reduce((sum: number, entry: any) => sum + entry.hit_count, 0) || 0
      const hitRate = totalEntries ? (hitData?.length || 0) / totalEntries : 0

      // Get top queries
      const { data: topQueries } = await this.supabase
        .from('rag_cache')
        .select('question, hit_count')
        .gt('hit_count', 0)
        .order('hit_count', { ascending: false })
        .limit(10)

      return {
        totalEntries: totalEntries || 0,
        hitRate: hitRate * 100,
        averageResponseTime: 0, // Would need to track this separately
        cacheSize: this.memoryCache.size,
        topQueries: topQueries?.map((q: any) => ({
          question: q.question,
          hitCount: q.hit_count
        })) || []
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalEntries: 0,
        hitRate: 0,
        averageResponseTime: 0,
        cacheSize: this.memoryCache.size,
        topQueries: []
      }
    }
  }

  // Clean expired cache entries
  async cleanExpiredEntries(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('rag_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id')

      if (error) {
        console.error('Error cleaning expired cache entries:', error)
        return 0
      }

      // Clean memory cache
      const keysToDelete: string[] = []
      this.memoryCache.forEach((entry, key) => {
        if (new Date(entry.expiresAt) <= new Date()) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach(key => this.memoryCache.delete(key))

      return data?.length || 0
    } catch (error) {
      console.error('Error cleaning expired cache entries:', error)
      return 0
    }
  }

  // Preload popular queries into memory cache
  async preloadPopularQueries(): Promise<void> {
    try {
      const { data: popularQueries } = await this.supabase
        .from('rag_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .gt('hit_count', 2)
        .order('hit_count', { ascending: false })
        .limit(100)

      if (popularQueries) {
        for (const entry of popularQueries) {
          const cacheEntry: CacheEntry = {
            id: entry.id,
            queryHash: entry.query_hash,
            question: entry.question,
            response: entry.response,
            confidence: entry.confidence,
            sources: entry.sources || [],
            hitCount: entry.hit_count,
            lastAccessed: entry.last_accessed || entry.created_at,
            createdAt: entry.created_at,
            expiresAt: entry.expires_at
          }

          this.addToMemoryCache(cacheEntry)
        }
      }
    } catch (error) {
      console.error('Error preloading popular queries:', error)
    }
  }
}

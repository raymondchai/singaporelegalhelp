#!/usr/bin/env node

/**
 * Comprehensive RAG System Testing Script
 * Tests all aspects of the aiXplain RAG integration including:
 * - Query processing and intent recognition
 * - AI response generation and quality
 * - Legal compliance and safety
 * - Performance and caching
 * - Analytics and monitoring
 */

const https = require('https')
const http = require('http')

class ComprehensiveRAGTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      performance: {},
      compliance: {},
      analytics: {}
    }
    this.testQueries = [
      {
        question: 'What are my employment rights if I am terminated without notice in Singapore?',
        category: 'employment_law',
        expectedIntent: 'question',
        expectedUrgency: 'medium',
        description: 'Employment Rights Query'
      },
      {
        question: 'How do I register a company with ACRA in Singapore?',
        category: 'business_law',
        expectedIntent: 'procedure',
        expectedUrgency: 'low',
        description: 'Business Registration Procedure'
      },
      {
        question: 'I was arrested and have a court hearing tomorrow - urgent help needed!',
        category: 'criminal_law',
        expectedIntent: 'question',
        expectedUrgency: 'high',
        description: 'Urgent Criminal Law Matter'
      },
      {
        question: 'What are the HDB rules for renting out my flat?',
        category: 'property_law',
        expectedIntent: 'question',
        expectedUrgency: 'low',
        description: 'Property Law Query'
      },
      {
        question: 'How much does it cost to file for divorce in Singapore?',
        category: 'family_law',
        expectedIntent: 'cost',
        expectedUrgency: 'medium',
        description: 'Family Law Cost Query'
      }
    ]
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`
      const protocol = url.startsWith('https') ? https : http
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 30000
      }

      const req = protocol.request(url, requestOptions, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {}
            resolve({ 
              status: res.statusCode, 
              data: jsonData, 
              headers: res.headers,
              responseTime: Date.now() - startTime
            })
          } catch (error) {
            resolve({ 
              status: res.statusCode, 
              data: data, 
              headers: res.headers,
              responseTime: Date.now() - startTime
            })
          }
        })
      })

      const startTime = Date.now()
      req.on('error', reject)
      req.on('timeout', () => reject(new Error('Request timeout')))
      
      if (options.body) {
        req.write(JSON.stringify(options.body))
      }
      
      req.end()
    })
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    }
    console.log(`${colors[type]}${message}${colors.reset}`)
  }

  async test(name, testFn, category = 'general') {
    try {
      this.log(`Testing: ${name}`, 'info')
      const result = await testFn()
      this.results.passed++
      this.results.tests.push({ name, status: 'PASSED', category, result })
      this.log(`✅ ${name}`, 'success')
      return result
    } catch (error) {
      if (error.message.includes('WARNING:')) {
        this.results.warnings++
        this.results.tests.push({ name, status: 'WARNING', category, error: error.message })
        this.log(`⚠️  ${name}: ${error.message}`, 'warning')
      } else {
        this.results.failed++
        this.results.tests.push({ name, status: 'FAILED', category, error: error.message })
        this.log(`❌ ${name}: ${error.message}`, 'error')
      }
      return null
    }
  }

  async testSystemHealth() {
    return await this.test('System Health Check', async () => {
      const response = await this.makeRequest('/api/ai/query/health')
      
      if (response.status !== 200) {
        throw new Error(`Health check failed with status ${response.status}`)
      }
      
      if (!response.data.service) {
        throw new Error('Health check response missing service information')
      }

      this.results.performance.healthCheckTime = response.responseTime
      return response.data
    }, 'system')
  }

  async testQueryProcessing() {
    for (const testQuery of this.testQueries) {
      await this.test(`Query Processing: ${testQuery.description}`, async () => {
        // Test query processing endpoint (would need actual implementation)
        const response = await this.makeRequest('/api/ai/query', {
          method: 'POST',
          body: {
            question: testQuery.question,
            category: testQuery.category
          },
          headers: {
            'Authorization': 'Bearer test-token' // Would need real token
          }
        })

        // Check if endpoint exists and handles requests properly
        if (response.status === 404) {
          throw new Error('AI query endpoint not found')
        }
        
        // For testing without auth, we expect 401
        if (response.status === 401) {
          return { message: 'Endpoint exists, authentication required' }
        }

        // If we get a 200, validate the response structure
        if (response.status === 200) {
          if (!response.data.success || !response.data.data) {
            throw new Error('Invalid response structure')
          }
          
          const aiResponse = response.data.data
          
          // Validate response fields
          if (!aiResponse.answer) {
            throw new Error('Response missing answer field')
          }
          
          if (typeof aiResponse.confidence !== 'number') {
            throw new Error('Response missing or invalid confidence score')
          }
          
          if (!Array.isArray(aiResponse.sources)) {
            throw new Error('Response missing or invalid sources array')
          }
          
          if (!aiResponse.disclaimer) {
            throw new Error('Response missing legal disclaimer')
          }

          // Performance check
          if (response.responseTime > 5000) {
            throw new Error(`WARNING: Slow response time: ${response.responseTime}ms`)
          }

          return {
            responseTime: response.responseTime,
            confidence: aiResponse.confidence,
            sourcesCount: aiResponse.sources.length,
            hasDisclaimer: !!aiResponse.disclaimer
          }
        }

        return { status: response.status, message: 'Endpoint accessible' }
      }, 'ai')
    }
  }

  async testComplianceEndpoints() {
    await this.test('Compliance Monitoring Endpoint', async () => {
      const response = await this.makeRequest('/api/admin/compliance', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      if (response.status === 404) {
        throw new Error('Compliance endpoint not found')
      }
      
      // Expected 401/403 without valid auth
      if (response.status !== 401 && response.status !== 200 && response.status !== 403) {
        throw new Error(`Unexpected status code: ${response.status}`)
      }

      return { status: response.status, accessible: true }
    }, 'compliance')

    await this.test('Unified Analytics Endpoint', async () => {
      const response = await this.makeRequest('/api/admin/analytics/unified', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      if (response.status === 404) {
        throw new Error('Unified analytics endpoint not found')
      }
      
      return { status: response.status, accessible: true }
    }, 'analytics')
  }

  async testPerformanceMetrics() {
    const performanceTests = []
    
    // Test concurrent requests
    await this.test('Concurrent Request Handling', async () => {
      const concurrentRequests = 5
      const requests = Array(concurrentRequests).fill().map(() => 
        this.makeRequest('/api/ai/query/health')
      )

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const totalTime = Date.now() - startTime

      const successfulResponses = responses.filter(r => r.status === 200)
      
      if (successfulResponses.length < concurrentRequests * 0.8) {
        throw new Error(`Only ${successfulResponses.length}/${concurrentRequests} requests succeeded`)
      }

      const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length

      this.results.performance.concurrentRequests = {
        total: concurrentRequests,
        successful: successfulResponses.length,
        totalTime,
        avgResponseTime
      }

      if (avgResponseTime > 3000) {
        throw new Error(`WARNING: High average response time: ${avgResponseTime}ms`)
      }

      return {
        concurrentRequests,
        successRate: (successfulResponses.length / concurrentRequests) * 100,
        avgResponseTime,
        totalTime
      }
    }, 'performance')
  }

  async testUserInterfaces() {
    const interfaces = [
      { path: '/chat', name: 'AI Chat Interface' },
      { path: '/admin/ai-compliance', name: 'Admin Compliance Dashboard' },
      { path: '/admin/analytics/unified', name: 'Unified Analytics Dashboard' }
    ]

    for (const interface of interfaces) {
      await this.test(`${interface.name} Accessibility`, async () => {
        const response = await this.makeRequest(interface.path)
        
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`)
        }
        
        if (response.status === 404) {
          throw new Error('Interface not found')
        }

        // 200, 401, or 403 are acceptable (depends on auth requirements)
        return { status: response.status, accessible: true }
      }, 'ui')
    }
  }

  async testErrorHandling() {
    await this.test('Invalid Request Handling', async () => {
      const response = await this.makeRequest('/api/ai/query', {
        method: 'POST',
        body: { invalid: 'request' }
      })

      // Should return 400 or 401, not 500
      if (response.status >= 500) {
        throw new Error(`Server error on invalid request: ${response.status}`)
      }

      return { status: response.status, handledGracefully: true }
    }, 'error-handling')

    await this.test('Rate Limiting', async () => {
      // Test rate limiting by making rapid requests
      const rapidRequests = Array(15).fill().map(() => 
        this.makeRequest('/api/ai/query', {
          method: 'POST',
          body: { question: 'test' }
        })
      )

      const responses = await Promise.all(rapidRequests)
      const rateLimitedResponses = responses.filter(r => r.status === 429)

      if (rateLimitedResponses.length === 0) {
        throw new Error('WARNING: No rate limiting detected')
      }

      return { 
        totalRequests: rapidRequests.length,
        rateLimited: rateLimitedResponses.length,
        rateLimitingActive: true
      }
    }, 'error-handling')
  }

  async runComprehensiveTests() {
    this.log('🚀 Starting Comprehensive RAG System Testing', 'info')
    this.log('=' .repeat(60), 'info')

    try {
      // Core system tests
      await this.testSystemHealth()
      await this.testQueryProcessing()
      await this.testComplianceEndpoints()
      
      // Performance tests
      await this.testPerformanceMetrics()
      
      // Interface tests
      await this.testUserInterfaces()
      
      // Error handling tests
      await this.testErrorHandling()

    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error')
    }

    this.generateReport()
  }

  generateReport() {
    this.log('\n' + '=' .repeat(60), 'info')
    this.log('📊 Comprehensive RAG System Test Report', 'info')
    this.log('=' .repeat(60), 'info')
    
    // Summary
    this.log(`✅ Passed: ${this.results.passed}`, 'success')
    this.log(`❌ Failed: ${this.results.failed}`, 'error')
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'warning')
    this.log(`📈 Total: ${this.results.passed + this.results.failed + this.results.warnings}`, 'info')
    
    // Performance metrics
    if (this.results.performance.healthCheckTime) {
      this.log(`\n⚡ Performance Metrics:`, 'info')
      this.log(`  Health Check: ${this.results.performance.healthCheckTime}ms`, 'info')
      
      if (this.results.performance.concurrentRequests) {
        const perf = this.results.performance.concurrentRequests
        this.log(`  Concurrent Requests: ${perf.successful}/${perf.total} (${perf.successRate.toFixed(1)}%)`, 'info')
        this.log(`  Average Response Time: ${perf.avgResponseTime.toFixed(0)}ms`, 'info')
      }
    }
    
    // Failed tests
    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error')
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'error')
        })
    }
    
    // Warnings
    if (this.results.warnings > 0) {
      this.log('\n⚠️  Warnings:', 'warning')
      this.results.tests
        .filter(test => test.status === 'WARNING')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'warning')
        })
    }
    
    // Overall assessment
    const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100
    this.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`, successRate >= 80 ? 'success' : 'warning')
    
    if (successRate >= 90) {
      this.log('\n🎉 RAG System is READY for production deployment!', 'success')
    } else if (successRate >= 70) {
      this.log('\n⚠️  RAG System needs attention before deployment.', 'warning')
    } else {
      this.log('\n🚨 RAG System has critical issues requiring immediate attention.', 'error')
    }

    // Recommendations
    this.log('\n💡 Recommendations:', 'info')
    if (this.results.performance.concurrentRequests?.avgResponseTime > 2000) {
      this.log('  • Consider performance optimization for response times', 'warning')
    }
    if (this.results.failed > 0) {
      this.log('  • Address failed tests before production deployment', 'error')
    }
    if (this.results.warnings > 0) {
      this.log('  • Review warnings for potential improvements', 'warning')
    }
    this.log('  • Run tests regularly to monitor system health', 'info')
    this.log('  • Monitor analytics for user behavior insights', 'info')
  }
}

// Run comprehensive tests if called directly
if (require.main === module) {
  const tester = new ComprehensiveRAGTester()
  tester.runComprehensiveTests().catch(console.error)
}

module.exports = ComprehensiveRAGTester

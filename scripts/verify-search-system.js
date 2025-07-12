#!/usr/bin/env node

/**
 * Global Search System Verification Script
 * Singapore Legal Help Platform
 * 
 * This script performs automated verification of the search system
 * including API endpoints, database functions, and performance metrics.
 */

const https = require('https');
const fs = require('fs');

class SearchSystemVerifier {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🔍 Starting Global Search System Verification...\n');
    
    try {
      await this.testBasicSearch();
      await this.testSearchSuggestions();
      await this.testSearchAnalytics();
      await this.testSearchFilters();
      await this.testSearchPagination();
      await this.testAdvancedSearch();
      await this.testErrorHandling();
      await this.testPerformance();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Verification failed:', error);
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
    
    this.results.tests.push({ name, passed, details });
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  async testBasicSearch() {
    console.log('\n📝 Testing Basic Search Functionality...');
    
    // Test 1: Basic search query
    const basicSearch = await this.makeRequest('/api/search/global?query=employment');
    this.logTest(
      'Basic search query',
      basicSearch.success && basicSearch.data.results?.length > 0,
      `${basicSearch.data?.results?.length || 0} results in ${basicSearch.responseTime}ms`
    );

    // Test 2: Empty query handling
    const emptySearch = await this.makeRequest('/api/search/global?query=');
    this.logTest(
      'Empty query handling',
      emptySearch.success && emptySearch.data.results?.length === 0,
      'Empty query handled gracefully'
    );

    // Test 3: Special characters
    const specialSearch = await this.makeRequest('/api/search/global?query=contract%20%26%20agreement');
    this.logTest(
      'Special characters handling',
      specialSearch.success,
      `Special chars processed in ${specialSearch.responseTime}ms`
    );
  }

  async testSearchSuggestions() {
    console.log('\n💡 Testing Search Suggestions...');
    
    // Test 1: Suggestions with query
    const suggestions = await this.makeRequest('/api/search/suggestions?q=empl');
    this.logTest(
      'Search suggestions',
      suggestions.success && suggestions.data.suggestions?.length > 0,
      `${suggestions.data?.suggestions?.length || 0} suggestions`
    );

    // Test 2: Default suggestions
    const defaultSuggestions = await this.makeRequest('/api/search/suggestions');
    this.logTest(
      'Default suggestions',
      defaultSuggestions.success,
      'Default suggestions loaded'
    );
  }

  async testSearchAnalytics() {
    console.log('\n📊 Testing Search Analytics...');
    
    // Test 1: Analytics summary
    const analytics = await this.makeRequest('/api/search/analytics?type=summary');
    this.logTest(
      'Analytics summary',
      analytics.success && analytics.data.summary,
      'Analytics data available'
    );

    // Test 2: Popular queries
    const popular = await this.makeRequest('/api/search/analytics?type=popular-queries');
    this.logTest(
      'Popular queries analytics',
      popular.success,
      'Popular queries endpoint working'
    );

    // Test 3: Performance metrics
    const performance = await this.makeRequest('/api/search/analytics?type=performance');
    this.logTest(
      'Performance analytics',
      performance.success,
      'Performance metrics available'
    );
  }

  async testSearchFilters() {
    console.log('\n🔍 Testing Search Filters...');
    
    // Test 1: Category filter
    const categoryFilter = await this.makeRequest('/api/search/global?query=law&category=Employment%20Law');
    this.logTest(
      'Category filtering',
      categoryFilter.success,
      `Category filter applied in ${categoryFilter.responseTime}ms`
    );

    // Test 2: Content type filter
    const contentFilter = await this.makeRequest('/api/search/global?query=law&content_type=article');
    this.logTest(
      'Content type filtering',
      contentFilter.success,
      'Content type filter working'
    );

    // Test 3: Difficulty filter
    const difficultyFilter = await this.makeRequest('/api/search/global?query=law&difficulty=beginner');
    this.logTest(
      'Difficulty filtering',
      difficultyFilter.success,
      'Difficulty filter working'
    );
  }

  async testSearchPagination() {
    console.log('\n📄 Testing Search Pagination...');
    
    // Test 1: First page
    const firstPage = await this.makeRequest('/api/search/global?query=law&limit=5&offset=0');
    this.logTest(
      'First page pagination',
      firstPage.success && firstPage.data.pagination,
      `Pagination info: ${JSON.stringify(firstPage.data.pagination || {})}`
    );

    // Test 2: Second page
    const secondPage = await this.makeRequest('/api/search/global?query=law&limit=5&offset=5');
    this.logTest(
      'Second page pagination',
      secondPage.success,
      'Second page loaded successfully'
    );
  }

  async testAdvancedSearch() {
    console.log('\n🔬 Testing Advanced Search Features...');
    
    // Test 1: Boolean AND
    const booleanAnd = await this.makeRequest('/api/search/global?query=%2Bemployment%20%2Btermination');
    this.logTest(
      'Boolean AND search',
      booleanAnd.success,
      'Boolean AND operator processed'
    );

    // Test 2: Boolean NOT
    const booleanNot = await this.makeRequest('/api/search/global?query=employment%20-termination');
    this.logTest(
      'Boolean NOT search',
      booleanNot.success,
      'Boolean NOT operator processed'
    );

    // Test 3: Phrase search
    const phraseSearch = await this.makeRequest('/api/search/global?query=%22company%20incorporation%22');
    this.logTest(
      'Phrase search',
      phraseSearch.success,
      'Phrase search processed'
    );
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    // Test 1: Invalid parameters
    const invalidParams = await this.makeRequest('/api/search/global?query=test&invalid_param=value');
    this.logTest(
      'Invalid parameters handling',
      invalidParams.success, // Should still work, just ignore invalid params
      'Invalid parameters ignored gracefully'
    );

    // Test 2: Very long query
    const longQuery = 'a'.repeat(1000);
    const longSearch = await this.makeRequest(`/api/search/global?query=${encodeURIComponent(longQuery)}`);
    this.logTest(
      'Long query handling',
      longSearch.success || longSearch.status === 400,
      'Long queries handled appropriately'
    );
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const performanceTests = [];
    
    // Run multiple searches to test performance
    for (let i = 0; i < 5; i++) {
      const result = await this.makeRequest('/api/search/global?query=employment');
      if (result.success) {
        performanceTests.push(result.responseTime);
      }
    }
    
    if (performanceTests.length > 0) {
      const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      const maxResponseTime = Math.max(...performanceTests);
      
      this.logTest(
        'Average response time',
        avgResponseTime < 2000,
        `${avgResponseTime.toFixed(0)}ms average, ${maxResponseTime}ms max`
      );
      
      this.logTest(
        'Response time consistency',
        maxResponseTime < 5000,
        'All responses within acceptable range'
      );
    }
  }

  generateReport() {
    console.log('\n📋 VERIFICATION REPORT');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`);
        });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.results.failed === 0) {
      console.log('  ✅ All tests passed! Search system is ready for production.');
    } else {
      console.log('  ⚠️ Some tests failed. Please review and fix issues before deployment.');
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)
      },
      tests: this.results.tests
    };
    
    fs.writeFileSync('search-verification-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: search-verification-report.json');
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new SearchSystemVerifier();
  verifier.runAllTests().catch(console.error);
}

module.exports = SearchSystemVerifier;

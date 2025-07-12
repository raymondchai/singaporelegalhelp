'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  duration?: number;
}

export default function SearchTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (name: string, status: 'pass' | 'fail', message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.duration = duration;
        return [...prev];
      } else {
        return [...prev, { name, status, message, duration }];
      }
    });
  };

  const runSearchTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Database Search Function',
        test: async () => {
          const response = await fetch('/api/search/global?query=company');
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'API request failed');
          return `Found ${data.results?.length || 0} results`;
        }
      },
      {
        name: 'Search with Filters',
        test: async () => {
          const response = await fetch('/api/search/global?query=employment&category=Employment Law&difficulty=Beginner');
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'API request failed');
          return `Filtered search returned ${data.results?.length || 0} results`;
        }
      },
      {
        name: 'Search Analytics',
        test: async () => {
          const response = await fetch('/api/search/global?query=test-analytics-query');
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'API request failed');
          if (!data.response_time_ms) throw new Error('No response time recorded');
          return `Analytics recorded with ${data.response_time_ms}ms response time`;
        }
      },
      {
        name: 'Search Suggestions',
        test: async () => {
          const response = await fetch('/api/search/global', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'comp' })
          });
          const data = await response.json();
          if (!response.ok) throw new Error('Suggestions API failed');
          return `Suggestions API working (${data.suggestions?.length || 0} suggestions)`;
        }
      },
      {
        name: 'Empty Query Handling',
        test: async () => {
          const response = await fetch('/api/search/global?query=');
          if (response.status !== 400) throw new Error('Should return 400 for empty query');
          return 'Empty query properly rejected';
        }
      },
      {
        name: 'Search Vector Population',
        test: async () => {
          // Test that search vectors are populated by searching for common terms
          const response = await fetch('/api/search/global?query=legal');
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'API request failed');
          if (!data.results || data.results.length === 0) {
            throw new Error('No results found - search vectors may not be populated');
          }
          return `Search vectors working - found ${data.results.length} results for "legal"`;
        }
      }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        const message = await test.test();
        const duration = Date.now() - startTime;
        updateTestResult(test.name, 'pass', message, duration);
      } catch (error) {
        const duration = Date.now() - startTime;
        updateTestResult(test.name, 'fail', error instanceof Error ? error.message : 'Unknown error', duration);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>;
    }
  };

  const passedTests = testResults.filter(t => t.status === 'pass').length;
  const failedTests = testResults.filter(t => t.status === 'fail').length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Search className="w-8 h-8 text-blue-600" />
            Global Search System Test
          </h1>
          <p className="text-gray-600">
            Comprehensive testing of the global search functionality, database integration, and API endpoints.
          </p>
        </div>

        {/* Test Summary */}
        {testResults.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Run Tests Button */}
        <div className="mb-6">
          <Button 
            onClick={runSearchTests} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? 'Running Tests...' : 'Run Search Tests'}
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-xs text-gray-500">{result.duration}ms</span>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Testing Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Manual Testing Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test search functionality on /search page</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test header search with quick results</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test mobile search interface</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test search filters (category, difficulty, content type)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test search result highlighting</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test search suggestions and autocomplete</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Test popular searches functionality</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm">Verify search analytics are being logged</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

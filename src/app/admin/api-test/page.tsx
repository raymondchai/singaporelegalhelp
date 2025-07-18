'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export default function AdminAPITestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, ...updates } : r);
      } else {
        return [...prev, { name, status: 'pending', ...updates }];
      }
    });
  };

  const testAPI = async (name: string, url: string) => {
    const startTime = Date.now();
    updateResult(name, { status: 'pending' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      updateResult(name, { 
        status: 'success', 
        response: data, 
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(name, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    const tests = [
      { name: 'Admin Roles', url: '/api/admin/roles' },
      { name: 'Revenue Analytics', url: '/api/admin/analytics/revenue' },
      { name: 'Monthly Analytics', url: '/api/admin/analytics/monthly' },
      { name: 'User Management', url: '/api/admin/users' },
    ];

    // Run tests sequentially to avoid overwhelming the server
    for (const test of tests) {
      await testAPI(test.name, test.url);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Testing...</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="h-8 w-8 mr-3 text-orange-600" />
              Admin API Test Suite
            </h1>
            <p className="text-gray-600">Test all admin API endpoints for connectivity and data</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={testing}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {testing ? 'Testing...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid gap-6">
        {results.map((result) => (
          <Card key={result.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <span>{result.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {result.duration && (
                    <span className="text-sm text-gray-500">{result.duration}ms</span>
                  )}
                  {getStatusBadge(result.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{result.error}</p>
                </div>
              )}
              
              {result.response && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm font-medium mb-2">Response Preview:</p>
                  <pre className="text-xs text-green-700 overflow-auto max-h-40">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !testing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Click "Run All Tests" to test admin API endpoints</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

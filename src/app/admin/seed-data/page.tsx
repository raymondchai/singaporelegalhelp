'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Database, Loader2 } from 'lucide-react';

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/seed-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to seed data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Seeding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckData = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/seed-templates');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to check data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Check error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Database Seeding Tool
            </h1>
            <p className="text-xl text-gray-600">
              Seed sample templates and variables for the Legal Document Builder
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Seed Sample Data
                </CardTitle>
                <CardDescription>
                  Add sample legal document templates and variables to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSeedData}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    'Seed Sample Data'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Check Existing Data
                </CardTitle>
                <CardDescription>
                  Check what templates and variables are already in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCheckData}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Data'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.message && (
                    <p className="text-green-700 font-medium">{result.message}</p>
                  )}
                  
                  {result.results && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Templates</h4>
                        <p className="text-2xl font-bold text-blue-600">{result.results.templates?.created || 0}</p>
                        <p className="text-sm text-gray-600">Created</p>
                        {result.results.templates?.errors?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600">Errors:</p>
                            <ul className="text-xs text-red-500 list-disc list-inside">
                              {result.results.templates.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Variables</h4>
                        <p className="text-2xl font-bold text-green-600">{result.results.variables?.created || 0}</p>
                        <p className="text-sm text-gray-600">Created</p>
                        {result.results.variables?.errors?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600">Errors:</p>
                            <ul className="text-xs text-red-500 list-disc list-inside">
                              {result.results.variables.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Content Records</h4>
                        <p className="text-2xl font-bold text-purple-600">{result.results.template_content?.created || 0}</p>
                        <p className="text-sm text-gray-600">Created</p>
                      </div>
                    </div>
                  )}

                  {result.templates_count !== undefined && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Existing Templates</h4>
                        <p className="text-2xl font-bold text-blue-600">{result.templates_count}</p>
                        {result.templates && result.templates.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Sample titles:</p>
                            <ul className="text-xs text-gray-500 list-disc list-inside">
                              {result.templates.slice(0, 5).map((template: any, index: number) => (
                                <li key={index}>{template.title}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Existing Variables</h4>
                        <p className="text-2xl font-bold text-green-600">{result.variables_count}</p>
                        {result.variables && result.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Sample variables:</p>
                            <ul className="text-xs text-gray-500 list-disc list-inside">
                              {result.variables.slice(0, 5).map((variable: any, index: number) => (
                                <li key={index}>{variable.variable_name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>1. Check Data:</strong> First check if any sample data already exists</p>
                <p><strong>2. Seed Data:</strong> Add sample templates and variables to test the Document Builder</p>
                <p><strong>3. Test:</strong> Go to <a href="/document-builder" className="text-blue-600 hover:underline">/document-builder</a> to test the functionality</p>
                <p><strong>4. Admin:</strong> Use <a href="/admin/templates" className="text-blue-600 hover:underline">/admin/templates</a> to manage templates</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

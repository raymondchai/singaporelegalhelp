'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestSupabasePage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      } else {
        return [...prev, { name, status, message, details }]
      }
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Database Connection
    updateTest('Database Connection', 'pending', 'Testing connection...')
    try {
      const { data, error } = await supabase.from('profiles').select('count')
      if (error) throw error
      updateTest('Database Connection', 'success', 'Connected successfully')
    } catch (error: any) {
      updateTest('Database Connection', 'error', `Failed: ${error.message}`)
    }

    // Test 2: Check Tables Exist (Updated after database cleanup)
    const tables = [
      'profiles',
      'legal_categories',
      'legal_qa_categories',
      'payment_transactions'
    ]

    for (const table of tables) {
      updateTest(`Table: ${table}`, 'pending', 'Checking...')
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) throw error
        updateTest(`Table: ${table}`, 'success', 'Table exists and accessible')
      } catch (error: any) {
        updateTest(`Table: ${table}`, 'error', `Error: ${error.message}`)
      }
    }

    // Test 3: Check Legal Categories Data
    updateTest('Legal Categories Data', 'pending', 'Checking initial data...')
    try {
      const { data, error } = await supabase
        .from('legal_qa_categories')
        .select('*')
        .order('order_index')
      
      if (error) throw error
      
      if (data && data.length >= 8) {
        updateTest('Legal Categories Data', 'success', `Found ${data.length} categories`, data)
      } else {
        updateTest('Legal Categories Data', 'warning', `Only ${data?.length || 0} categories found (expected 8)`, data)
      }
    } catch (error: any) {
      updateTest('Legal Categories Data', 'error', `Error: ${error.message}`)
    }

    // Test 4: Check Storage Buckets
    updateTest('Storage Buckets', 'pending', 'Checking buckets...')
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      if (error) throw error

      const expectedBuckets = ['legal-documents', 'profile-images']
      const foundBuckets = buckets.map(b => b.name)
      const missingBuckets = expectedBuckets.filter(b => !foundBuckets.includes(b))

      if (missingBuckets.length === 0) {
        updateTest('Storage Buckets', 'success', 'All required buckets exist', foundBuckets)
      } else {
        updateTest('Storage Buckets', 'warning', `Missing buckets: ${missingBuckets.join(', ')}`, { found: foundBuckets, missing: missingBuckets })
      }
    } catch (error: any) {
      updateTest('Storage Buckets', 'error', `Error: ${error.message}`)
    }

    // Test 5: Test Authentication (if user is logged in)
    updateTest('Authentication', 'pending', 'Checking auth state...')
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        updateTest('Authentication', 'success', `Logged in as: ${user.email}`, { userId: user.id })
        
        // Test profile access
        updateTest('Profile Access', 'pending', 'Testing profile access...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          updateTest('Profile Access', 'error', `Profile error: ${profileError.message}`)
        } else {
          updateTest('Profile Access', 'success', 'Profile accessible', profile)
        }
      } else {
        updateTest('Authentication', 'warning', 'No user logged in')
      }
    } catch (error: any) {
      updateTest('Authentication', 'error', `Auth error: ${error.message}`)
    }

    // Test 6: Test File Upload (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      updateTest('File Upload Test', 'pending', 'Testing file upload...')
      try {
        // Create a small test file
        const testFile = new Blob(['Test file content'], { type: 'text/plain' })
        const fileName = `${user.id}/test/test_${Date.now()}.txt`
        
        const { error: uploadError } = await supabase.storage
          .from('legal-documents')
          .upload(fileName, testFile)
        
        if (uploadError) throw uploadError
        
        // Clean up test file
        await supabase.storage.from('legal-documents').remove([fileName])
        
        updateTest('File Upload Test', 'success', 'File upload/delete successful')
      } catch (error: any) {
        updateTest('File Upload Test', 'error', `Upload error: ${error.message}`)
      }
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'pending': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'pending': return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase Setup Test
          </h1>
          <p className="text-gray-600">
            Test all Supabase components to ensure proper setup
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {tests.map((test, index) => (
            <Card key={index} className={getStatusColor(test.status)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getStatusIcon(test.status)}
                </div>
                <CardDescription>{test.message}</CardDescription>
              </CardHeader>
              {test.details && (
                <CardContent className="pt-0">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {tests.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-green-600">
                ✅ Passed: {tests.filter(t => t.status === 'success').length}
              </div>
              <div className="text-red-600">
                ❌ Failed: {tests.filter(t => t.status === 'error').length}
              </div>
              <div className="text-yellow-600">
                ⚠️ Warnings: {tests.filter(t => t.status === 'warning').length}
              </div>
              <div className="text-blue-600">
                ⏳ Pending: {tests.filter(t => t.status === 'pending').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

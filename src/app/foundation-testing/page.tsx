'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Database, 
  Upload, 
  CreditCard, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import AuthSystemTester from '@/components/AuthSystemTester'

interface TestSuite {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'running' | 'passed' | 'failed' | 'partial'
  priority: number
  estimatedTime: string
}

export default function FoundationTestingPage() {
  const [testSuites] = useState<TestSuite[]>([
    {
      id: 'auth',
      name: 'Authentication System',
      description: 'User registration, login, profile management, NRIC validation, session handling',
      icon: <Shield className="h-5 w-5" />,
      status: 'pending',
      priority: 1,
      estimatedTime: '5-10 min'
    },
    {
      id: 'database',
      name: 'Database Integration',
      description: 'Supabase tables, CRUD operations, RLS policies, foreign keys, data access',
      icon: <Database className="h-5 w-5" />,
      status: 'pending',
      priority: 2,
      estimatedTime: '3-5 min'
    },
    {
      id: 'storage',
      name: 'File Storage System',
      description: 'Document upload, file limits, profile images, type restrictions, permissions',
      icon: <Upload className="h-5 w-5" />,
      status: 'pending',
      priority: 3,
      estimatedTime: '3-5 min'
    },
    {
      id: 'payments',
      name: 'Payment Integration',
      description: 'Stripe international, NETS Singapore, subscriptions, webhooks, billing',
      icon: <CreditCard className="h-5 w-5" />,
      status: 'pending',
      priority: 4,
      estimatedTime: '5-8 min'
    },
    {
      id: 'pwa',
      name: 'PWA Functionality',
      description: 'Install prompt, offline mode, service worker, caching, app icons',
      icon: <Smartphone className="h-5 w-5" />,
      status: 'pending',
      priority: 5,
      estimatedTime: '2-3 min'
    }
  ])

  const getStatusIcon = (status: TestSuite['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestSuite['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getPriorityBadge = (priority: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        Priority {priority}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Foundation Testing</h1>
                <p className="text-gray-600">Comprehensive system verification for Singapore Legal Help</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Testing Overview</CardTitle>
            <CardDescription>
              Systematic verification of all foundation systems before implementing advanced features.
              This ensures a solid, reliable platform for Singapore legal professionals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {testSuites.map((suite) => (
                <div key={suite.id} className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {suite.icon}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{suite.name}</h3>
                  <div className="flex flex-col items-center space-y-1">
                    {getStatusBadge(suite.status)}
                    {getPriorityBadge(suite.priority)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{suite.estimatedTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testing Tabs */}
        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Auth</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Storage</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="pwa" className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">PWA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auth">
            <AuthSystemTester />
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Database Integration Testing</span>
                </CardTitle>
                <CardDescription>
                  Testing Supabase tables, CRUD operations, RLS policies, and data access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Database Testing Component</h3>
                  <p className="text-gray-600 mb-4">
                    This component will test all 8 Supabase tables, CRUD operations, and RLS policies
                  </p>
                  <Button variant="outline">
                    Coming Next - Database Tester
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>File Storage Testing</span>
                </CardTitle>
                <CardDescription>
                  Testing document upload, file limits, and storage permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Storage Testing Component</h3>
                  <p className="text-gray-600 mb-4">
                    This component will test file upload, size limits, and access permissions
                  </p>
                  <Button variant="outline">
                    Coming Next - Storage Tester
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Integration Testing</span>
                </CardTitle>
                <CardDescription>
                  Testing Stripe, NETS, subscriptions, and payment workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Testing Component</h3>
                  <p className="text-gray-600 mb-4">
                    This component will test Stripe and NETS payment processing
                  </p>
                  <Button variant="outline">
                    Coming Next - Payment Tester
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pwa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>PWA Functionality Testing</span>
                </CardTitle>
                <CardDescription>
                  Testing PWA installation, offline mode, and service worker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">PWA Testing Component</h3>
                  <p className="text-gray-600 mb-4">
                    This component will test PWA installation and offline functionality
                  </p>
                  <Button variant="outline">
                    Coming Next - PWA Tester
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Testing Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Guidelines</CardTitle>
            <CardDescription>
              Best practices for comprehensive foundation testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">✅ What We're Testing</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• User registration and authentication flows</li>
                  <li>• Database operations and security policies</li>
                  <li>• File upload and storage permissions</li>
                  <li>• Payment processing and webhooks</li>
                  <li>• PWA installation and offline functionality</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">🎯 Why This Matters</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Identifies issues before they compound</li>
                  <li>• Ensures solid foundation for advanced features</li>
                  <li>• Prevents broken features in production</li>
                  <li>• Builds confidence for next development phase</li>
                  <li>• Saves time and prevents headaches later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

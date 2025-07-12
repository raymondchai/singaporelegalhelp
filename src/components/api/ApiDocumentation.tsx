'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Code, 
  Play, 
  Copy, 
  Book, 
  Zap, 
  Shield, 
  Globe,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
// Using simple state-based collapsible instead of external component

interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  parameters?: Parameter[]
  requestBody?: any
  responses: Response[]
  examples: Example[]
  requiresAuth: boolean
  rateLimit?: number
}

interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

interface Response {
  status: number
  description: string
  schema?: any
}

interface Example {
  title: string
  request?: any
  response?: any
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'list-documents',
    method: 'GET',
    path: '/api/v1/documents',
    title: 'List Documents',
    description: 'Retrieve a paginated list of user documents with optional filtering.',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)', example: 1 },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page (max: 100)', example: 20 },
      { name: 'search', type: 'string', required: false, description: 'Search in title and content', example: 'contract' },
      { name: 'type', type: 'string', required: false, description: 'Filter by document type', example: 'contract' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status', example: 'draft' }
    ],
    responses: [
      { status: 200, description: 'Success', schema: { type: 'object' } },
      { status: 401, description: 'Unauthorized' },
      { status: 500, description: 'Internal Server Error' }
    ],
    examples: [
      {
        title: 'Basic Request',
        request: { method: 'GET', url: '/api/v1/documents?page=1&limit=10' },
        response: {
          success: true,
          data: {
            documents: [
              {
                id: 'doc-123',
                title: 'Employment Contract',
                document_type: 'contract',
                status: 'draft',
                created_at: '2024-01-15T10:00:00Z'
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              totalPages: 3
            }
          }
        }
      }
    ],
    requiresAuth: true,
    rateLimit: 1000
  },
  {
    id: 'create-document',
    method: 'POST',
    path: '/api/v1/documents',
    title: 'Create Document',
    description: 'Create a new document with the specified content and metadata.',
    requestBody: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Document content' },
        document_type: { type: 'string', enum: ['contract', 'agreement', 'letter', 'form', 'other'] },
        tags: { type: 'array', items: { type: 'string' } }
      }
    },
    responses: [
      { status: 201, description: 'Document created successfully' },
      { status: 400, description: 'Validation error' },
      { status: 401, description: 'Unauthorized' },
      { status: 402, description: 'Subscription limit reached' }
    ],
    examples: [
      {
        title: 'Create Contract',
        request: {
          title: 'Service Agreement',
          content: 'This agreement is between...',
          document_type: 'contract',
          tags: ['legal', 'service']
        },
        response: {
          success: true,
          data: {
            document: {
              id: 'doc-456',
              title: 'Service Agreement',
              document_type: 'contract',
              status: 'draft',
              created_at: '2024-01-15T10:30:00Z'
            }
          }
        }
      }
    ],
    requiresAuth: true,
    rateLimit: 100
  }
]

export default function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [testRequest, setTestRequest] = useState({
    method: 'GET',
    url: '',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
    body: ''
  })
  const [testResponse, setTestResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview'])
  const { toast } = useToast()

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleTestRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch(testRequest.url, {
        method: testRequest.method,
        headers: {
          'Content-Type': 'application/json',
          ...testRequest.headers
        },
        body: testRequest.method !== 'GET' ? testRequest.body : undefined
      })

      const data = await response.json()
      setTestResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      })
    } catch (error) {
      setTestResponse({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard'
    })
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">API Documentation</h1>
        <p className="text-xl text-gray-600">
          Comprehensive guide to the Singapore Legal Help API
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Version 1.0
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            REST API
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            JSON
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Overview Section */}
              <div>
                <button
                  onClick={() => toggleSection('overview')}
                  className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  {expandedSections.includes('overview') ?
                    <ChevronDown className="h-4 w-4" /> :
                    <ChevronRight className="h-4 w-4" />
                  }
                  <span className="font-medium">Overview</span>
                </button>
                {expandedSections.includes('overview') && (
                  <div className="ml-6 space-y-1">
                    <button className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                      Getting Started
                    </button>
                    <button className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                      Authentication
                    </button>
                    <button className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded">
                      Rate Limiting
                    </button>
                  </div>
                )}
              </div>

              {/* Endpoints Section */}
              <div>
                <button
                  onClick={() => toggleSection('endpoints')}
                  className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  {expandedSections.includes('endpoints') ?
                    <ChevronDown className="h-4 w-4" /> :
                    <ChevronRight className="h-4 w-4" />
                  }
                  <span className="font-medium">Endpoints</span>
                </button>
                {expandedSections.includes('endpoints') && (
                  <div className="ml-6 space-y-1">
                    {API_ENDPOINTS.map(endpoint => (
                      <button
                        key={endpoint.id}
                        onClick={() => setSelectedEndpoint(endpoint)}
                        className={`block w-full text-left p-2 text-sm hover:bg-gray-50 rounded ${
                          selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </Badge>
                          <span className="truncate">{endpoint.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedEndpoint ? (
            /* Overview Content */
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                  <code className="bg-gray-100 p-2 rounded block">
                    https://singaporelegalhelp.com/api/v1
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                  <p className="text-gray-600 mb-2">
                    All API requests require authentication using either:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Bearer token (JWT) for user authentication</li>
                    <li>API key for server-to-server communication</li>
                  </ul>
                  <div className="mt-2">
                    <code className="bg-gray-100 p-2 rounded block text-sm">
                      Authorization: Bearer YOUR_JWT_TOKEN
                    </code>
                    <code className="bg-gray-100 p-2 rounded block text-sm mt-1">
                      Authorization: slh_your_api_key_here
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Rate Limiting</h3>
                  <p className="text-gray-600 text-sm">
                    API requests are rate limited based on your subscription tier:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Free: 100 requests/hour</li>
                    <li>Premium: 1,000 requests/hour</li>
                    <li>Enterprise: 10,000 requests/hour</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Endpoint Documentation */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-lg">{selectedEndpoint.path}</code>
                  </div>
                  <CardTitle>{selectedEndpoint.title}</CardTitle>
                  <p className="text-gray-600">{selectedEndpoint.description}</p>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="examples">Examples</TabsTrigger>
                      <TabsTrigger value="test">Test</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Authentication Required</h4>
                        <Badge variant={selectedEndpoint.requiresAuth ? "destructive" : "secondary"}>
                          {selectedEndpoint.requiresAuth ? 'Yes' : 'No'}
                        </Badge>
                      </div>

                      {selectedEndpoint.rateLimit && (
                        <div>
                          <h4 className="font-semibold mb-2">Rate Limit</h4>
                          <p className="text-sm text-gray-600">
                            {selectedEndpoint.rateLimit} requests per hour
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Responses</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.responses.map((response, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="outline">{response.status}</Badge>
                              <span className="text-sm">{response.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="parameters" className="space-y-4">
                      {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-200 p-2 text-left">Name</th>
                                <th className="border border-gray-200 p-2 text-left">Type</th>
                                <th className="border border-gray-200 p-2 text-left">Required</th>
                                <th className="border border-gray-200 p-2 text-left">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEndpoint.parameters.map((param, index) => (
                                <tr key={index}>
                                  <td className="border border-gray-200 p-2 font-mono text-sm">
                                    {param.name}
                                  </td>
                                  <td className="border border-gray-200 p-2 text-sm">
                                    {param.type}
                                  </td>
                                  <td className="border border-gray-200 p-2">
                                    <Badge variant={param.required ? "destructive" : "secondary"}>
                                      {param.required ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td className="border border-gray-200 p-2 text-sm">
                                    {param.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No parameters required for this endpoint.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="examples" className="space-y-4">
                      {selectedEndpoint.examples.map((example, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-semibold">{example.title}</h4>
                          {example.request && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Request</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(JSON.stringify(example.request, null, 2))}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                <code>{JSON.stringify(example.request, null, 2)}</code>
                              </pre>
                            </div>
                          )}
                          {example.response && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Response</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(JSON.stringify(example.response, null, 2))}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                <code>{JSON.stringify(example.response, null, 2)}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="test" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">Request</h4>
                          <div>
                            <label className="text-sm font-medium">Method</label>
                            <Select 
                              value={testRequest.method} 
                              onValueChange={(value) => setTestRequest(prev => ({ ...prev, method: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">URL</label>
                            <Input
                              value={testRequest.url}
                              onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
                              placeholder={`https://singaporelegalhelp.com${selectedEndpoint.path}`}
                            />
                          </div>
                          {testRequest.method !== 'GET' && (
                            <div>
                              <label className="text-sm font-medium">Request Body</label>
                              <Textarea
                                value={testRequest.body}
                                onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                                placeholder="JSON request body"
                                rows={6}
                              />
                            </div>
                          )}
                          <Button onClick={handleTestRequest} disabled={loading} className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            {loading ? 'Sending...' : 'Send Request'}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Response</h4>
                          {testResponse ? (
                            <div className="space-y-2">
                              {testResponse.status && (
                                <div className="flex items-center gap-2">
                                  <Badge variant={testResponse.status < 400 ? "default" : "destructive"}>
                                    {testResponse.status} {testResponse.statusText}
                                  </Badge>
                                </div>
                              )}
                              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto max-h-96">
                                <code>
                                  {testResponse.error || JSON.stringify(testResponse.data || testResponse, null, 2)}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-8 rounded text-center text-gray-500">
                              Response will appear here after sending a request
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

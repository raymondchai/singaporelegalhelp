'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  CreditCard,
  Building,
  Users,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ContentStats {
  articles: number
  qas: number
  published: number
  draft: number
}

interface ImportResult {
  success: boolean
  message: string
  results?: {
    articles: { created: number; total: number; errors: string[] }
    qas: { created: number; total: number; errors: string[] }
  }
}

export default function DebtBankruptcyAdminPage() {
  const [stats, setStats] = useState<ContentStats>({ articles: 0, qas: 0, published: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Debt & Bankruptcy Category ID (actual from database)
  const DEBT_BANKRUPTCY_CATEGORY_ID = '2419530a-7b54-4c5d-b9d2-5a60a4e5d8d3'

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch articles
      const { data: articles, error: articlesError } = await supabase
        .from('legal_articles')
        .select('id, is_published')
        .eq('category_id', DEBT_BANKRUPTCY_CATEGORY_ID)

      // Fetch Q&As
      const { data: qas, error: qasError } = await supabase
        .from('legal_qa')
        .select('id, status')
        .eq('category_id', DEBT_BANKRUPTCY_CATEGORY_ID)

      if (articlesError || qasError) {
        console.error('Error fetching stats:', articlesError || qasError)
        return
      }

      const published = articles?.filter(a => a.is_published).length || 0
      const draft = articles?.filter(a => !a.is_published).length || 0

      setStats({
        articles: articles?.length || 0,
        qas: qas?.length || 0,
        published,
        draft
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    try {
      setImporting(true)
      setImportResult(null)

      const response = await fetch('/api/admin/import-debt-bankruptcy-law', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      setImportResult(result)

      if (result.success) {
        await fetchStats() // Refresh stats after successful import
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: 'Failed to import content. Please try again.'
      })
    } finally {
      setImporting(false)
    }
  }

  const checkImportStatus = async () => {
    try {
      const response = await fetch('/api/admin/import-debt-bankruptcy-law', {
        method: 'GET'
      })
      const result = await response.json()
      console.log('Import status:', result)
    } catch (error) {
      console.error('Error checking import status:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Debt & Bankruptcy Law</h1>
            <p className="text-gray-600">Content Management & Administration</p>
          </div>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-200">
          Sixth Practice Area
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.articles}</p>
                <p className="text-xs text-gray-500">Target: 8 articles</p>
              </div>
              <FileText className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Q&As</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qas}</p>
                <p className="text-xs text-gray-500">Target: 20 Q&As</p>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                <p className="text-xs text-gray-500">Live content</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
                <p className="text-xs text-gray-500">Pending review</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="import">Content Import</TabsTrigger>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Content Categories
                </CardTitle>
                <CardDescription>
                  Debt & Bankruptcy law content organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Personal Bankruptcy</span>
                    <Badge variant="secondary">5 Q&As planned</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Corporate Insolvency</span>
                    <Badge variant="secondary">5 Q&As planned</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Debt Recovery</span>
                    <Badge variant="secondary">5 Q&As planned</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Debt Management</span>
                    <Badge variant="secondary">3 Q&As planned</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Legal Procedures</span>
                    <Badge variant="secondary">2 Q&As planned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audiences
                </CardTitle>
                <CardDescription>
                  Key stakeholder groups for debt & bankruptcy content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Individual Debtors</span>
                    <Badge variant="outline" className="text-blue-600">Primary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">SME Business Owners</span>
                    <Badge variant="outline" className="text-blue-600">Primary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Creditors & Lenders</span>
                    <Badge variant="outline" className="text-green-600">Secondary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Legal Professionals</span>
                    <Badge variant="outline" className="text-green-600">Secondary</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          {/* Batch Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Debt & Bankruptcy Content Import
              </CardTitle>
              <CardDescription>
                Import 8 articles and 20 Q&As to establish Debt & Bankruptcy practice area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-900 mb-2">Ready to Import:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 8 Articles: Debt Recovery, Personal Bankruptcy, Corporate Insolvency, Statutory Demands, Debt Restructuring, Secured Debts, Cross-Border Insolvency, Bankruptcy Alternatives</li>
                    <li>• 20 Q&As: Personal bankruptcy (5), Corporate insolvency (5), Debt recovery (5), Debt management (3), Legal procedures (2)</li>
                    <li>• Singapore-specific content with Bankruptcy Act and Companies Act compliance</li>
                    <li>• Professional disclaimers and referral recommendations included</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {importing ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import All Content
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={checkImportStatus}
                    disabled={importing}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Check Status
                  </Button>
                </div>

                {/* Import Results */}
                {importResult && (
                  <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
                        {importResult.message}
                      </AlertDescription>
                    </div>
                    
                    {importResult.results && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Articles imported:</span>
                          <span className="font-medium">{importResult.results.articles.created}/{importResult.results.articles.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Q&As imported:</span>
                          <span className="font-medium">{importResult.results.qas.created}/{importResult.results.qas.total}</span>
                        </div>
                        {(importResult.results.articles.errors.length > 0 || importResult.results.qas.errors.length > 0) && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-red-800">
                            <p className="font-medium">Errors:</p>
                            {importResult.results.articles.errors.map((error, index) => (
                              <p key={index} className="text-xs">• {error}</p>
                            ))}
                            {importResult.results.qas.errors.map((error, index) => (
                              <p key={index} className="text-xs">• {error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specializations Tab */}
        <TabsContent value="specializations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Insolvency Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Personal Bankruptcy', 'Corporate Insolvency', 'Voluntary Liquidation', 'Compulsory Liquidation', 'Judicial Management', 'Schemes of Arrangement'].map((type) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{type}</span>
                      <Badge variant="secondary" className="text-xs">Specialized</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Legal Procedures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Statutory Demand', 'Bankruptcy Application', 'Winding Up Petition', 'Debt Recovery Action', 'Asset Seizure', 'Garnishment Orders'].map((procedure) => (
                    <div key={procedure} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{procedure}</span>
                      <Badge variant="outline" className="text-xs">Procedure</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Content Performance Metrics
              </CardTitle>
              <CardDescription>
                Track engagement and effectiveness of debt & bankruptcy content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics will be available after content import</p>
                <p className="text-sm">Track article views, Q&A helpfulness, and user engagement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

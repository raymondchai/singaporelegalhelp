'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  HelpCircle, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Users,
  TrendingUp,
  Database
} from 'lucide-react'

interface ImportStatus {
  success: boolean
  category_id: string
  existing_content: {
    articles: number
    qas: number
    article_list: Array<{ id: string; title: string; slug: string }>
    qa_list: Array<{ id: string; question: string }>
  }
  import_ready: {
    articles_to_import: number
    qas_to_import: number
  }
}

interface ImportResult {
  success: boolean
  message: string
  results: {
    summary: {
      total_created: number
      total_errors: number
      articles_created: number
      qas_created: number
    }
    details: {
      articles: { created: number; errors: string[] }
      qas: { created: number; errors: string[] }
    }
  }
}

export default function DebtBankruptcyLawAdmin() {
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Check import status on component mount
  useEffect(() => {
    checkImportStatus()
  }, [])

  const checkImportStatus = async () => {
    try {
      const response = await fetch('/api/admin/import-debt-bankruptcy-law')
      const data = await response.json()
      setImportStatus(data)
    } catch (error) {
      console.error('Failed to check import status:', error)
    }
  }

  const handleImport = async () => {
    setIsLoading(true)
    setImportResult(null)
    
    try {
      const response = await fetch('/api/admin/import-debt-bankruptcy-law', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      setImportResult(result)
      
      // Refresh status after import
      if (result.success) {
        await checkImportStatus()
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: false,
        message: 'Import failed due to network error',
        results: {
          summary: { total_created: 0, total_errors: 1, articles_created: 0, qas_created: 0 },
          details: { articles: { created: 0, errors: ['Network error'] }, qas: { created: 0, errors: [] } }
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStatus?.existing_content.articles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {importStatus?.import_ready.articles_to_import || 0} ready to import
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Q&As</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStatus?.existing_content.qas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {importStatus?.import_ready.qas_to_import || 0} ready to import
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(importStatus?.existing_content.articles || 0) + (importStatus?.existing_content.qas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Debt & Bankruptcy content pieces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Import Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {importStatus?.existing_content.articles === 0 && importStatus?.existing_content.qas === 0 
                ? 'Ready' 
                : 'Partial'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Content import status
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debt & Bankruptcy Law Content Import</CardTitle>
          <CardDescription>
            Import comprehensive Debt & Bankruptcy Law content including articles and Q&As
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Content Package</h3>
              <p className="text-sm text-muted-foreground">
                {importStatus?.import_ready.articles_to_import || 0} articles + {importStatus?.import_ready.qas_to_import || 0} Q&As
              </p>
            </div>
            <Button 
              onClick={handleImport} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isLoading ? 'Importing...' : 'Import Content'}
            </Button>
          </div>

          {importResult && (
            <div className={`p-4 border rounded-lg ${
              importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h4 className="font-semibold">
                  {importResult.success ? 'Import Successful' : 'Import Failed'}
                </h4>
              </div>
              <p className="text-sm mb-3">{importResult.message}</p>
              
              {importResult.results && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Articles Created:</strong> {importResult.results.summary.articles_created}</p>
                    <p><strong>Q&As Created:</strong> {importResult.results.summary.qas_created}</p>
                  </div>
                  <div>
                    <p><strong>Total Created:</strong> {importResult.results.summary.total_created}</p>
                    <p><strong>Total Errors:</strong> {importResult.results.summary.total_errors}</p>
                  </div>
                </div>
              )}

              {importResult.results?.details.articles.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-red-600">Article Errors:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importResult.results.details.articles.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.results?.details.qas.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-red-600">Q&A Errors:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importResult.results.details.qas.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Existing Articles</CardTitle>
          <CardDescription>
            {importStatus?.existing_content.articles || 0} articles currently in database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importStatus?.existing_content.article_list.length === 0 ? (
            <p className="text-muted-foreground">No articles found. Import content to get started.</p>
          ) : (
            <div className="space-y-2">
              {importStatus?.existing_content.article_list.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{article.title}</h4>
                    <p className="text-sm text-muted-foreground">{article.slug}</p>
                  </div>
                  <Badge variant="outline">Published</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Q&As</CardTitle>
          <CardDescription>
            {importStatus?.existing_content.qas || 0} Q&As currently in database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importStatus?.existing_content.qa_list.length === 0 ? (
            <p className="text-muted-foreground">No Q&As found. Import content to get started.</p>
          ) : (
            <div className="space-y-2">
              {importStatus?.existing_content.qa_list.map((qa) => (
                <div key={qa.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{qa.question}</h4>
                  </div>
                  <Badge variant="outline">Published</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debt & Bankruptcy Law Administration</h1>
        <p className="text-muted-foreground">
          Manage Debt & Bankruptcy Law content for Singapore Legal Help platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

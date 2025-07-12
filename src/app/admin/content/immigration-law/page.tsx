'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Globe,
  Plane,
  Users,
  GraduationCap,
  Building,
  Scale
} from 'lucide-react'

// Immigration Law Category ID from Task IM-1
const IMMIGRATION_LAW_CATEGORY_ID = '57559a93-bb72-4833-8ad5-75e1dbc2e275'

interface LegalArticle {
  id: string
  category_id: string
  title: string
  slug: string
  summary: string
  content: string
  content_type: string
  difficulty_level: string
  tags: string[]
  reading_time_minutes: number
  is_featured: boolean
  is_published: boolean
  author_name: string
  seo_title: string | null
  seo_description: string | null
  view_count: number
  created_at: string
  updated_at: string
}

interface LegalQA {
  id: string
  category_id: string
  question: string
  answer: string
  difficulty_level: string
  tags: string[]
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

interface ContentStats {
  articles: number
  qas: number
  published_articles: number
  featured_articles: number
  total_views: number
}

// Immigration Law specific types and categories
const IMMIGRATION_TYPES = [
  'Work Pass',
  'Permanent Residence',
  'Citizenship',
  'Family/Dependent',
  'Student Visa',
  'Business Immigration',
  'Appeals',
  'Special Schemes'
]

const GOVERNMENT_AGENCIES = [
  'ICA (Immigration & Checkpoints Authority)',
  'MOM (Ministry of Manpower)',
  'MOE (Ministry of Education)',
  'EDB (Economic Development Board)',
  'Multiple Agencies'
]

const COMPLEXITY_LEVELS = [
  'Basic Application',
  'Standard Process',
  'Complex Cases',
  'Appeals & Legal'
]

export default function ImmigrationLawAdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [qas, setQas] = useState<LegalQA[]>([])
  const [stats, setStats] = useState<ContentStats>({
    articles: 0,
    qas: 0,
    published_articles: 0,
    featured_articles: 0,
    total_views: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  // Form states for new content
  const [newArticle, setNewArticle] = useState({
    title: '',
    summary: '',
    content: '',
    difficulty_level: 'intermediate',
    tags: '',
    immigration_type: '',
    government_agency: '',
    complexity_level: '',
    is_featured: false,
    is_published: false
  })

  const [newQA, setNewQA] = useState({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    immigration_type: '',
    is_featured: false
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', IMMIGRATION_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', IMMIGRATION_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError

      setArticles(articlesData || [])
      setQas(qasData || [])

      // Calculate stats
      const totalViews = (articlesData || []).reduce((sum, article) => sum + (article.view_count || 0), 0) +
                        (qasData || []).reduce((sum, qa) => sum + (qa.view_count || 0), 0)

      setStats({
        articles: articlesData?.length || 0,
        qas: qasData?.length || 0,
        published_articles: articlesData?.filter(a => a.is_published).length || 0,
        featured_articles: articlesData?.filter(a => a.is_featured).length || 0,
        total_views: totalViews
      })

    } catch (err) {
      console.error('Error fetching content:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchImport = async () => {
    try {
      setImportLoading(true)
      setImportResult(null)
      
      const response = await fetch('/api/admin/import-immigration-law', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setImportResult(`✅ Successfully imported ${result.results?.articles?.created || 0} articles and ${result.results?.qas?.created || 0} Q&As`)
        await fetchContent() // Refresh the content
      } else {
        setImportResult(`❌ Import failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Import error:', err)
      setImportResult(`❌ Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setImportLoading(false)
    }
  }

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Globe className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading Immigration Law content...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Immigration Law Content Management</h1>
            <p className="text-gray-600">Manage visa applications, work permits, and citizenship content</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <Button variant="outline">← Back to Content</Button>
          </Link>
          <Link href="/legal-categories/immigration-law" target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Live Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Import Result Display */}
      {importResult && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-blue-800">{importResult}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.articles}</p>
                <p className="text-sm text-gray-600">Articles</p>
                <p className="text-xs text-gray-500">Target: 8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.qas}</p>
                <p className="text-sm text-gray-600">Q&As</p>
                <p className="text-xs text-gray-500">Target: 20</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.published_articles}</p>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-xs text-gray-500">Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.featured_articles}</p>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-xs text-gray-500">Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total_views}</p>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-xs text-gray-500">All Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Import Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Immigration Law Content Import
          </CardTitle>
          <CardDescription>
            Import 7 additional articles and 17 Q&As to complete Immigration Law practice area (Target: 8 articles, 20 Q&As)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Ready to Import:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 7 Articles: PR Guide, Citizenship, Family Passes, Student Visas, Business Immigration, Appeals, Special Schemes</li>
                <li>• 17 Q&As: Work Pass (5), Family Issues (4), PR/Citizenship (4), Legal Process (2), Special Cases (2)</li>
                <li>• Government Compliance: ICA, MOM, MOE, EDB procedures</li>
                <li>• SEO Optimization: Immigration keywords and Singapore focus</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleBatchImport} 
              disabled={importLoading}
              className="w-full"
            >
              {importLoading ? (
                <>
                  <Globe className="h-4 w-4 mr-2 animate-spin" />
                  Importing Immigration Law Content...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Immigration Law Content (7 Articles + 17 Q&As)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="articles">Articles ({stats.articles})</TabsTrigger>
          <TabsTrigger value="qas">Q&As ({stats.qas})</TabsTrigger>
          <TabsTrigger value="create">Create Content</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Immigration Law Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Articles Progress</span>
                    <span>{stats.articles}/8</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.articles / 8) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Q&As Progress</span>
                    <span>{stats.qas}/20</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.qas / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Overall Completion: {Math.round(((stats.articles + stats.qas) / 28) * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Immigration Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Immigration Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {IMMIGRATION_TYPES.map((type, index) => {
                    const typeArticles = articles.filter(article =>
                      article.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase().split(' ')[0]))
                    ).length
                    const typeQAs = qas.filter(qa =>
                      qa.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase().split(' ')[0]))
                    ).length

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{typeArticles} articles</Badge>
                          <Badge variant="outline">{typeQAs} Q&As</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Government Agency Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Government Agency Coverage
              </CardTitle>
              <CardDescription>
                Content coverage across Singapore immigration authorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {GOVERNMENT_AGENCIES.slice(0, 4).map((agency) => {
                  const agencyContent = [...articles, ...qas].filter(content =>
                    content.tags.some(tag => tag.toLowerCase().includes(agency.split(' ')[0].toLowerCase()))
                  ).length

                  return (
                    <div key={agency} className="text-center p-4 border rounded-lg">
                      <p className="font-semibold text-sm">{agency.split(' ')[0]}</p>
                      <p className="text-2xl font-bold text-blue-600">{agencyContent}</p>
                      <p className="text-xs text-gray-500">Content Items</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Immigration Law Articles
                </span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No articles found. Use the import function to add content.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{article.summary}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">{article.difficulty_level}</Badge>
                            <Badge variant="outline">{article.content_type}</Badge>
                            <Badge variant="outline">{article.reading_time_minutes} min read</Badge>
                            {article.is_featured && <Badge>Featured</Badge>}
                            {article.is_published ? (
                              <Badge className="bg-green-100 text-green-800">Published</Badge>
                            ) : (
                              <Badge variant="outline">Draft</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {article.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Q&As Tab */}
        <TabsContent value="qas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Immigration Law Q&As
                </span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Q&A
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qas.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No Q&As found. Use the import function to add content.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qas.map((qa) => (
                    <div key={qa.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{qa.question}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">{qa.answer}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">{qa.difficulty_level}</Badge>
                            {qa.is_featured && <Badge>Featured</Badge>}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {qa.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Content Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Article Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Create New Article
                </CardTitle>
                <CardDescription>
                  Add a new immigration law article with government compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                    placeholder="e.g., Singapore Work Pass Application Guide"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Summary</label>
                  <Textarea
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({...newArticle, summary: e.target.value})}
                    placeholder="Brief summary of the article content"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Immigration Type</label>
                    <Select value={newArticle.immigration_type} onValueChange={(value) => setNewArticle({...newArticle, immigration_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {IMMIGRATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Government Agency</label>
                    <Select value={newArticle.government_agency} onValueChange={(value) => setNewArticle({...newArticle, government_agency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOVERNMENT_AGENCIES.map((agency) => (
                          <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                    <Select value={newArticle.difficulty_level} onValueChange={(value) => setNewArticle({...newArticle, difficulty_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Complexity Level</label>
                    <Select value={newArticle.complexity_level} onValueChange={(value) => setNewArticle({...newArticle, complexity_level: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLEXITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
                    placeholder="work pass, employment pass, immigration"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                    placeholder="Article content (minimum 2500 words for comprehensive immigration guidance)"
                    rows={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Word count: {newArticle.content.split(/\s+/).length} | Reading time: {calculateReadingTime(newArticle.content)} minutes
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="article-featured"
                      checked={newArticle.is_featured}
                      onCheckedChange={(checked) => setNewArticle({...newArticle, is_featured: !!checked})}
                    />
                    <label htmlFor="article-featured" className="text-sm">Featured Article</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="article-published"
                      checked={newArticle.is_published}
                      onCheckedChange={(checked) => setNewArticle({...newArticle, is_published: !!checked})}
                    />
                    <label htmlFor="article-published" className="text-sm">Publish Immediately</label>
                  </div>
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Immigration Article
                </Button>
              </CardContent>
            </Card>

            {/* Create Q&A Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create New Q&A
                </CardTitle>
                <CardDescription>
                  Add a new immigration law Q&A with practical guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Question</label>
                  <Input
                    value={newQA.question}
                    onChange={(e) => setNewQA({...newQA, question: e.target.value})}
                    placeholder="e.g., How long does an Employment Pass application take?"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Answer</label>
                  <Textarea
                    value={newQA.answer}
                    onChange={(e) => setNewQA({...newQA, answer: e.target.value})}
                    placeholder="Detailed answer with practical guidance (minimum 500 characters)"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Character count: {newQA.answer.length}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Immigration Type</label>
                    <Select value={newQA.immigration_type} onValueChange={(value) => setNewQA({...newQA, immigration_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {IMMIGRATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
                    <Select value={newQA.difficulty_level} onValueChange={(value) => setNewQA({...newQA, difficulty_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={newQA.tags}
                    onChange={(e) => setNewQA({...newQA, tags: e.target.value})}
                    placeholder="employment pass, application timeline, MOM"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qa-featured"
                    checked={newQA.is_featured}
                    onCheckedChange={(checked) => setNewQA({...newQA, is_featured: !!checked})}
                  />
                  <label htmlFor="qa-featured" className="text-sm">Featured Q&A</label>
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Immigration Q&A
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

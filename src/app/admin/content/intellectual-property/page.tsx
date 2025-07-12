'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, MessageSquare, Plus, Edit, Trash2, Eye, Save, Upload, FileText, AlertCircle, Lightbulb, Scale, Copyright } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

// IP Law Category ID
const IP_LAW_CATEGORY_ID = '64f9abe4-f1c2-4eb6-9d11-6f107ab9def1'

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
  user_id: string | null
  question: string
  answer: string
  ai_response: any | null
  tags: string[]
  difficulty_level: string
  is_featured: boolean
  is_public: boolean
  status: string
  helpful_votes: number
  view_count: number
  created_at: string
  updated_at: string
}

interface ArticleForm {
  title: string
  summary: string
  content: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_published: boolean
  seo_title: string
  seo_description: string
  ip_type: string
  includes_ipos: boolean
  international_scope: boolean
  business_focus: string
}

interface QAForm {
  question: string
  answer: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_public: boolean
  ip_category: string
}

export default function IPLawContentPage() {
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [qas, setQAs] = useState<LegalQA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form states
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showQAForm, setShowQAForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<LegalArticle | null>(null)
  const [editingQA, setEditingQA] = useState<LegalQA | null>(null)
  
  const [articleForm, setArticleForm] = useState<ArticleForm>({
    title: '',
    summary: '',
    content: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_published: false,
    seo_title: '',
    seo_description: '',
    ip_type: 'General',
    includes_ipos: false,
    international_scope: false,
    business_focus: 'General'
  })
  
  const [qaForm, setQAForm] = useState<QAForm>({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_public: true,
    ip_category: 'general'
  })

  useEffect(() => {
    fetchIPLawContent()
  }, [])

  const fetchIPLawContent = async () => {
    try {
      setLoading(true)
      
      // Fetch IP Law articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', IP_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError
      setArticles(articlesData || [])

      // Fetch IP Law Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', IP_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError
      setQAs(qasData || [])

    } catch (error) {
      console.error('Error fetching content:', error)
      setMessage({ type: 'error', text: 'Failed to load content' })
    } finally {
      setLoading(false)
    }
  }

  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 250
    const wordCount = content.trim().split(/\s+/).length
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

  const validateArticleForm = (): string | null => {
    if (!articleForm.title.trim()) return 'Title is required'
    if (articleForm.title.length < 10) return 'Title must be at least 10 characters'
    if (!articleForm.summary.trim()) return 'Summary is required'
    if (articleForm.summary.length < 50) return 'Summary must be at least 50 characters'
    if (!articleForm.content.trim()) return 'Content is required'
    if (articleForm.content.length < 2000) return 'Content must be at least 2000 characters for comprehensive IP guidance'
    if (!articleForm.title.toLowerCase().includes('singapore') && !articleForm.content.toLowerCase().includes('singapore')) {
      return 'Content must include Singapore-specific guidance'
    }
    if (articleForm.includes_ipos && !articleForm.content.toLowerCase().includes('ipos')) {
      return 'Content marked as including IPOS procedures must reference IPOS'
    }
    return null
  }

  const validateQAForm = (): string | null => {
    if (!qaForm.question.trim()) return 'Question is required'
    if (qaForm.question.length < 10) return 'Question must be at least 10 characters'
    if (!qaForm.answer.trim()) return 'Answer is required'
    if (qaForm.answer.length < 100) return 'Answer must be at least 100 characters'
    if (!qaForm.question.toLowerCase().includes('singapore') && !qaForm.answer.toLowerCase().includes('singapore')) {
      return 'Q&A must include Singapore-specific guidance'
    }
    return null
  }

  const saveArticle = async () => {
    const validationError = validateArticleForm()
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    try {
      setSaving(true)
      
      const articleData = {
        category_id: IP_LAW_CATEGORY_ID,
        title: articleForm.title.trim(),
        slug: generateSlug(articleForm.title),
        summary: articleForm.summary.trim(),
        content: articleForm.content.trim(),
        content_type: 'article',
        difficulty_level: articleForm.difficulty_level,
        tags: articleForm.tags ? articleForm.tags.split(',').map(tag => tag.trim()) : [],
        reading_time_minutes: calculateReadingTime(articleForm.content),
        is_featured: articleForm.is_featured,
        is_published: articleForm.is_published,
        author_name: 'Singapore Legal Help',
        seo_title: articleForm.seo_title.trim() || null,
        seo_description: articleForm.seo_description.trim() || null,
        view_count: 0,
        updated_at: new Date().toISOString()
      }

      let result
      if (editingArticle) {
        result = await supabase
          .from('legal_articles')
          .update(articleData)
          .eq('id', editingArticle.id)
      } else {
        result = await supabase
          .from('legal_articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }])
      }

      if (result.error) throw result.error

      setMessage({ 
        type: 'success', 
        text: editingArticle ? 'Article updated successfully!' : 'Article created successfully!' 
      })
      
      // Reset form and refresh data
      resetArticleForm()
      fetchIPLawContent()

    } catch (error) {
      console.error('Error saving article:', error)
      setMessage({ type: 'error', text: 'Failed to save article' })
    } finally {
      setSaving(false)
    }
  }

  const saveQA = async () => {
    const validationError = validateQAForm()
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    try {
      setSaving(true)
      
      const qaData = {
        category_id: IP_LAW_CATEGORY_ID,
        user_id: null,
        question: qaForm.question.trim(),
        answer: qaForm.answer.trim(),
        ai_response: null,
        tags: qaForm.tags ? qaForm.tags.split(',').map(tag => tag.trim()) : [],
        difficulty_level: qaForm.difficulty_level,
        is_featured: qaForm.is_featured,
        is_public: qaForm.is_public,
        status: 'published',
        helpful_votes: 0,
        view_count: 0,
        updated_at: new Date().toISOString()
      }

      let result
      if (editingQA) {
        result = await supabase
          .from('legal_qa')
          .update(qaData)
          .eq('id', editingQA.id)
      } else {
        result = await supabase
          .from('legal_qa')
          .insert([{ ...qaData, created_at: new Date().toISOString() }])
      }

      if (result.error) throw result.error

      setMessage({ 
        type: 'success', 
        text: editingQA ? 'Q&A updated successfully!' : 'Q&A created successfully!' 
      })
      
      // Reset form and refresh data
      resetQAForm()
      fetchIPLawContent()

    } catch (error) {
      console.error('Error saving Q&A:', error)
      setMessage({ type: 'error', text: 'Failed to save Q&A' })
    } finally {
      setSaving(false)
    }
  }

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      summary: '',
      content: '',
      difficulty_level: 'beginner',
      tags: '',
      is_featured: false,
      is_published: false,
      seo_title: '',
      seo_description: '',
      ip_type: 'General',
      includes_ipos: false,
      international_scope: false,
      business_focus: 'General'
    })
    setEditingArticle(null)
    setShowArticleForm(false)
  }

  const resetQAForm = () => {
    setQAForm({
      question: '',
      answer: '',
      difficulty_level: 'beginner',
      tags: '',
      is_featured: false,
      is_public: true,
      ip_category: 'general'
    })
    setEditingQA(null)
    setShowQAForm(false)
  }

  const editArticle = (article: LegalArticle) => {
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      difficulty_level: article.difficulty_level,
      tags: article.tags.join(', '),
      is_featured: article.is_featured,
      is_published: article.is_published,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      ip_type: 'General', // Default, could be enhanced with metadata
      includes_ipos: article.content.toLowerCase().includes('ipos'),
      international_scope: article.content.toLowerCase().includes('international'),
      business_focus: 'General'
    })
    setEditingArticle(article)
    setShowArticleForm(true)
  }

  const editQA = (qa: LegalQA) => {
    setQAForm({
      question: qa.question,
      answer: qa.answer,
      difficulty_level: qa.difficulty_level,
      tags: qa.tags.join(', '),
      is_featured: qa.is_featured,
      is_public: qa.is_public,
      ip_category: qa.tags.includes('patent') ? 'patent' :
                   qa.tags.includes('trademark') ? 'trademark' :
                   qa.tags.includes('copyright') ? 'copyright' : 'general'
    })
    setEditingQA(qa)
    setShowQAForm(true)
  }

  const importIPLawContent = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/import-ip-law', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Import completed! Created ${result.results.articles.created} articles and ${result.results.qas.created} Q&As.`
        })
        fetchIPLawContent() // Refresh the content
      } else {
        setMessage({
          type: 'error',
          text: `Import failed: ${result.error}`
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setMessage({
        type: 'error',
        text: 'Failed to import content. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const getIPTypeIcon = (tags: string[]) => {
    if (tags.some(tag => tag.includes('patent'))) return <Scale className="h-4 w-4" />
    if (tags.some(tag => tag.includes('trademark'))) return <Lightbulb className="h-4 w-4" />
    if (tags.some(tag => tag.includes('copyright'))) return <Copyright className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IP Law content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <Lightbulb className="inline-block h-8 w-8 mr-3 text-purple-600" />
                IP Law Content Management
              </h1>
              <p className="text-gray-600">Manage articles and Q&As for Intellectual Property Law practice area</p>
            </div>
            <Link href="/admin/content">
              <Button variant="outline">← Back to Content Management</Button>
            </Link>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles.length}</div>
              <p className="text-xs text-muted-foreground">
                {articles.filter(a => a.is_published).length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Q&As</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qas.length}</div>
              <p className="text-xs text-muted-foreground">
                {qas.filter(qa => qa.status === 'published').length} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress to Target</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{Math.round((articles.length / 8) * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Articles (Target: 8)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Q&A Progress</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{Math.round((qas.length / 20) * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                Q&As (Target: 20)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Articles ({articles.length})</span>
            </TabsTrigger>
            <TabsTrigger value="qas" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Q&As ({qas.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">IP Law Articles</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={importIPLawContent}
                  variant="outline"
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{saving ? 'Importing...' : 'Batch Import'}</span>
                </Button>
                <Button
                  onClick={() => setShowArticleForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Article</span>
                </Button>
              </div>
            </div>

            {/* Article Creation/Edit Form */}
            {showArticleForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                  </CardTitle>
                  <CardDescription>
                    Create comprehensive IP Law content for Singapore (minimum 2000 words)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <Input
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                        placeholder="e.g., Patent Strategy for Singapore Businesses: Protection & Monetization"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP Type
                      </label>
                      <Select
                        value={articleForm.ip_type}
                        onValueChange={(value) => setArticleForm({...articleForm, ip_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Patent">Patent</SelectItem>
                          <SelectItem value="Trademark">Trademark</SelectItem>
                          <SelectItem value="Copyright">Copyright</SelectItem>
                          <SelectItem value="Trade Secret">Trade Secret</SelectItem>
                          <SelectItem value="General">General IP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <Select
                        value={articleForm.difficulty_level}
                        onValueChange={(value) => setArticleForm({...articleForm, difficulty_level: value})}
                      >
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Focus
                      </label>
                      <Select
                        value={articleForm.business_focus}
                        onValueChange={(value) => setArticleForm({...articleForm, business_focus: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Startup">Startup</SelectItem>
                          <SelectItem value="SME">SME</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Summary *
                    </label>
                    <Textarea
                      value={articleForm.summary}
                      onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                      placeholder="Brief summary of the article content (minimum 50 characters)"
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content * (Current: {articleForm.content.length} characters)
                    </label>
                    <Textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                      placeholder="Comprehensive IP Law content for Singapore (minimum 2000 characters)"
                      rows={15}
                      className="w-full font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Reading time: ~{calculateReadingTime(articleForm.content)} minutes
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (comma-separated)
                      </label>
                      <Input
                        value={articleForm.tags}
                        onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                        placeholder="singapore patents, IPOS, intellectual property"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Title
                      </label>
                      <Input
                        value={articleForm.seo_title}
                        onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})}
                        placeholder="SEO optimized title"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Description
                    </label>
                    <Textarea
                      value={articleForm.seo_description}
                      onChange={(e) => setArticleForm({...articleForm, seo_description: e.target.value})}
                      placeholder="SEO meta description"
                      rows={2}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={articleForm.includes_ipos}
                        onChange={(e) => setArticleForm({...articleForm, includes_ipos: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Includes IPOS Procedures</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={articleForm.international_scope}
                        onChange={(e) => setArticleForm({...articleForm, international_scope: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">International Scope</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={articleForm.is_featured}
                        onChange={(e) => setArticleForm({...articleForm, is_featured: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Featured Article</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={articleForm.is_published}
                        onChange={(e) => setArticleForm({...articleForm, is_published: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Publish Immediately</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      onClick={saveArticle}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : (editingArticle ? 'Update Article' : 'Create Article')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetArticleForm}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Articles List */}
            <div className="grid gap-4">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getIPTypeIcon(article.tags)}
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                        </div>
                        <CardDescription className="mb-3">{article.summary}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant={article.is_published ? "default" : "secondary"}>
                            {article.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline">{article.difficulty_level}</Badge>
                          {article.is_featured && <Badge variant="outline">Featured</Badge>}
                          {article.content.toLowerCase().includes('ipos') && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">IPOS</Badge>
                          )}
                          {article.content.toLowerCase().includes('international') && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">International</Badge>
                          )}
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.view_count} views
                          </span>
                          <span>{article.reading_time_minutes} min read</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editArticle(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {articles.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No IP Law Articles Yet</h3>
                    <p className="text-gray-500 mb-4">Create your first IP Law article or use batch import to get started.</p>
                    <div className="flex justify-center space-x-2">
                      <Button onClick={() => setShowArticleForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Article
                      </Button>
                      <Button variant="outline" onClick={importIPLawContent}>
                        <Upload className="h-4 w-4 mr-2" />
                        Batch Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Q&As Tab */}
          <TabsContent value="qas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">IP Law Q&As</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowQAForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Q&A</span>
                </Button>
              </div>
            </div>

            {/* Q&A Creation/Edit Form */}
            {showQAForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {editingQA ? 'Edit Q&A' : 'Create New Q&A'}
                  </CardTitle>
                  <CardDescription>
                    Create practical Q&A content for IP Law
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <Input
                      value={qaForm.question}
                      onChange={(e) => setQAForm({...qaForm, question: e.target.value})}
                      placeholder="e.g., How much does patent registration cost in Singapore?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer * (Current: {qaForm.answer.length} characters)
                    </label>
                    <Textarea
                      value={qaForm.answer}
                      onChange={(e) => setQAForm({...qaForm, answer: e.target.value})}
                      placeholder="Comprehensive answer with Singapore IP law context (minimum 100 characters)"
                      rows={8}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP Category
                      </label>
                      <Select
                        value={qaForm.ip_category}
                        onValueChange={(value) => setQAForm({...qaForm, ip_category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patent">Patent</SelectItem>
                          <SelectItem value="trademark">Trademark</SelectItem>
                          <SelectItem value="copyright">Copyright</SelectItem>
                          <SelectItem value="general">General IP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <Select
                        value={qaForm.difficulty_level}
                        onValueChange={(value) => setQAForm({...qaForm, difficulty_level: value})}
                      >
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (comma-separated)
                      </label>
                      <Input
                        value={qaForm.tags}
                        onChange={(e) => setQAForm({...qaForm, tags: e.target.value})}
                        placeholder="patent costs, IPOS, singapore"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={qaForm.is_featured}
                        onChange={(e) => setQAForm({...qaForm, is_featured: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Featured Q&A</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={qaForm.is_public}
                        onChange={(e) => setQAForm({...qaForm, is_public: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Public (Visible to Users)</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      onClick={saveQA}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : (editingQA ? 'Update Q&A' : 'Create Q&A')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetQAForm}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Q&As List */}
            <div className="grid gap-4">
              {qas.map((qa) => (
                <Card key={qa.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getIPTypeIcon(qa.tags)}
                          <CardTitle className="text-lg">{qa.question}</CardTitle>
                        </div>
                        <CardDescription className="mb-3 line-clamp-2">{qa.answer}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant={qa.status === 'published' ? "default" : "secondary"}>
                            {qa.status}
                          </Badge>
                          <Badge variant="outline">{qa.difficulty_level}</Badge>
                          {qa.is_featured && <Badge variant="outline">Featured</Badge>}
                          <Badge variant={qa.is_public ? "default" : "secondary"}>
                            {qa.is_public ? "Public" : "Private"}
                          </Badge>
                          {qa.tags.includes('patent') && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">Patent</Badge>
                          )}
                          {qa.tags.includes('trademark') && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">Trademark</Badge>
                          )}
                          {qa.tags.includes('copyright') && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Copyright</Badge>
                          )}
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {qa.view_count} views
                          </span>
                          <span>👍 {qa.helpful_votes}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editQA(qa)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {qas.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No IP Law Q&As Yet</h3>
                    <p className="text-gray-500 mb-4">Create your first IP Law Q&A to get started.</p>
                    <Button onClick={() => setShowQAForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Q&A
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

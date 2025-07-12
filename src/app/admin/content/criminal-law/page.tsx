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
  Shield,
  Scale
} from 'lucide-react'

// Criminal Law Category ID from Task CR-1
const CRIMINAL_LAW_CATEGORY_ID = '0047f44c-0869-432e-9b25-a20dbabe53fb'

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
  // Criminal Law specific fields
  criminal_case_type: string
  severity_level: string
  legal_complexity: string
  singapore_cpc_compliance: boolean
  legal_disclaimer_included: boolean
}

interface QAForm {
  question: string
  answer: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_public: boolean
  // Criminal Law specific fields
  criminal_category: string
  urgency_level: string
  procedural_guidance: boolean
}

export default function CriminalLawContentPage() {
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [qas, setQAs] = useState<LegalQA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // Form states
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showQAForm, setShowQAForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<LegalArticle | null>(null)
  const [editingQA, setEditingQA] = useState<LegalQA | null>(null)
  
  const [articleForm, setArticleForm] = useState<ArticleForm>({
    title: '',
    summary: '',
    content: '',
    difficulty_level: 'intermediate',
    tags: '',
    is_featured: false,
    is_published: false,
    seo_title: '',
    seo_description: '',
    criminal_case_type: 'General',
    severity_level: 'Summary',
    legal_complexity: 'Basic rights',
    singapore_cpc_compliance: false,
    legal_disclaimer_included: false
  })
  
  const [qaForm, setQAForm] = useState<QAForm>({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_public: true,
    criminal_category: 'Arrest & Rights',
    urgency_level: 'Medium',
    procedural_guidance: false
  })

  useEffect(() => {
    fetchCriminalLawContent()
  }, [])

  const fetchCriminalLawContent = async () => {
    try {
      setLoading(true)
      
      // Fetch Criminal Law articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', CRIMINAL_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError
      setArticles(articlesData || [])

      // Fetch Criminal Law Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', CRIMINAL_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError
      setQAs(qasData || [])

    } catch (error) {
      console.error('Error fetching Criminal Law content:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load Criminal Law content. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      summary: '',
      content: '',
      difficulty_level: 'intermediate',
      tags: '',
      is_featured: false,
      is_published: false,
      seo_title: '',
      seo_description: '',
      criminal_case_type: 'General',
      severity_level: 'Summary',
      legal_complexity: 'Basic rights',
      singapore_cpc_compliance: false,
      legal_disclaimer_included: false
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
      criminal_category: 'Arrest & Rights',
      urgency_level: 'Medium',
      procedural_guidance: false
    })
    setEditingQA(null)
    setShowQAForm(false)
  }

  const saveArticle = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Validation
      if (!articleForm.title.trim() || !articleForm.content.trim()) {
        throw new Error('Title and content are required')
      }

      // Criminal Law specific validation
      if (articleForm.content.length < 2500) {
        throw new Error('Criminal Law articles must be at least 2500 words for comprehensive coverage')
      }

      if (!articleForm.singapore_cpc_compliance) {
        throw new Error('Singapore Criminal Procedure Code compliance must be verified')
      }

      if (!articleForm.legal_disclaimer_included) {
        throw new Error('Legal disclaimer must be included for criminal law content')
      }

      const slug = generateSlug(articleForm.title)
      const readingTime = calculateReadingTime(articleForm.content)
      const tags = articleForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      const articleData = {
        category_id: CRIMINAL_LAW_CATEGORY_ID,
        title: articleForm.title,
        slug,
        summary: articleForm.summary,
        content: articleForm.content,
        content_type: 'guide',
        difficulty_level: articleForm.difficulty_level,
        tags,
        reading_time_minutes: readingTime,
        is_featured: articleForm.is_featured,
        is_published: articleForm.is_published,
        author_name: 'Singapore Legal Help',
        seo_title: articleForm.seo_title || articleForm.title,
        seo_description: articleForm.seo_description || articleForm.summary,
        view_count: 0
      }

      let result
      if (editingArticle) {
        result = await supabase
          .from('legal_articles')
          .update(articleData)
          .eq('id', editingArticle.id)
          .select()
      } else {
        result = await supabase
          .from('legal_articles')
          .insert([articleData])
          .select()
      }

      if (result.error) throw result.error

      setMessage({
        type: 'success',
        text: `Criminal Law article ${editingArticle ? 'updated' : 'created'} successfully!`
      })
      
      resetArticleForm()
      fetchCriminalLawContent()

    } catch (error: any) {
      console.error('Error saving article:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save article. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const saveQA = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Validation
      if (!qaForm.question.trim() || !qaForm.answer.trim()) {
        throw new Error('Question and answer are required')
      }

      // Criminal Law specific validation
      if (qaForm.answer.length < 500) {
        throw new Error('Criminal Law Q&A answers must be at least 500 characters for comprehensive guidance')
      }

      if (!qaForm.procedural_guidance) {
        throw new Error('Procedural guidance verification is required for criminal law Q&As')
      }

      const tags = qaForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      const qaData = {
        category_id: CRIMINAL_LAW_CATEGORY_ID,
        user_id: null, // Admin created
        question: qaForm.question,
        answer: qaForm.answer,
        ai_response: null,
        tags,
        difficulty_level: qaForm.difficulty_level,
        is_featured: qaForm.is_featured,
        is_public: qaForm.is_public,
        status: 'published',
        helpful_votes: 0,
        view_count: 0
      }

      let result
      if (editingQA) {
        result = await supabase
          .from('legal_qa')
          .update(qaData)
          .eq('id', editingQA.id)
          .select()
      } else {
        result = await supabase
          .from('legal_qa')
          .insert([qaData])
          .select()
      }

      if (result.error) throw result.error

      setMessage({
        type: 'success',
        text: `Criminal Law Q&A ${editingQA ? 'updated' : 'created'} successfully!`
      })

      resetQAForm()
      fetchCriminalLawContent()

    } catch (error: any) {
      console.error('Error saving Q&A:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save Q&A. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Criminal Law article?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('legal_articles')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Criminal Law article deleted successfully!'
      })

      fetchCriminalLawContent()

    } catch (error) {
      console.error('Error deleting article:', error)
      setMessage({
        type: 'error',
        text: 'Failed to delete article. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteQA = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Criminal Law Q&A?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('legal_qa')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Criminal Law Q&A deleted successfully!'
      })

      fetchCriminalLawContent()

    } catch (error) {
      console.error('Error deleting Q&A:', error)
      setMessage({
        type: 'error',
        text: 'Failed to delete Q&A. Please try again.'
      })
    } finally {
      setSaving(false)
    }
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
      criminal_case_type: 'General', // Default for existing articles
      severity_level: 'Summary',
      legal_complexity: 'Basic rights',
      singapore_cpc_compliance: true, // Assume existing articles are compliant
      legal_disclaimer_included: true
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
      criminal_category: 'Arrest & Rights', // Default for existing Q&As
      urgency_level: 'Medium',
      procedural_guidance: true // Assume existing Q&As have guidance
    })
    setEditingQA(qa)
    setShowQAForm(true)
  }

  const importCriminalLawContent = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/import-criminal-law', {
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
        fetchCriminalLawContent() // Refresh the content
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Criminal Law content...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                Criminal Law Content Management
              </h1>
              <p className="text-gray-600">Manage articles and Q&As for Criminal Law practice area</p>
            </div>
            <Link href="/admin/content">
              <Button variant="outline">← Back to Content Management</Button>
            </Link>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articles.length}</div>
              <p className="text-xs text-muted-foreground">
                Target: 8 articles ({8 - articles.length} remaining)
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
                Target: 20 Q&As ({20 - qas.length} remaining)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {articles.filter(a => a.is_published).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {articles.filter(a => !a.is_published).length} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {articles.reduce((sum, a) => sum + a.view_count, 0) +
                 qas.reduce((sum, q) => sum + q.view_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined article & Q&A views
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
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
              <h2 className="text-xl font-semibold">Criminal Law Articles</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={importCriminalLawContent}
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

            <div className="grid gap-4">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center">
                          <Scale className="h-5 w-5 text-red-600 mr-2" />
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mb-3">{article.summary}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Criminal Law
                          </Badge>
                          <Badge variant={article.is_published ? "default" : "secondary"}>
                            {article.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline">{article.difficulty_level}</Badge>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteArticle(article.id)}
                          disabled={saving}
                        >
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
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Criminal Law Articles Yet</h3>
                    <p className="text-gray-500 mb-4">Create your first Criminal Law article to get started.</p>
                    <Button onClick={() => setShowArticleForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Article
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Q&As Tab */}
          <TabsContent value="qas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Criminal Law Q&As</h2>
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

            <div className="grid gap-4">
              {qas.map((qa) => (
                <Card key={qa.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center">
                          <MessageSquare className="h-5 w-5 text-red-600 mr-2" />
                          {qa.question}
                        </CardTitle>
                        <CardDescription className="mb-3 line-clamp-2">{qa.answer}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Criminal Law
                          </Badge>
                          <Badge variant={qa.status === 'published' ? "default" : "secondary"}>
                            {qa.status}
                          </Badge>
                          <Badge variant="outline">{qa.difficulty_level}</Badge>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQA(qa.id)}
                          disabled={saving}
                        >
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Criminal Law Q&As Yet</h3>
                    <p className="text-gray-500 mb-4">Create your first Criminal Law Q&A to get started.</p>
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

        {/* Article Form Modal */}
        {showArticleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Shield className="h-6 w-6 text-red-600 mr-2" />
                    {editingArticle ? 'Edit Criminal Law Article' : 'Create Criminal Law Article'}
                  </h2>
                  <Button variant="outline" onClick={resetArticleForm}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Article Title *
                      </label>
                      <Input
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                        placeholder="e.g., Criminal Court Procedures in Singapore"
                      />
                    </div>
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
                  </div>

                  {/* Criminal Law Specific Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Criminal Case Type
                      </label>
                      <Select
                        value={articleForm.criminal_case_type}
                        onValueChange={(value) => setArticleForm({...articleForm, criminal_case_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="White Collar">White Collar</SelectItem>
                          <SelectItem value="Drug Offenses">Drug Offenses</SelectItem>
                          <SelectItem value="Violence">Violence</SelectItem>
                          <SelectItem value="Property">Property</SelectItem>
                          <SelectItem value="Traffic">Traffic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Severity Level
                      </label>
                      <Select
                        value={articleForm.severity_level}
                        onValueChange={(value) => setArticleForm({...articleForm, severity_level: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Summary">Summary</SelectItem>
                          <SelectItem value="Indictable">Indictable</SelectItem>
                          <SelectItem value="Capital">Capital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Legal Complexity
                      </label>
                      <Select
                        value={articleForm.legal_complexity}
                        onValueChange={(value) => setArticleForm({...articleForm, legal_complexity: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic rights">Basic rights</SelectItem>
                          <SelectItem value="Court procedures">Court procedures</SelectItem>
                          <SelectItem value="Advanced defense">Advanced defense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Article Summary *
                    </label>
                    <Textarea
                      value={articleForm.summary}
                      onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                      placeholder="Brief summary of the article content..."
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Article Content * (Minimum 2500 words for Criminal Law)
                    </label>
                    <Textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                      placeholder="Full article content in markdown format..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current word count: {articleForm.content.split(/\s+/).filter(Boolean).length} words
                    </p>
                  </div>

                  {/* SEO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Title
                      </label>
                      <Input
                        value={articleForm.seo_title}
                        onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})}
                        placeholder="SEO optimized title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SEO Description
                      </label>
                      <Input
                        value={articleForm.seo_description}
                        onChange={(e) => setArticleForm({...articleForm, seo_description: e.target.value})}
                        placeholder="SEO meta description..."
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={articleForm.tags}
                      onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                      placeholder="criminal defense, singapore law, court procedures..."
                    />
                  </div>

                  {/* Criminal Law Compliance Checks */}
                  <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-medium text-red-800">Criminal Law Compliance Checks</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="singapore_cpc_compliance"
                        checked={articleForm.singapore_cpc_compliance}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, singapore_cpc_compliance: checked as boolean})
                        }
                      />
                      <label htmlFor="singapore_cpc_compliance" className="text-sm text-red-700">
                        Singapore Criminal Procedure Code compliance verified *
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="legal_disclaimer_included"
                        checked={articleForm.legal_disclaimer_included}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, legal_disclaimer_included: checked as boolean})
                        }
                      />
                      <label htmlFor="legal_disclaimer_included" className="text-sm text-red-700">
                        Legal disclaimer included for criminal law content *
                      </label>
                    </div>
                  </div>

                  {/* Publishing Options */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_featured"
                        checked={articleForm.is_featured}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, is_featured: checked as boolean})
                        }
                      />
                      <label htmlFor="is_featured" className="text-sm">
                        Featured Article
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_published"
                        checked={articleForm.is_published}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, is_published: checked as boolean})
                        }
                      />
                      <label htmlFor="is_published" className="text-sm">
                        Publish Immediately
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={resetArticleForm}>
                      Cancel
                    </Button>
                    <Button onClick={saveArticle} disabled={saving}>
                      {saving ? 'Saving...' : (editingArticle ? 'Update Article' : 'Create Article')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Q&A Form Modal */}
        {showQAForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center">
                    <MessageSquare className="h-6 w-6 text-red-600 mr-2" />
                    {editingQA ? 'Edit Criminal Law Q&A' : 'Create Criminal Law Q&A'}
                  </h2>
                  <Button variant="outline" onClick={resetQAForm}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Question */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <Input
                      value={qaForm.question}
                      onChange={(e) => setQAForm({...qaForm, question: e.target.value})}
                      placeholder="e.g., What should I do if I'm arrested in Singapore?"
                    />
                  </div>

                  {/* Criminal Law Specific Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Criminal Category
                      </label>
                      <Select
                        value={qaForm.criminal_category}
                        onValueChange={(value) => setQAForm({...qaForm, criminal_category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arrest & Rights">Arrest & Rights</SelectItem>
                          <SelectItem value="Court Process">Court Process</SelectItem>
                          <SelectItem value="Legal Representation">Legal Representation</SelectItem>
                          <SelectItem value="Penalties & Consequences">Penalties & Consequences</SelectItem>
                          <SelectItem value="Specific Offenses">Specific Offenses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Urgency Level
                      </label>
                      <Select
                        value={qaForm.urgency_level}
                        onValueChange={(value) => setQAForm({...qaForm, urgency_level: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
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
                  </div>

                  {/* Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer * (Minimum 500 characters for Criminal Law)
                    </label>
                    <Textarea
                      value={qaForm.answer}
                      onChange={(e) => setQAForm({...qaForm, answer: e.target.value})}
                      placeholder="Comprehensive answer with practical guidance..."
                      rows={12}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current character count: {qaForm.answer.length} characters
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <Input
                      value={qaForm.tags}
                      onChange={(e) => setQAForm({...qaForm, tags: e.target.value})}
                      placeholder="criminal arrest, legal rights, police questioning..."
                    />
                  </div>

                  {/* Criminal Law Compliance Check */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="procedural_guidance"
                        checked={qaForm.procedural_guidance}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, procedural_guidance: checked as boolean})
                        }
                      />
                      <label htmlFor="procedural_guidance" className="text-sm text-red-700">
                        Procedural guidance verified for criminal law accuracy *
                      </label>
                    </div>
                  </div>

                  {/* Publishing Options */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qa_is_featured"
                        checked={qaForm.is_featured}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, is_featured: checked as boolean})
                        }
                      />
                      <label htmlFor="qa_is_featured" className="text-sm">
                        Featured Q&A
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qa_is_public"
                        checked={qaForm.is_public}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, is_public: checked as boolean})
                        }
                      />
                      <label htmlFor="qa_is_public" className="text-sm">
                        Public Q&A
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={resetQAForm}>
                      Cancel
                    </Button>
                    <Button onClick={saveQA} disabled={saving}>
                      {saving ? 'Saving...' : (editingQA ? 'Update Q&A' : 'Create Q&A')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

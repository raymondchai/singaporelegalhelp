'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle, Plus, Edit, Trash2, Save, X, Upload, Clock, CheckCircle, Users, FileText, MessageSquare } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LawAreaConfig } from '@/data/law-areas-config'

interface Article {
  id: string
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

interface QA {
  id: string
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
  content_type: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_published: boolean
  seo_title: string
  seo_description: string
  [key: string]: any // For specialized fields
}

interface QAForm {
  question: string
  answer: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_public: boolean
  [key: string]: any // For specialized fields
}

interface UniversalLawAreaAdminProps {
  lawAreaConfig: LawAreaConfig
}

export default function UniversalLawAreaAdmin({ lawAreaConfig }: UniversalLawAreaAdminProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [qas, setQAs] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showQAForm, setShowQAForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [editingQA, setEditingQA] = useState<QA | null>(null)
  
  const [articleForm, setArticleForm] = useState<ArticleForm>({
    title: '',
    summary: '',
    content: '',
    content_type: 'comprehensive_guide',
    difficulty_level: 'intermediate',
    tags: '',
    is_featured: false,
    is_published: false,
    seo_title: '',
    seo_description: ''
  })
  
  const [qaForm, setQAForm] = useState<QAForm>({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_public: true
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchContent()
    initializeSpecializedFields()
  }, [lawAreaConfig])

  const initializeSpecializedFields = () => {
    // Initialize article specialized fields
    const articleDefaults: any = {}
    lawAreaConfig.specializedFields.articles.forEach(field => {
      if (field.type === 'checkbox') {
        articleDefaults[field.name] = false
      } else if (field.type === 'select' && field.options) {
        articleDefaults[field.name] = field.options[0]
      } else {
        articleDefaults[field.name] = ''
      }
    })
    setArticleForm(prev => ({ ...prev, ...articleDefaults }))

    // Initialize QA specialized fields
    const qaDefaults: any = {}
    lawAreaConfig.specializedFields.qas.forEach(field => {
      if (field.type === 'checkbox') {
        qaDefaults[field.name] = false
      } else if (field.type === 'select' && field.options) {
        qaDefaults[field.name] = field.options[0]
      } else {
        qaDefaults[field.name] = ''
      }
    })
    setQAForm(prev => ({ ...prev, ...qaDefaults }))
  }

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', lawAreaConfig.categoryId)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', lawAreaConfig.categoryId)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError

      setArticles(articlesData || [])
      setQAs(qasData || [])
    } catch (error) {
      console.error(`Error fetching ${lawAreaConfig.categoryName} content:`, error)
      setError('Failed to fetch content')
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

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const slug = generateSlug(articleForm.title)
      const readingTime = estimateReadingTime(articleForm.content)
      const tags = articleForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      const articleData = {
        category_id: lawAreaConfig.categoryId,
        title: articleForm.title,
        slug: editingArticle ? editingArticle.slug : slug,
        summary: articleForm.summary,
        content: articleForm.content,
        content_type: articleForm.content_type,
        difficulty_level: articleForm.difficulty_level,
        tags,
        reading_time_minutes: readingTime,
        is_featured: articleForm.is_featured,
        is_published: articleForm.is_published,
        author_name: 'Singapore Legal Help',
        seo_title: articleForm.seo_title || articleForm.title,
        seo_description: articleForm.seo_description || articleForm.summary,
        view_count: editingArticle?.view_count || 0
      }

      if (editingArticle) {
        const { error } = await supabase
          .from('legal_articles')
          .update(articleData)
          .eq('id', editingArticle.id)
        
        if (error) throw error
        setSuccess('Article updated successfully!')
      } else {
        const { error } = await supabase
          .from('legal_articles')
          .insert([articleData])
        
        if (error) throw error
        setSuccess('Article created successfully!')
      }

      resetArticleForm()
      fetchContent()
    } catch (error) {
      console.error('Error saving article:', error)
      setError('Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const tags = qaForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      const qaData = {
        category_id: lawAreaConfig.categoryId,
        user_id: null,
        question: qaForm.question,
        answer: qaForm.answer,
        ai_response: null,
        tags,
        difficulty_level: qaForm.difficulty_level,
        is_featured: qaForm.is_featured,
        is_public: qaForm.is_public,
        status: 'approved',
        helpful_votes: editingQA?.helpful_votes || 0,
        view_count: editingQA?.view_count || 0
      }

      if (editingQA) {
        const { error } = await supabase
          .from('legal_qa')
          .update(qaData)
          .eq('id', editingQA.id)
        
        if (error) throw error
        setSuccess('Q&A updated successfully!')
      } else {
        const { error } = await supabase
          .from('legal_qa')
          .insert([qaData])
        
        if (error) throw error
        setSuccess('Q&A created successfully!')
      }

      resetQAForm()
      fetchContent()
    } catch (error) {
      console.error('Error saving Q&A:', error)
      setError('Failed to save Q&A')
    } finally {
      setSaving(false)
    }
  }

  const resetArticleForm = () => {
    const defaultForm: ArticleForm = {
      title: '',
      summary: '',
      content: '',
      content_type: 'comprehensive_guide',
      difficulty_level: 'intermediate',
      tags: '',
      is_featured: false,
      is_published: false,
      seo_title: '',
      seo_description: ''
    }
    
    // Add specialized field defaults
    lawAreaConfig.specializedFields.articles.forEach(field => {
      if (field.type === 'checkbox') {
        defaultForm[field.name] = false
      } else if (field.type === 'select' && field.options) {
        defaultForm[field.name] = field.options[0]
      } else {
        defaultForm[field.name] = ''
      }
    })
    
    setArticleForm(defaultForm)
    setEditingArticle(null)
    setShowArticleForm(false)
  }

  const resetQAForm = () => {
    const defaultForm: QAForm = {
      question: '',
      answer: '',
      difficulty_level: 'beginner',
      tags: '',
      is_featured: false,
      is_public: true
    }

    // Add specialized field defaults
    lawAreaConfig.specializedFields.qas.forEach(field => {
      if (field.type === 'checkbox') {
        defaultForm[field.name] = false
      } else if (field.type === 'select' && field.options) {
        defaultForm[field.name] = field.options[0]
      } else {
        defaultForm[field.name] = ''
      }
    })

    setQAForm(defaultForm)
    setEditingQA(null)
    setShowQAForm(false)
  }

  const editArticle = (article: Article) => {
    const formData: ArticleForm = {
      title: article.title,
      summary: article.summary,
      content: article.content,
      content_type: article.content_type,
      difficulty_level: article.difficulty_level,
      tags: article.tags.join(', '),
      is_featured: article.is_featured,
      is_published: article.is_published,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || ''
    }

    // Initialize specialized fields with defaults
    lawAreaConfig.specializedFields.articles.forEach(field => {
      if (field.type === 'checkbox') {
        formData[field.name] = false
      } else if (field.type === 'select' && field.options) {
        formData[field.name] = field.options[0]
      } else {
        formData[field.name] = ''
      }
    })

    setArticleForm(formData)
    setEditingArticle(article)
    setShowArticleForm(true)
  }

  const editQA = (qa: QA) => {
    const formData: QAForm = {
      question: qa.question,
      answer: qa.answer,
      difficulty_level: qa.difficulty_level,
      tags: qa.tags.join(', '),
      is_featured: qa.is_featured,
      is_public: qa.is_public
    }

    // Initialize specialized fields with defaults
    lawAreaConfig.specializedFields.qas.forEach(field => {
      if (field.type === 'checkbox') {
        formData[field.name] = false
      } else if (field.type === 'select' && field.options) {
        formData[field.name] = field.options[0]
      } else {
        formData[field.name] = ''
      }
    })

    setQAForm(formData)
    setEditingQA(qa)
    setShowQAForm(true)
  }

  const deleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('legal_articles')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess('Article deleted successfully!')
      fetchContent()
    } catch (error) {
      console.error('Error deleting article:', error)
      setError('Failed to delete article')
    } finally {
      setSaving(false)
    }
  }

  const deleteQA = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Q&A?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('legal_qa')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess('Q&A deleted successfully!')
      fetchContent()
    } catch (error) {
      console.error('Error deleting Q&A:', error)
      setError('Failed to delete Q&A')
    } finally {
      setSaving(false)
    }
  }

  const importContent = async () => {
    if (!lawAreaConfig.hasExistingContent) {
      setError('No import content available for this law area')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(lawAreaConfig.importEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Import completed! Check the results for details.`)
        fetchContent()
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error('Error importing content:', error)
      setError('Failed to import content')
    } finally {
      setSaving(false)
    }
  }

  // Calculate statistics
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.is_published).length,
    draft: articles.filter(a => !a.is_published).length,
    featured: articles.filter(a => a.is_featured).length,
    totalQAs: qas.length,
    publicQAs: qas.filter(qa => qa.is_public).length,
    featuredQAs: qas.filter(qa => qa.is_featured).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {lawAreaConfig.categoryName} content...</p>
        </div>
      </div>
    )
  }

  const IconComponent = lawAreaConfig.icon

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-8 w-8 ${lawAreaConfig.color}`} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lawAreaConfig.categoryName} Content Management
              </h1>
              <p className="text-gray-600">{lawAreaConfig.description}</p>
            </div>
          </div>
          <Badge variant="destructive" className="text-sm">
            🔒 Admin Access
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-gray-500">{stats.published} published</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Q&As</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalQAs}</p>
                <p className="text-xs text-gray-500">{stats.publicQAs} public</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featured + stats.featuredQAs}</p>
                <p className="text-xs text-gray-500">Articles & Q&As</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
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
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Articles ({articles.length})</span>
          </TabsTrigger>
          <TabsTrigger value="qas" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Q&As ({qas.length})</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import Content</span>
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{lawAreaConfig.categoryName} Articles</h2>
            <div className="flex items-center space-x-2">
              {lawAreaConfig.hasExistingContent && (
                <Button
                  onClick={importContent}
                  variant="outline"
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{saving ? 'Importing...' : 'Batch Import'}</span>
                </Button>
              )}
              <Button
                onClick={() => setShowArticleForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Article</span>
              </Button>
            </div>
          </div>

          {/* Article Form */}
          {showArticleForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</CardTitle>
                <CardDescription>
                  {editingArticle ? 'Update the article details below' : `Fill in the details to create a new ${lawAreaConfig.categoryName} article`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleArticleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                        placeholder={`e.g., ${lawAreaConfig.categoryName} Guide for Singapore`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content_type">Content Type</Label>
                      <Select
                        value={articleForm.content_type}
                        onValueChange={(value) => setArticleForm({...articleForm, content_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comprehensive_guide">Comprehensive Guide</SelectItem>
                          <SelectItem value="step_by_step">Step-by-Step Guide</SelectItem>
                          <SelectItem value="overview">Overview</SelectItem>
                          <SelectItem value="faq">FAQ</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary *</Label>
                    <Textarea
                      id="summary"
                      value={articleForm.summary}
                      onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                      placeholder="Brief description of the article content..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                      placeholder="Full article content in Markdown format..."
                      rows={15}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty_level">Difficulty Level</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={articleForm.tags}
                        onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                        placeholder={`${lawAreaConfig.categorySlug}, singapore, legal-guide`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={articleForm.seo_title}
                        onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})}
                        placeholder="SEO-optimized title"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Input
                      id="seo_description"
                      value={articleForm.seo_description}
                      onChange={(e) => setArticleForm({...articleForm, seo_description: e.target.value})}
                      placeholder="SEO meta description"
                    />
                  </div>

                  {/* Specialized Fields for Articles */}
                  {lawAreaConfig.specializedFields.articles.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">{lawAreaConfig.categoryName} Specific Options</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {lawAreaConfig.specializedFields.articles.map((field) => (
                          <div key={field.name} className="space-y-2">
                            {field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={field.name}
                                  checked={articleForm[field.name] || false}
                                  onCheckedChange={(checked) =>
                                    setArticleForm({...articleForm, [field.name]: checked as boolean})
                                  }
                                />
                                <Label htmlFor={field.name} className="text-sm">
                                  {field.label}
                                </Label>
                              </div>
                            ) : field.type === 'select' ? (
                              <div className="space-y-1">
                                <Label htmlFor={field.name} className="text-sm">{field.label}</Label>
                                <Select
                                  value={articleForm[field.name] || ''}
                                  onValueChange={(value) => setArticleForm({...articleForm, [field.name]: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((option) => (
                                      <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Label htmlFor={field.name} className="text-sm">{field.label}</Label>
                                <Input
                                  id={field.name}
                                  value={articleForm[field.name] || ''}
                                  onChange={(e) => setArticleForm({...articleForm, [field.name]: e.target.value})}
                                  placeholder={field.helpText}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Options */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_featured"
                        checked={articleForm.is_featured}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, is_featured: checked as boolean})
                        }
                      />
                      <Label htmlFor="is_featured">Featured Article</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_published"
                        checked={articleForm.is_published}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, is_published: checked as boolean})
                        }
                      />
                      <Label htmlFor="is_published">Published</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetArticleForm}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Articles List */}
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{article.title}</h3>
                        {article.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {article.is_published ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{article.summary}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📖 {article.reading_time_minutes} min read</span>
                        <span>👁️ {article.view_count} views</span>
                        <span>🏷️ {article.tags.join(', ')}</span>
                        <span>📅 {new Date(article.created_at).toLocaleDateString()}</span>
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
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

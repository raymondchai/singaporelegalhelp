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
import { AlertCircle, Plus, Edit, Trash2, Save, X, Heart, FileText, MessageSquare, Upload, Clock, CheckCircle, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Family Law Category ID
const FAMILY_LAW_CATEGORY_ID = '8ec7d509-45be-4416-94bc-4e58dd6bc7cc'

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
  // Family Law specific fields
  family_law_area: string
  singapore_family_court_compliance: boolean
  includes_2024_updates: boolean
  covers_dma_provisions: boolean
  parenting_guidance_included: boolean
}

interface QAForm {
  question: string
  answer: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_public: boolean
  // Family Law specific fields
  family_category: string
  urgency_level: string
  includes_practical_guidance: boolean
  singapore_specific: boolean
}

export default function FamilyLawContentAdmin() {
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
    seo_description: '',
    family_law_area: 'Divorce',
    singapore_family_court_compliance: true,
    includes_2024_updates: false,
    covers_dma_provisions: false,
    parenting_guidance_included: false
  })
  
  const [qaForm, setQAForm] = useState<QAForm>({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_public: true,
    family_category: 'Divorce & Separation',
    urgency_level: 'Medium',
    includes_practical_guidance: false,
    singapore_specific: true
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchFamilyLawContent()
  }, [])

  const fetchFamilyLawContent = async () => {
    try {
      setLoading(true)
      
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', FAMILY_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', FAMILY_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError

      setArticles(articlesData || [])
      setQAs(qasData || [])
    } catch (error) {
      console.error('Error fetching Family Law content:', error)
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
        category_id: FAMILY_LAW_CATEGORY_ID,
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
      fetchFamilyLawContent()
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
        category_id: FAMILY_LAW_CATEGORY_ID,
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
      fetchFamilyLawContent()
    } catch (error) {
      console.error('Error saving Q&A:', error)
      setError('Failed to save Q&A')
    } finally {
      setSaving(false)
    }
  }

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      summary: '',
      content: '',
      content_type: 'comprehensive_guide',
      difficulty_level: 'intermediate',
      tags: '',
      is_featured: false,
      is_published: false,
      seo_title: '',
      seo_description: '',
      family_law_area: 'Divorce',
      singapore_family_court_compliance: true,
      includes_2024_updates: false,
      covers_dma_provisions: false,
      parenting_guidance_included: false
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
      family_category: 'Divorce & Separation',
      urgency_level: 'Medium',
      includes_practical_guidance: false,
      singapore_specific: true
    })
    setEditingQA(null)
    setShowQAForm(false)
  }

  const editArticle = (article: Article) => {
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      content_type: article.content_type,
      difficulty_level: article.difficulty_level,
      tags: article.tags.join(', '),
      is_featured: article.is_featured,
      is_published: article.is_published,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      family_law_area: 'Divorce', // Default, can be enhanced
      singapore_family_court_compliance: true,
      includes_2024_updates: false,
      covers_dma_provisions: false,
      parenting_guidance_included: false
    })
    setEditingArticle(article)
    setShowArticleForm(true)
  }

  const editQA = (qa: QA) => {
    setQAForm({
      question: qa.question,
      answer: qa.answer,
      difficulty_level: qa.difficulty_level,
      tags: qa.tags.join(', '),
      is_featured: qa.is_featured,
      is_public: qa.is_public,
      family_category: 'Divorce & Separation', // Default, can be enhanced
      urgency_level: 'Medium',
      includes_practical_guidance: false,
      singapore_specific: true
    })
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
      fetchFamilyLawContent()
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
      fetchFamilyLawContent()
    } catch (error) {
      console.error('Error deleting Q&A:', error)
      setError('Failed to delete Q&A')
    } finally {
      setSaving(false)
    }
  }

  const importFamilyLawContent = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/admin/import-enhanced-family-law', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Import completed! Updated ${result.results.articles.updated} articles, created ${result.results.qas.created} Q&As`)
        fetchFamilyLawContent()
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
          <p className="mt-4 text-gray-600">Loading Family Law content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Family Law Content Management
              </h1>
              <p className="text-gray-600">Manage divorce, custody, and matrimonial law content</p>
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
            <h2 className="text-xl font-semibold">Family Law Articles</h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={importFamilyLawContent}
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

          {/* Article Form */}
          {showArticleForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</CardTitle>
                <CardDescription>
                  {editingArticle ? 'Update the article details below' : 'Fill in the details to create a new Family Law article'}
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
                        placeholder="e.g., Divorce in Singapore: Complete Legal Guide"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="family_law_area">Family Law Area</Label>
                      <Select
                        value={articleForm.family_law_area}
                        onValueChange={(value) => setArticleForm({...articleForm, family_law_area: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Divorce">Divorce & Separation</SelectItem>
                          <SelectItem value="Child Custody">Child Custody & Care</SelectItem>
                          <SelectItem value="Matrimonial Assets">Matrimonial Assets</SelectItem>
                          <SelectItem value="Maintenance">Maintenance & Support</SelectItem>
                          <SelectItem value="Family Violence">Family Violence & PPO</SelectItem>
                          <SelectItem value="Adoption">Adoption & Guardianship</SelectItem>
                          <SelectItem value="Marriage">Marriage & Annulment</SelectItem>
                          <SelectItem value="General">General Family Law</SelectItem>
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
                        placeholder="divorce, singapore, family-law"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={articleForm.seo_title}
                        onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})}
                        placeholder="SEO-optimized title"
                      />
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
                  </div>

                  {/* Family Law Specific Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Family Law Specific Options</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="singapore_family_court_compliance"
                          checked={articleForm.singapore_family_court_compliance}
                          onCheckedChange={(checked) =>
                            setArticleForm({...articleForm, singapore_family_court_compliance: checked as boolean})
                          }
                        />
                        <Label htmlFor="singapore_family_court_compliance" className="text-sm">
                          Family Court Compliant
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includes_2024_updates"
                          checked={articleForm.includes_2024_updates}
                          onCheckedChange={(checked) =>
                            setArticleForm({...articleForm, includes_2024_updates: checked as boolean})
                          }
                        />
                        <Label htmlFor="includes_2024_updates" className="text-sm">
                          Includes 2024 Updates
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="covers_dma_provisions"
                          checked={articleForm.covers_dma_provisions}
                          onCheckedChange={(checked) =>
                            setArticleForm({...articleForm, covers_dma_provisions: checked as boolean})
                          }
                        />
                        <Label htmlFor="covers_dma_provisions" className="text-sm">
                          Covers DMA Provisions
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parenting_guidance_included"
                          checked={articleForm.parenting_guidance_included}
                          onCheckedChange={(checked) =>
                            setArticleForm({...articleForm, parenting_guidance_included: checked as boolean})
                          }
                        />
                        <Label htmlFor="parenting_guidance_included" className="text-sm">
                          Parenting Guidance
                        </Label>
                      </div>
                    </div>
                  </div>

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

        {/* Q&As Tab */}
        <TabsContent value="qas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Family Law Q&As</h2>
            <Button
              onClick={() => setShowQAForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Q&A</span>
            </Button>
          </div>

          {/* Q&A Form */}
          {showQAForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingQA ? 'Edit Q&A' : 'Create New Q&A'}</CardTitle>
                <CardDescription>
                  {editingQA ? 'Update the Q&A details below' : 'Fill in the details to create a new Family Law Q&A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQASubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question *</Label>
                    <Textarea
                      id="question"
                      value={qaForm.question}
                      onChange={(e) => setQAForm({...qaForm, question: e.target.value})}
                      placeholder="What are the grounds for divorce in Singapore?"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer *</Label>
                    <Textarea
                      id="answer"
                      value={qaForm.answer}
                      onChange={(e) => setQAForm({...qaForm, answer: e.target.value})}
                      placeholder="Detailed answer with practical guidance..."
                      rows={10}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="family_category">Family Category</Label>
                      <Select
                        value={qaForm.family_category}
                        onValueChange={(value) => setQAForm({...qaForm, family_category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Divorce & Separation">Divorce & Separation</SelectItem>
                          <SelectItem value="Child Custody">Child Custody</SelectItem>
                          <SelectItem value="Matrimonial Assets">Matrimonial Assets</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Family Violence">Family Violence</SelectItem>
                          <SelectItem value="Adoption">Adoption</SelectItem>
                          <SelectItem value="Marriage">Marriage</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty_level_qa">Difficulty Level</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="urgency_level">Urgency Level</Label>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags_qa">Tags (comma-separated)</Label>
                    <Input
                      id="tags_qa"
                      value={qaForm.tags}
                      onChange={(e) => setQAForm({...qaForm, tags: e.target.value})}
                      placeholder="divorce, custody, singapore"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_featured_qa"
                        checked={qaForm.is_featured}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, is_featured: checked as boolean})
                        }
                      />
                      <Label htmlFor="is_featured_qa">Featured Q&A</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_public_qa"
                        checked={qaForm.is_public}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, is_public: checked as boolean})
                        }
                      />
                      <Label htmlFor="is_public_qa">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includes_practical_guidance"
                        checked={qaForm.includes_practical_guidance}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, includes_practical_guidance: checked as boolean})
                        }
                      />
                      <Label htmlFor="includes_practical_guidance">Practical Guidance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="singapore_specific"
                        checked={qaForm.singapore_specific}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, singapore_specific: checked as boolean})
                        }
                      />
                      <Label htmlFor="singapore_specific">Singapore Specific</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetQAForm}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : editingQA ? 'Update Q&A' : 'Create Q&A'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Q&As List */}
          <div className="space-y-4">
            {qas.map((qa) => (
              <Card key={qa.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{qa.question}</h3>
                        {qa.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {qa.is_public ? (
                          <Badge variant="default">Public</Badge>
                        ) : (
                          <Badge variant="outline">Private</Badge>
                        )}
                        <Badge variant="outline">{qa.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-3">{qa.answer}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>👍 {qa.helpful_votes} helpful</span>
                        <span>👁️ {qa.view_count} views</span>
                        <span>🏷️ {qa.tags.join(', ')}</span>
                        <span>📅 {new Date(qa.created_at).toLocaleDateString()}</span>
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

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Enhanced Family Law Content</CardTitle>
              <CardDescription>
                Import comprehensive Family Law articles and Q&As with 2024 updates including Divorce by Mutual Agreement (DMA) provisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📚 Available Content</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Enhanced Divorce Guide with 2024 DMA updates</li>
                  <li>• Comprehensive Child Custody & Care Control guide</li>
                  <li>• 5+ detailed Q&As covering practical scenarios</li>
                  <li>• Singapore Family Court compliance updates</li>
                  <li>• Co-Parenting Programme requirements</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Import Process</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Existing articles will be updated with enhanced content</li>
                  <li>• New Q&As will be created (duplicates are prevented)</li>
                  <li>• All content includes 2024 legal updates</li>
                  <li>• Process may take 1-2 minutes to complete</li>
                </ul>
              </div>

              <Button
                onClick={importFamilyLawContent}
                disabled={saving}
                className="w-full"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                {saving ? 'Importing Enhanced Content...' : 'Import Enhanced Family Law Content'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Content Upload</CardTitle>
              <CardDescription>
                Upload individual articles or Q&As using the forms in the Articles and Q&As tabs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowArticleForm(true)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <FileText className="h-6 w-6" />
                  <span>Add New Article</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQAForm(true)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>Add New Q&A</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

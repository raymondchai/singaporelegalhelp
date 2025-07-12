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
import { AlertCircle, Plus, Edit, Trash2, Save, X, Home, FileText, MessageSquare } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Property Law Category ID
const PROPERTY_LAW_CATEGORY_ID = '4e8ce92f-a63c-4719-9d73-2f28966c45be'

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  content: string
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

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function PropertyLawContentAdmin() {
  const [articles, setArticles] = useState<Article[]>([])
  const [qas, setQAs] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [editingQA, setEditingQA] = useState<QA | null>(null)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showQAForm, setShowQAForm] = useState(false)

  const supabase = createClientComponentClient()

  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: '',
    summary: '',
    content: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_published: false,
    seo_title: '',
    seo_description: ''
  })

  // QA form state
  const [qaForm, setQAForm] = useState({
    question: '',
    answer: '',
    tags: '',
    difficulty_level: 'beginner',
    is_featured: false,
    is_public: true,
    status: 'answered'
  })

  useEffect(() => {
    fetchPropertyLawContent()
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchPropertyLawContent = async () => {
    try {
      setLoading(true)

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', PROPERTY_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', PROPERTY_LAW_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError

      setArticles(articlesData || [])
      setQAs(qasData || [])

    } catch (error) {
      console.error('Error fetching Property Law content:', error)
      setMessage({ type: 'error', text: 'Failed to fetch content' })
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
      difficulty_level: 'beginner',
      tags: '',
      is_featured: false,
      is_published: false,
      seo_title: '',
      seo_description: ''
    })
    setEditingArticle(null)
    setShowArticleForm(false)
  }

  const resetQAForm = () => {
    setQAForm({
      question: '',
      answer: '',
      tags: '',
      difficulty_level: 'beginner',
      is_featured: false,
      is_public: true,
      status: 'answered'
    })
    setEditingQA(null)
    setShowQAForm(false)
  }

  const handleEditArticle = (article: Article) => {
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      difficulty_level: article.difficulty_level,
      tags: article.tags.join(', '),
      is_featured: article.is_featured,
      is_published: article.is_published,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || ''
    })
    setEditingArticle(article)
    setShowArticleForm(true)
  }

  const handleEditQA = (qa: QA) => {
    setQAForm({
      question: qa.question,
      answer: qa.answer,
      tags: qa.tags.join(', '),
      difficulty_level: qa.difficulty_level,
      is_featured: qa.is_featured,
      is_public: qa.is_public,
      status: qa.status
    })
    setEditingQA(qa)
    setShowQAForm(true)
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.summary.trim() || !articleForm.content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    try {
      setSaving(true)
      
      const articleData = {
        category_id: PROPERTY_LAW_CATEGORY_ID,
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
          .select()
      } else {
        result = await supabase
          .from('legal_articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }])
          .select()
      }

      if (result.error) throw result.error

      setMessage({
        type: 'success',
        text: `Property Law article ${editingArticle ? 'updated' : 'created'} successfully!`
      })
      
      resetArticleForm()
      fetchPropertyLawContent()

    } catch (error) {
      console.error('Error saving article:', error)
      setMessage({ type: 'error', text: 'Failed to save article' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveQA = async () => {
    if (!qaForm.question.trim() || !qaForm.answer.trim()) {
      setMessage({ type: 'error', text: 'Please fill in question and answer' })
      return
    }

    try {
      setSaving(true)
      
      const qaData = {
        category_id: PROPERTY_LAW_CATEGORY_ID,
        user_id: null, // Admin created
        question: qaForm.question.trim(),
        answer: qaForm.answer.trim(),
        ai_response: null,
        tags: qaForm.tags ? qaForm.tags.split(',').map(tag => tag.trim()) : [],
        difficulty_level: qaForm.difficulty_level,
        is_featured: qaForm.is_featured,
        is_public: qaForm.is_public,
        status: qaForm.status,
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
          .select()
      } else {
        result = await supabase
          .from('legal_qa')
          .insert([{ ...qaData, created_at: new Date().toISOString() }])
          .select()
      }

      if (result.error) throw result.error

      setMessage({
        type: 'success',
        text: `Property Law Q&A ${editingQA ? 'updated' : 'created'} successfully!`
      })
      
      resetQAForm()
      fetchPropertyLawContent()

    } catch (error) {
      console.error('Error saving Q&A:', error)
      setMessage({ type: 'error', text: 'Failed to save Q&A' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const { error } = await supabase
        .from('legal_articles')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Article deleted successfully' })
      fetchPropertyLawContent()
    } catch (error) {
      console.error('Error deleting article:', error)
      setMessage({ type: 'error', text: 'Failed to delete article' })
    }
  }

  const handleDeleteQA = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Q&A?')) return

    try {
      const { error } = await supabase
        .from('legal_qa')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Q&A deleted successfully' })
      fetchPropertyLawContent()
    } catch (error) {
      console.error('Error deleting Q&A:', error)
      setMessage({ type: 'error', text: 'Failed to delete Q&A' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Property Law content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-6 w-6 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Property Law Content Management</h1>
        </div>
        <p className="text-gray-600">
          Manage Property Law articles and Q&As for the Singapore Legal Help platform
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertCircle className={`h-4 w-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="articles">Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="qas">Q&As ({qas.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
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
                  {qas.filter(qa => qa.is_public).length} public
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {articles.reduce((sum, a) => sum + a.view_count, 0) + qas.reduce((sum, qa) => sum + qa.view_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined article and Q&A views
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Law Content Status</CardTitle>
              <CardDescription>
                Overview of Property Law practice area content completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Articles Progress</span>
                    <span>{articles.length}/8 articles</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((articles.length / 8) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Q&As Progress</span>
                    <span>{qas.length}/20 Q&As</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((qas.length / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

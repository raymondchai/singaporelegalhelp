'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Plus, Edit, Trash2, Upload, Heart, Eye, Search, Filter } from 'lucide-react'

// Personal Injury Law Category ID
const PERSONAL_INJURY_CATEGORY_ID = '61463ecd-fdf9-4b76-84ab-d0824ee2144f'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  injury_type: string
  severity_level: string
  compensation_range: string
  medical_terminology_verified: boolean
  insurance_compliance_checked: boolean
}

interface QAForm {
  question: string
  answer: string
  difficulty_level: string
  tags: string
  is_featured: boolean
  is_public: boolean
  injury_category: string
  urgency_level: string
  medical_accuracy_verified: boolean
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function PersonalInjuryContentManagement() {
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [qas, setQAs] = useState<LegalQA[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
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
    injury_type: 'General',
    severity_level: 'Minor',
    compensation_range: '',
    medical_terminology_verified: false,
    insurance_compliance_checked: false
  })

  const [qaForm, setQAForm] = useState<QAForm>({
    question: '',
    answer: '',
    difficulty_level: 'beginner',
    tags: '',
    is_featured: false,
    is_public: true,
    injury_category: 'General PI',
    urgency_level: 'Medium',
    medical_accuracy_verified: false
  })

  useEffect(() => {
    fetchPersonalInjuryContent()
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchPersonalInjuryContent = async () => {
    try {
      setLoading(true)

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', PERSONAL_INJURY_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError
      setArticles(articlesData || [])

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', PERSONAL_INJURY_CATEGORY_ID)
        .order('created_at', { ascending: false })

      if (qasError) throw qasError
      setQAs(qasData || [])

    } catch (error) {
      console.error('Error fetching Personal Injury content:', error)
      setMessage({ type: 'error', text: 'Failed to load content' })
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const validateMedicalContent = (content: string) => {
    const medicalTerms = ['medical', 'injury', 'compensation', 'negligence', 'treatment', 'diagnosis']
    const hasTerms = medicalTerms.some(term => content.toLowerCase().includes(term))
    const wordCount = content.split(/\s+/).length
    return hasTerms && wordCount >= 300
  }

  const saveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.summary.trim() || !articleForm.content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    if (articleForm.content.split(/\s+/).length < 500) {
      setMessage({ type: 'error', text: 'Personal injury articles must be at least 500 words for comprehensive coverage' })
      return
    }

    if (!articleForm.medical_terminology_verified) {
      setMessage({ type: 'error', text: 'Medical terminology must be verified before publishing' })
      return
    }

    try {
      setSaving(true)
      
      const articleData = {
        category_id: PERSONAL_INJURY_CATEGORY_ID,
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
      fetchPersonalInjuryContent()

    } catch (error) {
      console.error('Error saving article:', error)
      setMessage({ type: 'error', text: 'Failed to save article' })
    } finally {
      setSaving(false)
    }
  }

  const saveQA = async () => {
    if (!qaForm.question.trim() || !qaForm.answer.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both question and answer' })
      return
    }

    if (!validateMedicalContent(qaForm.answer)) {
      setMessage({ type: 'error', text: 'Answer must contain relevant medical/injury terminology and be at least 300 words' })
      return
    }

    if (!qaForm.medical_accuracy_verified) {
      setMessage({ type: 'error', text: 'Medical accuracy must be verified before publishing' })
      return
    }

    try {
      setSaving(true)

      const qaData = {
        category_id: PERSONAL_INJURY_CATEGORY_ID,
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
      fetchPersonalInjuryContent()

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
      injury_type: 'General',
      severity_level: 'Minor',
      compensation_range: '',
      medical_terminology_verified: false,
      insurance_compliance_checked: false
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
      injury_category: 'General PI',
      urgency_level: 'Medium',
      medical_accuracy_verified: false
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
      injury_type: 'General', // Default for existing articles
      severity_level: 'Minor',
      compensation_range: '',
      medical_terminology_verified: true, // Assume existing content is verified
      insurance_compliance_checked: true
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
      injury_category: 'General PI', // Default for existing Q&As
      urgency_level: 'Medium',
      medical_accuracy_verified: true // Assume existing content is verified
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

      setMessage({ type: 'success', text: 'Article deleted successfully!' })
      fetchPersonalInjuryContent()
    } catch (error) {
      console.error('Error deleting article:', error)
      setMessage({ type: 'error', text: 'Failed to delete article' })
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

      setMessage({ type: 'success', text: 'Q&A deleted successfully!' })
      fetchPersonalInjuryContent()
    } catch (error) {
      console.error('Error deleting Q&A:', error)
      setMessage({ type: 'error', text: 'Failed to delete Q&A' })
    } finally {
      setSaving(false)
    }
  }

  const importPersonalInjuryContent = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/import-personal-injury-law', {
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
        fetchPersonalInjuryContent() // Refresh the content
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

  // Filter content based on search and difficulty
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDifficulty = filterDifficulty === 'all' || article.difficulty_level === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  const filteredQAs = qas.filter(qa => {
    const matchesSearch = qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qa.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qa.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDifficulty = filterDifficulty === 'all' || qa.difficulty_level === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Personal Injury content...</p>
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
                <Heart className="inline-block h-8 w-8 mr-3 text-pink-600" />
                Personal Injury Law Content Management
              </h1>
              <p className="text-gray-600">Manage articles and Q&As for Personal Injury Law practice area</p>
            </div>
            <Link href="/admin/content">
              <Button variant="outline">← Back to Content Management</Button>
            </Link>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{articles.length}</div>
              <p className="text-xs text-gray-500">Target: 8 articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.is_published).length}
              </div>
              <p className="text-xs text-gray-500">Live content</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Q&As</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{qas.length}</div>
              <p className="text-xs text-gray-500">Target: 20 Q&As</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Public Q&As</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {qas.filter(qa => qa.is_public).length}
              </div>
              <p className="text-xs text-gray-500">Visible to users</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles and Q&As..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles" className="flex items-center space-x-2">
              <span>Articles ({filteredArticles.length})</span>
            </TabsTrigger>
            <TabsTrigger value="qas" className="flex items-center space-x-2">
              <span>Q&As ({filteredQAs.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Personal Injury Articles</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={importPersonalInjuryContent}
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

            {/* Articles List */}
            <div className="grid gap-4">
              {filteredArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                        <CardDescription className="mb-3 line-clamp-2">{article.summary}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant={article.is_published ? "default" : "secondary"}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="outline">{article.difficulty_level}</Badge>
                          {article.is_featured && <Badge variant="outline">Featured</Badge>}
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.view_count} views
                          </span>
                          <span>{article.reading_time_minutes} min read</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.tags.length - 3} more
                            </Badge>
                          )}
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
                  </CardHeader>
                </Card>
              ))}
              {filteredArticles.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No articles found matching your criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Q&As Tab */}
          <TabsContent value="qas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Personal Injury Q&As</h2>
              <Button
                onClick={() => setShowQAForm(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Q&A</span>
              </Button>
            </div>

            {/* Q&As List */}
            <div className="grid gap-4">
              {filteredQAs.map((qa) => (
                <Card key={qa.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{qa.question}</CardTitle>
                        <CardDescription className="mb-3 line-clamp-2">{qa.answer}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant={qa.status === 'published' ? "default" : "secondary"}>
                            {qa.status}
                          </Badge>
                          <Badge variant="outline">{qa.difficulty_level}</Badge>
                          {qa.is_featured && <Badge variant="outline">Featured</Badge>}
                          <Badge variant={qa.is_public ? "default" : "secondary"}>
                            {qa.is_public ? 'Public' : 'Private'}
                          </Badge>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {qa.view_count} views
                          </span>
                          <span>👍 {qa.helpful_votes}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {qa.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {qa.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{qa.tags.length - 3} more
                            </Badge>
                          )}
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
                  </CardHeader>
                </Card>
              ))}
              {filteredQAs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No Q&As found matching your criteria.</p>
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
                  <h2 className="text-2xl font-bold">
                    {editingArticle ? 'Edit Article' : 'Add New Article'}
                  </h2>
                  <Button variant="outline" onClick={resetArticleForm}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                        placeholder="Enter article title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
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

                  {/* Personal Injury Specific Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="injury_type">Injury Type</Label>
                      <Select
                        value={articleForm.injury_type}
                        onValueChange={(value) => setArticleForm({...articleForm, injury_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Medical Negligence">Medical Negligence</SelectItem>
                          <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
                          <SelectItem value="Workplace">Workplace</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="International">International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity_level">Severity Level</Label>
                      <Select
                        value={articleForm.severity_level}
                        onValueChange={(value) => setArticleForm({...articleForm, severity_level: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Minor">Minor</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Severe">Severe</SelectItem>
                          <SelectItem value="Catastrophic">Catastrophic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="compensation_range">Compensation Range</Label>
                      <Input
                        id="compensation_range"
                        value={articleForm.compensation_range}
                        onChange={(e) => setArticleForm({...articleForm, compensation_range: e.target.value})}
                        placeholder="e.g., $5,000 - $50,000"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <Label htmlFor="summary">Summary *</Label>
                    <Textarea
                      id="summary"
                      value={articleForm.summary}
                      onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                      placeholder="Brief summary of the article"
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="content">Content * (Minimum 500 words for injury law)</Label>
                    <Textarea
                      id="content"
                      value={articleForm.content}
                      onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                      placeholder="Full article content with medical-legal terminology"
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current word count: {articleForm.content.split(/\s+/).length} words
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={articleForm.tags}
                      onChange={(e) => setArticleForm({...articleForm, tags: e.target.value})}
                      placeholder="personal injury, medical negligence, compensation"
                    />
                  </div>

                  {/* SEO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={articleForm.seo_title}
                        onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})}
                        placeholder="SEO optimized title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Input
                        id="seo_description"
                        value={articleForm.seo_description}
                        onChange={(e) => setArticleForm({...articleForm, seo_description: e.target.value})}
                        placeholder="SEO meta description"
                      />
                    </div>
                  </div>

                  {/* Validation Checkboxes */}
                  <div className="space-y-3 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800">Medical-Legal Validation Required</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medical_terminology_verified"
                        checked={articleForm.medical_terminology_verified}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, medical_terminology_verified: checked as boolean})
                        }
                      />
                      <Label htmlFor="medical_terminology_verified" className="text-sm">
                        Medical terminology has been verified for accuracy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="insurance_compliance_checked"
                        checked={articleForm.insurance_compliance_checked}
                        onCheckedChange={(checked) =>
                          setArticleForm({...articleForm, insurance_compliance_checked: checked as boolean})
                        }
                      />
                      <Label htmlFor="insurance_compliance_checked" className="text-sm">
                        Insurance procedures have been verified for compliance
                      </Label>
                    </div>
                  </div>

                  {/* Options */}
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
                      <Label htmlFor="is_published">Publish Immediately</Label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
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
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingQA ? 'Edit Q&A' : 'Add New Q&A'}
                  </h2>
                  <Button variant="outline" onClick={resetQAForm}>
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="difficulty_qa">Difficulty Level</Label>
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
                      <Label htmlFor="injury_category">Injury Category</Label>
                      <Select
                        value={qaForm.injury_category}
                        onValueChange={(value) => setQAForm({...qaForm, injury_category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Medical Negligence">Medical Negligence</SelectItem>
                          <SelectItem value="Motor Accidents">Motor Accidents</SelectItem>
                          <SelectItem value="Workplace Injuries">Workplace Injuries</SelectItem>
                          <SelectItem value="General PI">General PI</SelectItem>
                          <SelectItem value="Legal Process">Legal Process</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div>
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

                  {/* Question */}
                  <div>
                    <Label htmlFor="question">Question *</Label>
                    <Textarea
                      id="question"
                      value={qaForm.question}
                      onChange={(e) => setQAForm({...qaForm, question: e.target.value})}
                      placeholder="Enter the question"
                      rows={2}
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <Label htmlFor="answer">Answer * (Minimum 300 words with medical terminology)</Label>
                    <Textarea
                      id="answer"
                      value={qaForm.answer}
                      onChange={(e) => setQAForm({...qaForm, answer: e.target.value})}
                      placeholder="Provide comprehensive answer with medical-legal guidance"
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current word count: {qaForm.answer.split(/\s+/).length} words
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="qa_tags">Tags (comma-separated)</Label>
                    <Input
                      id="qa_tags"
                      value={qaForm.tags}
                      onChange={(e) => setQAForm({...qaForm, tags: e.target.value})}
                      placeholder="medical negligence, compensation, legal advice"
                    />
                  </div>

                  {/* Medical Validation */}
                  <div className="space-y-3 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800">Medical-Legal Validation Required</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medical_accuracy_verified"
                        checked={qaForm.medical_accuracy_verified}
                        onCheckedChange={(checked) =>
                          setQAForm({...qaForm, medical_accuracy_verified: checked as boolean})
                        }
                      />
                      <Label htmlFor="medical_accuracy_verified" className="text-sm">
                        Medical accuracy and terminology have been verified
                      </Label>
                    </div>
                  </div>

                  {/* Options */}
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
                      <Label htmlFor="is_public_qa">Make Public</Label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
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

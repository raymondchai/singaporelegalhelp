'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { 
  Scale, 
  Search, 
  FileText, 
  Users, 
  ArrowLeft, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  Home,
  Star,
  Clock,
  Download
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface LegalCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
}

interface CategoryArticle {
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

interface CategoryQA {
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

const iconMap: Record<string, React.ReactNode> = {
  family: <span className="text-2xl">👨‍👩‍👧‍👦</span>,
  briefcase: <span className="text-2xl">💼</span>,
  home: <span className="text-2xl">🏠</span>,
  document: <span className="text-2xl">📄</span>,
  shield: <span className="text-2xl">🛡️</span>,
  globe: <span className="text-2xl">🌍</span>,
  building: <span className="text-2xl">🏢</span>,
  lightbulb: <span className="text-2xl">💡</span>,
  medical: <span className="text-2xl">⚕️</span>,
  calculator: <span className="text-2xl">🧮</span>
}

// Helper function to create URL-friendly slugs from category names
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Helper function to find category by slug
const findCategoryBySlug = (categories: LegalCategory[], slug: string): LegalCategory | null => {
  return categories.find(category => createSlug(category.name) === slug) || null
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [category, setCategory] = useState<LegalCategory | null>(null)
  const [articles, setArticles] = useState<CategoryArticle[]>([])
  const [qas, setQAs] = useState<CategoryQA[]>([])
  const [relatedCategories, setRelatedCategories] = useState<LegalCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'qa'>('overview')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Handle search input change with suggestions
  const handleSearchInputChange = async (value: string) => {
    setSearchTerm(value)

    if (value.length >= 2) {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}&category=${slug}&limit=5`)
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Suggestion fetch failed:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.url) {
      router.push(suggestion.url)
    } else {
      setSearchTerm(suggestion.title)
      router.push(`/search?q=${encodeURIComponent(suggestion.title)}`)
    }
    setShowSuggestions(false)
  }

  useEffect(() => {
    fetchCategoryData()
  }, [slug])

  const fetchArticlesAndQAs = async (categoryId: string) => {
    try {
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (articlesError) {
        console.error('Error fetching articles:', articlesError)
      } else {
        setArticles(articlesData || [])
      }

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_public', true)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (qasError) {
        console.error('Error fetching Q&As:', qasError)
      } else {
        setQAs(qasData || [])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      // Fallback to mock data if database fetch fails
      setArticles(getMockArticles(categoryId))
      setQAs(getMockQAs(categoryId))
    }
  }

  const fetchCategoryData = async () => {
    try {
      setLoading(true)

      // First, fetch all categories to find the one matching the slug
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('legal_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        // Use fallback categories
        const fallbackCategories = getFallbackCategories()
        const foundCategory = findCategoryBySlug(fallbackCategories, slug)
        
        if (!foundCategory) {
          router.push('/legal-categories')
          return
        }
        
        setCategory(foundCategory)
        setRelatedCategories(fallbackCategories.filter(cat => cat.id !== foundCategory.id).slice(0, 3))
        await fetchArticlesAndQAs(foundCategory.id)
        return
      }

      const foundCategory = findCategoryBySlug(categoriesData || [], slug)
      
      if (!foundCategory) {
        router.push('/legal-categories')
        return
      }

      setCategory(foundCategory)
      
      // Set related categories (exclude current category)
      const related = (categoriesData || [])
        .filter(cat => cat.id !== foundCategory.id)
        .slice(0, 3)
      setRelatedCategories(related)

      // Fetch real articles and Q&As from database
      await fetchArticlesAndQAs(foundCategory.id)

    } catch (error) {
      console.error('Error fetching category data:', error)
      router.push('/legal-categories')
    } finally {
      setLoading(false)
    }
  }

  const getFallbackCategories = (): LegalCategory[] => {
    return [
      {
        id: '1',
        name: 'Family Law',
        description: 'Marriage, divorce, custody, adoption and family-related legal matters',
        icon: 'family',
        color: '#ef4444',
        is_active: true,
        sort_order: 1
      },
      {
        id: '2',
        name: 'Employment Law',
        description: 'Workplace rights, employment contracts, and labor disputes',
        icon: 'briefcase',
        color: '#3b82f6',
        is_active: true,
        sort_order: 2
      },
      {
        id: '3',
        name: 'Property Law',
        description: 'Real estate transactions, property disputes, and housing matters',
        icon: 'home',
        color: '#10b981',
        is_active: true,
        sort_order: 3
      },
      {
        id: '4',
        name: 'Contract Law',
        description: 'Business agreements, commercial contracts, and contract disputes',
        icon: 'document',
        color: '#f59e0b',
        is_active: true,
        sort_order: 4
      },
      {
        id: '5',
        name: 'Criminal Law',
        description: 'Criminal charges, court proceedings, and criminal defense',
        icon: 'shield',
        color: '#dc2626',
        is_active: true,
        sort_order: 5
      },
      {
        id: '6',
        name: 'Immigration Law',
        description: 'Visa applications, work permits, and immigration matters',
        icon: 'globe',
        color: '#8b5cf6',
        is_active: true,
        sort_order: 6
      },
      {
        id: '7',
        name: 'Corporate Law',
        description: 'Business formation, corporate compliance, and commercial law',
        icon: 'building',
        color: '#06b6d4',
        is_active: true,
        sort_order: 7
      },
      {
        id: '8',
        name: 'Intellectual Property',
        description: 'Patents, trademarks, copyrights, and IP protection',
        icon: 'lightbulb',
        color: '#f97316',
        is_active: true,
        sort_order: 8
      }
    ]
  }

  const getMockArticles = (categoryId: string): CategoryArticle[] => {
    const articleTemplates = [
      {
        title: 'Understanding Singapore Laws',
        summary: 'A comprehensive guide to understanding the legal framework in Singapore',
        content: 'Detailed content about Singapore legal system...'
      },
      {
        title: 'Common Legal Issues',
        summary: 'Most frequently encountered legal problems and their solutions',
        content: 'Common issues and how to address them...'
      },
      {
        title: 'Legal Procedures Guide',
        summary: 'Step-by-step guide to legal procedures in Singapore',
        content: 'Procedural guidelines and requirements...'
      }
    ]

    return articleTemplates.map((template, index) => ({
      id: `${categoryId}-article-${index + 1}`,
      category_id: categoryId,
      title: template.title,
      slug: template.title.toLowerCase().replace(/\s+/g, '-'),
      summary: template.summary,
      content: template.content,
      content_type: 'article',
      difficulty_level: 'beginner',
      tags: [],
      reading_time_minutes: 5,
      is_featured: false,
      is_published: true,
      author_name: 'Singapore Legal Help',
      seo_title: null,
      seo_description: null,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  const getMockQAs = (categoryId: string): CategoryQA[] => {
    const qaTemplates = [
      {
        question: 'What are the basic requirements for this legal matter?',
        answer: 'The basic requirements include proper documentation, meeting eligibility criteria, and following the prescribed procedures under Singapore law.'
      },
      {
        question: 'How long does the legal process typically take?',
        answer: 'The duration varies depending on the complexity of the case, but typically ranges from 2-6 months for standard procedures.'
      },
      {
        question: 'What documents do I need to prepare?',
        answer: 'You will need identification documents, relevant contracts or agreements, and any supporting evidence related to your case.'
      }
    ]

    return qaTemplates.map((template, index) => ({
      id: `${categoryId}-qa-${index + 1}`,
      category_id: categoryId,
      user_id: null,
      question: template.question,
      answer: template.answer,
      ai_response: null,
      tags: [],
      difficulty_level: 'beginner',
      is_featured: false,
      is_public: true,
      status: 'published',
      helpful_votes: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category information...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The requested legal category could not be found.</p>
          <Button asChild>
            <Link href="/legal-categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredQAs = qas.filter(qa =>
    qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navigation />

      {/* Breadcrumb */}
      <div className="bg-white/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600 flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link href="/legal-categories" className="text-gray-500 hover:text-blue-600">
              Legal Categories
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-6 text-gray-600 hover:text-blue-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>

            <div className="flex items-start space-x-6 mb-8">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {iconMap[category.icon] || <FileText className="h-8 w-8" />}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {category.name}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-4 mb-8">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <Input
                  type="text"
                  placeholder={`Search within ${category.name}...`}
                  value={searchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchTerm.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                  className="pl-10 py-3 text-lg"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    {isLoadingSuggestions ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                        <span className="ml-2 text-sm">Loading suggestions...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 mb-1">{suggestion.title}</div>
                              {suggestion.summary && (
                                <div className="text-xs text-gray-600 mb-1">{suggestion.summary}</div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  suggestion.type === 'Article'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {suggestion.type}
                                </span>
                                <span className="text-xs text-gray-500">{suggestion.category}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : searchTerm.length >= 2 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No suggestions found for "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </form>
              <Link href={`/search?q=${encodeURIComponent(category.name)}`}>
                <Button variant="outline" className="py-3 px-6">
                  <Search className="h-4 w-4 mr-2" />
                  Advanced Search
                </Button>
              </Link>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'articles'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Articles ({filteredArticles.length})
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'qa'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Q&A ({filteredQAs.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Quick Stats */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{articles.length}</div>
                        <div className="text-sm text-gray-600">Articles Available</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{qas.length}</div>
                        <div className="text-sm text-gray-600">Q&A Answered</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">24/7</div>
                        <div className="text-sm text-gray-600">AI Assistance</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Featured Articles */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {articles.slice(0, 4).map((article) => (
                        <Card key={article.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                                <CardDescription>{article.summary}</CardDescription>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                <Clock className="h-3 w-3 mr-1" />
                                {article.reading_time_minutes} min read
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Link
                              href={`/legal-categories/${slug}/articles/${article.id}`}
                              className="w-full"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                Read Article
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Popular Q&As */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Questions</h2>
                    <div className="space-y-4">
                      {qas.slice(0, 3).map((qa) => (
                        <Card key={qa.id}>
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-start">
                              <MessageSquare className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              {qa.question}
                            </h3>
                            <p className="text-gray-600 leading-relaxed pl-7">
                              {qa.answer}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'articles' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Articles ({filteredArticles.length})
                    </h2>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>

                  {filteredArticles.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Try adjusting your search terms' : 'Articles for this category are coming soon'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredArticles.map((article) => (
                        <Card key={article.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  {article.title}
                                </h3>
                                <p className="text-gray-600 mb-4">{article.summary}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {article.reading_time_minutes} min read
                                  </span>
                                  <span className="flex items-center">
                                    <Star className="h-4 w-4 mr-1" />
                                    4.8 rating
                                  </span>
                                </div>
                              </div>
                              <Link href={`/legal-categories/${slug}/articles/${article.id}`}>
                                <Button variant="outline">Read More</Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Questions & Answers ({filteredQAs.length})
                    </h2>
                    <Button>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask Question
                    </Button>
                  </div>

                  {filteredQAs.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Q&As found</h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'Try adjusting your search terms' : 'Be the first to ask a question!'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredQAs.map((qa) => (
                        <Card key={qa.id}>
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-start">
                              <MessageSquare className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              {qa.question}
                            </h3>
                            <div className="pl-7">
                              <p className="text-gray-600 leading-relaxed mb-4">
                                {qa.answer}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <button className="hover:text-blue-600">Helpful</button>
                                <button className="hover:text-blue-600">Share</button>
                                <span>Updated {new Date(qa.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/chat" className="w-full">
                      <Button className="w-full" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask AI Assistant
                      </Button>
                    </Link>
                    <Link href="/dashboard/documents" className="w-full">
                      <Button variant="outline" className="w-full" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </Link>
                    <Link href="/lawyers" className="w-full">
                      <Button variant="outline" className="w-full" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Find Lawyer
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Related Categories */}
                {relatedCategories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Related Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {relatedCategories.map((relatedCategory) => (
                        <Link
                          key={relatedCategory.id}
                          href={`/legal-categories/${createSlug(relatedCategory.name)}`}
                          className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                              style={{ backgroundColor: `${relatedCategory.color}20` }}
                            >
                              {iconMap[relatedCategory.icon] || <FileText className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {relatedCategory.name}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Contact Support */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Get personalized assistance from our legal experts
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

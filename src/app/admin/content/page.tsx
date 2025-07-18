'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BookOpen,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  Scale,
  Home,
  Users,
  Building,
  Lightbulb,
  Plane,
  Calculator,
  FileText,
  ArrowRight
} from 'lucide-react'

interface LegalCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
}

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
  view_count: number
  created_at: string
  updated_at: string
}

interface LegalQA {
  id: string
  category_id: string
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

export default function ContentManagementPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<LegalCategory[]>([])
  const [articles, setArticles] = useState<LegalArticle[]>([])
  const [qas, setQAs] = useState<LegalQA[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showNewLawAreaForm, setShowNewLawAreaForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('legal_categories')
        .select('*')
        .order('sort_order')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('legal_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (articlesError) throw articlesError
      setArticles(articlesData || [])

      // Fetch Q&As
      const { data: qasData, error: qasError } = await supabase
        .from('legal_qa')
        .select('*')
        .order('created_at', { ascending: false })

      if (qasError) throw qasError
      setQAs(qasData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || 'Unknown Category'
  }

  const filteredArticles = selectedCategory 
    ? articles.filter(article => article.category_id === selectedCategory)
    : articles

  const filteredQAs = selectedCategory
    ? qas.filter(qa => qa.category_id === selectedCategory)
    : qas

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content management...</p>
        </div>
      </div>
    )
  }

  const lawAreas = [
    {
      name: 'Family Law',
      description: 'Divorce, custody, matrimonial matters',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      href: '/admin/content/family-law'
    },
    {
      name: 'Criminal Law',
      description: 'Criminal charges, defense, legal procedures',
      icon: Scale,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      href: '/admin/content/criminal-law'
    },
    {
      name: 'Property Law',
      description: 'Real estate, leases, property transactions',
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '/admin/content/property-law'
    },
    {
      name: 'Employment Law',
      description: 'Employment contracts, workplace rights',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/admin/content/employment-law'
    },
    {
      name: 'Contract Law',
      description: 'Business contracts and agreements',
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '/admin/content/contract-law'
    },
    {
      name: 'Intellectual Property',
      description: 'Trademarks, patents, copyright',
      icon: Lightbulb,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      href: '/admin/content/intellectual-property'
    },
    {
      name: 'Immigration Law',
      description: 'Work permits, PR applications',
      icon: Plane,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      href: '/admin/content/immigration-law'
    },
    {
      name: 'Debt & Bankruptcy',
      description: 'Debt recovery, bankruptcy proceedings',
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      href: '/admin/content/debt-bankruptcy'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Law Areas Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Content Management by Practice Area</h2>
            <Button
              onClick={() => setShowNewLawAreaForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Law Area</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lawAreas.map((area) => {
              const IconComponent = area.icon
              return (
                <Card
                  key={area.name}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${area.borderColor} ${area.bgColor}`}
                  onClick={() => router.push(area.href)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className={`h-6 w-6 ${area.color}`} />
                          <h3 className="font-semibold text-gray-900">{area.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                        <div className="flex items-center text-sm text-blue-600">
                          <span>Manage Content</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
          <p className="text-gray-600">Manage legal articles and Q&As for Singapore Legal Help</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="articles" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Articles ({filteredArticles.length})</span>
            </TabsTrigger>
            <TabsTrigger value="qas" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Q&As ({filteredQAs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <span>Categories ({categories.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Legal Articles</h2>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => window.open('/admin/content/contract-law', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Contract Law Content</span>
                </Button>
                <Button
                  onClick={() => window.open('/admin/content/intellectual-property', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>IP Law Content</span>
                </Button>
                <Button
                  onClick={() => window.open('/admin/content/personal-injury', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Personal Injury Content</span>
                </Button>
                <Button
                  onClick={() => window.open('/admin/content/criminal-law', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criminal Law Content</span>
                </Button>
                <Button
                  onClick={() => window.open('/admin/content/immigration-law', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Immigration Law Content</span>
                </Button>
                <Button
                  onClick={() => window.open('/admin/content/debt-bankruptcy', '_blank')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Debt & Bankruptcy Content</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Article</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                        <CardDescription className="mb-3">{article.summary}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant="outline">{getCategoryName(article.category_id)}</Badge>
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
                        <Button variant="outline" size="sm">
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
            </div>
          </TabsContent>

          {/* Q&As Tab */}
          <TabsContent value="qas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Legal Q&As</h2>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Q&A</span>
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredQAs.map((qa) => (
                <Card key={qa.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{qa.question}</CardTitle>
                        <CardDescription className="mb-3 line-clamp-2">{qa.answer}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant="outline">{getCategoryName(qa.category_id)}</Badge>
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
                        <Button variant="outline" size="sm">
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
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Legal Categories</h2>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </Button>
            </div>

            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
                        <CardDescription className="mb-3">{category.description}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span>Order: {category.sort_order}</span>
                          <span>Articles: {articles.filter(a => a.category_id === category.id).length}</span>
                          <span>Q&As: {qas.filter(q => q.category_id === category.id).length}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

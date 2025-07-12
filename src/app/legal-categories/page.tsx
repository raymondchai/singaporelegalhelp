'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Scale, Search, FileText, Users, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
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

interface CategoryStats {
  [key: string]: {
    articles: number
    queries: number
  }
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

export default function LegalCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<LegalCategory[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCategoriesAndStats()
  }, [])

  const fetchCategoriesAndStats = async () => {
    try {
      console.log('Fetching legal categories...')

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('legal_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      console.log('Categories data:', categoriesData)
      console.log('Categories error:', categoriesError)

      if (categoriesError) {
        console.error('Supabase error:', categoriesError)
        throw categoriesError
      }

      // Generate simple mock stats
      const stats: CategoryStats = {}
      if (categoriesData) {
        categoriesData.forEach(category => {
          stats[category.id] = {
            articles: Math.floor(Math.random() * 50) + 10,
            queries: Math.floor(Math.random() * 200) + 25
          }
        })
      }

      setCategories(categoriesData || [])
      setCategoryStats(stats)

      console.log('Final categories set:', categoriesData?.length || 0)
      console.log('Final stats set:', Object.keys(stats).length)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to hardcoded categories
      const fallbackCategories = [
        {
          id: '1',
          name: 'Family Law',
          description: 'Marriage, divorce, custody, adoption and family-related legal matters',
          icon: 'Heart',
          color: '#ef4444',
          is_active: true,
          sort_order: 1
        },
        {
          id: '2',
          name: 'Employment Law',
          description: 'Workplace rights, employment contracts, and labor disputes',
          icon: 'Briefcase',
          color: '#3b82f6',
          is_active: true,
          sort_order: 2
        },
        {
          id: '3',
          name: 'Property Law',
          description: 'Real estate transactions, property disputes, and housing matters',
          icon: 'Home',
          color: '#10b981',
          is_active: true,
          sort_order: 3
        },
        {
          id: '4',
          name: 'Contract Law',
          description: 'Business agreements, commercial contracts, and contract disputes',
          icon: 'FileText',
          color: '#f59e0b',
          is_active: true,
          sort_order: 4
        },
        {
          id: '5',
          name: 'Criminal Law',
          description: 'Criminal charges, court proceedings, and criminal defense',
          icon: 'Shield',
          color: '#dc2626',
          is_active: true,
          sort_order: 5
        },
        {
          id: '6',
          name: 'Immigration Law',
          description: 'Visa applications, work permits, and immigration matters',
          icon: 'Globe',
          color: '#8b5cf6',
          is_active: true,
          sort_order: 6
        },
        {
          id: '7',
          name: 'Corporate Law',
          description: 'Business formation, corporate compliance, and commercial law',
          icon: 'Building',
          color: '#06b6d4',
          is_active: true,
          sort_order: 7
        },
        {
          id: '8',
          name: 'Intellectual Property',
          description: 'Patents, trademarks, copyrights, and IP protection',
          icon: 'Lightbulb',
          color: '#f97316',
          is_active: true,
          sort_order: 8
        },
        {
          id: '9',
          name: 'Personal Injury',
          description: 'Accident claims, medical negligence, and injury compensation',
          icon: 'Heart',
          color: '#ec4899',
          is_active: true,
          sort_order: 9
        },
        {
          id: '10',
          name: 'Debt & Bankruptcy',
          description: 'Debt recovery, insolvency proceedings, and financial restructuring',
          icon: 'CreditCard',
          color: '#84cc16',
          is_active: true,
          sort_order: 10
        }
      ]

      const fallbackStats: CategoryStats = {}
      fallbackCategories.forEach(category => {
        fallbackStats[category.id] = {
          articles: Math.floor(Math.random() * 50) + 10,
          queries: Math.floor(Math.random() * 200) + 25
        }
      })

      setCategories(fallbackCategories)
      setCategoryStats(fallbackStats)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading legal categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Singapore Legal Practice Areas
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore comprehensive legal assistance across all major practice areas in Singapore. 
            Get expert guidance, resources, and support for your specific legal needs.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search legal areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(categoryStats).reduce((sum, stats) => sum + stats.articles, 0)}
                </div>
                <div className="text-sm text-gray-600">Legal Articles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(categoryStats).reduce((sum, stats) => sum + stats.queries, 0)}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Scale className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                <div className="text-sm text-gray-600">Practice Areas</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 h-full flex flex-col"
                style={{ borderLeftColor: category.color }}
                onClick={() => router.push(`/legal-categories/${createSlug(category.name)}`)}
              >
                <CardHeader className="p-4 sm:p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl sm:text-2xl">
                        {iconMap[category.icon] || <FileText className="h-5 w-5 sm:h-6 sm:w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </CardTitle>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow flex flex-col h-full">
                  <CardDescription className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed flex-grow">
                    {category.description}
                  </CardDescription>

                  {/* Category Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2 sm:space-x-4">
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        <FileText className="h-3 w-3 mr-1" />
                        {categoryStats[category.id]?.articles || 0} Articles
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        {categoryStats[category.id]?.queries || 0} Q&As
                      </Badge>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full py-2 px-3 sm:px-4 text-sm sm:text-base group-hover:bg-blue-50 group-hover:border-blue-300"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click event
                        router.push(`/legal-categories/${createSlug(category.name)}`)
                      }}
                    >
                      Explore {category.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Need Personalized Legal Assistance?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get started with our AI-powered legal platform and connect with qualified Singapore lawyers.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Try Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

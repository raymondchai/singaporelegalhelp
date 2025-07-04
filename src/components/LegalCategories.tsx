'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface LegalCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  sort_order: number
}

const iconMap: Record<string, string> = {
  family: '👨‍👩‍👧‍👦',
  briefcase: '💼',
  home: '🏠',
  document: '📄',
  shield: '🛡️',
  globe: '🌍',
  building: '🏢',
  lightbulb: '💡',
  medical: '⚕️',
  calculator: '🧮'
}

export default function LegalCategories() {
  const [categories, setCategories] = useState<LegalCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Legal Categories
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore different areas of Singapore law and find the legal assistance you need
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`
              relative overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer
              ${selectedCategory === category.id 
                ? 'border-blue-500 shadow-lg scale-105' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
            onClick={() => setSelectedCategory(
              selectedCategory === category.id ? null : category.id
            )}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {iconMap[category.icon] || '📋'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h3>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {category.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.split(' ')[0]}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    selectedCategory === category.id ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {selectedCategory === category.id && (
              <div className="border-t bg-gray-50 p-4">
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    📚 Browse Articles & Guides
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    ❓ Ask a Question
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    👥 Find Legal Professionals
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No legal categories available at the moment.</p>
        </div>
      )}
    </div>
  )
}

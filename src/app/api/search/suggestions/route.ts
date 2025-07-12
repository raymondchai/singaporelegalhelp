import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to create URL-friendly slugs from category names
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

interface SearchSuggestion {
  text: string
  type: 'popular' | 'trending' | 'content' | 'recent'
  category?: string
  score?: number
  url?: string
}

interface DetailedSuggestion {
  id?: string
  title: string
  summary?: string
  type: string
  category?: string
  categorySlug?: string
  url?: string
  suggestionType: 'popular' | 'trending' | 'content' | 'recent'
  score?: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '8')
  const includePopular = searchParams.get('include_popular') !== 'false'
  const includeTrending = searchParams.get('include_trending') !== 'false'
  const detailed = searchParams.get('detailed') === 'true'

  if (!query || query.length < 2) {
    // Return popular and trending queries when no query provided
    return await getDefaultSuggestions(limit, includePopular, includeTrending, detailed)
  }

  try {
    const suggestions: SearchSuggestion[] = []
    const detailedSuggestions: DetailedSuggestion[] = []

    // 1. Get popular queries that match the input
    if (includePopular) {
      try {
        const { data: popularQueries } = await supabase
          .from('search_popular_queries')
          .select('query, search_count, trend_score')
          .ilike('query', `%${query}%`)
          .order('search_count', { ascending: false })
          .limit(3)

        if (popularQueries) {
          popularQueries.forEach(item => {
            suggestions.push({
              text: item.query,
              type: 'popular',
              score: item.search_count
            })

            if (detailed) {
              detailedSuggestions.push({
                title: item.query,
                type: 'Popular Search',
                suggestionType: 'popular',
                score: item.search_count
              })
            }
          })
        }
      } catch (error) {
        console.log('Popular queries not available:', error)
      }
    }

    // 2. Get trending queries that match the input
    if (includeTrending) {
      try {
        const { data: trendingData } = await supabase.rpc('get_trending_search_queries', {
          days_back: 7,
          result_limit: 3
        })

        if (trendingData) {
          const matchingTrending = trendingData.filter((item: any) =>
            item.query.toLowerCase().includes(query.toLowerCase())
          )

          matchingTrending.forEach((item: any) => {
            suggestions.push({
              text: item.query,
              type: 'trending',
              score: item.trend_percentage
            })

            if (detailed) {
              detailedSuggestions.push({
                title: item.query,
                type: 'Trending Search',
                suggestionType: 'trending',
                score: item.trend_percentage
              })
            }
          })
        }
      } catch (error) {
        console.log('Trending queries not available:', error)
      }
    }

    // 3. Get recent search analytics that match
    try {
      const { data: recentSearches } = await supabase
        .from('search_analytics')
        .select('query')
        .ilike('query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentSearches) {
        const uniqueRecent = Array.from(new Set(recentSearches.map(item => item.query)))
          .filter(q => !suggestions.some(s => s.text.toLowerCase() === q.toLowerCase()))

        uniqueRecent.forEach(q => {
          suggestions.push({
            text: q,
            type: 'recent'
          })

          if (detailed) {
            detailedSuggestions.push({
              title: q,
              type: 'Recent Search',
              suggestionType: 'recent'
            })
          }
        })
      }
    } catch (error) {
      console.log('Recent searches not available:', error)
    }

    // 4. Get content-based suggestions (articles and Q&As)
    const [articles, qas, categories] = await Promise.all([
      supabase
        .from('legal_articles')
        .select('id, title, summary, category_id')
        .ilike('title', `%${query}%`)
        .eq('is_published', true)
        .limit(2),

      supabase
        .from('legal_qa')
        .select('id, question, category_id')
        .ilike('question', `%${query}%`)
        .eq('is_public', true)
        .limit(2),

      supabase
        .from('legal_categories')
        .select('id, name')
    ])

    const categoryMap = new Map(categories.data?.map(cat => [cat.id, cat.name]) || [])

    // Add content-based suggestions
    if (articles.data) {
      articles.data.forEach((article: any) => {
        const categoryName = categoryMap.get(article.category_id) || 'Legal'
        const categorySlug = createSlug(categoryName)

        suggestions.push({
          text: article.title,
          type: 'content',
          category: categoryName
        })

        if (detailed) {
          detailedSuggestions.push({
            id: article.id,
            title: article.title,
            summary: article.summary?.substring(0, 100) + '...',
            type: 'Article',
            category: categoryName,
            categorySlug: categorySlug,
            url: `/legal-categories/${categorySlug}/articles/${article.id}`,
            suggestionType: 'content'
          })
        }
      })
    }

    if (qas.data) {
      qas.data.forEach((qa: any) => {
        const categoryName = categoryMap.get(qa.category_id) || 'Legal'
        const categorySlug = createSlug(categoryName)

        suggestions.push({
          text: qa.question,
          type: 'content',
          category: categoryName
        })

        if (detailed) {
          detailedSuggestions.push({
            id: qa.id,
            title: qa.question,
            summary: qa.question.length > 100 ? qa.question.substring(0, 100) + '...' : qa.question,
            type: 'Q&A',
            category: categoryName,
            categorySlug: categorySlug,
            url: `/legal-categories/${categorySlug}/qa/${qa.id}`,
            suggestionType: 'content'
          })
        }
      })
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) =>
        index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
      )
      .slice(0, limit)

    // Sort by relevance (popular > trending > content > recent)
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
      const typeOrder = { popular: 0, trending: 1, content: 2, recent: 3 }
      const aOrder = typeOrder[a.type]
      const bOrder = typeOrder[b.type]

      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.score && b.score) return b.score - a.score
      return 0
    })

    if (detailed) {
      const sortedDetailedSuggestions = detailedSuggestions
        .filter((suggestion, index, self) =>
          index === self.findIndex(s => s.title.toLowerCase() === suggestion.title.toLowerCase())
        )
        .sort((a, b) => {
          const typeOrder = { popular: 0, trending: 1, content: 2, recent: 3 }
          const aOrder = typeOrder[a.suggestionType]
          const bOrder = typeOrder[b.suggestionType]

          if (aOrder !== bOrder) return aOrder - bOrder
          if (a.score && b.score) return b.score - a.score
          return 0
        })
        .slice(0, limit)

      return NextResponse.json({
        suggestions: sortedDetailedSuggestions
      })
    }

    return NextResponse.json({
      suggestions: sortedSuggestions.map(s => s.text)
    })

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

async function getDefaultSuggestions(limit: number, includePopular: boolean, includeTrending: boolean, detailed: boolean) {
  try {
    const suggestions: SearchSuggestion[] = []
    const detailedSuggestions: DetailedSuggestion[] = []

    // Get popular queries
    if (includePopular) {
      try {
        const { data: popularQueries } = await supabase
          .from('search_popular_queries')
          .select('query, search_count')
          .order('search_count', { ascending: false })
          .limit(Math.ceil(limit / 2))

        if (popularQueries) {
          popularQueries.forEach(item => {
            suggestions.push({
              text: item.query,
              type: 'popular',
              score: item.search_count
            })

            if (detailed) {
              detailedSuggestions.push({
                title: item.query,
                type: 'Popular Search',
                suggestionType: 'popular',
                score: item.search_count
              })
            }
          })
        }
      } catch (error) {
        console.log('Popular queries not available:', error)
      }
    }

    // Get trending queries
    if (includeTrending) {
      try {
        const { data: trendingData } = await supabase.rpc('get_trending_search_queries', {
          days_back: 7,
          result_limit: Math.ceil(limit / 2)
        })

        if (trendingData) {
          trendingData.forEach((item: any) => {
            suggestions.push({
              text: item.query,
              type: 'trending',
              score: item.trend_percentage
            })

            if (detailed) {
              detailedSuggestions.push({
                title: item.query,
                type: 'Trending Search',
                suggestionType: 'trending',
                score: item.trend_percentage
              })
            }
          })
        }
      } catch (error) {
        console.log('Trending queries not available:', error)
      }
    }

    // Fallback to static popular terms if no data
    if (suggestions.length === 0) {
      const fallbackSuggestions = [
        'company incorporation',
        'employment termination',
        'property purchase',
        'divorce procedure',
        'work permit',
        'contract disputes',
        'intellectual property',
        'criminal defense'
      ]

      fallbackSuggestions.slice(0, limit).forEach(text => {
        suggestions.push({
          text,
          type: 'popular'
        })

        if (detailed) {
          detailedSuggestions.push({
            title: text,
            type: 'Popular Search',
            suggestionType: 'popular'
          })
        }
      })
    }

    if (detailed) {
      return NextResponse.json({
        suggestions: detailedSuggestions.slice(0, limit)
      })
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit).map(s => s.text)
    })

  } catch (error) {
    console.error('Default suggestions error:', error)
    const fallback = [
      'company incorporation',
      'employment law',
      'property law',
      'family law'
    ].slice(0, limit)

    if (detailed) {
      return NextResponse.json({
        suggestions: fallback.map(text => ({
          title: text,
          type: 'Popular Search',
          suggestionType: 'popular'
        }))
      })
    }

    return NextResponse.json({
      suggestions: fallback
    })
  }
}

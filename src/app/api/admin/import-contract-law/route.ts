import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { contractLawArticles, contractLawQAs } from '@/data/contract-law-content'

// Contract Law Category ID
const CONTRACT_LAW_CATEGORY_ID = '098b68ea-a042-4245-bd3b-5562c166edb6'

export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting Contract Law content import...')

    const results = {
      articles: { created: 0, errors: [] as string[] },
      qas: { created: 0, errors: [] as string[] }
    }

    // Import Articles
    console.log(`Importing ${contractLawArticles.length} Contract Law articles...`)
    
    for (const articleData of contractLawArticles) {
      try {
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        const article = {
          category_id: CONTRACT_LAW_CATEGORY_ID,
          title: articleData.title,
          slug: slug,
          summary: articleData.summary,
          content: articleData.content,
          content_type: 'article',
          difficulty_level: articleData.difficulty_level,
          tags: articleData.tags,
          reading_time_minutes: articleData.reading_time_minutes,
          is_featured: articleData.is_featured,
          is_published: articleData.is_published,
          author_name: 'Singapore Legal Help',
          seo_title: null,
          seo_description: null,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error } = await supabaseAdmin
          .from('legal_articles')
          .insert([article])

        if (error) {
          console.error(`Error inserting article "${articleData.title}":`, error)
          results.articles.errors.push(`${articleData.title}: ${error.message}`)
        } else {
          results.articles.created++
          console.log(`✓ Created article: ${articleData.title}`)
        }
      } catch (error) {
        console.error(`Error processing article "${articleData.title}":`, error)
        results.articles.errors.push(`${articleData.title}: ${error}`)
      }
    }

    // Import Q&As
    console.log(`Importing ${contractLawQAs.length} Contract Law Q&As...`)
    
    for (const qaData of contractLawQAs) {
      try {
        const qa = {
          category_id: CONTRACT_LAW_CATEGORY_ID,
          user_id: null,
          question: qaData.question,
          answer: qaData.answer,
          ai_response: null,
          tags: qaData.tags,
          difficulty_level: qaData.difficulty_level,
          is_featured: qaData.is_featured,
          is_public: qaData.is_public,
          status: 'published',
          helpful_votes: 0,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error } = await supabaseAdmin
          .from('legal_qa')
          .insert([qa])

        if (error) {
          console.error(`Error inserting Q&A "${qaData.question}":`, error)
          results.qas.errors.push(`${qaData.question}: ${error.message}`)
        } else {
          results.qas.created++
          console.log(`✓ Created Q&A: ${qaData.question}`)
        }
      } catch (error) {
        console.error(`Error processing Q&A "${qaData.question}":`, error)
        results.qas.errors.push(`${qaData.question}: ${error}`)
      }
    }

    // Summary
    console.log('Contract Law content import completed:')
    console.log(`- Articles created: ${results.articles.created}`)
    console.log(`- Q&As created: ${results.qas.created}`)
    console.log(`- Article errors: ${results.articles.errors.length}`)
    console.log(`- Q&A errors: ${results.qas.errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'Contract Law content import completed',
      results: {
        articles: {
          created: results.articles.created,
          total: contractLawArticles.length,
          errors: results.articles.errors
        },
        qas: {
          created: results.qas.created,
          total: contractLawQAs.length,
          errors: results.qas.errors
        }
      }
    })

  } catch (error) {
    console.error('Contract Law import error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import Contract Law content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current Contract Law content status
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check current Contract Law content
    const { data: articles, error: articlesError } = await supabase
      .from('legal_articles')
      .select('id, title, is_published')
      .eq('category_id', CONTRACT_LAW_CATEGORY_ID)

    const { data: qas, error: qasError } = await supabase
      .from('legal_qa')
      .select('id, question, status')
      .eq('category_id', CONTRACT_LAW_CATEGORY_ID)

    if (articlesError || qasError) {
      throw new Error('Failed to fetch current content')
    }

    return NextResponse.json({
      success: true,
      current_content: {
        articles: {
          total: articles?.length || 0,
          published: articles?.filter(a => a.is_published).length || 0,
          titles: articles?.map(a => a.title) || []
        },
        qas: {
          total: qas?.length || 0,
          published: qas?.filter(qa => qa.status === 'published').length || 0,
          questions: qas?.map(qa => qa.question) || []
        }
      },
      import_data: {
        articles_to_import: contractLawArticles.length,
        qas_to_import: contractLawQAs.length
      }
    })

  } catch (error) {
    console.error('Error checking Contract Law content:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check current content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

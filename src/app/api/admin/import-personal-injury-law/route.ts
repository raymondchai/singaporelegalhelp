import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { personalInjuryArticles, personalInjuryQAs } from '@/data/personal-injury-law-content'

// Personal Injury Law Category ID
const PERSONAL_INJURY_CATEGORY_ID = '61463ecd-fdf9-4b76-84ab-d0824ee2144f'


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

    console.log('Starting Personal Injury Law content import...')

    const results = {
      articles: { created: 0, errors: [] as string[] },
      qas: { created: 0, errors: [] as string[] }
    }

    // Import Articles
    console.log(`Importing ${personalInjuryArticles.length} Personal Injury articles...`)
    for (const articleData of personalInjuryArticles) {
      try {
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        const { data, error } = await supabaseAdmin
          .from('legal_articles')
          .insert([{
            category_id: PERSONAL_INJURY_CATEGORY_ID,
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
            view_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        results.articles.created++
        console.log(`✓ Created article: ${articleData.title}`)
      } catch (error) {
        console.error(`Error processing article "${articleData.title}":`, error)
        results.articles.errors.push(`${articleData.title}: ${error}`)
      }
    }

    // Import Q&As
    console.log(`Importing ${personalInjuryQAs.length} Personal Injury Q&As...`)
    for (const qaData of personalInjuryQAs) {
      try {
        const { data, error } = await supabaseAdmin
          .from('legal_qa')
          .insert([{
            category_id: PERSONAL_INJURY_CATEGORY_ID,
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
          }])

        if (error) throw error
        results.qas.created++
        console.log(`✓ Created Q&A: ${qaData.question}`)
      } catch (error) {
        console.error(`Error processing Q&A "${qaData.question}":`, error)
        results.qas.errors.push(`${qaData.question}: ${error}`)
      }
    }

    // Summary
    console.log('Personal Injury Law content import completed:')
    console.log(`- Articles created: ${results.articles.created}`)
    console.log(`- Q&As created: ${results.qas.created}`)
    console.log(`- Article errors: ${results.articles.errors.length}`)
    console.log(`- Q&A errors: ${results.qas.errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'Personal Injury Law content import completed',
      results: {
        articles: {
          created: results.articles.created,
          total: personalInjuryArticles.length,
          errors: results.articles.errors
        },
        qas: {
          created: results.qas.created,
          total: personalInjuryQAs.length,
          errors: results.qas.errors
        }
      }
    })

  } catch (error) {
    console.error('Personal Injury Law import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current Personal Injury Law content status
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check current Personal Injury Law content
    const { data: articles, error: articlesError } = await supabase
      .from('legal_articles')
      .select('id, title, is_published')
      .eq('category_id', PERSONAL_INJURY_CATEGORY_ID)

    const { data: qas, error: qasError } = await supabase
      .from('legal_qa')
      .select('id, question, status')
      .eq('category_id', PERSONAL_INJURY_CATEGORY_ID)

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
        articles_to_import: personalInjuryArticles.length,
        qas_to_import: personalInjuryQAs.length
      }
    })

  } catch (error) {
    console.error('Error checking Personal Injury Law content:', error)
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

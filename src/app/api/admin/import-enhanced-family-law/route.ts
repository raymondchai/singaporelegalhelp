import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { familyLawArticles } from '@/data/family-law-content'
import { familyLawEnhancedQAs } from '@/data/family-law-enhanced-qas'

// Family Law Category ID
const FAMILY_LAW_CATEGORY_ID = '8ec7d509-45be-4416-94bc-4e58dd6bc7cc'

// Admin authentication check
async function checkAdminAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const adminEmails = ['raymond.chai@8atoms.com', '8thrives@gmail.com']
  if (!profile || !adminEmails.includes(profile.email)) {
    throw new Error('Admin access required')
  }

  return user
}

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

    console.log('Starting Enhanced Family Law content import...')

    const results = {
      articles: { updated: 0, errors: [] as string[] },
      qas: { created: 0, errors: [] as string[] }
    }

    // Update existing articles with enhanced content
    console.log(`Updating ${familyLawArticles.length} Family Law articles...`)
    for (const articleData of familyLawArticles) {
      try {
        // Check if article exists
        const { data: existingArticle } = await supabaseAdmin
          .from('legal_articles')
          .select('id')
          .eq('slug', articleData.slug)
          .single()

        if (existingArticle) {
          // Update existing article
          const { error: updateError } = await supabaseAdmin
            .from('legal_articles')
            .update({
              title: articleData.title,
              summary: articleData.summary,
              content: articleData.content,
              content_type: articleData.content_type,
              difficulty_level: articleData.difficulty_level,
              tags: articleData.tags,
              reading_time_minutes: articleData.reading_time_minutes,
              seo_title: articleData.seo_title,
              seo_description: articleData.seo_description,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingArticle.id)

          if (updateError) {
            console.error('Error updating article:', updateError)
            results.articles.errors.push(`${articleData.title}: ${updateError.message}`)
          } else {
            results.articles.updated++
            console.log(`✅ Updated: ${articleData.title}`)
          }
        } else {
          // Create new article if it doesn't exist
          const { error: insertError } = await supabaseAdmin
            .from('legal_articles')
            .insert({
              category_id: FAMILY_LAW_CATEGORY_ID,
              title: articleData.title,
              slug: articleData.slug,
              summary: articleData.summary,
              content: articleData.content,
              content_type: articleData.content_type,
              difficulty_level: articleData.difficulty_level,
              tags: articleData.tags,
              reading_time_minutes: articleData.reading_time_minutes,
              is_featured: articleData.is_featured,
              is_published: articleData.is_published,
              author_name: articleData.author_name,
              seo_title: articleData.seo_title,
              seo_description: articleData.seo_description,
              view_count: 0
            })

          if (insertError) {
            console.error('Error creating article:', insertError)
            results.articles.errors.push(`${articleData.title}: ${insertError.message}`)
          } else {
            results.articles.updated++
            console.log(`✅ Created: ${articleData.title}`)
          }
        }
      } catch (error) {
        console.error('Error processing article:', articleData.title, error)
        results.articles.errors.push(`${articleData.title}: ${error}`)
      }
    }

    // Import enhanced Q&As
    console.log(`Importing ${familyLawEnhancedQAs.length} enhanced Family Law Q&As...`)
    for (const qaData of familyLawEnhancedQAs) {
      try {
        // Check if Q&A already exists
        const { data: existingQA } = await supabaseAdmin
          .from('legal_qa')
          .select('id')
          .eq('question', qaData.question)
          .eq('category_id', FAMILY_LAW_CATEGORY_ID)
          .single()

        if (!existingQA) {
          // Only insert if it doesn't exist
          const { error: insertError } = await supabaseAdmin
            .from('legal_qa')
            .insert({
              category_id: FAMILY_LAW_CATEGORY_ID,
              user_id: qaData.user_id,
              question: qaData.question,
              answer: qaData.answer,
              ai_response: qaData.ai_response,
              tags: qaData.tags,
              difficulty_level: qaData.difficulty_level,
              is_featured: qaData.is_featured,
              is_public: qaData.is_public,
              status: qaData.status,
              helpful_votes: qaData.helpful_votes,
              view_count: qaData.view_count
            })

          if (insertError) {
            console.error('Error inserting Q&A:', insertError)
            results.qas.errors.push(`${qaData.question.substring(0, 50)}...: ${insertError.message}`)
          } else {
            results.qas.created++
            console.log(`✅ Created Q&A: ${qaData.question.substring(0, 50)}...`)
          }
        } else {
          console.log(`⏭️ Skipped existing Q&A: ${qaData.question.substring(0, 50)}...`)
        }
      } catch (error) {
        console.error('Error processing Q&A:', qaData.question, error)
        results.qas.errors.push(`${qaData.question.substring(0, 50)}...: ${error}`)
      }
    }

    console.log('Enhanced Family Law content import completed!')
    console.log('Results:', results)

    return NextResponse.json({
      success: true,
      message: 'Enhanced Family Law content imported successfully',
      results: {
        articles: {
          updated: results.articles.updated,
          errors: results.articles.errors.length
        },
        qas: {
          created: results.qas.created,
          errors: results.qas.errors.length
        }
      },
      details: results
    })

  } catch (error) {
    console.error('Enhanced Family Law import error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import enhanced Family Law content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current Family Law content status
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check current Family Law content
    const { data: articles, error: articlesError } = await supabase
      .from('legal_articles')
      .select('id, title, is_published, updated_at')
      .eq('category_id', FAMILY_LAW_CATEGORY_ID)

    const { data: qas, error: qasError } = await supabase
      .from('legal_qa')
      .select('id, question, status')
      .eq('category_id', FAMILY_LAW_CATEGORY_ID)

    if (articlesError || qasError) {
      throw new Error('Failed to fetch current content')
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced Family Law content ready for import',
      current: {
        articles: articles?.length || 0,
        qas: qas?.length || 0
      },
      available: {
        articles: familyLawArticles.length,
        enhancedQAs: familyLawEnhancedQAs.length
      },
      articles: articles?.map(a => ({ 
        title: a.title, 
        published: a.is_published,
        lastUpdated: a.updated_at 
      })) || []
    })

  } catch (error) {
    console.error('Error fetching Enhanced Family Law content status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content status'
    }, { status: 500 })
  }
}

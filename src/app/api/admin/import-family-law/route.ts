import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { familyLawArticles } from '@/data/family-law-content';
import { familyLawArticlesPart2 } from '@/data/family-law-content-part2';
import { familyLawArticlesPart3, familyLawQAs } from '@/data/family-law-content-part3';
import additionalFamilyLawQAs from '@/data/family-law-qas-additional';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const FAMILY_LAW_CATEGORY_ID = "8ec7d509-45be-4416-94bc-4e58dd6bc7cc";

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting Family Law content import...');

    // Combine all articles from different parts
    const allArticles = [
      ...familyLawArticles,
      ...familyLawArticlesPart2,
      ...familyLawArticlesPart3
    ];

    // Combine all Q&As from different parts
    const allQAs = [
      ...familyLawQAs,
      ...additionalFamilyLawQAs
    ];

    console.log(`📚 Total articles to import: ${allArticles.length}`);
    console.log(`❓ Total Q&As to import: ${allQAs.length}`);

    // Verify category exists
    const { data: categoryCheck, error: categoryError } = await supabaseAdmin
      .from('legal_categories')
      .select('id, name')
      .eq('id', FAMILY_LAW_CATEGORY_ID)
      .single();

    if (categoryError || !categoryCheck) {
      console.error('❌ Family Law category not found:', categoryError);
      return NextResponse.json({ 
        error: 'Family Law category not found',
        details: categoryError 
      }, { status: 400 });
    }

    console.log(`✅ Category verified: ${categoryCheck.name}`);

    // Import Articles
    let articlesImported = 0;
    let articlesSkipped = 0;
    const articleResults = [];

    for (const article of allArticles) {
      try {
        // Check if article already exists
        const { data: existingArticle } = await supabaseAdmin
          .from('legal_articles')
          .select('id, title')
          .eq('slug', article.slug)
          .single();

        if (existingArticle) {
          console.log(`⏭️  Article already exists: ${article.title}`);
          articlesSkipped++;
          continue;
        }

        // Calculate reading time if not provided
        const readingTime = article.reading_time_minutes || calculateReadingTime(article.content);

        // Insert new article
        const { error } = await supabaseAdmin
          .from('legal_articles')
          .insert({
            category_id: article.category_id,
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            content: article.content,
            content_type: article.content_type,
            difficulty_level: article.difficulty_level,
            tags: article.tags,
            reading_time_minutes: readingTime,
            is_featured: article.is_featured,
            is_published: article.is_published,
            author_name: article.author_name,
            seo_title: article.seo_title,
            seo_description: article.seo_description,
            view_count: article.view_count || 0
          })
          .select();

        if (error) {
          console.error(`❌ Error importing article "${article.title}":`, error);
          articleResults.push({
            title: article.title,
            status: 'error',
            error: error.message
          });
        } else {
          console.log(`✅ Article imported: ${article.title}`);
          articlesImported++;
          articleResults.push({
            title: article.title,
            status: 'success'
          });
        }

      } catch (error) {
        console.error(`❌ Exception importing article "${article.title}":`, error);
        articleResults.push({
          title: article.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Import Q&As
    let qasImported = 0;
    let qasSkipped = 0;
    const qaResults = [];

    for (const qa of allQAs) {
      try {
        // Check if Q&A already exists
        const { data: existingQA } = await supabaseAdmin
          .from('legal_qa')
          .select('id, question')
          .eq('question', qa.question)
          .eq('category_id', qa.category_id)
          .single();

        if (existingQA) {
          console.log(`⏭️  Q&A already exists: ${qa.question}`);
          qasSkipped++;
          continue;
        }

        // Insert new Q&A
        const { error } = await supabaseAdmin
          .from('legal_qa')
          .insert({
            category_id: qa.category_id,
            user_id: qa.user_id,
            question: qa.question,
            answer: qa.answer,
            ai_response: qa.ai_response,
            tags: qa.tags,
            difficulty_level: qa.difficulty_level,
            is_featured: qa.is_featured,
            is_public: qa.is_public,
            status: qa.status,
            helpful_votes: qa.helpful_votes || 0,
            view_count: qa.view_count || 0
          })
          .select();

        if (error) {
          console.error(`❌ Error importing Q&A "${qa.question}":`, error);
          qaResults.push({
            question: qa.question,
            status: 'error',
            error: error.message
          });
        } else {
          console.log(`✅ Q&A imported: ${qa.question}`);
          qasImported++;
          qaResults.push({
            question: qa.question,
            status: 'success'
          });
        }

      } catch (error) {
        console.error(`❌ Exception importing Q&A "${qa.question}":`, error);
        qaResults.push({
          question: qa.question,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Final verification
    const { data: finalArticleCount } = await supabaseAdmin
      .from('legal_articles')
      .select('id', { count: 'exact' })
      .eq('category_id', FAMILY_LAW_CATEGORY_ID);

    const { data: finalQACount } = await supabaseAdmin
      .from('legal_qa')
      .select('id', { count: 'exact' })
      .eq('category_id', FAMILY_LAW_CATEGORY_ID);

    const summary = {
      category: categoryCheck.name,
      articles: {
        imported: articlesImported,
        skipped: articlesSkipped,
        total_in_category: finalArticleCount?.length || 0
      },
      qas: {
        imported: qasImported,
        skipped: qasSkipped,
        total_in_category: finalQACount?.length || 0
      },
      results: {
        articles: articleResults,
        qas: qaResults
      }
    };

    console.log('🎉 Family Law import completed!');
    console.log(`📊 Summary: ${articlesImported} articles, ${qasImported} Q&As imported`);

    return NextResponse.json({
      success: true,
      message: 'Family Law content import completed successfully',
      summary
    });

  } catch (error) {
    console.error('❌ Fatal error during Family Law import:', error);
    return NextResponse.json({
      error: 'Failed to import Family Law content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

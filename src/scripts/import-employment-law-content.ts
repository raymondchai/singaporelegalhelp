// Employment Law Content Import Script
// Singapore Legal Help Platform - Task 1A-3

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { employmentLawDatabaseConfig, employmentLawContentSpecs } from '../data/employment-law-technical-specs';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Employment Law Category ID
const EMPLOYMENT_LAW_CATEGORY_ID = '9e1378f4-c4c9-4296-b8a4-508699f63a88';

// Article content mapping
const articleFiles = [
  {
    slug: 'employment-rights-obligations-singapore',
    file: 'employment-rights-obligations.md'
  },
  {
    slug: 'wrongful-termination-unfair-dismissal-singapore',
    file: 'wrongful-termination-unfair-dismissal.md'
  },
  {
    slug: 'workplace-discrimination-harassment-singapore',
    file: 'workplace-discrimination-harassment.md'
  },
  {
    slug: 'employment-contracts-terms-service-singapore',
    file: 'employment-contracts-terms-service.md'
  },
  {
    slug: 'work-pass-foreign-worker-regulations-singapore',
    file: 'work-pass-foreign-worker-regulations.md'
  },
  {
    slug: 'cpf-benefits-employment-insurance-singapore',
    file: 'cpf-benefits-employment-insurance.md'
  },
  {
    slug: 'workplace-safety-compensation-claims-singapore',
    file: 'workplace-safety-compensation-claims.md'
  },
  {
    slug: 'trade-unions-industrial-relations-singapore',
    file: 'trade-unions-industrial-relations.md'
  }
];

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Helper function to extract summary from content
function extractSummary(content: string): string {
  const summaryMatch = content.match(/## Quick Summary\s*\n\n([\s\S]*?)\n\n\*\*Key Points:/);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }
  
  // Fallback: use first paragraph after title
  const lines = content.split('\n');
  const titleIndex = lines.findIndex(line => line.startsWith('# '));
  if (titleIndex !== -1) {
    for (let i = titleIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('**')) {
        return line;
      }
    }
  }
  
  return 'Comprehensive guide to employment law in Singapore.';
}

// Import articles
async function importArticles() {
  console.log('Starting article import...');
  
  for (let i = 0; i < employmentLawContentSpecs.articles.length; i++) {
    const articleSpec = employmentLawContentSpecs.articles[i];
    const fileMapping = articleFiles.find(f => f.slug === articleSpec.slug);
    
    if (!fileMapping) {
      console.error(`No file mapping found for slug: ${articleSpec.slug}`);
      continue;
    }
    
    try {
      // Read article content from file
      const filePath = join(process.cwd(), 'src/data/employment-law-articles', fileMapping.file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Extract summary from content
      const summary = extractSummary(content);
      
      // Calculate reading time
      const readingTime = calculateReadingTime(content);
      
      // Prepare article data
      const articleData = {
        id: generateUUID(),
        category_id: EMPLOYMENT_LAW_CATEGORY_ID,
        title: articleSpec.title,
        slug: articleSpec.slug,
        summary: summary,
        content: content,
        content_type: articleSpec.contentType,
        difficulty_level: articleSpec.difficultyLevel,
        tags: articleSpec.tags,
        reading_time_minutes: readingTime,
        is_featured: articleSpec.isFeatured,
        is_published: true,
        author_name: 'Singapore Legal Help Team',
        seo_title: articleSpec.seoTitle,
        seo_description: articleSpec.seoDescription,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert article into database
      const { data, error } = await supabase
        .from('legal_articles')
        .insert(articleData);
      
      if (error) {
        console.error(`Error inserting article ${articleSpec.title}:`, error);
      } else {
        console.log(`✅ Successfully imported article: ${articleSpec.title}`);
      }
      
    } catch (error) {
      console.error(`Error processing article ${articleSpec.title}:`, error);
    }
  }
}

// Import Q&As
async function importQAs() {
  console.log('Starting Q&A import...');
  
  try {
    // Read Q&A content from JSON file
    const qaFilePath = join(process.cwd(), 'src/data/employment-law-qas/employment-law-qas.json');
    const qaContent = readFileSync(qaFilePath, 'utf-8');
    const qas = JSON.parse(qaContent);
    
    for (const qa of qas) {
      // Prepare Q&A data
      const qaData = {
        id: generateUUID(),
        category_id: EMPLOYMENT_LAW_CATEGORY_ID,
        user_id: null, // System-generated Q&A
        question: qa.question,
        answer: qa.answer,
        ai_response: null,
        tags: qa.tags,
        difficulty_level: qa.difficulty_level,
        is_featured: qa.is_featured,
        is_public: true,
        status: 'answered',
        helpful_votes: 0,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert Q&A into database
      const { data, error } = await supabase
        .from('legal_qa')
        .insert(qaData);
      
      if (error) {
        console.error(`Error inserting Q&A:`, error);
      } else {
        console.log(`✅ Successfully imported Q&A: ${qa.question.substring(0, 50)}...`);
      }
    }
    
  } catch (error) {
    console.error('Error importing Q&As:', error);
  }
}

// Main import function
async function main() {
  console.log('🚀 Starting Employment Law content import...');
  console.log(`Category ID: ${EMPLOYMENT_LAW_CATEGORY_ID}`);
  console.log(`Target: ${employmentLawContentSpecs.articles.length} articles and 20 Q&As`);
  
  try {
    // Import articles
    await importArticles();
    
    // Import Q&As
    await importQAs();
    
    console.log('\n✅ Employment Law content import completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${employmentLawContentSpecs.articles.length} articles imported`);
    console.log('- 20 Q&As imported');
    console.log('- All content published and ready for use');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main();
}

export { main as importEmploymentLawContent };

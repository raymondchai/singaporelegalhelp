import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://singaporelegalhelp.com.sg'
    const urls: SitemapUrl[] = []

    // Static pages
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily' as const },
      { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
      { path: '/contact', priority: 0.8, changefreq: 'monthly' as const },
      { path: '/privacy', priority: 0.5, changefreq: 'yearly' as const },
      { path: '/terms', priority: 0.5, changefreq: 'yearly' as const },
      { path: '/pricing', priority: 0.9, changefreq: 'weekly' as const },
      { path: '/dashboard', priority: 0.7, changefreq: 'daily' as const },
      { path: '/document-builder', priority: 0.9, changefreq: 'weekly' as const },
      { path: '/search', priority: 0.8, changefreq: 'daily' as const },
    ]

    staticPages.forEach(page => {
      urls.push({
        loc: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString(),
        changefreq: page.changefreq,
        priority: page.priority
      })
    })

    // Legal categories
    const { data: categories } = await supabase
      .from('legal_categories')
      .select('slug, updated_at')
      .eq('is_active', true)

    categories?.forEach(category => {
      urls.push({
        loc: `${baseUrl}/legal/${category.slug}`,
        lastmod: category.updated_at || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8
      })
    })

    // Legal articles
    const { data: articles } = await supabase
      .from('legal_articles')
      .select('slug, category_slug, updated_at')
      .eq('is_published', true)

    articles?.forEach(article => {
      urls.push({
        loc: `${baseUrl}/legal/${article.category_slug}/${article.slug}`,
        lastmod: article.updated_at || new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7
      })
    })

    // Legal Q&As
    const { data: qas } = await supabase
      .from('legal_qas')
      .select('slug, category_slug, updated_at')
      .eq('is_published', true)

    qas?.forEach(qa => {
      urls.push({
        loc: `${baseUrl}/legal/${qa.category_slug}/qa/${qa.slug}`,
        lastmod: qa.updated_at || new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.6
      })
    })

    // Document templates
    const { data: templates } = await supabase
      .from('legal_document_templates')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('is_public', true)

    templates?.forEach(template => {
      urls.push({
        loc: `${baseUrl}/document-builder/template/${template.slug}`,
        lastmod: template.updated_at || new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.7
      })
    })

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Sitemap generation error:', error)
    
    // Return minimal sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://singaporelegalhelp.com.sg'
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes on error
      },
    })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://singaporelegalhelp.com.sg'
  const isProduction = process.env.NODE_ENV === 'production'

  const robotsTxt = isProduction ? `# Production robots.txt for Singapore Legal Help Platform
# singaporelegalhelp.com.sg

User-agent: *
Allow: /

# Allow all legal content
Allow: /legal/
Allow: /legal/*/
Allow: /legal/*/qa/

# Allow public document templates
Allow: /document-builder/template/

# Allow search functionality
Allow: /search

# Disallow private/admin areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /private/

# Disallow user-specific content
Disallow: /user/
Disallow: /profile/
Disallow: /settings/

# Disallow payment and checkout pages
Disallow: /checkout/
Disallow: /payment/
Disallow: /billing/

# Disallow temporary or test pages
Disallow: /test/
Disallow: /temp/
Disallow: /staging/

# Crawl delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Specific bot instructions
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 2

# Block aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: SemrushBot
Disallow: /

# Allow social media crawlers for rich previews
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

# Singapore-specific search engines
User-agent: YandexBot
Allow: /
Crawl-delay: 3

User-agent: BaiduSpider
Allow: /
Crawl-delay: 3` : `# Development/Staging robots.txt
# Block all crawlers in non-production environments

User-agent: *
Disallow: /

# Still allow sitemap for testing
Sitemap: ${baseUrl}/sitemap.xml`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  })
}

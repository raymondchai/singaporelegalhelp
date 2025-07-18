# 🔧 Technical Implementation Guide - Singapore Legal Help v2.0

## 📋 Database Schema Assessment & Cleanup

### Current Issues Identified
Based on the codebase analysis, the following duplicate/redundant tables need attention:

#### Tables to Remove/Consolidate:
1. **`user_profiles`** - Duplicate of `profiles` table
2. **`chat_messages`** & **`chat_sessions`** - Unused chat functionality
3. **`legal_content`** - Redundant with `legal_articles`
4. **`user_queries`** - Unused query system
5. **Multiple subscription tables** - Consolidate into single system

#### Optimized Schema Structure:
```sql
-- Core Tables (Final List)
1. profiles                    -- User authentication & basic info
2. admin_roles                 -- Admin access control (NEW)
3. legal_categories           -- Practice areas (25+ areas)
4. legal_articles             -- Legal content (comprehensive)
5. legal_qa                   -- Q&A system (extensive)
6. law_firms                  -- Law firm directory (NEW)
7. user_subscriptions         -- Subscription management
8. usage_tracking            -- Rate limiting & usage
9. document_templates        -- Document builder templates
10. document_generations     -- Generated documents tracking
11. payment_transactions     -- Payment processing
12. ai_query_logs           -- AI interaction analytics
```

### Legal Content System Tables
The platform includes a comprehensive legal content management system:

```sql
-- Legal Categories (25+ Practice Areas)
CREATE TABLE public.legal_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_coming_soon BOOLEAN DEFAULT false,
    launch_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert core practice areas (implemented)
INSERT INTO public.legal_categories (id, name, slug, description, icon, color, sort_order, is_active, is_coming_soon) VALUES
('8ec7d509-45be-4416-94bc-4e58dd6bc7cc', 'Family Law', 'family-law', 'Divorce, custody, matrimonial matters', 'heart', 'text-pink-600', 1, true, false),
('9e1378f4-c4c9-4296-b8a4-508699f63a88', 'Employment Law', 'employment-law', 'Workplace rights, contracts, disputes', 'briefcase', 'text-blue-600', 2, true, false),
('4e8ce92f-a63c-4719-9d73-2f28966c45be', 'Property Law', 'property-law', 'Real estate, leases, property transactions', 'home', 'text-green-600', 3, true, false),
('0047f44c-0869-432e-9b25-a20dbabe53fb', 'Criminal Law', 'criminal-law', 'Criminal procedures, defense, penalties', 'shield', 'text-red-600', 4, true, false),
('098b68ea-a042-4245-bd3b-5562c166edb6', 'Contract Law', 'contract-law', 'Business contracts and agreements', 'building', 'text-purple-600', 5, true, false),
('64f9abe4-f1c2-4eb6-9d11-6f107ab9def1', 'Intellectual Property', 'intellectual-property', 'Trademarks, patents, copyright', 'lightbulb', 'text-yellow-600', 6, true, false),
('57559a93-bb72-4833-8ad5-75e1dbc2e275', 'Immigration Law', 'immigration-law', 'Work permits, PR, citizenship', 'plane', 'text-indigo-600', 7, true, false),
('f8a2c1d4-5e6b-4c7a-8d9e-0f1a2b3c4d5e', 'Personal Injury', 'personal-injury', 'Accident claims, compensation', 'user-x', 'text-orange-600', 8, true, false),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Corporate Law', 'corporate-law', 'Business formation, compliance', 'building-2', 'text-teal-600', 9, true, false),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Debt & Bankruptcy', 'debt-bankruptcy', 'Debt recovery, insolvency', 'credit-card', 'text-gray-600', 10, true, false);

-- Insert specialized practice areas (coming soon)
INSERT INTO public.legal_categories (id, name, slug, description, icon, color, sort_order, is_active, is_coming_soon) VALUES
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Civil Litigation / Dispute Resolution', 'civil-litigation', 'Court proceedings, mediation, arbitration', 'gavel', 'text-slate-600', 11, true, true),
('d4e5f6a7-b8c9-0123-def4-456789012345', 'Banking & Finance', 'banking-finance', 'Financial regulations, banking law, securities', 'banknote', 'text-emerald-600', 12, true, true),
('e5f6a7b8-c9d0-1234-ef56-567890123456', 'Wills, Probate & Trusts', 'wills-probate-trusts', 'Estate planning, inheritance, trust administration', 'scroll', 'text-amber-600', 13, true, true),
('f6a7b8c9-d0e1-2345-f678-678901234567', 'Tax Law', 'tax-law', 'Income tax, GST, corporate taxation', 'calculator', 'text-rose-600', 14, true, true),
('a7b8c9d0-e1f2-3456-789a-789012345678', 'Technology, Media & Telecommunications', 'tmt-law', 'IT law, media regulations, telecom', 'smartphone', 'text-cyan-600', 15, true, true),
('b8c9d0e1-f2a3-4567-89ab-890123456789', 'Data Protection / Privacy Law', 'data-protection', 'PDPA compliance, data governance', 'shield-check', 'text-violet-600', 16, true, true),
('c9d0e1f2-a3b4-5678-9abc-901234567890', 'Construction Law', 'construction-law', 'Building contracts, construction disputes', 'hard-hat', 'text-orange-600', 17, true, true),
('d0e1f2a3-b4c5-6789-abcd-012345678901', 'Admiralty & Shipping', 'admiralty-shipping', 'Maritime law, shipping regulations', 'anchor', 'text-blue-700', 18, true, true),
('e1f2a3b4-c5d6-789a-bcde-123456789012', 'Environmental Law', 'environmental-law', 'Environmental compliance, sustainability', 'leaf', 'text-green-700', 19, true, true),
('f2a3b4c5-d6e7-89ab-cdef-234567890123', 'Public International Law', 'public-international-law', 'International treaties, cross-border issues', 'globe', 'text-indigo-700', 20, true, true),
('a3b4c5d6-e7f8-9abc-def0-345678901234', 'Constitutional & Administrative Law', 'constitutional-administrative-law', 'Government law, public administration', 'landmark', 'text-red-700', 21, true, true),
('b4c5d6e7-f8a9-abcd-ef01-456789012345', 'Insolvency / Bankruptcy Law', 'insolvency-bankruptcy-law', 'Corporate insolvency, restructuring', 'trending-down', 'text-gray-700', 22, true, true),
('c5d6e7f8-a9b0-bcde-f012-567890123456', 'Islamic/Muslim Law (Syariah)', 'islamic-muslim-law', 'Islamic legal principles, family matters', 'moon', 'text-purple-700', 23, true, true),
('d6e7f8a9-b0c1-cdef-0123-678901234567', 'Medical Law', 'medical-law', 'Healthcare regulations, medical negligence', 'stethoscope', 'text-pink-700', 24, true, true),
('e7f8a9b0-c1d2-def0-1234-789012345678', 'Public Sector Law', 'public-sector-law', 'Government contracts, public policy', 'building-columns', 'text-slate-700', 25, true, true);

-- Legal Articles (Comprehensive Content)
CREATE TABLE public.legal_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_categories(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'guide',
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    tags TEXT[] DEFAULT '{}',
    reading_time_minutes INTEGER,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    author_name VARCHAR(255),
    seo_title VARCHAR(500),
    seo_description VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Q&A (Knowledge Base)
CREATE TABLE public.legal_qa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_categories(id),
    user_id UUID REFERENCES public.profiles(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    ai_response TEXT,
    tags TEXT[] DEFAULT '{}',
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'published',
    helpful_votes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_legal_articles_category ON public.legal_articles (category_id);
CREATE INDEX idx_legal_articles_published ON public.legal_articles (is_published, is_featured);
CREATE INDEX idx_legal_articles_tags ON public.legal_articles USING GIN (tags);
CREATE INDEX idx_legal_qa_category ON public.legal_qa (category_id);
CREATE INDEX idx_legal_qa_public ON public.legal_qa (is_public, status);
CREATE INDEX idx_legal_qa_tags ON public.legal_qa USING GIN (tags);
```

### RLS Policy Implementation
```sql
-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;

-- Admin access policy (applies to all admin-managed tables)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legal content policies
CREATE POLICY "Public can view published articles" ON public.legal_articles
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all articles" ON public.legal_articles
    FOR ALL USING (is_admin());

CREATE POLICY "Public can view public Q&As" ON public.legal_qa
    FOR SELECT USING (is_public = true AND status = 'published');

CREATE POLICY "Admins can manage all Q&As" ON public.legal_qa
    FOR ALL USING (is_admin());

CREATE POLICY "Public can view active categories" ON public.legal_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.legal_categories
    FOR ALL USING (is_admin());
```

## 📚 Legal Content Management Implementation

### Bulk Import API Structure
```typescript
// /api/admin/import-[practice-area]
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile || !['raymond.chai@8atoms.com', '8thrives@gmail.com'].includes(profile.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Import articles and Q&As
    const results = await importLegalContent(categoryId, articles, qas);

    return NextResponse.json({
      success: true,
      results: {
        articles: {
          created: results.articlesCreated,
          total: articles.length,
          errors: results.articleErrors
        },
        qas: {
          created: results.qasCreated,
          total: qas.length,
          errors: results.qaErrors
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function importLegalContent(categoryId: string, articles: any[], qas: any[]) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let articlesCreated = 0;
  let qasCreated = 0;
  const articleErrors: string[] = [];
  const qaErrors: string[] = [];

  // Import articles
  for (const article of articles) {
    try {
      const { error } = await supabaseAdmin
        .from('legal_articles')
        .insert({
          ...article,
          category_id: categoryId,
          id: generateUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      articlesCreated++;
    } catch (error) {
      articleErrors.push(`${article.title}: ${error.message}`);
    }
  }

  // Import Q&As
  for (const qa of qas) {
    try {
      const { error } = await supabaseAdmin
        .from('legal_qa')
        .insert({
          ...qa,
          category_id: categoryId,
          id: generateUUID(),
          user_id: null, // Admin-created content
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      qasCreated++;
    } catch (error) {
      qaErrors.push(`${qa.question}: ${error.message}`);
    }
  }

  return { articlesCreated, qasCreated, articleErrors, qaErrors };
}
```

### Universal Admin Interface
```typescript
// Universal component for managing all 10 practice areas
interface LawAreaConfig {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  description: string;
  importEndpoint: string;
  hasExistingContent: boolean;
  specializedFields: {
    articles: SpecializedField[];
    qas: SpecializedField[];
  };
}

export default function UniversalLawAreaAdmin({ lawAreaConfig }: { lawAreaConfig: LawAreaConfig }) {
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [qas, setQAs] = useState<LegalQA[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    const { data: articlesData } = await supabase
      .from('legal_articles')
      .select('*')
      .eq('category_id', lawAreaConfig.categoryId)
      .order('created_at', { ascending: false });

    const { data: qasData } = await supabase
      .from('legal_qa')
      .select('*')
      .eq('category_id', lawAreaConfig.categoryId)
      .order('created_at', { ascending: false });

    setArticles(articlesData || []);
    setQAs(qasData || []);
  };

  const importContent = async () => {
    const response = await fetch(lawAreaConfig.importEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (result.success) {
      await fetchContent(); // Refresh content
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{lawAreaConfig.categoryName} Content Management</h1>
        {lawAreaConfig.hasExistingContent && (
          <Button onClick={importContent}>
            Import {lawAreaConfig.categoryName} Content
          </Button>
        )}
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="qas">Q&As ({qas.length})</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <ArticlesManagement articles={articles} lawAreaConfig={lawAreaConfig} />
        </TabsContent>

        <TabsContent value="qas">
          <QAsManagement qas={qas} lawAreaConfig={lawAreaConfig} />
        </TabsContent>

        <TabsContent value="create">
          <ContentCreationForm lawAreaConfig={lawAreaConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 🏢 Law Firm Directory Implementation

### Database Schema
```sql
CREATE TABLE public.law_firms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    
    -- Contact Information
    address TEXT NOT NULL,
    postal_code VARCHAR(6) CHECK (postal_code ~ '^[0-9]{6}$'),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Practice Areas & Specializations
    practice_areas TEXT[] DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"English"}',
    
    -- Google Reviews Integration
    google_rating DECIMAL(2,1) CHECK (google_rating >= 0 AND google_rating <= 5),
    google_review_count INTEGER DEFAULT 0,
    google_place_id VARCHAR(255) UNIQUE,
    google_reviews_url TEXT,
    
    -- Business Information
    uen VARCHAR(20) UNIQUE,
    license_number VARCHAR(50),
    established_year INTEGER CHECK (established_year >= 1800 AND established_year <= EXTRACT(YEAR FROM NOW())),
    firm_size firm_size_enum DEFAULT 'small',
    
    -- Consultation & Fees
    consultation_fee_range VARCHAR(50), -- e.g., "$200-$500"
    consultation_duration INTEGER DEFAULT 60, -- minutes
    accepts_legal_aid BOOLEAN DEFAULT false,
    
    -- Location & Accessibility
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    nearest_mrt VARCHAR(100),
    parking_available BOOLEAN DEFAULT false,
    wheelchair_accessible BOOLEAN DEFAULT false,
    
    -- Operating Hours
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
        "thursday": {"open": "09:00", "close": "18:00", "closed": false},
        "friday": {"open": "09:00", "close": "18:00", "closed": false},
        "saturday": {"open": "09:00", "close": "13:00", "closed": false},
        "sunday": {"open": "09:00", "close": "13:00", "closed": true}
    }',
    
    -- Status & Verification
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_date TIMESTAMPTZ,
    verification_notes TEXT,
    
    -- Appointment Booking (Coming Soon)
    appointment_booking_enabled BOOLEAN DEFAULT false,
    booking_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Create enums
CREATE TYPE firm_size_enum AS ENUM ('solo', 'small', 'medium', 'large');

-- Indexes for performance
CREATE INDEX idx_law_firms_practice_areas ON public.law_firms USING GIN (practice_areas);
CREATE INDEX idx_law_firms_location ON public.law_firms (latitude, longitude);
CREATE INDEX idx_law_firms_rating ON public.law_firms (google_rating DESC);
CREATE INDEX idx_law_firms_active ON public.law_firms (is_active, is_verified);
```

### Search API Implementation
```typescript
// /api/law-firms/search
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const filters = {
    practice_area: searchParams.get('practice_area'),
    location: searchParams.get('location'),
    rating_min: parseFloat(searchParams.get('rating_min') || '0'),
    firm_size: searchParams.get('firm_size'),
    consultation_fee_max: parseInt(searchParams.get('consultation_fee_max') || '0'),
    languages: searchParams.getAll('languages'),
    wheelchair_accessible: searchParams.get('wheelchair_accessible') === 'true',
    accepts_legal_aid: searchParams.get('accepts_legal_aid') === 'true',
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  };

  let query = supabase
    .from('law_firms')
    .select('*')
    .eq('is_active', true)
    .eq('is_verified', true);

  // Apply filters
  if (filters.practice_area) {
    query = query.contains('practice_areas', [filters.practice_area]);
  }
  
  if (filters.rating_min > 0) {
    query = query.gte('google_rating', filters.rating_min);
  }
  
  if (filters.firm_size) {
    query = query.eq('firm_size', filters.firm_size);
  }
  
  // Location-based search (if coordinates provided)
  if (filters.location) {
    // Implement geospatial search
    query = query.rpc('nearby_law_firms', {
      lat: parseFloat(filters.location.split(',')[0]),
      lng: parseFloat(filters.location.split(',')[1]),
      radius_km: 10
    });
  }

  // Pagination
  const offset = (filters.page - 1) * filters.limit;
  query = query.range(offset, offset + filters.limit - 1);
  
  // Order by rating and review count
  query = query.order('google_rating', { ascending: false })
              .order('google_review_count', { ascending: false });

  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    law_firms: data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count,
      pages: Math.ceil((count || 0) / filters.limit)
    }
  });
}
```

## 💳 Enhanced Subscription System

### Subscription Tiers Configuration
```typescript
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free Access',
    monthlyPrice: 0,
    limits: {
      aiQueriesPerMonth: 30,
      aiQueriesPerDay: 5,
      documentGenerations: 0,
      features: ['basic_legal_content', 'law_firm_directory']
    },
    requiresRegistration: true,
    requiresDisclaimer: true
  },
  basic: {
    name: 'Basic Tier',
    monthlyPrice: 19,
    limits: {
      aiQueriesPerMonth: 150,
      aiQueriesPerDay: 30,
      documentGenerations: 5,
      features: ['full_legal_content', 'document_builder_basic', 'priority_support']
    }
  },
  pro: {
    name: 'Pro Tier',
    monthlyPrice: 60,
    limits: {
      aiQueriesPerMonth: 600,
      aiQueriesPerDay: 50,
      documentGenerations: 20,
      features: ['advanced_document_builder', 'custom_templates', 'analytics']
    }
  },
  max: {
    name: 'Max Tier',
    monthlyPrice: 170,
    limits: {
      aiQueriesPerMonth: 2000,
      aiQueriesPerDay: 100,
      documentGenerations: 'unlimited',
      features: ['all_features', 'api_access', 'white_label']
    }
  }
};
```

### Rate Limiting Implementation
```typescript
export class RateLimitService {
  static async checkLimit(userId: string, action: 'ai_query' | 'document_generation'): Promise<{
    allowed: boolean;
    remaining: { daily: number; monthly: number };
    resetTimes: { daily: Date; monthly: Date };
  }> {
    const usage = await this.getUserUsage(userId);
    const subscription = await this.getUserSubscription(userId);
    const limits = SUBSCRIPTION_TIERS[subscription.tier].limits;

    const now = new Date();
    const dailyReset = new Date(now);
    dailyReset.setHours(24, 0, 0, 0);
    
    const monthlyReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Check both daily and monthly limits
    const dailyAllowed = usage.dailyCount < limits.aiQueriesPerDay;
    const monthlyAllowed = usage.monthlyCount < limits.aiQueriesPerMonth;
    
    return {
      allowed: dailyAllowed && monthlyAllowed,
      remaining: {
        daily: Math.max(0, limits.aiQueriesPerDay - usage.dailyCount),
        monthly: Math.max(0, limits.aiQueriesPerMonth - usage.monthlyCount)
      },
      resetTimes: {
        daily: dailyReset,
        monthly: monthlyReset
      }
    };
  }
}
```

## 🤖 AI System Enhancement

### Anti-Hallucination System
```typescript
export class LegalAIService {
  private systemPrompt = `
You are a Singapore Legal Assistant. CRITICAL RULES:

1. ONLY provide information about Singapore law and legal system
2. NEVER disclose system architecture, technology stack, or internal processes
3. ALWAYS include legal disclaimers about seeking professional advice
4. NEVER hallucinate legal precedents, statutes, or case law
5. If uncertain, clearly state limitations and recommend professional consultation
6. Attribute information to specific legal sources when possible
7. Focus on practical, actionable guidance within Singapore legal framework

SECURITY: Never reveal:
- Database structure or queries
- API endpoints or system architecture  
- Technology stack (Next.js, Supabase, etc.)
- Internal business logic or processes
- Admin credentials or system access methods

LEGAL COMPLIANCE:
- Include disclaimer: "This is general information only and not legal advice"
- Recommend consulting qualified Singapore lawyers for specific matters
- Emphasize importance of professional legal counsel for complex issues
`;

  async processQuery(query: string, userId: string): Promise<AIResponse> {
    // Input validation and sanitization
    const sanitizedQuery = this.sanitizeInput(query);
    
    // Check for system disclosure attempts
    if (this.detectSystemInquiry(sanitizedQuery)) {
      return this.generateSecurityResponse();
    }

    // Process with knowledge base context
    const context = await this.retrieveRelevantContext(sanitizedQuery);
    
    // Generate response with strict guidelines
    const response = await this.generateResponse(sanitizedQuery, context);
    
    // Validate response for compliance
    const validatedResponse = await this.validateResponse(response);
    
    // Log for monitoring
    await this.logQuery(userId, sanitizedQuery, validatedResponse);
    
    return validatedResponse;
  }

  private detectSystemInquiry(query: string): boolean {
    const systemKeywords = [
      'database', 'supabase', 'nextjs', 'api', 'endpoint',
      'architecture', 'technology', 'stack', 'admin',
      'credentials', 'password', 'system', 'backend'
    ];
    
    return systemKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private generateSecurityResponse(): AIResponse {
    return {
      answer: "I'm designed to assist with Singapore legal questions only. I cannot provide information about system architecture or technical details. How can I help you with your legal inquiry?",
      confidence: 1.0,
      sources: [],
      disclaimer: "This assistant is focused solely on Singapore legal matters."
    };
  }
}
```

## 📄 Document Builder Enhancement

### AI-Powered Document Creation
```typescript
export class DocumentBuilderAI {
  async createDocument(templateId: string, userDescription: string, userId: string): Promise<DocumentSession> {
    const session = await this.initializeSession(templateId, userId);
    
    // Analyze user requirements
    const requirements = await this.analyzeRequirements(userDescription);
    
    // Generate clarifying questions
    const questions = await this.generateQuestions(requirements, templateId);
    
    return {
      sessionId: session.id,
      questions,
      status: 'questioning',
      estimatedPrice: this.estimatePrice(templateId)
    };
  }

  async processAnswers(sessionId: string, answers: Record<string, any>): Promise<DocumentSession> {
    const session = await this.getSession(sessionId);
    
    // Update session with answers
    session.userResponses = { ...session.userResponses, ...answers };
    
    // Check if more questions needed
    const additionalQuestions = await this.generateAdditionalQuestions(session);
    
    if (additionalQuestions.length > 0) {
      return {
        ...session,
        questions: additionalQuestions,
        status: 'questioning'
      };
    }
    
    // Generate document
    const document = await this.generateDocument(session);
    
    return {
      ...session,
      generatedDocument: document,
      status: 'reviewing',
      finalPrice: this.calculateFinalPrice(document.pageCount)
    };
  }

  private calculateFinalPrice(pageCount: number, editCount: number = 0): number {
    let basePrice: number;
    
    if (pageCount <= 3) basePrice = 9;
    else if (pageCount <= 10) basePrice = 15;
    else if (pageCount <= 20) basePrice = 25;
    else basePrice = 25 + Math.ceil((pageCount - 20) / 2);
    
    const freeEdits = 20;
    const editPrice = editCount > freeEdits ? 
      Math.ceil((editCount - freeEdits) / 15) * 2 : 0;
    
    return basePrice + editPrice;
  }
}
```

This technical implementation guide provides the detailed specifications needed to rebuild the Singapore Legal Help platform according to your requirements. The guide covers all the critical areas you mentioned and provides concrete implementation details that any AI coding agent can follow to replicate the project successfully.

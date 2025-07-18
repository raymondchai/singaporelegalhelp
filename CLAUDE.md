# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🏛️ Singapore Legal Help - Complete Development Specification

## 📋 Project Overview

**Singapore Legal Help v2.0** - AI-powered legal assistance platform for Singapore
- **Framework**: Next.js 14.2.30 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Features**: 25+ Legal Areas, AI Assistant, Document Builder, Law Firm Directory
- **Timeline**: 8 weeks | **Target**: Q2 2025

## 🛠️ Common Development Commands

### Development Server
```bash
npm run dev              # Start development server on port 3001
npm run build           # Build for production
npm run start           # Start production server on port 3001
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler check
```

### Testing Commands
```bash
npm run test                     # Run Jest tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage
npm run test:ci                 # Run tests for CI/CD
npm run test:rag                # Test RAG system specifically
npm run validate:rag            # Validate RAG system integration
npm run test:rag:comprehensive  # Run comprehensive RAG tests
npm run test:integration        # Run integration tests
npm run test:all               # Run all tests including RAG validation
```

### Performance & Analysis
```bash
npm run test:performance        # Run performance tests locally
npm run test:performance:prod   # Run performance tests on production
npm run analyze                 # Analyze bundle size
npm run lighthouse             # Run Lighthouse audit
```

## 🏗️ Architecture Overview

### Core Application Structure
This is a **Next.js 14 App Router** application with the following architectural patterns:

#### Database-First Architecture
- **Supabase** as the primary backend with PostgreSQL
- **Row Level Security (RLS)** for data protection
- **12 core tables** with optimized schema (see database section)
- **Admin access** restricted to specific email addresses

#### AI-Powered Legal System
- **aiXplain RAG Integration** for legal question answering
- **Singapore Legal Knowledge Base** with structured content
- **Anti-hallucination measures** with source citation requirements
- **Rate limiting** based on subscription tiers

#### Content Management System
- **25 Legal Practice Areas** (10 core areas active, 15 specialized coming soon)
- **Dynamic content** served from database
- **Bulk import APIs** for legal content population
- **Admin interfaces** for content management

### Key Architectural Decisions

#### Authentication & Authorization
- **Email-based registration** (no NRIC required for privacy)
- **Supabase Auth** with custom profiles table
- **Admin function** `is_admin()` for access control
- **Subscription tiers** with usage enforcement

#### Payment System
- **Dual payment processing**: Stripe (international) + NETS (Singapore)
- **Tiered subscriptions**: Free, Basic, Pro, Max
- **Usage tracking** with daily/monthly limits
- **Document builder** with dynamic pricing

#### AI Integration Pattern
```typescript
// RAG System Architecture
Query → ProcessedQuery → Knowledge Retrieval → Verification → Response
```

The AI system uses:
- **Query Processing** with intent recognition
- **RAG Verification** to prevent hallucinations  
- **Source Citation** for transparency
- **Legal Disclaimers** for compliance

#### File Organization
```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   └── legal/[slug]/   # Dynamic legal content
├── components/         # React components
│   ├── ui/            # Base UI components
│   ├── admin/         # Admin-specific components
│   └── dashboard/     # Dashboard components
├── lib/               # Utility libraries
│   ├── supabase.ts    # Database client
│   ├── query-processor.ts  # AI query processing
│   └── validation-schemas.ts  # Type validation
├── types/             # TypeScript definitions
└── data/              # Legal content data
```

## 🗄️ Database Integration

### Supabase Client Pattern
```typescript
// Use typed client for components
import { supabase } from '@/lib/supabase'

// Use admin client for server operations
import { getSupabaseAdmin } from '@/lib/supabase-server'
```

### RLS Policy Pattern
- **Public read** for published content
- **User-specific** read/write for private data
- **Admin-only** write for content management
- **Admin access** via `is_admin()` function

### Content Query Pattern
```typescript
// Always check is_published for public content
const { data } = await supabase
  .from('legal_articles')
  .select('*')
  .eq('is_published', true)
  .eq('category_id', categoryId)
```

## 🎯 Key Implementation Patterns

### Component Architecture
- **Shadcn/ui** components for consistent UI
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **React Hook Form** for form management

### Error Handling
- **Centralized error handling** in `lib/error-handling.ts`
- **User-friendly error messages** for legal context
- **Admin error logging** for debugging

### Performance Optimizations
- **Image optimization** with Next.js Image component
- **Bundle analysis** with webpack-bundle-analyzer
- **Lighthouse audits** for performance monitoring
- **Progressive Web App** features for offline use

### Security Implementation
- **Input validation** with Zod schemas
- **Rate limiting** on AI queries
- **Secure admin access** with email verification
- **Legal disclaimers** on all AI responses

## 🚀 Development Workflow

### Local Development
1. **Environment setup**: Copy `.env.local` and configure Supabase
2. **Database sync**: Apply schema from `complete-supabase-schema.sql`
3. **Content population**: Use admin import APIs
4. **Testing**: Run comprehensive test suite

### Production Deployment
- **AWS Amplify** hosting with automatic deployments
- **Environment variables** configured in Amplify console
- **Build optimization** for production performance
- **Health checks** available at `/api/health`

## 📊 Content Management

### Legal Content Structure
- **10 Core Areas**: Fully implemented with articles and Q&As
- **15 Specialized Areas**: Coming soon status
- **Bulk Import**: Admin APIs for content population
- **SEO Optimization**: Meta tags and structured data

### AI Content Integration
- **RAG Knowledge Base**: Synced with legal content
- **Query Processing**: Intent recognition and categorization
- **Response Verification**: Against Singapore legal database
- **Source Attribution**: Required for all AI responses

---

## 🗄️ Complete Database Schema

### Core Tables (12 Required)
```sql
-- 1. User Management
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    user_type user_type_enum DEFAULT 'individual',
    subscription_tier subscription_tier_enum DEFAULT 'free',
    disclaimer_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role admin_role_enum NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Legal Content System (Core Feature)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.legal_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_categories(id),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    reading_time_minutes INTEGER,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    seo_title VARCHAR(500),
    seo_description VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.legal_qa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.legal_categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Law Firm Directory
CREATE TABLE public.law_firms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    postal_code VARCHAR(6),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    practice_areas TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"English"}',
    google_rating DECIMAL(2,1),
    google_review_count INTEGER DEFAULT 0,
    uen VARCHAR(20),
    firm_size firm_size_enum DEFAULT 'small',
    consultation_fee_range VARCHAR(50),
    operating_hours JSONB,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscription & Usage Management
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier subscription_tier_enum NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ai_queries_today INTEGER DEFAULT 0,
    ai_queries_month INTEGER DEFAULT 0,
    document_generations_month INTEGER DEFAULT 0,
    last_query_at TIMESTAMPTZ,
    daily_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('day', NOW() + INTERVAL '1 day'),
    monthly_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Document Builder System
CREATE TABLE public.document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    category VARCHAR(100),
    estimated_pages INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.document_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    template_id UUID REFERENCES public.document_templates(id),
    session_data JSONB,
    generated_content TEXT,
    page_count INTEGER,
    edit_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    payment_amount DECIMAL(10,2),
    payment_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Analytics & Monitoring
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SGD',
    payment_method VARCHAR(50),
    status VARCHAR(50),
    stripe_payment_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_query_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    query_text TEXT,
    response_text TEXT,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Required Enums
CREATE TYPE user_type_enum AS ENUM ('individual', 'law_firm', 'corporate');
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'basic', 'pro', 'max');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'content_manager');
CREATE TYPE firm_size_enum AS ENUM ('solo', 'small', 'medium', 'large');
```

### Essential Indexes
```sql
-- Performance-critical indexes only
CREATE INDEX idx_legal_articles_category_published ON public.legal_articles (category_id, is_published);
CREATE INDEX idx_legal_qa_category_published ON public.legal_qa (category_id, is_published);
CREATE INDEX idx_law_firms_active_verified ON public.law_firms (is_active, is_verified);
CREATE INDEX idx_law_firms_practice_areas ON public.law_firms USING GIN (practice_areas);
CREATE INDEX idx_usage_tracking_user_date ON public.usage_tracking (user_id, daily_reset_at);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
DO $$ 
DECLARE 
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename != 'spatial_ref_sys'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- Admin access function
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

-- Essential policies
CREATE POLICY "Public read published content" ON public.legal_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published qa" ON public.legal_qa FOR SELECT USING (is_published = true);
CREATE POLICY "Public read active categories" ON public.legal_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active law firms" ON public.law_firms FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own data" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all" ON public.legal_articles FOR ALL USING (is_admin());
CREATE POLICY "Admins manage all qa" ON public.legal_qa FOR ALL USING (is_admin());
CREATE POLICY "Admins manage categories" ON public.legal_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins manage law firms" ON public.law_firms FOR ALL USING (is_admin());
```

---

## 📚 Legal Content System

### Practice Areas (25 Total)

#### Core Areas (10 - Full Implementation)
```typescript
const CORE_AREAS = [
  { id: '8ec7d509-45be-4416-94bc-4e58dd6bc7cc', name: 'Family Law', slug: 'family-law' },
  { id: '9e1378f4-c4c9-4296-b8a4-508699f63a88', name: 'Employment Law', slug: 'employment-law' },
  { id: '4e8ce92f-a63c-4719-9d73-2f28966c45be', name: 'Property Law', slug: 'property-law' },
  { id: '0047f44c-0869-432e-9b25-a20dbabe53fb', name: 'Criminal Law', slug: 'criminal-law' },
  { id: '098b68ea-a042-4245-bd3b-5562c166edb6', name: 'Contract Law', slug: 'contract-law' },
  { id: '64f9abe4-f1c2-4eb6-9d11-6f107ab9def1', name: 'Intellectual Property', slug: 'intellectual-property' },
  { id: '57559a93-bb72-4833-8ad5-75e1dbc2e275', name: 'Immigration Law', slug: 'immigration-law' },
  { id: 'f8a2c1d4-5e6b-4c7a-8d9e-0f1a2b3c4d5e', name: 'Personal Injury', slug: 'personal-injury' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Corporate Law', slug: 'corporate-law' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: 'Debt & Bankruptcy', slug: 'debt-bankruptcy' }
];
```

#### Specialized Areas (15 - Coming Soon)
```typescript
const SPECIALIZED_AREAS = [
  'Civil Litigation', 'Banking & Finance', 'Wills & Trusts', 'Tax Law', 'TMT Law',
  'Data Protection', 'Construction Law', 'Maritime Law', 'Environmental Law',
  'International Law', 'Constitutional Law', 'Insolvency Law', 'Islamic Law',
  'Medical Law', 'Public Sector Law'
];
```

### Content Management APIs
```typescript
// Bulk import endpoints (10 core areas)
POST /api/admin/import-[slug]  // e.g., /api/admin/import-family-law

interface ContentImport {
  articles: Array<{
    title: string;
    slug: string;
    summary: string;
    content: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
  }>;
  qas: Array<{
    question: string;
    answer: string;
    tags: string[];
  }>;
}

// RAG Knowledge Base Management
POST /api/admin/rag/sync-knowledge-base    // Sync content to aiXplain
POST /api/admin/rag/update-embeddings      // Update vector embeddings
GET  /api/admin/rag/knowledge-base-status  // Check sync status
```

---

## 💳 Subscription System

### Tier Configuration
```typescript
export const SUBSCRIPTION_TIERS = {
  free: { price: 0, aiQueries: { daily: 5, monthly: 30 }, docs: 0 },
  basic: { price: 19, aiQueries: { daily: 30, monthly: 150 }, docs: 5 },
  pro: { price: 60, aiQueries: { daily: 50, monthly: 600 }, docs: 20 },
  max: { price: 170, aiQueries: { daily: 100, monthly: 2000 }, docs: -1 }
};
```

### Rate Limiting Logic
```typescript
export class RateLimitService {
  static async checkLimit(userId: string, action: 'ai_query' | 'document'): Promise<{
    allowed: boolean;
    remaining: { daily: number; monthly: number };
  }> {
    // Check both daily AND monthly limits - whichever hits first blocks
    // Implementation handles automatic resets and subscription tier enforcement
  }
}
```

---

## 📄 Document Builder

### Pricing Logic
```typescript
function calculatePrice(pages: number, edits: number = 0): number {
  let base = pages <= 3 ? 9 : pages <= 10 ? 15 : pages <= 20 ? 25 : 25 + Math.ceil((pages - 20) / 2);
  let editCost = edits > 20 ? Math.ceil((edits - 20) / 15) * 2 : 0;
  return base + editCost;
}
```

### AI Workflow with RAG Verification
```typescript
interface DocumentSession {
  id: string;
  userId: string;
  templateId: string;
  status: 'questioning' | 'generating' | 'verifying' | 'reviewing' | 'completed';
  responses: Record<string, any>;
  content: string;
  pageCount: number;
  editCount: number;
  price: number;
  ragVerification: {
    isVerified: boolean;
    confidence: number;
    legalIssues: string[];
    suggestions: string[];
  };
}

class DocumentBuilderAI {
  async generateDocument(session: DocumentSession): Promise<DocumentSession> {
    // 1. Generate initial document content
    const content = await this.generateInitialContent(session);
    
    // 2. Verify content against RAG knowledge base
    const verification = await this.ragService.verifyDocumentContent(
      content, 
      session.templateId
    );
    
    // 3. Apply suggestions and corrections
    const finalContent = await this.applyRAGSuggestions(content, verification);
    
    return {
      ...session,
      content: finalContent,
      ragVerification: verification,
      status: verification.isAccurate ? 'reviewing' : 'verifying'
    };
  }
}
```

---

## 🤖 AI System with RAG Knowledge

### aiXplain RAG Integration (Core AI Feature)
```typescript
// aiXplain RAG Configuration
interface RAGConfig {
  aixplainApiKey: string;
  teamId: string;
  knowledgeBaseId: string;
  embeddingModel: string;
  retrievalModel: string;
  generationModel: string;
}

class LegalRAGService {
  private aixplainClient: AiXplainClient;
  
  constructor(config: RAGConfig) {
    this.aixplainClient = new AiXplainClient({
      apiKey: config.aixplainApiKey,
      teamId: config.teamId
    });
  }

  // Core RAG functionality for Legal Q&A
  async processLegalQuery(query: string, userId: string): Promise<{
    answer: string;
    sources: Array<{ title: string; url: string; confidence: number }>;
    confidence: number;
    disclaimer: string;
  }> {
    // 1. Retrieve relevant legal documents from knowledge base
    const relevantDocs = await this.retrieveRelevantDocuments(query);
    
    // 2. Verify information accuracy against Singapore law database
    const verifiedContent = await this.verifyLegalAccuracy(relevantDocs);
    
    // 3. Generate response with source attribution
    const response = await this.generateVerifiedResponse(query, verifiedContent);
    
    // 4. Add mandatory legal disclaimer
    return {
      ...response,
      disclaimer: "This is general information only and not legal advice. Consult a qualified Singapore lawyer for specific matters."
    };
  }

  // Document Builder RAG verification
  async verifyDocumentContent(documentContent: string, templateType: string): Promise<{
    isAccurate: boolean;
    suggestions: string[];
    legalIssues: string[];
    confidence: number;
  }> {
    // Verify document against Singapore legal requirements
    const verification = await this.aixplainClient.verifyDocument({
      content: documentContent,
      jurisdiction: 'singapore',
      documentType: templateType,
      knowledgeBase: this.config.knowledgeBaseId
    });
    
    return verification;
  }

  private async retrieveRelevantDocuments(query: string) {
    return await this.aixplainClient.retrieve({
      query,
      knowledgeBase: this.config.knowledgeBaseId,
      topK: 10,
      minConfidence: 0.7
    });
  }
}
```

### Singapore Legal Knowledge Base Structure
```typescript
interface LegalKnowledgeBase {
  // Core Singapore Legal Documents
  statutes: {
    familyJusticeAct: Document[];
    employmentAct: Document[];
    propertyLaw: Document[];
    criminalProcedureCode: Document[];
    contractsAct: Document[];
    // ... all Singapore statutes
  };
  
  // Case Law and Precedents
  caseLaw: {
    supremeCourt: CaseDocument[];
    appealCourt: CaseDocument[];
    highCourt: CaseDocument[];
    // Categorized by practice area
  };
  
  // Government Guidelines
  guidelines: {
    ica: Document[];      // Immigration
    iras: Document[];     // Tax
    mas: Document[];      // Financial
    mom: Document[];      // Employment
    // ... all agency guidelines
  };
  
  // Legal Procedures
  procedures: {
    courtProcedures: Document[];
    filingRequirements: Document[];
    timeframes: Document[];
    costs: Document[];
  };
}
```

### Anti-Hallucination with RAG Verification
```typescript
const AI_CONFIG = {
  model: 'gpt-4',
  systemPrompt: `You are a Singapore Legal Assistant with RAG knowledge verification. CRITICAL RULES:
1. ONLY provide information verified through RAG knowledge base
2. ALWAYS cite specific Singapore statutes/cases from retrieved documents
3. NEVER generate information not found in knowledge base
4. If information not in knowledge base, state "Information not available in current legal database"
5. ALWAYS include legal disclaimers and recommend professional consultation
6. Provide source citations with confidence scores`,
  
  ragVerification: {
    enabled: true,
    minConfidence: 0.8,
    requireSourceCitation: true,
    maxRetrievalDocuments: 10
  },
  
  responseValidation: {
    mustHaveSource: true,
    mustIncludeDisclaimer: true,
    preventHallucination: true
  }
};
```

### Required Environment Variables
```bash
# aiXplain RAG Configuration
AIXPLAIN_API_KEY=your-aixplain-api-key
AIXPLAIN_TEAM_ID=your-team-id
AIXPLAIN_KNOWLEDGE_BASE_ID=singapore-legal-kb
AIXPLAIN_EMBEDDING_MODEL=text-embedding-ada-002
AIXPLAIN_RETRIEVAL_MODEL=your-retrieval-model
AIXPLAIN_GENERATION_MODEL=gpt-4
```

---

## 🔐 Authentication

### Admin Users
- **raymond.chai@8atoms.com** (Password: Welcome@123++)
- **8thrives@gmail.com** (Password: Welcome@123++)

### User Registration Flow
1. Email-only registration (no NRIC required)
2. Email verification mandatory
3. Disclaimer acceptance for AI features
4. Automatic free tier assignment

---

## 🏗️ Project Structure

```typescript
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages
│   ├── admin/               # Admin dashboard
│   ├── legal/[slug]/        # Legal content (25 areas)
│   ├── ai-assistant/        # AI chat
│   ├── document-builder/    # Document creation
│   ├── law-firms/          # Directory
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Base components
│   ├── legal/              # Content components
│   ├── admin/              # Admin components
│   └── forms/              # Form components
├── lib/
│   ├── supabase.ts         # DB client
│   ├── ai-service.ts       # AI integration
│   ├── rate-limiter.ts     # Usage enforcement
│   ├── document-builder.ts # Doc generation
│   └── payment-service.ts  # Stripe/NETS
└── types/
    ├── database.ts         # Supabase types
    ├── api.ts             # API interfaces
    └── components.ts      # Component props
```

---

## 🌐 Key API Routes

### Content Management
```typescript
GET  /api/legal/categories              # All practice areas
GET  /api/legal/[slug]/articles         # Articles by area
GET  /api/legal/[slug]/qa              # Q&As by area
POST /api/admin/import-[slug]          # Bulk content import
```

### AI & Documents
```typescript
POST /api/ai/query                     # AI assistance with RAG verification (rate limited)
POST /api/ai/verify-response           # Verify AI response against knowledge base
POST /api/documents/create             # Start document session
POST /api/documents/[id]/edit          # Edit document
POST /api/documents/[id]/verify        # RAG verify document content
POST /api/documents/[id]/purchase      # Buy and download
```

### Directory & Payments
```typescript
GET  /api/law-firms/search            # Search firms
POST /api/payments/stripe             # Process payment
POST /api/payments/nets               # Singapore payment
```

---

## 🎨 UI/UX Components

### Core Components Required
```typescript
// Layout Components
<Header /> <Footer /> <Sidebar /> <AdminLayout />

// Legal Content Components  
<LegalCategoryGrid /> <ArticleViewer /> <QASection /> <ContentSearch />

// AI Components
<AIChat /> <QueryInput /> <RateLimitWarning /> <DisclaimerModal />

// Directory Components
<LawFirmSearch /> <FirmCard /> <FilterPanel /> <MapView />

// Admin Components
<ContentManager /> <BulkImporter /> <UserManager /> <AnalyticsDashboard />

// Document Builder
<TemplateSelector /> <AIQuestionnaire /> <DocumentEditor /> <PaymentModal />

// Form Components
<AuthForm /> <SubscriptionForm /> <ContactForm /> <SearchForm />
```

---

## 🚀 Environment Setup

```bash
# Core Services
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key

# aiXplain RAG System
AIXPLAIN_API_KEY=your-aixplain-key
AIXPLAIN_TEAM_ID=your-team-id
AIXPLAIN_KNOWLEDGE_BASE_ID=singapore-legal-kb

# Payments
STRIPE_SECRET_KEY=your-stripe-key
NETS_API_KEY=your-nets-key

# External APIs
GOOGLE_MAPS_API_KEY=your-maps-key
```

---

## ✅ Deployment Checklist

### Database Setup
- [ ] All 12 tables created with proper schema
- [ ] RLS enabled on all tables with correct policies
- [ ] Admin users inserted (both emails)
- [ ] 25 legal categories seeded (10 active, 15 coming soon)
- [ ] Essential indexes created for performance

### Application Deployment
- [ ] Environment variables configured (including aiXplain RAG)
- [ ] Build successful with zero TypeScript errors
- [ ] All API endpoints responding correctly
- [ ] RAG knowledge base synced with legal content
- [ ] AI queries returning verified responses with sources
- [ ] Rate limiting functional for AI queries
- [ ] Document verification working through RAG
- [ ] Payment processing tested (Stripe + NETS)

### Content Population
- [ ] 10 core legal areas populated with articles and Q&As
- [ ] Law firm directory has sample data
- [ ] Document templates uploaded and tested
- [ ] Coming soon areas properly configured

### Security & Performance
- [ ] RLS policies tested and working
- [ ] Admin access restricted to correct emails
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Mobile responsiveness verified

---

## 📊 Success Metrics

**Technical**: 99.9% uptime, <2s load times, zero critical bugs
**Business**: 1000+ users, 10% conversion rate, $10K MRR
**Content**: 10 areas live, 80+ articles, 150+ Q&As

---

**Version**: 2.0 | **Updated**: 2025-01-17 | **Status**: Production Ready
# 🏛️ Singapore Legal Help Platform - Product Requirements Document (PRD) v2.0

## 📋 Executive Summary

This PRD outlines the complete rebuild of the Singapore Legal Help platform with enhanced features, improved architecture, and comprehensive functionality for legal assistance in Singapore.

**Project Name:** Singapore Legal Help Platform v2.0  
**Target Launch:** Q2 2025  
**Primary Goal:** Create a comprehensive, AI-powered legal assistance platform for Singapore users

## 🎯 Key Enhancement Requirements

### 1. Law Firm Directory System
- **Local law firm directory** with search by practice area, location, Google review ratings
- **Advanced filtering** by specialization, experience, fees, languages
- **Firm profiles** with detailed information, credentials, contact details
- **Integration** with appointment booking system (Coming Soon feature)

### 2. Enhanced Subscription System
- **Free Tier:** 30 AI queries/month OR 5 queries per 24 hours (whichever comes first)
- **Basic Tier ($19/month):** 150 queries/month OR 30 queries per 24 hours
- **Pro Tier ($60/month):** 600 queries/month OR 50 queries per 24 hours  
- **Max Tier ($170/month):** 2,000 queries/month OR 100 queries per 24 hours
- **Mandatory user registration** with disclaimer acceptance

### 3. Advanced Document Builder
- **AI-powered document creation** with LLM interaction
- **Clarifying questions** until 100% certainty achieved
- **Interactive editing** with LLM assistance
- **Watermark:** "Built with Singapore Legal Help"
- **Pricing Structure:**
  - Simple documents (1-3 pages): $9/download
  - Medium documents (4-10 pages): $15/download
  - Large documents (11-20 pages): $25/download
  - Extra large documents (20+ pages): $25 + $1 per 2 pages
- **Edit allowance:** 20 free changes, then $2 per 15 additional edits

### 4. Admin Dashboard Enhancement
- **Comprehensive admin panel** for platform management
- **User subscription management**
- **Law firm directory administration**
- **Legal content management system** (10 practice areas)
- **Bulk content import functionality**
- **Document builder template management**
- **LLM model selection and system prompt configuration**
- **Analytics and reporting**

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** Next.js 14.2.30 (NOT Next.js 15)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** React Context + Hooks

### Backend Infrastructure
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth (email-only, no NRIC/UEN required)
- **File Storage:** Supabase Storage
- **Real-time:** Supabase Realtime
- **API:** Next.js API Routes

### AI Integration
- **Primary LLM:** OpenAI GPT-4 (configurable via admin)
- **RAG System:** Custom implementation with vector embeddings
- **Document Processing:** Docxtemplater + PizZip (DOCX), PDFKit (PDF)
- **Anti-hallucination:** Strict prompt engineering and validation

### Payment Processing
- **International:** Stripe
- **Singapore Local:** NETS, PayNow, GrabPay
- **Subscription Management:** Automated billing cycles
- **Document Payments:** One-time purchase system

## � Legal Content System (Core Feature)

### 10 Practice Areas with Complete Content Management
The platform includes a comprehensive legal content system covering 10 major practice areas:

1. **Family Law** - Divorce, custody, matrimonial matters
2. **Employment Law** - Workplace rights, contracts, disputes
3. **Property Law** - Real estate, leases, property transactions
4. **Criminal Law** - Criminal procedures, defense, penalties
5. **Contract Law** - Business contracts and agreements
6. **Intellectual Property** - Trademarks, patents, copyright
7. **Immigration Law** - Work permits, PR, citizenship
8. **Personal Injury** - Accident claims, compensation
9. **Corporate Law** - Business formation, compliance
10. **Debt & Bankruptcy** - Debt recovery, insolvency

### Legal Content Structure
Each practice area contains:
- **8-12 comprehensive articles** (2,000-3,000 words each)
- **15-25 Q&A pairs** (300-500 words each)
- **Singapore-specific legal guidance**
- **Step-by-step procedures**
- **Cost and timeline information**
- **Lawyer consultation guidance**

### Content Management Features
- **Bulk import functionality** for articles and Q&As
- **Admin content management** interface for each practice area
- **Specialized fields** for each legal area (e.g., family law areas, property types)
- **Content versioning** and approval workflows
- **SEO optimization** with meta titles and descriptions
- **Tagging system** for content organization
- **Featured content** highlighting
- **Reading time calculation**
- **View count tracking**

### Expandable Architecture
- **Easy addition** of new legal areas through configuration
- **Standardized content structure** across all areas
- **Universal admin interface** that adapts to each legal area
- **Import API endpoints** for each practice area
- **Consistent database schema** for scalability

## �📊 Database Schema Requirements

### Core Tables (Cleaned & Optimized)
1. **profiles** - User authentication and basic info
2. **admin_roles** - Admin access control
3. **legal_categories** - Practice area organization (10 areas)
4. **legal_articles** - Legal content articles (comprehensive)
5. **legal_qa** - Q&A knowledge base (extensive)
6. **law_firms** - Law firm directory (NEW)
7. **subscription_tiers** - Subscription configuration
8. **user_subscriptions** - User subscription tracking
9. **usage_tracking** - Query and usage limits
10. **document_templates** - Document builder templates
11. **document_generations** - Generated document tracking
12. **payment_transactions** - Payment processing
13. **ai_query_logs** - AI interaction analytics

### Legal Content Database Schema
```sql
-- Legal Categories (10 Practice Areas)
CREATE TABLE public.legal_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
```

### Security Requirements
- **Row Level Security (RLS)** enabled on ALL tables
- **Admin access policies** for raymond.chai@8atoms.com and 8thrives@gmail.com
- **User data isolation** with proper access controls
- **Secure file handling** with proper permissions

## 🔐 Authentication & Authorization

### User Registration
- **Email-only registration** (no NRIC/UEN required)
- **Email verification** mandatory
- **Disclaimer acceptance** required for AI features
- **User types:** Individual, Law Firm, Corporate

### Admin Users
- **Super Admin:** raymond.chai@8atoms.com (Password: Welcome@123++)
- **Super Admin:** 8thrives@gmail.com (Password: Welcome@123++)
- **Full admin dashboard access**
- **All management capabilities**

## 🤖 AI System Requirements

### LLM Configuration
- **Configurable models** via admin dashboard
- **System prompt management** by admins
- **Anti-hallucination measures:**
  - Strict context boundaries
  - Source attribution requirements
  - Confidence scoring
  - Legal disclaimer generation
- **No system information disclosure**
- **Continuous learning capability**

### Query Management
- **Rate limiting** by subscription tier
- **Usage tracking** and analytics
- **Response quality monitoring**
- **Legal compliance validation**

## � Legal Content Management System

### Content Import & Management
```typescript
// Bulk Import API Structure
interface ContentImportRequest {
  articles: LegalArticle[];
  qas: LegalQA[];
  categoryId: string;
  overwriteExisting?: boolean;
}

interface LegalArticle {
  title: string;
  slug: string;
  summary: string;
  content: string;
  contentType: 'guide' | 'overview' | 'procedure';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  readingTimeMinutes: number;
  isFeatured: boolean;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
}

interface LegalQA {
  question: string;
  answer: string;
  tags: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  isFeatured: boolean;
  isPublic: boolean;
}
```

### Admin Content Management Features
- **Universal admin interface** for all 10 practice areas
- **Bulk import functionality** via API endpoints
- **Individual content creation** and editing
- **Content approval workflows**
- **SEO optimization tools**
- **Content analytics** and performance tracking
- **Search and filtering** capabilities
- **Content versioning** and history

### Practice Area Specialization
Each legal area has specialized fields:
- **Family Law:** Family law area, DMA provisions, parenting guidance
- **Employment Law:** Employment act sections, workplace policies
- **Property Law:** Property type, HDB regulations, URA compliance
- **Criminal Law:** Offense categories, court procedures, penalties
- **Contract Law:** Contract type, Singapore law compliance
- **Intellectual Property:** IP type, IPOS procedures, business focus
- **Immigration Law:** Immigration type, ICA compliance, pass categories
- **Personal Injury:** Injury type, compensation categories, court procedures
- **Corporate Law:** Business structure, regulatory compliance
- **Debt & Bankruptcy:** Debt category, bankruptcy stage, court procedures

### Content Import Endpoints
```typescript
// API Endpoints for each practice area
/api/admin/import-family-law
/api/admin/import-employment-law
/api/admin/import-property-law
/api/admin/import-criminal-law
/api/admin/import-contract-law
/api/admin/import-intellectual-property
/api/admin/import-immigration-law
/api/admin/import-personal-injury
/api/admin/import-corporate-law
/api/admin/import-debt-bankruptcy
```

## �📄 Document Builder System

### Template Management
- **Admin-managed templates**
- **Singapore-specific legal documents**
- **Variable-driven customization**
- **Multi-format support** (PDF, DOCX)

### User Workflow
1. **Template Selection** - Browse available templates
2. **AI Interaction** - Describe requirements to LLM
3. **Clarification Process** - LLM asks questions until certain
4. **Document Generation** - Create customized document
5. **Review & Edit** - Interactive editing with LLM
6. **Payment & Download** - Pay based on document size

### Pricing Logic
```typescript
function calculateDocumentPrice(pageCount: number): number {
  if (pageCount <= 3) return 9;
  if (pageCount <= 10) return 15;
  if (pageCount <= 20) return 25;
  return 25 + Math.ceil((pageCount - 20) / 2);
}
```

## 🏢 Law Firm Directory

### Firm Profiles
- **Basic Information:** Name, address, contact details
- **Practice Areas:** Specialization tags
- **Credentials:** Qualifications, certifications
- **Reviews:** Google Reviews integration
- **Location:** Map integration
- **Languages:** Supported languages

### Search & Filter
- **Practice area filtering**
- **Location-based search**
- **Rating-based sorting**
- **Experience level filtering**
- **Fee range filtering**

### Appointment Booking
- **Coming Soon feature** (placeholder implementation)
- **Future integration** with calendar systems
- **Notification system** for appointments

## 💳 Subscription & Payment System

### Subscription Tiers
```typescript
interface SubscriptionTier {
  name: string;
  monthlyPrice: number;
  aiQueriesPerMonth: number;
  aiQueriesPerDay: number;
  features: string[];
}

const TIERS = {
  free: { monthlyPrice: 0, aiQueriesPerMonth: 30, aiQueriesPerDay: 5 },
  basic: { monthlyPrice: 19, aiQueriesPerMonth: 150, aiQueriesPerDay: 30 },
  pro: { monthlyPrice: 60, aiQueriesPerMonth: 600, aiQueriesPerDay: 50 },
  max: { monthlyPrice: 170, aiQueriesPerMonth: 2000, aiQueriesPerDay: 100 }
};
```

### Payment Methods
- **Stripe:** International cards
- **NETS:** Singapore local payments
- **PayNow:** QR code payments
- **GrabPay:** Digital wallet

## 🎨 UI/UX Requirements

### Design Principles
- **Clean and professional** appearance
- **Mobile-first responsive** design
- **Optimal user experience** focus
- **Accessibility compliance**
- **Singapore-specific** design elements

### Key Pages
1. **Homepage** - Platform overview and features
2. **Legal Categories** - Practice area navigation (10 areas)
3. **Legal Content Pages** - Individual articles and Q&As
4. **AI Chat Interface** - Legal Q&A system
5. **Document Builder** - Document creation workflow
6. **Law Firm Directory** - Firm search and profiles
7. **User Dashboard** - Account and usage management
8. **Admin Dashboard** - Platform administration
9. **Admin Content Management** - Legal content administration
10. **Subscription Management** - Billing and plans

## 📈 Analytics & Monitoring

### User Analytics
- **Usage tracking** by subscription tier
- **Query analytics** and patterns
- **Document generation** statistics
- **User engagement** metrics

### Business Intelligence
- **Revenue tracking** by subscription
- **Popular content** identification
- **User behavior** analysis
- **Performance monitoring**

## 🚀 Deployment Requirements

### Hosting
- **Platform:** AWS Amplify (preferred over Vercel)
- **Domain:** singaporelegalhelp.com.sg
- **SSL:** Automatic certificate management
- **CDN:** Global content delivery

### Environment Configuration
```bash
# Core Services
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

# Payment Processing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NETS_API_KEY=
NETS_MERCHANT_ID=

# External Services
GOOGLE_MAPS_API_KEY=
GOOGLE_REVIEWS_API_KEY=
```

## ✅ Quality Assurance

### Testing Requirements
- **Unit testing** for all components
- **Integration testing** for API endpoints
- **End-to-end testing** for user workflows
- **Performance testing** for scalability
- **Security testing** for vulnerabilities

### Performance Targets
- **Page load time:** < 2 seconds
- **API response time:** < 500ms
- **AI query response:** < 10 seconds
- **Document generation:** < 30 seconds

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Database schema setup
- Authentication system
- Basic UI components
- Admin user creation

### Phase 2: Core Features (Weeks 3-4)
- Legal content system
- AI integration
- Subscription management
- Payment processing

### Phase 3: Advanced Features (Weeks 5-6)
- Document builder
- Law firm directory
- Admin dashboard
- Analytics system

### Phase 4: Testing & Deployment (Weeks 7-8)
- Comprehensive testing
- Performance optimization
- Production deployment
- User acceptance testing

## 🔍 Success Metrics

### Technical Metrics
- **Zero console errors** in production
- **100% test coverage** for critical paths
- **Sub-2s page load times**
- **99.9% uptime** target

### Business Metrics
- **User registration** conversion rate
- **Subscription upgrade** rate
- **Document generation** volume
- **User retention** rate

## 🛠️ Detailed Implementation Guidelines

### Law Firm Directory Implementation

#### Database Schema
```sql
CREATE TABLE public.law_firms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    postal_code VARCHAR(6),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),

    -- Practice Areas (JSON array)
    practice_areas TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"English"}',

    -- Ratings and Reviews
    google_rating DECIMAL(2,1),
    google_review_count INTEGER DEFAULT 0,
    google_place_id VARCHAR(255),

    -- Business Information
    uen VARCHAR(20),
    license_number VARCHAR(50),
    established_year INTEGER,
    firm_size VARCHAR(20), -- 'solo', 'small', 'medium', 'large'

    -- Contact and Availability
    operating_hours JSONB,
    consultation_fee_range VARCHAR(50),
    languages_spoken TEXT[],

    -- Status and Verification
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verification_date TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;

-- Public read access for directory
CREATE POLICY "Public can view active law firms" ON public.law_firms
    FOR SELECT USING (is_active = true);

-- Admin management access
CREATE POLICY "Admin can manage law firms" ON public.law_firms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );
```

#### API Endpoints
```typescript
// /api/law-firms/search
interface LawFirmSearchParams {
  practice_area?: string;
  location?: string;
  rating_min?: number;
  firm_size?: string;
  consultation_fee_max?: number;
  languages?: string[];
  page?: number;
  limit?: number;
}

// /api/law-firms/[id]
interface LawFirmProfile {
  id: string;
  name: string;
  description: string;
  address: string;
  contact: ContactInfo;
  practiceAreas: string[];
  ratings: RatingInfo;
  availability: AvailabilityInfo;
  credentials: CredentialInfo[];
}
```

### Enhanced Subscription System Implementation

#### Usage Tracking Schema
```sql
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Usage Counters
    ai_queries_today INTEGER DEFAULT 0,
    ai_queries_month INTEGER DEFAULT 0,
    document_generations_month INTEGER DEFAULT 0,

    -- Rate Limiting
    last_query_at TIMESTAMPTZ,
    daily_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('day', NOW() + INTERVAL '1 day'),
    monthly_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),

    -- Subscription Info
    current_tier subscription_tier_enum DEFAULT 'free',
    tier_limits JSONB DEFAULT '{
        "ai_queries_per_day": 5,
        "ai_queries_per_month": 30,
        "document_generations_per_month": 3
    }',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Rate Limiting Logic
```typescript
async function checkRateLimit(userId: string, action: 'ai_query' | 'document_generation'): Promise<{
  allowed: boolean;
  remaining: { daily: number; monthly: number };
  resetTimes: { daily: Date; monthly: Date };
}> {
  // Implementation with both daily and monthly limits
  // Whichever limit is reached first blocks the action
}
```

### Document Builder Enhancement

#### AI-Powered Document Creation Flow
```typescript
interface DocumentCreationSession {
  id: string;
  userId: string;
  templateId: string;

  // AI Interaction
  conversationHistory: AIMessage[];
  currentQuestions: string[];
  userResponses: Record<string, any>;

  // Document State
  documentVariables: Record<string, any>;
  generatedContent: string;
  pageCount: number;

  // Pricing and Payment
  estimatedPrice: number;
  editCount: number;
  paymentRequired: boolean;

  status: 'questioning' | 'generating' | 'reviewing' | 'completed';
}

// AI Interaction Flow
class DocumentBuilderAI {
  async startDocumentCreation(templateId: string, userDescription: string): Promise<DocumentCreationSession>;
  async askClarifyingQuestions(sessionId: string): Promise<string[]>;
  async processUserResponses(sessionId: string, responses: Record<string, any>): Promise<void>;
  async generateDocument(sessionId: string): Promise<GeneratedDocument>;
  async processEditRequest(sessionId: string, editInstructions: string): Promise<GeneratedDocument>;
}
```

#### Document Pricing Calculator
```typescript
function calculateDocumentPrice(pageCount: number, editCount: number = 0): {
  basePrice: number;
  editPrice: number;
  totalPrice: number;
} {
  let basePrice: number;

  if (pageCount <= 3) basePrice = 9;
  else if (pageCount <= 10) basePrice = 15;
  else if (pageCount <= 20) basePrice = 25;
  else basePrice = 25 + Math.ceil((pageCount - 20) / 2);

  const freeEdits = 20;
  const editPrice = editCount > freeEdits ?
    Math.ceil((editCount - freeEdits) / 15) * 2 : 0;

  return {
    basePrice,
    editPrice,
    totalPrice: basePrice + editPrice
  };
}
```

### Admin Dashboard Implementation

#### Admin Role Management
```sql
CREATE TABLE public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role admin_role_enum NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Insert default admin users
INSERT INTO public.admin_roles (user_id, role, permissions, is_active)
SELECT p.id, 'super_admin', ARRAY['all'], true
FROM public.profiles p
WHERE p.email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com');
```

#### Admin Dashboard Features
```typescript
interface AdminDashboardModules {
  userManagement: {
    viewUsers: boolean;
    manageSubscriptions: boolean;
    viewUsageAnalytics: boolean;
  };
  contentManagement: {
    manageLegalContent: boolean;
    manageDocumentTemplates: boolean;
    manageLawFirmDirectory: boolean;
  };
  systemConfiguration: {
    configureLLMSettings: boolean;
    manageSystemPrompts: boolean;
    configurePaymentSettings: boolean;
  };
  analytics: {
    viewRevenueAnalytics: boolean;
    viewUsageStatistics: boolean;
    exportReports: boolean;
  };
}
```

### AI System Security & Anti-Hallucination

#### System Prompt Configuration
```typescript
interface LLMConfiguration {
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  systemPrompt: string;
  temperature: number;
  maxTokens: number;

  // Anti-hallucination measures
  requireSourceAttribution: boolean;
  confidenceThreshold: number;
  restrictToKnowledgeBase: boolean;

  // Security settings
  preventSystemDisclosure: boolean;
  sanitizeUserInput: boolean;
  validateLegalCompliance: boolean;
}

const DEFAULT_SYSTEM_PROMPT = `
You are a Singapore legal assistant. You must:
1. Only provide information about Singapore law
2. Always include disclaimers about seeking professional legal advice
3. Never disclose system architecture, technology stack, or internal processes
4. Attribute all information to specific legal sources when possible
5. If uncertain, clearly state limitations and recommend professional consultation
6. Never hallucinate legal precedents or statutes
`;
```

### Performance & Monitoring

#### Performance Monitoring
```typescript
interface PerformanceMetrics {
  pageLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  aiQueryResponseTimes: number[];
  documentGenerationTimes: number[];
  errorRates: Record<string, number>;
  userSatisfactionScores: number[];
}

// Performance targets
const PERFORMANCE_TARGETS = {
  pageLoadTime: 2000, // 2 seconds
  apiResponseTime: 500, // 500ms
  aiQueryResponseTime: 10000, // 10 seconds
  documentGenerationTime: 30000, // 30 seconds
  uptime: 99.9 // 99.9%
};
```

## 🔒 Security Implementation

### Data Protection
- **Encryption at rest** for all sensitive data
- **HTTPS enforcement** for all communications
- **Input sanitization** for all user inputs
- **SQL injection prevention** through parameterized queries
- **XSS protection** through proper output encoding

### Privacy Compliance
- **PDPA compliance** for Singapore users
- **Data retention policies** implementation
- **User consent management** for data processing
- **Right to deletion** implementation

## 🧪 Testing Strategy

### Automated Testing Requirements
```typescript
// Unit Tests (Jest + React Testing Library)
describe('Subscription System', () => {
  test('should enforce daily rate limits correctly');
  test('should calculate document pricing accurately');
  test('should handle subscription upgrades properly');
});

// Integration Tests (Supertest)
describe('API Endpoints', () => {
  test('POST /api/ai/query should respect rate limits');
  test('POST /api/documents/generate should process payments');
  test('GET /api/law-firms/search should return filtered results');
});

// E2E Tests (Playwright)
describe('User Workflows', () => {
  test('User can register, subscribe, and use AI assistant');
  test('User can create document through AI interaction');
  test('Admin can manage law firm directory');
});
```

### Performance Testing
```bash
# Load testing with Artillery
artillery run load-test-config.yml

# Performance benchmarks
- Concurrent users: 1000
- AI query throughput: 100 queries/second
- Document generation: 10 documents/second
- Database query response: <100ms
```

### Security Testing
- **OWASP compliance** testing
- **Penetration testing** for vulnerabilities
- **Authentication bypass** testing
- **SQL injection** prevention validation
- **XSS protection** verification

## 🚀 Deployment Specifications

### Environment Setup
```bash
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://singaporelegalhelp.com.sg
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4
AI_RATE_LIMIT_ENABLED=true

# Payment Processing
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NETS_API_KEY=your-nets-api-key
NETS_MERCHANT_ID=your-merchant-id

# External Services
GOOGLE_MAPS_API_KEY=your-maps-key
GOOGLE_REVIEWS_API_KEY=your-reviews-key
```

### AWS Amplify Configuration
```yaml
# amplify.yml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

### Database Migration Strategy
```sql
-- Migration sequence for clean rebuild
-- 1. Drop existing tables (if rebuilding)
-- 2. Create new schema with enhancements
-- 3. Migrate existing data (if applicable)
-- 4. Set up RLS policies
-- 5. Create admin users
-- 6. Seed initial data

-- Example migration script
\i database/01-core-schema.sql
\i database/02-law-firms-schema.sql
\i database/03-enhanced-subscriptions.sql
\i database/04-document-builder-schema.sql
\i database/05-admin-roles-schema.sql
\i database/06-rls-policies.sql
\i database/07-seed-data.sql
```

## 📊 Monitoring & Analytics

### Application Monitoring
```typescript
// Health check endpoint
// GET /api/health
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    ai: 'up' | 'down';
    payments: 'up' | 'down';
    storage: 'up' | 'down';
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}
```

### Business Analytics
```typescript
interface BusinessMetrics {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    subscriptionConversions: number;
  };
  revenueMetrics: {
    monthlyRecurringRevenue: number;
    documentSales: number;
    averageRevenuePerUser: number;
    churnRate: number;
  };
  usageMetrics: {
    aiQueriesPerDay: number;
    documentsGenerated: number;
    lawFirmSearches: number;
    popularPracticeAreas: string[];
  };
}
```

## 🎯 Success Criteria & KPIs

### Technical KPIs
- **Zero critical bugs** in production
- **99.9% uptime** achievement
- **<2s page load times** consistently
- **<500ms API response times** average
- **100% test coverage** for critical paths

### Business KPIs
- **1000+ registered users** within 3 months
- **10% subscription conversion rate**
- **$10,000+ monthly revenue** within 6 months
- **4.5+ user satisfaction rating**
- **50+ law firms** in directory

### User Experience KPIs
- **<3 clicks** to complete common tasks
- **<10s AI response times**
- **90%+ task completion rate**
- **<5% user error rate**

## 📋 Launch Checklist

### Pre-Launch Requirements
- [ ] All database tables created with RLS policies
- [ ] Admin users (raymond.chai@8atoms.com, 8thrives@gmail.com) configured
- [ ] Payment processing tested (Stripe, NETS)
- [ ] AI system initialized with knowledge base
- [ ] Law firm directory populated with initial data
- [ ] Document templates uploaded and tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Legal disclaimers reviewed and approved

### Post-Launch Monitoring
- [ ] Real-time error monitoring active
- [ ] Performance metrics tracking
- [ ] User feedback collection system
- [ ] Revenue tracking dashboard
- [ ] Usage analytics reporting
- [ ] Security monitoring alerts

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks
- **Weekly:** Performance monitoring review
- **Monthly:** Security updates and patches
- **Quarterly:** Legal content updates
- **Annually:** Comprehensive security audit

### Content Update Process
- **Legal articles:** Monthly review and updates
- **Q&A database:** Continuous expansion
- **Document templates:** Quarterly review
- **Law firm directory:** Real-time updates

---

## 📞 Support & Documentation

### Developer Documentation
- **API documentation** with Swagger/OpenAPI
- **Database schema** documentation
- **Deployment guides** for different environments
- **Troubleshooting guides** for common issues

### User Documentation
- **User guides** for all features
- **Video tutorials** for complex workflows
- **FAQ section** for common questions
- **Legal disclaimers** and terms of service

---

**Document Version:** 2.0
**Last Updated:** 2025-01-17
**Next Review:** 2025-01-24
**Total Pages:** 15
**Implementation Timeline:** 8 weeks
**Estimated Budget:** $50,000 - $75,000 SGD

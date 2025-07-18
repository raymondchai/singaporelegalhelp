# 🚀 Deployment Checklist - Singapore Legal Help v2.0

## 📋 Pre-Deployment Requirements

### 1. Environment Setup
- [ ] **Node.js 18+** installed
- [ ] **Next.js 14.2.30** (NOT 15.x) configured
- [ ] **TypeScript** setup with strict mode
- [ ] **Tailwind CSS** configured
- [ ] **ESLint & Prettier** configured

### 2. Database Setup (Supabase)
- [ ] **New Supabase project** created or existing cleaned
- [ ] **Database schema** deployed from migration files
- [ ] **RLS policies** enabled on ALL tables
- [ ] **Admin users** created (raymond.chai@8atoms.com, 8thrives@gmail.com)
- [ ] **Storage buckets** configured for documents
- [ ] **Database functions** deployed for search and analytics

### 3. External Service Configuration
- [ ] **OpenAI API key** configured for AI features
- [ ] **Stripe account** setup for international payments
- [ ] **NETS merchant account** for Singapore payments
- [ ] **Google Maps API** for law firm locations
- [ ] **Google Reviews API** for firm ratings

## 🗄️ Database Migration Script

```sql
-- Complete database setup script
-- Run in Supabase SQL Editor

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create enums
CREATE TYPE user_type_enum AS ENUM ('individual', 'law_firm', 'corporate');
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'basic', 'pro', 'max');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'admin', 'content_manager');
CREATE TYPE firm_size_enum AS ENUM ('solo', 'small', 'medium', 'large');

-- 3. Core tables
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    user_type user_type_enum DEFAULT 'individual',
    subscription_tier subscription_tier_enum DEFAULT 'free',
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
    google_place_id VARCHAR(255),
    uen VARCHAR(20),
    firm_size firm_size_enum DEFAULT 'small',
    consultation_fee_range VARCHAR(50),
    operating_hours JSONB,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 4. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Profiles: Users can view/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin roles: Only admins can manage
CREATE POLICY "Admins can manage roles" ON public.admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

-- Law firms: Public read, admin write
CREATE POLICY "Public can view active law firms" ON public.law_firms
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage law firms" ON public.law_firms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
        )
    );

-- User subscriptions: Users can view own
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking: Users can view own
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Create admin users function
CREATE OR REPLACE FUNCTION create_admin_users()
RETURNS void AS $$
BEGIN
    -- This will be called after user creation via API
    INSERT INTO public.admin_roles (user_id, role, permissions, is_active)
    SELECT p.id, 'super_admin', ARRAY['all'], true
    FROM public.profiles p 
    WHERE p.email IN ('raymond.chai@8atoms.com', '8thrives@gmail.com')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 7. Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_law_firms_practice_areas ON public.law_firms USING GIN (practice_areas);
CREATE INDEX idx_law_firms_active ON public.law_firms (is_active, is_verified);
CREATE INDEX idx_usage_tracking_user_date ON public.usage_tracking (user_id, daily_reset_at);
```

## 🔧 Environment Variables Setup

```bash
# .env.local (Development)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
AI_SYSTEM_PROMPT="You are a Singapore legal assistant..."

# Payment Processing
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NETS_API_KEY=your-nets-api-key
NETS_MERCHANT_ID=your-merchant-id

# External APIs
GOOGLE_MAPS_API_KEY=your-maps-api-key
GOOGLE_REVIEWS_API_KEY=your-reviews-api-key

# .env.production (Production)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://singaporelegalhelp.com.sg
# ... same variables with production values
```

## 🧪 Testing Checklist

### Unit Tests
- [ ] **Authentication system** tests
- [ ] **Subscription management** tests
- [ ] **Rate limiting** logic tests
- [ ] **Document pricing** calculation tests
- [ ] **AI query processing** tests

### Integration Tests
- [ ] **API endpoints** functionality
- [ ] **Database operations** with RLS
- [ ] **Payment processing** workflows
- [ ] **AI system** integration
- [ ] **File upload/download** operations

### End-to-End Tests
- [ ] **User registration** and login flow
- [ ] **Subscription upgrade** process
- [ ] **AI query** with rate limiting
- [ ] **Document generation** workflow
- [ ] **Law firm search** functionality
- [ ] **Admin dashboard** operations

## 🚀 Deployment Steps

### 1. AWS Amplify Setup
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### 2. Domain Configuration
- [ ] **Domain purchased** (singaporelegalhelp.com.sg)
- [ ] **DNS configured** to point to Amplify
- [ ] **SSL certificate** automatically provisioned
- [ ] **Custom domain** connected in Amplify console

### 3. Admin User Creation
```bash
# Call admin user creation API after deployment
curl -X POST https://singaporelegalhelp.com.sg/api/admin/create-users \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Initial Data Seeding
- [ ] **Legal categories** imported (25+ practice areas)
- [ ] **Core areas** content imported (10 areas with full content)
- [ ] **Coming soon areas** configured (15 specialized areas)
- [ ] **Legal articles** imported (8-12 per core area)
- [ ] **Q&A content** imported (15-25 per core area)
- [ ] **Sample law firms** added
- [ ] **Document templates** uploaded

### 5. Legal Content Import
```bash
# Import content for each practice area
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-family-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-employment-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-property-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-criminal-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-contract-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-intellectual-property
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-immigration-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-personal-injury
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-corporate-law
curl -X POST https://singaporelegalhelp.com.sg/api/admin/import-debt-bankruptcy
```

## 📊 Post-Deployment Verification

### Functionality Tests
- [ ] **User registration** works
- [ ] **Admin login** successful (both admin emails)
- [ ] **Legal content** displays correctly (10 core areas + 15 coming soon)
- [ ] **Coming soon areas** display properly with launch dates
- [ ] **Content search** functions properly
- [ ] **AI queries** respond correctly
- [ ] **Rate limiting** enforces limits
- [ ] **Payment processing** functional
- [ ] **Document generation** works
- [ ] **Law firm search** returns results
- [ ] **Admin content management** functional
- [ ] **Bulk content import** works

### Performance Tests
- [ ] **Page load times** < 2 seconds
- [ ] **API response times** < 500ms
- [ ] **AI query response** < 10 seconds
- [ ] **Database queries** optimized
- [ ] **Image loading** optimized

### Security Tests
- [ ] **RLS policies** working correctly
- [ ] **Admin access** restricted properly
- [ ] **User data** isolated
- [ ] **Payment data** secure
- [ ] **API endpoints** protected

## 🔍 Monitoring Setup

### Application Monitoring
- [ ] **Error tracking** (Sentry or similar)
- [ ] **Performance monitoring** (Vercel Analytics or similar)
- [ ] **Uptime monitoring** (Pingdom or similar)
- [ ] **Log aggregation** (CloudWatch or similar)

### Business Metrics
- [ ] **User registration** tracking
- [ ] **Subscription conversion** metrics
- [ ] **AI query usage** analytics
- [ ] **Document generation** statistics
- [ ] **Revenue tracking** dashboard

## 📞 Support Documentation

### User Guides
- [ ] **Getting started** guide
- [ ] **AI assistant** usage guide
- [ ] **Document builder** tutorial
- [ ] **Law firm search** guide
- [ ] **Subscription management** guide

### Admin Documentation
- [ ] **Admin dashboard** guide
- [ ] **Content management** procedures
- [ ] **User management** guide
- [ ] **System monitoring** procedures
- [ ] **Troubleshooting** guide

---

## ✅ Final Launch Checklist

- [ ] All database tables created with proper RLS
- [ ] Admin users configured and tested
- [ ] Payment systems tested (Stripe + NETS)
- [ ] AI system initialized and responding
- [ ] Law firm directory populated
- [ ] Document templates uploaded
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Legal disclaimers in place
- [ ] User documentation complete
- [ ] Monitoring systems active
- [ ] Backup procedures tested
- [ ] Domain and SSL configured
- [ ] Production environment variables set
- [ ] Error handling implemented
- [ ] Rate limiting functional
- [ ] Mobile responsiveness verified

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Sign-off:** ___________

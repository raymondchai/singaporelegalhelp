# Deployment Guide - Singapore Legal Help Platform

This guide covers the complete deployment process for the Singapore Legal Help platform.

## 🎯 Pre-Deployment Checklist

### 1. Accounts Setup
- [ ] GitHub repository created and configured
- [ ] Vercel account connected to GitHub
- [ ] Supabase project created (Singapore region)
- [ ] Stripe account configured for Singapore
- [ ] NETS merchant account approved
- [ ] aiXplain account with API access
- [ ] Domain registered: singaporelegalhelp.com.sg

### 2. Environment Configuration
- [ ] All environment variables documented
- [ ] Production secrets generated
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] Payment webhooks configured

## 🗄 Supabase Setup

### 1. Create Supabase Project
```bash
# Project Configuration
Project Name: singapore-legal-help-prod
Region: Southeast Asia (Singapore) - ap-southeast-1
Database Password: [Generate secure password]
Pricing Plan: Pro (required for production)
```

### 2. Deploy Database Schema
1. Navigate to Supabase SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Execute the script to create all tables and policies
4. Verify all tables are created with proper RLS policies

### 3. Configure Authentication
1. Go to Authentication > Settings
2. Enable email confirmations
3. Configure email templates
4. Set up custom SMTP (optional)

### 4. Set up Storage (if needed)
1. Create storage buckets for document uploads
2. Configure RLS policies for file access
3. Set up CDN for file delivery

## 💳 Payment Setup

### Stripe Configuration
1. **Create Stripe Account**
   - Business country: Singapore
   - Add SGD as currency
   - Complete business verification

2. **Configure Products and Prices**
   ```bash
   # Create products in Stripe Dashboard
   Basic Plan: $29 SGD/month
   Premium Plan: $99 SGD/month  
   Enterprise Plan: $299 SGD/month
   ```

3. **Set up Webhooks**
   - Endpoint: `https://singaporelegalhelp.com.sg/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.updated`

### NETS Configuration
1. **Register with NETS**
   - Complete merchant application
   - Provide Singapore business documents
   - Wait for approval (2-4 weeks)

2. **Configure API Access**
   - Obtain merchant ID and API credentials
   - Set up webhook endpoint: `https://singaporelegalhelp.com.sg/api/nets/webhook`
   - Test with sandbox environment

## 🤖 aiXplain Setup

### 1. Initialize Legal Knowledge Base
```javascript
// Create Singapore Law Index
const lawIndex = await IndexFactory.create({
  name: "Singapore Law Knowledge Base",
  description: "Comprehensive Singapore legal documents and statutes",
  embedding_model: "OPENAI_ADA002"
});
```

### 2. Upload Legal Documents
- Singapore Statutes
- Case law database
- Legal precedents
- Regulatory guidelines

### 3. Configure Legal Assistant Agent
```javascript
const legalAgent = await AgentFactory.create({
  name: "Singapore Legal Assistant",
  description: "Expert in Singapore law and legal procedures",
  tools: [lawIndex]
});
```

## 🚀 Vercel Deployment

### 1. Connect Repository
1. Go to Vercel dashboard
2. Import project from GitHub
3. Select `singapore-legal-help` repository

### 2. Configure Build Settings
```bash
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
Node.js Version: 18.x
```

### 3. Environment Variables
Add all production environment variables in Vercel dashboard:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME=Singapore Legal Help
NEXT_PUBLIC_APP_URL=https://singaporelegalhelp.com.sg
NEXT_PUBLIC_ENVIRONMENT=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Your Service Role Key]

# Payment Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Live Stripe Publishable Key]
STRIPE_SECRET_KEY=[Live Stripe Secret Key]
STRIPE_WEBHOOK_SECRET=[Stripe Webhook Secret]

# NETS Configuration
NETS_MERCHANT_ID=[NETS Merchant ID]
NETS_SECRET_KEY=[NETS Secret Key]

# aiXplain Configuration
AIXPLAIN_API_KEY=[aiXplain API Key]
AIXPLAIN_TEAM_ID=[aiXplain Team ID]

# Security
NEXTAUTH_SECRET=[Generate strong secret]
NEXTAUTH_URL=https://singaporelegalhelp.com.sg
```

### 4. Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Verify deployment at generated URL

## 🌐 Domain Configuration

### 1. DNS Setup
Configure the following DNS records at your domain registrar:

```dns
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 300

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

### 2. Vercel Domain Setup
1. Go to Vercel project → Settings → Domains
2. Add domain: `singaporelegalhelp.com.sg`
3. Add domain: `www.singaporelegalhelp.com.sg`
4. Set `singaporelegalhelp.com.sg` as primary domain
5. Wait for SSL certificate provisioning

## 🔒 Security Configuration

### 1. Database Security
- [ ] RLS policies enabled on all tables
- [ ] Service role key secured
- [ ] Database backups configured
- [ ] Connection pooling enabled

### 2. API Security
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Webhook signatures verified
- [ ] Environment variables secured

### 3. Application Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Content Security Policy set
- [ ] XSS protection enabled

## 📊 Monitoring Setup

### 1. Application Monitoring
- **Vercel Analytics** - Built-in performance monitoring
- **Error Tracking** - Set up Sentry or similar
- **Uptime Monitoring** - Configure status checks

### 2. Database Monitoring
- **Supabase Dashboard** - Database performance metrics
- **Query Performance** - Monitor slow queries
- **Connection Monitoring** - Track connection usage

### 3. Payment Monitoring
- **Stripe Dashboard** - Payment success rates
- **NETS Dashboard** - Local payment metrics
- **Revenue Tracking** - Subscription analytics

## 🧪 Post-Deployment Testing

### 1. Functionality Tests
- [ ] User registration and login
- [ ] Payment processing (test mode)
- [ ] AI Q&A responses
- [ ] Document upload and analysis
- [ ] Email notifications

### 2. Performance Tests
- [ ] Page load speeds < 2s
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] API response times

### 3. Security Tests
- [ ] Authentication flows
- [ ] Authorization checks
- [ ] Data access controls
- [ ] Payment security

## 🚨 Rollback Plan

### Emergency Rollback
1. **Vercel Rollback**
   - Go to Vercel deployments
   - Select previous stable deployment
   - Click "Promote to Production"

2. **Database Rollback**
   - Use Supabase point-in-time recovery
   - Restore to last known good state
   - Update application if schema changes

3. **DNS Rollback**
   - Point domain to maintenance page
   - Communicate with users
   - Fix issues and redeploy

## 📞 Go-Live Process

### 1. Soft Launch (Internal Testing)
- [ ] Deploy to production
- [ ] Test all features with real data
- [ ] Verify payment processing
- [ ] Check AI responses

### 2. Beta Launch (Limited Users)
- [ ] Invite beta users
- [ ] Monitor performance
- [ ] Collect feedback
- [ ] Fix critical issues

### 3. Public Launch
- [ ] Marketing announcement
- [ ] Monitor traffic spikes
- [ ] Scale resources if needed
- [ ] Provide user support

## 📋 Maintenance

### Regular Tasks
- [ ] Monitor application performance
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Backup verification
- [ ] Payment reconciliation

### Monthly Tasks
- [ ] Performance optimization
- [ ] Security updates
- [ ] Feature usage analysis
- [ ] Cost optimization
- [ ] User feedback review

---

**Deployment completed successfully! 🎉**

For support during deployment:
- Email: tech@singaporelegalhelp.com.sg
- Emergency: +65 6123 4567

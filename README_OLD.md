# Singapore Legal Help Platform

AI-powered legal assistance platform specifically designed for Singapore law matters. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🎯 Project Overview

**Complete clean rebuild from scratch** - Modern, scalable legal assistance platform.

### Final Architecture
- **Domain:** singaporelegalhelp.com.sg
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Singapore region)
- **Hosting:** Vercel
- **Payments:** Stripe + NETS integration
- **AI/RAG:** aiXplain integration
- **Repository:** https://github.com/raymondchai/singaporelegalhelp.git

## 🚀 Features

### Core Features
- **AI-Powered Legal Q&A** - Instant answers to Singapore law questions
- **Document Analysis** - Upload and analyze legal documents with AI insights
- **Expert Consultation** - Connect with qualified Singapore lawyers
- **Multi-tier Subscriptions** - Flexible pricing plans for different needs
- **Secure Authentication** - User profiles with role-based access
- **Payment Processing** - Stripe and NETS integration for Singapore market

### Legal Practice Areas
- Business Law
- Employment Law
- Property Law
- Family Law
- Criminal Law
- Intellectual Property
- Immigration Law
- Tax Law

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Secure data access
- **Authentication** - Built-in auth with email/password

### Payments
- **Stripe** - International payment processing
- **NETS** - Singapore local payment methods

### AI & Analytics
- **aiXplain** - RAG system for legal document processing
- **Legal Knowledge Base** - Singapore law database

## 📋 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- NETS merchant account (for local payments)
- aiXplain account (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/raymondchai/singaporelegalhelp.git
   cd singapore-legal-help
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your actual values:
   ```env
   # App Configuration
   NEXT_PUBLIC_APP_NAME=Singapore Legal Help
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENVIRONMENT=development

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-singapore-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Payment Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

   # NETS Configuration
   NETS_MERCHANT_ID=your-nets-merchant-id
   NETS_SECRET_KEY=your-nets-secret-key

   # aiXplain Configuration
   AIXPLAIN_API_KEY=your-aixplain-api-key
   AIXPLAIN_TEAM_ID=your-team-id

   # Security
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   - Create a new Supabase project in Singapore region
   - Run the SQL schema from `supabase-schema.sql`
   - Enable Row Level Security policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

The application uses the following optimized tables (cleaned up 2025-07-04):

- **profiles** - User profiles and subscription information
- **legal_categories** - Legal practice area categories and navigation
- **legal_qa_categories** - Legal Q&A categorization system
- **payment_transactions** - Payment processing records
- **legal_documents** - Storage bucket for uploaded legal documents

See `FINAL_DATABASE_SCHEMA.md` for the complete current database structure.

## 💳 Payment Integration

### Stripe (International)
- Credit/debit card payments
- Subscription management
- Webhook handling for payment events

### NETS (Singapore Local)
- PayNow integration
- Local bank transfers
- Singapore-specific payment methods

## 🤖 AI Integration

### aiXplain RAG System
- Legal document processing and indexing
- Singapore law knowledge base
- Contextual Q&A responses
- Document analysis and insights

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **PDPA Compliance** - Singapore data protection compliance
- **Secure Authentication** - Email/password with session management
- **API Rate Limiting** - Protection against abuse
- **Environment Variables** - Secure configuration management

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Accessible UI components
- Dark/light theme support

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Domain Configuration
- Set up custom domain: singaporelegalhelp.com.sg
- Configure DNS records
- Enable automatic HTTPS

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build test
npm run build

# Linting
npm run lint
```

## 📊 Monitoring

- **Vercel Analytics** - Performance monitoring
- **Supabase Dashboard** - Database metrics
- **Stripe Dashboard** - Payment analytics
- **Error Tracking** - Application error monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@singaporelegalhelp.com.sg
- Phone: +65 6123 4567

## 🔄 Version History

- **v0.1.0** - Initial release with core features
- Authentication system
- Payment integration
- AI-powered legal assistance
- Responsive design

---

**Built with ❤️ for Singapore's legal community**

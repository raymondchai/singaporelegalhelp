# 🇸🇬 Singapore Legal Help Platform

> **A comprehensive AI-powered legal assistance platform built specifically for Singapore's legal landscape**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-purple?style=for-the-badge)](https://web.dev/progressive-web-apps/)

## 🎯 **Project Overview**

Singapore Legal Help is a modern, AI-powered legal assistance platform designed to democratize access to legal information and services in Singapore. Built with cutting-edge web technologies, it provides comprehensive legal guidance across all major practice areas in Singapore.

### 🌟 **Key Highlights**
- **🤖 AI-Powered Legal Assistant** - RAG-based legal guidance with Singapore-specific knowledge
- **📱 Progressive Web App** - Mobile-first design with offline capabilities  
- **🏛️ 10 Legal Practice Areas** - Comprehensive coverage of Singapore law
- **🔐 Secure Authentication** - NRIC/UEN validation and user management
- **💳 Dual Payment System** - Stripe (international) + NETS (Singapore)
- **📊 Real-time Content Management** - Dynamic legal content system

---

## 🚀 **Features**

### 🏛️ **Legal Practice Areas**
| Practice Area | Coverage | Status |
|---------------|----------|--------|
| **Family Law** | Divorce, Custody, Adoption | ✅ Complete |
| **Employment Law** | Rights, Disputes, Work Passes | ✅ Complete |
| **Property Law** | HDB, Private Property, Rentals | ✅ Complete |
| **Contract Law** | Business Agreements, Disputes | ✅ Complete |
| **Criminal Law** | Defense, Court Procedures | ✅ Complete |
| **Immigration Law** | Work Passes, PR Applications | ✅ Complete |
| **Corporate Law** | Business Formation, Compliance | 🔄 In Progress |
| **Intellectual Property** | Patents, Trademarks | 🔄 In Progress |
| **Personal Injury** | Claims, Compensation | 📅 Planned |
| **Debt & Bankruptcy** | Recovery, Insolvency | 📅 Planned |

### 👥 **User Management System**
- **User Types**: Individual, Law Firm, Corporate
- **Subscription Tiers**: Free, Basic, Premium, Enterprise  
- **Authentication**: Singapore NRIC/UEN validation
- **Profile Management**: Comprehensive user profiles
- **Document Storage**: Secure file upload and management

### 🤖 **AI Integration (Ready)**
- **aiXplain RAG API** - Framework ready for implementation
- **Singapore Legal Knowledge Base** - Structured for AI training
- **Context-Aware Responses** - Legal domain-specific AI
- **Citation Tracking** - Source references and accuracy

### 📱 **Progressive Web App**
- **Offline Functionality** - Core features work without internet
- **Push Notifications** - Legal deadline reminders
- **Install Prompts** - Native app-like experience
- **Background Sync** - Automatic data synchronization

---

## 🛠 **Technology Stack**

### **Frontend Architecture**
```
Next.js 14.2.30 (App Router)
├── TypeScript 5.0          # Type-safe development
├── Tailwind CSS 3.4        # Utility-first styling
├── Radix UI                 # Accessible components
├── Lucide React            # Beautiful icons
└── React Hook Form         # Form management
```

### **Backend & Database**
```
Supabase (Backend-as-a-Service)
├── PostgreSQL              # Primary database
├── Authentication          # User management
├── Row Level Security      # Data protection
├── File Storage           # Document management
└── Real-time Updates      # Live data sync
```

### **PWA & Performance**
```
Progressive Web App
├── next-pwa               # Service worker integration
├── Workbox               # Advanced caching
├── Web App Manifest      # Native app features
└── Offline Support       # Core functionality offline
```

### **Payment Integration**
```
Dual Payment System
├── Stripe                # International payments
└── NETS                  # Singapore local payments
```

---

## 🗄 **Database Architecture**

### **Optimized Schema (5 Core Tables)**
```sql
📊 Database Structure (Post-Cleanup 2025-07-04)
├── profiles              # User authentication & profiles
├── legal_categories      # Practice area navigation  
├── legal_articles        # Comprehensive legal content
├── legal_qa             # Q&A knowledge base
└── payment_transactions  # Payment processing
```

### **Content Management System**
- **21+ Legal Articles** - Comprehensive Singapore legal guides
- **18+ Q&A Pairs** - Frequently asked legal questions
- **Real-time Content** - Database-driven content delivery
- **Admin Interface** - Content management dashboard

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### **Quick Setup**
```bash
# 1. Clone the repository
git clone https://github.com/raymondchai/singaporelegalhelp.git
cd singaporelegalhelp

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run the development server
npm run dev
```

### **Environment Variables**
Create a `.env.local` file with the following variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# NETS Configuration (Singapore)
NETS_MERCHANT_ID=your_nets_merchant_id
NETS_SECRET_KEY=your_nets_secret_key

# aiXplain Configuration (Optional)
AIXPLAIN_API_KEY=your_aixplain_api_key
AIXPLAIN_TEAM_ID=your_aixplain_team_id
```

---

## 🌐 **AWS Amplify Deployment**

### **Current Status**
- ✅ **Live on AWS Amplify**: [https://main.d2s0gf51rcbiy5.amplifyapp.com/](https://main.d2s0gf51rcbiy5.amplifyapp.com/)
- ✅ **Build Configuration**: Optimized for AWS Amplify hosting
- ✅ **Singapore Region**: Deployed in ap-southeast-1 for optimal performance
- 🎯 **Custom Domain**: Setup guide available in `AWS_AMPLIFY_DOMAIN_SETUP.md`

### **AWS Deployment Features**
- **Auto-scaling**: Handles traffic spikes automatically
- **Global CDN**: AWS CloudFront for fast content delivery
- **SSL/TLS**: Automatic HTTPS with AWS Certificate Manager
- **CI/CD**: Automatic deployments from GitHub commits
- **Monitoring**: AWS CloudWatch integration for performance tracking

### **Verification Commands**
```powershell
# Windows PowerShell
.\scripts\verify-aws-deployment.ps1

# Or test manually
curl https://main.d2s0gf51rcbiy5.amplifyapp.com/api/health
```

---

## 📊 **Project Status**

### **Development Phases**
- ✅ **Phase 1**: Foundation Testing & Stabilization
- 🔄 **Phase 2**: Core Features Implementation (Current)
- 📅 **Phase 3**: PWA Advanced Features
- 📅 **Phase 4**: aiXplain RAG Integration
- 📅 **Phase 5**: Advanced Platform Features
- 📅 **Phase 6**: Production Deployment

### **Current Achievements**
- ✅ Database cleanup and optimization
- ✅ Legal content structure implementation
- ✅ Real content population (21+ articles, 18+ Q&As)
- ✅ Database-driven content system
- ✅ Admin content management interface
- ✅ PWA infrastructure setup
- ✅ Authentication system
- ✅ Payment integration framework

---

## 🤝 **Contributing**

We welcome contributions to improve Singapore Legal Help! Please read our contributing guidelines and submit pull requests for any improvements.

### **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure mobile-first responsive design
- Write comprehensive tests
- Follow Singapore legal compliance requirements

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 **Links**

- **Live Demo**: [https://main.d2s0gf51rcbiy5.amplifyapp.com/](https://main.d2s0gf51rcbiy5.amplifyapp.com/) (AWS Amplify)
- **Target Domain**: [https://www.singaporelegalhelp.com.sg](https://www.singaporelegalhelp.com.sg) (Setup in progress)
- **Documentation**: See `/docs` folder
- **Database Schema**: `FINAL_DATABASE_SCHEMA.md`
- **AWS Deployment Guide**: `AWS_AMPLIFY_DOMAIN_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`

---

## 📞 **Support**

For support and questions:
- Create an issue on GitHub
- Email: [Your Contact Email]
- Documentation: Check the `/docs` folder

---

**Built with ❤️ for Singapore's legal community**

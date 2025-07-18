# Singapore Legal Help - Project Context for Claude

## Project Overview
Singapore Legal Help is a comprehensive AI-powered legal assistance platform built specifically for Singapore's legal landscape.

## Technology Stack
- **Frontend**: Next.js 14.2.30 (App Router), TypeScript 5.0, Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **PWA**: next-pwa, Workbox for offline functionality
- **Payments**: Stripe (international) + NETS (Singapore)

## Project Structure
```
singapore-legal-help/
├── src/app/              # Next.js App Router pages
├── src/components/       # React components
├── src/lib/             # Utilities and configurations
├── src/styles/          # Global styles
├── public/              # Static assets
├── supabase/            # Database migrations and types
└── docs/                # Documentation
```

## Database Schema (5 Core Tables)
- `profiles` - User authentication & profiles
- `legal_categories` - Practice area navigation
- `legal_articles` - Comprehensive legal content
- `legal_qa` - Q&A knowledge base
- `payment_transactions` - Payment processing

## Current Development Focus
- Phase 2: Core Features Implementation
- Completed: Database optimization, content system, PWA setup
- In Progress: Corporate Law, IP Law sections
- Next: aiXplain RAG integration

## Key Features
- 10 Legal Practice Areas (6 complete, 2 in progress, 2 planned)
- User Management (Individual, Law Firm, Corporate types)
- AI-ready architecture for legal guidance
- Progressive Web App with offline capabilities
- Dual payment system (Stripe + NETS)

## Development Guidelines
- Mobile-first responsive design
- TypeScript best practices
- Tailwind CSS for styling
- Singapore legal compliance requirements
- Supabase Row Level Security for data protection

## Important Files
- `.env.local` - Environment variables (Supabase, Stripe, NETS keys)
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js and PWA configuration
- `FINAL_DATABASE_SCHEMA.md` - Complete database documentation

## Common Tasks
- Run development: `npm run dev`
- Build for production: `npm run build`
- Run tests: `npm test`
- Database migrations: Check `supabase/migrations/`

## Notes for Claude
- This is a Singapore-specific legal platform
- All content must comply with Singapore law
- User data security is paramount
- Focus on user-friendly legal information access
- Progressive enhancement for offline functionality
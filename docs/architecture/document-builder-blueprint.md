# 📄 Document Builder Architecture Blueprint

## Overview
The Document Builder is a comprehensive document automation system specifically designed for Singapore's legal landscape. It enables users to create, customize, and download professional legal documents with Singapore-specific compliance features.

> **Implementation Status**: ✅ COMPLETE  
> **Full Implementation Details**: [LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md](../../LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md)  
> **Architecture Decision Record**: [ADR-0012](./decisions/0012-document-builder-implementation.md)

## System Components

### Database Schema
```
legal_document_templates    -- Template metadata and configuration
template_content           -- File content and processing status  
template_variables         -- Reusable variable library
template_usage            -- Analytics and usage tracking
```

For complete schema details, see [legal-document-builder-schema.sql](../../database/legal-document-builder-schema.sql)

### API Endpoints
- **`/api/admin/templates`** - Template CRUD operations
- **`/api/admin/variables`** - Variable management
- **`/api/admin/templates/generate`** - Document generation
- **`/api/admin/seed-templates`** - Sample data seeding

### User Interface
- **`/document-builder`** - Template browser and discovery
- **`/document-builder/[templateId]`** - Template customization and generation
- **`/admin/templates`** - Admin template management
- **`/admin/seed-data`** - Database seeding utility

## Data Flow

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│  User       │────▶│ Template Browser │────▶│ Template      │
│  Interface  │     │ /document-builder│     │ Selection     │
└─────────────┘     └─────────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Document   │◀────│ Document         │◀────│ Form          │
│  Download   │     │ Generation       │     │ Customization │
└─────────────┘     └─────────────────┘     └───────────────┘
```

> **Interactive Diagram**: For a more detailed interactive diagram, see the [Document Builder Flow Diagram](https://miro.com/app/board/document-builder-flow/) (requires Miro access)

## Integrations

### Authentication System
- User authentication required for document access
- Subscription tier validation for premium templates
- Admin-specific interfaces for template management

### Storage System
- Template files stored in Supabase storage
- Generated documents temporarily stored for download
- Secure file handling with proper access controls

### Payment System
- Integration with subscription tiers
- Premium templates accessible based on subscription level
- Pay-per-document option for specific templates

## Security & Compliance

- Row Level Security (RLS) for all database tables
- Singapore-specific validation (NRIC, UEN, phone formats)
- PDPA compliance for user data handling
- Comprehensive input validation and sanitization

## Sample Templates Implemented

The system launched with 6 legal document templates:
1. Employment Contract Template (Basic tier)
2. HDB Tenancy Agreement (Free tier)
3. Non-Disclosure Agreement (Free tier)
4. Service Agreement Template (Basic tier)
5. Will and Testament Template (Premium tier)
6. Power of Attorney Form (Basic tier)

For complete details on implemented templates, see [LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md](../../LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md#sample-data-seeded).

## Future Enhancements

- Template library expansion with more Singapore-specific documents
- Conditional logic for advanced document customization
- E-signature integration for document finalization
- Legal review services integration
- Advanced analytics for template usage patterns

## Related Documentation
- [Document Builder Technical Implementation](../../LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md#technical-implementation)
- [Document Builder Database Schema](../../database/legal-document-builder-schema.sql)
- [Document Builder User Experience](../../LEGAL-DOCUMENT-BUILDER-COMPLETION-SUMMARY.md#user-experience-features)

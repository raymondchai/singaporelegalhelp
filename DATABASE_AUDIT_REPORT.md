# DATABASE USAGE AUDIT REPORT
## Singapore Legal Help Platform
**Date:** 2025-07-04  
**Database:** Supabase Project (ooqhzdavkjlyjxqrhkwt)

---

## ✅ ACTIVELY USED TABLES:

### 1. **legal_categories**
- **Used in:** 
  - `src/app/debug/page.tsx` (line 22)
  - `src/app/demo/page.tsx` (lines 245, 289)
  - `src/app/legal-categories/[slug]/page.tsx` (line 106)
  - `src/app/legal-categories/page.tsx` (line 70)
  - `src/components/LegalCategories.tsx` (line 40)
- **Operations:** SELECT
- **Purpose:** Core legal practice areas display and navigation
- **Status:** ✅ CRITICAL - Heavily used across multiple components

### 2. **profiles**
- **Used in:**
  - `src/app/api/nets/payment/route.ts` (line 27)
  - `src/app/api/nets/webhook/route.ts` (lines 88, 135)
  - `src/app/api/stripe/checkout/route.ts` (line 26)
  - `src/app/test-supabase/page.tsx` (lines 41, 121)
  - `src/components/AuthSystemTester.tsx` (lines 126, 174)
  - `src/contexts/auth-context.tsx` (line 27)
  - `src/lib/auth.ts` (lines 47, 61)
- **Operations:** SELECT, INSERT, UPDATE
- **Purpose:** User profile management and authentication
- **Status:** ✅ CRITICAL - Core authentication system

### 3. **payment_transactions**
- **Used in:**
  - `src/app/api/nets/payment/route.ts` (line 51)
  - `src/app/api/nets/webhook/route.ts` (lines 47, 64, 99, 115, 127)
  - `src/app/api/stripe/checkout/route.ts` (line 50)
  - `src/app/api/stripe/webhook/route.ts` (lines 68, 85, 95)
- **Operations:** SELECT, INSERT, UPDATE
- **Purpose:** Payment processing and transaction tracking
- **Status:** ✅ CRITICAL - Payment system functionality

### 4. **legal_qa_categories**
- **Used in:**
  - `src/app/test-supabase/page.tsx` (line 75)
- **Operations:** SELECT
- **Purpose:** Q&A categorization system
- **Status:** ✅ ACTIVE - Used in testing/demo

---

## ❓ POTENTIALLY UNUSED TABLES:

### 1. **user_profiles**
- **Code References:** ❌ NONE FOUND
- **Analysis:** Potential duplicate of 'profiles' table
- **Data Check Required:** Need to verify if contains unique data
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

### 2. **chat_messages**
- **Code References:** ❌ NONE FOUND
- **Analysis:** Chat functionality not implemented in current codebase
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

### 3. **chat_sessions**
- **Code References:** ❌ NONE FOUND
- **Analysis:** Chat functionality not implemented in current codebase
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

### 4. **legal_content**
- **Code References:** ❌ NONE FOUND (except demo table list)
- **Analysis:** Contains 3 sample legal articles but no active code usage
- **Data:** 3 records with valuable sample content (divorce, employment, property)
- **Recommendation:** 🔄 EXPORT DATA FIRST, then DELETE table

### 5. **legal_documents** (Storage Bucket)
- **Code References:** ✅ Found in `src/app/test-supabase/page.tsx` (line 148, 154)
- **Analysis:** Storage bucket, not table - used for file operations
- **Recommendation:** ✅ KEEP - Storage functionality

### 6. **legal_qa_questions**
- **Code References:** ❌ NONE FOUND
- **Analysis:** Q&A questions table not actively used
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

### 7. **user_queries**
- **Code References:** ❌ NONE FOUND (except demo table list)
- **Analysis:** Referenced in demo but no actual usage found
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

### 8. **user_subscriptions**
- **Code References:** ❌ NONE FOUND
- **Analysis:** Subscription functionality not implemented
- **Recommendation:** 🗑️ CANDIDATE FOR DELETION

---

## 🔄 DUPLICATE/REDUNDANT ANALYSIS:

### **profiles vs user_profiles**
- **profiles:** Actively used across authentication system
- **user_profiles:** No code references found
- **Analysis:** Likely duplicate or legacy table
- **Recommendation:** DELETE user_profiles, KEEP profiles

---

## 📊 SUMMARY:

**Total Tables:** 12  
**Actively Used:** 4 tables  
**Candidates for Deletion:** 7 tables  
**Storage Buckets:** 1 (legal-documents)

**Tables to DELETE:**
1. user_profiles
2. chat_messages  
3. chat_sessions
4. legal_content
5. legal_qa_questions
6. user_queries
7. user_subscriptions

**Tables to KEEP:**
1. legal_categories ✅
2. profiles ✅
3. payment_transactions ✅
4. legal_qa_categories ✅

**Storage Buckets to KEEP:**
1. legal-documents ✅

# Storage Buckets Setup Guide

## Bucket 1: legal-documents

**Configuration:**
```
Bucket Name: legal-documents
Public: No (Private)
File Size Limit: 50MB (52,428,800 bytes)
```

**Allowed MIME Types:**
```
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
text/plain
text/csv
image/jpeg
image/png
image/webp
```

**Folder Structure:**
```
legal-documents/
├── {user_id}/
│   ├── contracts/
│   ├── agreements/
│   ├── legal-forms/
│   ├── evidence/
│   └── correspondence/
```

**File Naming Convention:**
```
{user_id}/{category}/{timestamp}_{original_filename}
Example: 123e4567-e89b-12d3-a456-426614174000/contracts/1703123456789_employment_contract.pdf
```

## Bucket 2: profile-images

**Configuration:**
```
Bucket Name: profile-images
Public: No (Private)
File Size Limit: 5MB (5,242,880 bytes)
```

**Allowed MIME Types:**
```
image/jpeg
image/jpg
image/png
image/webp
image/gif
```

**Folder Structure:**
```
profile-images/
├── {user_id}/
│   ├── avatar.jpg
│   └── thumbnails/
│       └── avatar_thumb.jpg
```

**File Naming Convention:**
```
{user_id}/avatar.{extension}
{user_id}/thumbnails/avatar_thumb.{extension}
```

## Storage Policies SQL

Run this in Supabase SQL Editor after creating buckets:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Legal documents policies
CREATE POLICY "Users can upload legal documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'legal-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own legal documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'legal-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own legal documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'legal-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own legal documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'legal-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Profile images policies
CREATE POLICY "Users can upload profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own profile images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## File Upload Helper Functions

Add these to your application:

```typescript
// File validation
export function validateFile(file: File, type: 'document' | 'image'): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const imageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  const allowedTypes = type === 'document' ? documentTypes : imageTypes;
  const maxSize = type === 'document' ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB or 5MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

// Generate file path
export function generateFilePath(userId: string, category: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${category}/${timestamp}_${sanitizedFileName}`;
}
```

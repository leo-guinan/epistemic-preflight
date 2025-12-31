# Client-Side Direct Upload Flow

## Overview

To bypass Vercel's 4.5MB request body limit on the hobby plan, files are uploaded **directly from the client to Supabase Storage**, completely bypassing Vercel's API routes.

## Flow Diagram

```
Client (Browser)
  │
  ├─> 1. POST /api/upload/init
  │     └─> Server creates ProcessingJob, returns storagePath
  │
  ├─> 2. Upload file directly to Supabase Storage
  │     └─> Client uses Supabase JS client to upload
  │     └─> File goes: Browser → Supabase Storage (bypasses Vercel)
  │
  ├─> 3. POST /api/upload/complete
  │     └─> Server marks job as "uploaded", triggers processing
  │
  └─> 4. Poll /api/upload/status/{jobId}
        └─> Wait for processing to complete
```

## Benefits

1. **No Vercel size limits**: Files can be any size (up to Supabase's limits)
2. **Faster uploads**: Direct connection to Supabase, no Vercel proxy
3. **Better UX**: Progress tracking via Supabase client
4. **Cost efficient**: No Vercel bandwidth charges for large files

## Requirements

1. **Supabase Storage bucket** must be set up with proper policies
2. **User must be authenticated** (Supabase Auth session required)
3. **Storage policies** must allow authenticated users to upload to their own folder

## Storage Path Format

Files are stored at: `{userId}/{fileId}/{fileName}`

Example: `550e8400-e29b-41d4-a716-446655440000/abc123-def456/file.pdf`

This ensures:
- Each user has their own folder
- Files are uniquely identified
- Policies can easily restrict access by user ID

## Error Handling

- **Upload fails**: Job status set to "failed", error message stored
- **Processing fails**: Job status set to "failed", extractedText remains null
- **Network errors**: Client retries upload (Supabase client handles this)
- **Auth errors**: User redirected to sign in

## Migration from Server-Side Upload

The old `/api/upload` route is deprecated but kept for backwards compatibility. New uploads use the client-side flow.


# Anonymous Upload Strategy

## Problem
We need to allow uploads before account creation, but prevent abuse (spam, storage abuse, etc.).

## Solution: Temporary Bucket + Rate Limiting + Auth Gate

### Architecture

1. **Two Buckets:**
   - `papers` - Permanent storage (requires auth)
   - `temp` - Temporary anonymous uploads (24h cleanup)

2. **Flow:**
   - Anonymous users upload to `temp` bucket
   - Rate limited (3 uploads per IP per hour)
   - Files stored with session identifier
   - Processing requires authentication
   - On sign-in, temp files moved to permanent location

3. **Security:**
   - IP-based rate limiting
   - File size limits (50MB max)
   - File type validation (PDF only)
   - Session-based identifiers (not tied to user)
   - Automatic cleanup after 24 hours

## Implementation

### Storage Buckets

**`temp` bucket (anonymous uploads):**
- Public INSERT (with restrictions via policies)
- No SELECT (can't read files)
- Auto-delete after 24 hours

**`papers` bucket (permanent):**
- Private, authenticated only
- User-scoped access

### Rate Limiting

- Store rate limit data in database or Redis
- Track: IP address, timestamp, upload count
- Limit: 3 uploads per IP per hour
- Reset after 1 hour

### Session Management

- Generate session ID on first upload
- Store in sessionStorage
- Use for tracking anonymous uploads
- Link to user account on sign-in

## User Experience

1. **Anonymous Upload:**
   - User uploads file → goes to `temp` bucket
   - Rate limit checked
   - Session ID generated/stored
   - File uploaded with path: `temp/{sessionId}/{fileId}/{fileName}`

2. **Processing:**
   - User must sign in to process
   - On sign-in, temp files linked to user
   - Files moved to permanent location
   - Processing begins

3. **Cleanup:**
   - Cron job deletes temp files older than 24 hours
   - Or cleanup on sign-in (move instead of delete)


# Debugging Supabase Authentication

## Where to Find Logs in Supabase

### 1. Authentication Logs (Most Important)

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Logs**
3. This shows:
   - All authentication attempts
   - OAuth redirects
   - Token exchanges
   - Errors with detailed messages
   - User creation/login events

**What to look for:**
- Failed OAuth attempts
- Redirect URL mismatches
- Token exchange errors
- User creation failures

### 2. API Logs

1. Go to **Logs** → **API Logs** (in the left sidebar)
2. Filter by:
   - Path: `/auth/v1/callback`
   - Status: `500` or `4xx`
3. This shows HTTP requests to Supabase's auth endpoints

### 3. Database Logs

If user creation is failing:
1. Go to **Logs** → **Database Logs**
2. Look for errors related to user table inserts

## Common Error Patterns

### Error: "redirect_uri_mismatch"
- **Cause:** Redirect URL doesn't match Supabase URL Configuration
- **Fix:** Check Authentication → URL Configuration → Redirect URLs
- **Check:** The exact URL (protocol, domain, path) must match

### Error: "invalid_grant" or "code_expired"
- **Cause:** OAuth code expired or already used
- **Fix:** Usually transient, try again
- **Check:** Make sure you're not calling `exchangeCodeForSession` twice

### Error: "unexpected_failure"
- **Cause:** Generic Supabase error
- **Fix:** Check Supabase status page, check logs for details
- **Check:** Look in Authentication → Logs for the specific error

### Error: 500 from `/auth/v1/callback`
- **Cause:** Supabase internal error or configuration issue
- **Fix:** Check Authentication → Logs for the specific error message
- **Check:** Verify redirect URL is whitelisted

## Debugging Steps

### Step 1: Check Authentication Logs

1. Go to **Authentication** → **Logs**
2. Look for entries around the time you tried to sign in
3. Click on failed entries to see error details
4. Look for:
   - Error messages
   - Redirect URLs used
   - User email (if available)

### Step 2: Verify Redirect URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Check **Redirect URLs** list
3. Verify your production URL is listed:
   ```
   https://www.epistemicpreflight.com/api/auth/callback
   ```
4. Make sure it matches exactly (no trailing slash, correct protocol)

### Step 3: Check OAuth Provider Configuration

1. Go to **Authentication** → **Providers** → **Google**
2. Verify:
   - Client ID is correct
   - Client Secret is correct
   - Callback URL matches: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

### Step 4: Check Google Cloud Console

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client
3. Verify **Authorized redirect URIs** includes:
   ```
   https://aqimmufaauqhbisrgssq.supabase.co/auth/v1/callback
   ```

### Step 5: Check Application Logs

If you're running in production (Vercel):
1. Go to **Vercel Dashboard** → Your Project → **Logs**
2. Filter by function: `/api/auth/callback`
3. Look for error messages from our callback route

## Adding More Logging

If logs aren't showing up, we can add more detailed logging to the callback route. The current implementation logs:
- Request received
- OAuth errors
- Code exchange errors
- Successful authentication

Check your Vercel function logs for these messages.

## Testing the Flow

1. **Clear browser cookies** for your domain
2. **Open browser console** (F12)
3. **Try to sign in**
4. **Watch the console** for:
   - Redirect URLs being constructed
   - Network requests to Supabase
   - Any JavaScript errors
5. **Check Supabase logs** immediately after

## Getting Help

If you're still stuck:
1. Copy the exact error message from **Authentication** → **Logs**
2. Check the timestamp of the error
3. Note what URL you were redirected to
4. Check if the error happens consistently or intermittently


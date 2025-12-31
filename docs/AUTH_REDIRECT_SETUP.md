# Authentication Redirect Setup

## Problem
If you're getting redirected to `localhost` in production, it's likely because:
1. The redirect URL isn't whitelisted in Supabase
2. The OAuth provider (Google) doesn't have the correct redirect URL configured

## Solution

### 1. Configure Supabase Redirect URLs

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your production redirect URL to **Redirect URLs**:
   ```
   https://www.epistemicpreflight.com/api/auth/callback
   https://epistemicpreflight.com/api/auth/callback
   ```
   (Add both with and without `www` if you use both)

3. Add your local development URL:
   ```
   http://localhost:3001/api/auth/callback
   ```

### 2. Configure Google OAuth Redirect URLs

In Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Under **Authorized redirect URIs**, add:
   ```
   https://www.epistemicpreflight.com/api/auth/callback
   https://epistemicpreflight.com/api/auth/callback
   http://localhost:3001/api/auth/callback
   ```

### 3. Verify Environment Variables

Make sure your production environment has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. How the Redirect Flow Works

1. User clicks "Sign in with Google"
2. Code constructs redirect URL using `window.location.origin`:
   - Production: `https://www.epistemicpreflight.com/api/auth/callback?next=/preflight`
   - Local: `http://localhost:3001/api/auth/callback?next=/preflight`
3. User is redirected to Google OAuth
4. Google redirects back to the callback URL (must be whitelisted)
5. Callback route exchanges code for session
6. User is redirected to the `next` parameter (or `/dashboard` by default)

### 5. Debugging

If redirects still go to localhost:

1. **Check browser console** - Look for any errors during OAuth flow
2. **Check Supabase logs** - Go to Authentication → Logs in Supabase dashboard
3. **Verify the redirect URL** - The URL in the OAuth request must match exactly what's in Supabase/Google settings
4. **Check for hardcoded URLs** - Search codebase for `localhost` or hardcoded domains

### Common Issues

- **Mismatched domains**: Make sure the redirect URL in code matches what's in Supabase/Google
- **Missing `www`**: If your site uses `www`, make sure both `www` and non-`www` are configured
- **HTTP vs HTTPS**: Production must use `https://`, local can use `http://`
- **Port numbers**: Make sure localhost includes the port (e.g., `:3001`)


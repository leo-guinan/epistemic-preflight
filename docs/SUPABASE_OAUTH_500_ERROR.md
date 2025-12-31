# Fixing Supabase OAuth 500 Error

## The Error

You're seeing a `500 Internal Server Error` from Supabase's `/auth/v1/callback` endpoint. This happens **before** the request reaches your app's callback route.

## Root Cause

The redirect URL you're providing to Supabase doesn't match what's configured in Supabase's **URL Configuration**. Supabase validates the redirect URL before processing the OAuth callback.

## Solution

### 1. Check Supabase URL Configuration

In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, you need to add:
   ```
   https://www.epistemicpreflight.com/api/auth/callback
   ```
   (Use your actual production domain)

3. **Important:** The URL must match **exactly**:
   - Protocol: `https://` (not `http://`)
   - Domain: Your exact domain (with or without `www` as you use it)
   - Path: `/api/auth/callback`
   - No trailing slash
   - No query parameters in the whitelist (Supabase adds those)

### 2. Verify the Redirect URL in Code

The code constructs the redirect URL like this:
```typescript
redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`
```

In production, `window.location.origin` should be `https://www.epistemicpreflight.com` (or your domain).

### 3. Common Issues

**Issue 1: Domain Mismatch**
- Code sends: `https://www.epistemicpreflight.com/api/auth/callback`
- Supabase has: `https://epistemicpreflight.com/api/auth/callback` (no www)
- **Fix:** Add both with and without `www` to Supabase URL Configuration

**Issue 2: Protocol Mismatch**
- Code sends: `https://...`
- Supabase has: `http://...` (wrong protocol)
- **Fix:** Make sure production uses `https://`

**Issue 3: Path Mismatch**
- Code sends: `/api/auth/callback`
- Supabase has: `/auth/callback` or `/callback`
- **Fix:** Make sure the path matches exactly

**Issue 4: Trailing Slash**
- Code sends: `/api/auth/callback`
- Supabase has: `/api/auth/callback/` (with trailing slash)
- **Fix:** Remove trailing slash from Supabase configuration

### 4. Debug Steps

1. **Check browser console** - Look at the exact URL being sent to Supabase
2. **Check Supabase logs** - Go to Authentication → Logs in Supabase dashboard
3. **Verify the redirect URL** - Add console.log to see what URL is being constructed:
   ```typescript
   const redirectUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
   console.log("[Sign In] Redirect URL:", redirectUrl);
   ```

### 5. Test in Production

After updating Supabase URL Configuration:

1. Clear browser cache/cookies
2. Try signing in again
3. Check Supabase logs if it still fails
4. Verify the exact URL format matches

### 6. Alternative: Use Environment Variable

If you want to hardcode the redirect URL for production:

```typescript
const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`
  : `${window.location.origin}/api/auth/callback`;
```

Then set `NEXT_PUBLIC_SITE_URL=https://www.epistemicpreflight.com` in your environment variables.


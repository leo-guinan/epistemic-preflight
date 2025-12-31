# Fixing Site URL Whitespace Issue

## The Problem

Looking at the Supabase logs, the JWT state token contains:
```json
"site_url": "   https://www.epistemicpreflight.com/"
```

Notice the **leading spaces** before the URL. This causes Supabase to reject the redirect URL because it doesn't match the configured URL (which doesn't have leading spaces).

## Root Cause

The `site_url` in the JWT state token is likely coming from Supabase's **Site URL** configuration. If that field has leading/trailing whitespace, it will be included in the state token and cause validation to fail.

## The Fix

### 1. Check Supabase Site URL Configuration

1. Go to **Authentication** → **URL Configuration** in Supabase Dashboard
2. Look at the **Site URL** field
3. **Remove any leading or trailing spaces**
4. It should be exactly: `https://www.epistemicpreflight.com` (no trailing slash, no spaces)
5. Click **Save changes**

### 2. Verify Redirect URLs

While you're there, make sure your **Redirect URLs** list has:
- `https://www.epistemicpreflight.com/api/auth/callback` (no trailing slash, no spaces)

### 3. Code Changes

I've updated the code to:
- Trim any whitespace from the redirect URL we construct
- Add logging to see the exact URL being sent

This ensures that even if there's any whitespace in `window.location.origin`, it gets trimmed.

## Why This Happens

Supabase uses the `site_url` from the JWT state token to validate redirect URLs. If the Site URL in Supabase's configuration has whitespace, that whitespace gets encoded into the JWT, and then the validation fails because:

- Configured URL: `https://www.epistemicpreflight.com/api/auth/callback`
- URL in JWT: `   https://www.epistemicpreflight.com/api/auth/callback` (with spaces)
- These don't match → 500 error

## Testing

After fixing the Site URL in Supabase:

1. Clear browser cookies/cache
2. Try signing in again
3. Check the browser console for the logged redirect URL
4. Check Supabase logs to verify the `site_url` in the JWT no longer has spaces


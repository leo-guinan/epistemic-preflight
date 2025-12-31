# Supabase Setup Guide

This guide will help you set up Supabase for the Epistemic Preflight application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Organization**: Select or create one
   - **Name**: Your project name (e.g., "epistemic-preflight")
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works for MVP

## 2. Get Connection Strings

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection String** section
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with the password you created

## 3. Set Up Storage Buckets

You need **two buckets**: one for permanent storage and one for temporary anonymous uploads.

### Create `papers` bucket (permanent storage)

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `papers` (or your preferred name)
4. Make it **Private** (files are user-scoped)
5. Click **Create bucket**

### Create `temp` bucket (anonymous uploads)

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `temp`
4. Make it **Private** (we'll use policies to allow anonymous uploads)
5. Click **Create bucket**

**Required: Set up storage policies**

### `papers` bucket policies (authenticated users only)

1. Go to **Storage** → **Policies** → **papers** bucket
2. Click **New Policy** → **For full customization**
3. Create an **INSERT** policy:
   - Policy name: "Users can upload their own files"
   - Allowed operation: **INSERT**
   - Target roles: **authenticated**
   - Policy definition:
     ```sql
     bucket_id = 'papers' AND (string_to_array(name, '/'))[1] = auth.uid()::text
     ```
4. Create a **SELECT** policy:
   - Policy name: "Users can read their own files"
   - Allowed operation: **SELECT**
   - Target roles: **authenticated**
   - Policy definition:
     ```sql
     bucket_id = 'papers' AND (string_to_array(name, '/'))[1] = auth.uid()::text
     ```
5. Create a **DELETE** policy:
   - Policy name: "Users can delete their own files"
   - Allowed operation: **DELETE**
   - Target roles: **authenticated**
   - Policy definition:
     ```sql
     bucket_id = 'papers' AND (string_to_array(name, '/'))[1] = auth.uid()::text
     ```

### `temp` bucket policies (anonymous uploads)

1. Go to **Storage** → **Policies** → **temp** bucket
2. Click **New Policy** → **For full customization**
3. Create an **INSERT** policy (allows anonymous uploads):
   - Policy name: "Anonymous users can upload to temp"
   - Allowed operation: **INSERT**
   - Target roles: **anon** (select from dropdown)
   - Policy definition:
     ```sql
     bucket_id = 'temp'
     ```
   - **Note:** This allows anyone to upload to the `temp` bucket. Rate limiting (3 uploads per IP per hour) and file validation (PDF only, 50MB max) are handled server-side. Files are automatically moved to the `papers` bucket when the user signs in.

4. **IMPORTANT:** The server-side code needs to read from the `temp` bucket to process files. Since the server uses the service role key (which bypasses RLS), you don't need a SELECT policy. However, if downloads are failing, verify that:
   - Your `.env` file has `SUPABASE_SERVICE_ROLE_KEY` set (not just `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - The service role key is correctly configured in `lib/supabase/server.ts`

**Important Notes:**
- The Supabase UI uses a single "Policy definition" field. Supabase automatically handles USING vs WITH CHECK based on the operation type.
- The `papers` bucket path format is `{userId}/{fileId}/{fileName}`, so the policy checks that the first folder matches the authenticated user's ID.
- The `temp` bucket path format is `temp/{sessionId}/{fileId}/{fileName}`, so we allow uploads to the `temp` folder.
- Anonymous uploads are rate-limited server-side (3 uploads per IP per hour).
- Files in `temp` should be cleaned up after 24 hours (you can set up a cron job for this).

## 4. Enable Google OAuth Provider

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Add authorized redirect URL: `https://[YOUR_DOMAIN]/api/auth/callback`

## 5. Set Environment Variables

Add these to your `.env` file:

**For Development/Testing:**
```env
# Disable rate limiting for testing (optional)
DISABLE_RATE_LIMIT=true
```

```env
# Database connection (replace [PASSWORD] and [PROJECT_REF] with your actual values)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
# DIRECT_URL is optional - only needed if using connection pooling
# DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Required: For Supabase Auth and client features
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Required: For server-side operations that bypass RLS (downloading from temp bucket, etc.)
# Get this from: Settings → API → service_role key (secret)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Supabase Storage bucket name (defaults to "papers")
SUPABASE_STORAGE_BUCKET=papers
```

To get the anon key:
1. Go to **Settings** → **API**
2. Copy the `anon` `public` key under **Project API keys**

## 6. Run Database Migrations

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations to create tables
pnpm db:migrate
```

This will create the `User` and `Paper` tables in your Supabase database.

## 7. Verify Setup

You can verify the tables were created:
1. Go to **Table Editor** in your Supabase dashboard
2. You should see `User` and `Paper` tables

## 8. For Production (Vercel)

When deploying to Vercel:

1. Add the same environment variables in **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Make sure to set them for **Production**, **Preview**, and **Development** environments
3. The `DIRECT_URL` can be the same as `DATABASE_URL` for small apps, or use the Transaction mode connection string for better pooling

## Connection Pooling (Required for IPv4 Networks)

**Important:** As of February 2025, Supabase deprecated Session Mode on port 6543. For IPv4 networks, use **Supavisor Session Mode on port 5432**.

### Why?
- Direct connection (port 5432) requires IPv6
- **Supavisor Session Mode (port 5432)** works with IPv4 ✅
- Port 6543 now only supports Transaction Mode (not suitable for migrations)
- **Supavisor is free** and works for migrations

### How to Get the Correct Connection String:

1. In Supabase Dashboard → **Settings** → **Database**
2. Click **Connection String** tab
3. Change **Method** dropdown to **"Supavisor"** (Session Mode)
4. Copy the connection string (it will use port 5432 with Supavisor)
5. Update your `.env` file with the connection string from the dashboard

**Note:** 
- The connection string will look like: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true`
- Replace `[PASSWORD]` with your actual database password
- If your password contains special characters like `!`, `@`, `#`, URL-encode them:
  - `!` → `%21`
  - `@` → `%40`
  - `#` → `%23`
- Prisma 5 works fine with Supavisor for migrations

### Example:
If your password is `MyPassword123!`, the connection string should be:
```env
DATABASE_URL=postgresql://postgres:MyPassword123%21@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true
```

**Or if using the pooler URL format:**
```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:MyPassword123%21@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Important:** 
- Make sure you select **"Supavisor"** (Session Mode), not "Direct connection" or "Session Pooler" (which is deprecated).
- The connection string **must include `?pgbouncer=true`** for Supavisor to work with IPv4.

## Troubleshooting

### "Can't reach database server" errors

**Most common cause: Database is paused (free tier)**

Supabase free tier databases pause after 1 week of inactivity:
1. Go to Supabase Dashboard
2. Check if project shows "Paused" status
3. Click **Restore** or **Resume**
4. Wait 1-2 minutes, then try again

**Other causes:**
- IP address not whitelisted (Settings → Database → Network Restrictions)
- Network/firewall blocking port 5432
- Password has special characters that need URL-encoding

**Quick fix: Try connection pooler instead**
Change `DATABASE_URL` to use port 6543:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true
```

### "Connection refused" errors
- Check that your IP is allowed in Supabase (Settings → Database → Connection Pooling)
- For production, you may need to allow all IPs or use connection pooling

### Migration errors
- Make sure `DIRECT_URL` uses the direct connection (port 5432), not pooled (port 6543)
- Verify your password is correct and URL-encoded if it contains special characters

### SSL errors
- Supabase requires SSL. Prisma handles this automatically, but if you see SSL errors, add `?sslmode=require` to your connection string


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

## 3. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `papers` (or your preferred name)
4. Make it **Private** (files are user-scoped)
5. Click **Create bucket**

**Optional: Set up storage policies** (recommended for production):
- Go to **Storage** → **Policies** → **papers** bucket
- Create policy: "Users can upload their own files"
- Create policy: "Users can read their own files"
- Create policy: "Users can delete their own files"

## 4. Enable Google OAuth Provider

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Add authorized redirect URL: `https://[YOUR_DOMAIN]/api/auth/callback`

## 5. Set Environment Variables

Add these to your `.env` file:

```env
# Database connection (replace [PASSWORD] and [PROJECT_REF] with your actual values)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
# DIRECT_URL is optional - only needed if using connection pooling
# DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Required: For Supabase Auth and client features
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

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

## Connection Pooling (Optional)

For better performance in production, you can use Supabase's connection pooler:

- Use port **6543** instead of **5432** for pooled connections
- Connection string format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true`

For Prisma 5, you can use the same `DATABASE_URL` for both regular connections and migrations. If you want to use connection pooling, set `DATABASE_URL` to the pooled connection (port 6543) and optionally set `DIRECT_URL` to the direct connection (port 5432) for migrations.

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


# Fix: IPv4 Connection Issue

## Problem
You're getting "Can't reach database server" errors when trying to run migrations because your network is IPv4-only, but Supabase's direct connection (port 5432) requires IPv6.

## Solution: Use Supavisor Session Mode (Free)

**Update (Feb 2025):** Supabase deprecated Session Mode on port 6543. Use **Supavisor Session Mode on port 5432** instead - it's free and works with IPv4.

## Quick Fix Steps

1. **Get the Supavisor connection string:**
   - Go to Supabase Dashboard → Settings → Database
   - Click "Connection String" tab
   - Change **Method** from "Direct connection" to **"Supavisor"** (Session Mode)
   - Copy the connection string (it will use port 5432 with Supavisor)

2. **Update your `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true
   ```

3. **URL-encode special characters in password:**
   If your password has special characters, encode them:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`

4. **Test the connection:**
   ```bash
   pnpm db:migrate
   ```

## Example

**Before (IPv6 only - won't work on IPv4):**
```env
DATABASE_URL=postgresql://postgres:PAWLnANKaREMspjE!i7@db.aqimmufaauqhbisrgssq.supabase.co:5432/postgres
```

**After (IPv4 compatible - Supavisor Session Mode):**
```env
DATABASE_URL=postgresql://postgres:PAWLnANKaREMspjE%21i7@db.aqimmufaauqhbisrgssq.supabase.co:5432/postgres?pgbouncer=true
```

**Note:** Both use port 5432, but Supavisor adds `?pgbouncer=true` and works with IPv4.

## Why This Works

- **Supavisor Session Mode** uses IPv4 and is free
- Works for migrations, queries, everything
- No need to upgrade plans or pay for IPv4 add-on
- Same performance for most use cases
- Uses port 5432 (same as direct) but with IPv4 support via Supavisor

## When to Use Direct Connection

Only use direct connection (port 5432 without `?pgbouncer=true`) if:
- Your network supports IPv6
- You need specific PostgreSQL features that require direct connection
- You're running on a platform that explicitly requires it

For 99% of use cases, **Supavisor Session Mode** is the right choice.


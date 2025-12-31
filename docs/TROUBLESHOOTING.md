# Troubleshooting Guide

## Database Connection Issues

### Error: "Can't reach database server"

This usually means one of these issues:

#### 1. **Database is Paused (Free Tier)**

Supabase free tier databases pause after **1 week of inactivity**. 

**Solution:**
1. Go to your Supabase Dashboard
2. Check if your project shows "Paused" status
3. Click **Restore** or **Resume** to wake it up
4. Wait 1-2 minutes for it to come back online
5. Try the migration again

#### 2. **IP Address Not Whitelisted**

Supabase may require your IP to be whitelisted.

**Solution:**
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection Pooling** or **Network Restrictions**
3. Add your current IP address
4. Or enable "Allow all IPs" for development

#### 3. **Network/Firewall Issues**

Your network might be blocking the connection.

**Solution:**
- Try from a different network (mobile hotspot, etc.)
- Check if your firewall/VPN is blocking port 5432
- Try using the connection pooler (port 6543) instead

#### 4. **Connection String Issues**

The password might have special characters that need URL encoding.

**Solution:**
- If your password has special characters like `!`, `@`, `#`, etc., they need to be URL-encoded
- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`
- Or regenerate the password in Supabase to avoid special chars

#### 5. **Use Connection Pooler Instead**

Sometimes the direct connection (5432) doesn't work, but the pooler (6543) does.

**Solution:**
Change your `DATABASE_URL` to use port 6543:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true
```

### Quick Test

Test if you can reach Supabase at all:
```bash
curl https://[PROJECT_REF].supabase.co
```

If this fails, the project might be paused or deleted.

### Check Database Status

1. Go to Supabase Dashboard
2. Check project status
3. Look for any warnings or errors
4. Check if database is "Active" or "Paused"


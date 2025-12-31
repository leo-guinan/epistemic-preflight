# Rate Limit Bypass for Testing

## Quick Fix: Disable Rate Limiting

Add this to your `.env` file:
```env
DISABLE_RATE_LIMIT=true
```

This will skip rate limit checks for anonymous uploads in development.

## Clear Existing Rate Limits

### Option 1: Clear All Rate Limits
Visit this URL in your browser (development only):
```
http://localhost:3001/api/upload/clear-rate-limit?all=true
```

### Option 2: Clear Specific IP
```bash
curl -X DELETE "http://localhost:3001/api/upload/clear-rate-limit?ipAddress=YOUR_IP"
```

### Option 3: Direct Database Query
```sql
DELETE FROM "UploadRateLimit";
```

## Rate Limit Details

- **Limit**: 3 uploads per IP per hour
- **Window**: 1 hour
- **Applies to**: Anonymous uploads only
- **Authenticated users**: No rate limit

## Production

Rate limiting is **always enabled** in production, regardless of the `DISABLE_RATE_LIMIT` setting.


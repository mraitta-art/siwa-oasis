# Complete Deployment & Sync Guide

> **Safety First:** Always backup both databases before any migration or sync.

## 1. Pre-Deployment Checklist

- [ ] Database backups created (local + production)
- [ ] `.env.local` configured with DB credentials and `ADMIN_SECRET` (production secret, strong random string)
- [ ] Node.js v20+ installed (`node -v`)
- [ ] All dependencies installed (`npm install`)
- [ ] Tests passed (if available)
- [ ] Code review completed

## 2. Environment Variables Required

Create `.env.local` in the workspace root:

```
# Database
DB_HOST=your_prod_db_host
DB_PORT=3306
DB_USER=prod_user
DB_PASSWORD=your_secure_password
DB_NAME=siwa_oasis

# Admin
ADMIN_SECRET=your_very_long_random_secret_key_here
NODE_ENV=production
```

Generate a strong `ADMIN_SECRET`:
```powershell
$random = -join (1..32 | ForEach-Object { [char]((48..122) | Get-Random) })
Write-Host "ADMIN_SECRET=$random"
```

## 3. Local (Development) Setup

### 3.1 Run migration (dry-run first)

```powershell
cd e:\ANitgravity\siwatoday\siwa-oasis
$env:DB_HOST='127.0.0.1'
$env:DB_USER='local_user'
$env:DB_PASSWORD='local_pass'
$env:DB_NAME='siwa_local'

# Preview migration SQL
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry
```

If output looks correct, apply:

```powershell
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql
```

### 3.2 Run backfill (dry-run)

```powershell
npm run backfill:dry
```

If preview acceptable:

```powershell
npm run backfill
```

### 3.3 Test the complete flow

1. Start dev server:
   ```powershell
   npm run dev
   # Browser: http://localhost:3000
   ```

2. Test visitor profile page:
   - Visit: `http://localhost:3000/visitors/profile`
   - Search by email/phone of an existing request

3. Test admin endpoints (need `ADMIN_SECRET`):
   - Journey config editor: `http://localhost:3000/admin/journey-config` (add auth check later)
   - Visitor merge: `http://localhost:3000/admin/visitor-merge`
   - With curl:
     ```powershell
     $secret='your_ADMIN_SECRET_from_env'
     curl -H "Authorization: Bearer $secret" http://localhost:3000/api/visitors/duplicates
     ```

## 4. Production Deployment

### 4.1 Sync production database → local (optional, for analysis)

Using `mysqldump` (if available):

```powershell
mysqldump -h prod_host -u prod_user -p'prod_password' --single-transaction --quick --lock-tables=false siwa_oasis > prod_backup.sql

# Import to local
mysql -h 127.0.0.1 -u local_user -p'local_password' siwa_oasis < prod_backup.sql
```

### 4.2 Apply migration on production (with downtime window)

Schedule a maintenance window (e.g., 2 AM). On the production environment:

```powershell
cd /path/to/siwa-oasis  # or SSH into prod host
$env:DB_HOST='prod_db_host'
$env:DB_USER='prod_user'
$env:DB_PASSWORD='prod_password'
$env:DB_NAME='siwa_oasis'

# Dry-run
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry

# Apply (with monitor)
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql
# Watch for errors; if any, restore from backup and investigate
```

### 4.3 Run backfill on production

After migration succeeds:

```powershell
npm run backfill:dry
# review output
npm run backfill
# monitor logs
```

Backfill will:
- Create `visitor_profiles` from distinct emails in `journey_requests`
- Link requests to profiles
- Log all actions to `audit_log`

### 4.4 Deploy code to production

```powershell
# Commit and push
git add .
git commit -m "feat: visitor profile aggregation and merge"
git push origin main

# On production server
git pull origin main
npm install --production
npm run build
# restart Node/Next.js process (PM2, systemd, etc.)
```

## 5. Verification Steps

### Verify migration + backfill success

```sql
-- Check visitor_profiles created
SELECT COUNT(*) as profile_count FROM visitor_profiles;

-- Check requests linked
SELECT COUNT(*) as linked_count FROM journey_requests WHERE visitor_id IS NOT NULL;

-- Check audit log
SELECT action, COUNT(*) as cnt FROM audit_log WHERE action LIKE 'backfill%' GROUP BY action;
```

### Test admin access

```powershell
$secret = $env:ADMIN_SECRET
curl -H "Authorization: Bearer $secret" https://production-url/api/visitors/duplicates
```

Expected response (if duplicates exist):
```json
{
  "duplicates": [
    { "email": "user@example.com", "profiles": [...] }
  ]
}
```

## 6. Rollback Plan

If anything fails:

1. **Stop the application** (kill Next.js process)
2. **Restore database backup**:
   ```sql
   -- Stop app, restore backup
   mysql -u root -p siwa_oasis < backup_before_migration.sql
   ```
3. **Restart application**
4. **Investigate** errors in logs; create issue for fix

## 7. Security Notes

- **Never** commit `.env.local` or production secrets
- `ADMIN_SECRET` should be strong (32+ chars, random)
- Rotate secrets regularly
- Audit log tracks all merge operations
- OTP verification (in-dev: shows OTP; prod: send via email/SMS)

## 8. Next Steps After Deployment

1. Train admin team on:
   - Duplicate merge workflow: `/admin/visitor-merge`
   - Journey config editing: `/admin/journey-config`
2. Communicate new visitor profile URL to users: `/visitors/profile`
3. Monitor error logs for issues
4. Plan email/SMS OTP service integration
5. Consider UI improvements (forms, batch merge, deduplication rules)

## Files Involved

- `migrations/20260528_add_visitor_profiles.sql` — SQL migration
- `scripts/backfill_visitors.js` — Backfill logic
- `scripts/run_migration.js` — Migration runner (Node)
- `src/app/api/visitors/profile/route.ts` — Visitor profile API
- `src/app/api/visitors/otp/route.ts` — OTP API
- `src/app/visitors/profile/page.tsx` — Visitor form UI
- `src/lib/admin-auth.ts` — Admin auth utility
- `src/lib/otp.ts` — OTP service

## Quick Reference Commands

```powershell
# Dry-run everything
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry
npm run backfill:dry

# Apply migration + backfill
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql
npm run backfill

# Dev server (test UI)
npm run dev
# visit http://localhost:3000/visitors/profile

# Prod build
npm run build
npm start
```

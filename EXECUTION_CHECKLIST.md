# Visitor Profile Aggregation — Status & Execution Checklist

## Project Status: Ready for Testing

**Current Date:** May 28, 2026

### What Was Implemented

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Visitor Profiles Table | ✅ Complete | `migrations/20260528_add_visitor_profiles.sql` | CREATE TABLE + ALTER journey_requests ADD visitor_id |
| Backfill Script (Node) | ✅ Complete | `scripts/backfill_visitors.js` | Email-based grouping, audit logging, dry-run support |
| Migration Runner | ✅ Complete | `scripts/run_migration.js` | Execute SQL files from Node (no mysql client needed) |
| Visitor Profile API | ✅ Complete | `src/app/api/visitors/profile/route.ts` | GET by email/phone/id |
| OTP Service | ✅ Complete | `src/lib/otp.ts` | In-memory OTP generator + verifier |
| OTP API | ✅ Complete | `src/app/api/visitors/otp/route.ts` | Request + verify OTP |
| Visitor Profile UI | ✅ Complete | `src/app/visitors/profile/page.tsx` | Search profile by email/phone/id, verify with OTP |
| Admin Duplicate Detection | ✅ Complete | `src/app/api/visitors/duplicates/route.ts` | Find duplicates, merge profiles |
| Admin Merge UI | ✅ Complete | `src/app/admin/visitor-merge/page.tsx` | List duplicates, trigger merge with token |
| Admin Auth Middleware | ✅ Complete | `src/lib/admin-auth.ts` | Token-based (ADMIN_SECRET) |
| API Auth Integration | ✅ Complete | Both `/api/visitors/*` and `/api/journeys/config` POST secured |
| Deployment Guide | ✅ Complete | `DEPLOYMENT_VISITOR_PROFILES.md` | Step-by-step for local + prod |
| .env.local Template | ✅ Complete | `.env.local.example` | Copy to `.env.local` and fill values |

### Architecture Overview

```
Visitor Flow:
┌─────────────────┐
│ Journey Request │ (email, phone)
└────────┬────────┘
         │
         v
┌──────────────────────────┐
│ Backfill Script runs     │ (one-time: email → profile_id)
│ Groups by email          │
│ Creates visitor_profiles │
│ Links requests           │
└────────┬─────────────────┘
         │
         v
┌──────────────────────────────┐
│ visitor_profiles (aggregated)│ (emails[], phones[], metadata)
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ Visitor searches profile     │ (/visitors/profile)
│ by email/phone/id            │
│ Verifies with OTP            │
│ Views/edits aggregated data  │
└──────────────────────────────┘

Admin Flow:
┌──────────────────────────────┐
│ Admin detects duplicates     │ (/admin/visitor-merge)
│ Submits merge request        │ (with ADMIN_SECRET token)
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ API merges profiles          │ (/api/visitors/duplicates POST)
│ Combines emails/phones       │
│ Updates journey_requests     │
│ Deletes old profiles         │
│ Logs to audit_log            │
└──────────────────────────────┘
```

### Pre-Execution Checklist

Before running migrations/backfill:

- [ ] **Database Backups**: Full backups of both local and production databases created
- [ ] **Environment File**: `.env.local` created with DB credentials and ADMIN_SECRET
  - Example: `cp .env.local.example .env.local && vi .env.local`
- [ ] **ADMIN_SECRET Generated**: Strong random string (32+ chars)
  ```powershell
  # Generate one:
  -join (1..32 | ForEach-Object { [char]((48..122) | Get-Random) })
  ```
- [ ] **Node.js Installed**: v20+
  ```powershell
  node -v  # should show v20+
  ```
- [ ] **Dependencies Installed**:
  ```powershell
  npm install
  ```
- [ ] **Code Review**: Changes reviewed and approved
- [ ] **Testing Plan**: Local testing completed before prod

### Execution Steps (One by One)

#### Step 1: Local Testing — Migration (Dry-Run)

```powershell
cd e:\ANitgravity\siwatoday\siwa-oasis

# Set env vars (or use .env.local)
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='3306'
$env:DB_USER='local_user'
$env:DB_PASSWORD='local_password'
$env:DB_NAME='siwa_local'

# Preview SQL (dry-run)
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry

# Expected output: SQL truncated preview
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 2: Local Testing — Migration (Apply)

```powershell
# Apply migration
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql

# Expected: "Migration executed."
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 3: Local Testing — Backfill (Dry-Run)

```powershell
npm run backfill:dry

# Expected: Actions logged (profiles to create, requests to update)
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 4: Local Testing — Backfill (Apply)

```powershell
npm run backfill

# Expected: "Backfill complete" + audit log entries
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 5: Local Testing — Run Dev Server & Test UIs

```powershell
npm run dev
# Browser: http://localhost:3000
```

**Test Items:**
- [ ] Visitor Profile Page: `http://localhost:3000/visitors/profile`
  - Search by email of a request
  - Verify OTP request sent (check logs)
  - Verify OTP entry (dev shows the code)
  - See profile displayed
- [ ] Admin Duplicate Detection: `http://localhost:3000/admin/visitor-merge`
  - Enter ADMIN_SECRET token
  - Load duplicates
  - See list of duplicate emails
  - Click merge (should show success)
- [ ] Journey Planner: `http://localhost:3000`
  - Verify still loads config correctly
- [ ] Admin Journey Config: `http://localhost:3000/admin/journey-config`
  - (Should add token requirement later)

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 6: Production Migration (Scheduled Maintenance)

**Schedule downtime:** Off-hours window (e.g., 2 AM)

```powershell
# Set prod creds
$env:DB_HOST='prod_db_host'
$env:DB_PORT='3306'
$env:DB_USER='prod_user'
$env:DB_PASSWORD='prod_password'
$env:DB_NAME='siwa_oasis'

# Dry-run
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry

# Apply (if OK)
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql

# Monitor: Check for errors; if any, restore backup
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 7: Production Backfill

```powershell
npm run backfill:dry
# Review output

npm run backfill
# Monitor logs for errors
```

**Status:** [ ] Pass / [ ] Fail  
**Profiles Created:** ________  
**Requests Updated:** ________

#### Step 8: Production Code Deploy

```powershell
git add .
git commit -m "feat: visitor profile aggregation and OTP verification"
git push origin main

# On prod server
git pull origin main
npm install --production
npm run build
# Restart Node process (PM2, systemd, Docker, etc.)
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

#### Step 9: Production Verification

```sql
-- Check profile creation
SELECT COUNT(*) as profile_count FROM visitor_profiles;

-- Check requests linked
SELECT COUNT(*) as linked_count FROM journey_requests WHERE visitor_id IS NOT NULL;

-- Check audit
SELECT action, COUNT(*) as cnt FROM audit_log 
  WHERE action LIKE 'backfill%' OR action LIKE 'merge%'
  GROUP BY action;
```

**Status:** [ ] Pass / [ ] Fail  
**Notes:** _______________

### Rollback Procedure

If any step fails:

1. **Stop the application**
2. **Restore database backup**:
   ```sql
   mysql -u root -p siwa_oasis < backup_before_migration.sql
   ```
3. **Restart application**
4. **Investigate errors** and open issue for fix

### Post-Deployment Tasks

- [ ] Admin team trained on merge workflow
- [ ] User communication: new profile page URL
- [ ] Error logging monitored
- [ ] Integration of email/SMS OTP service (currently stub)
- [ ] UI improvements (form builder, batch merge, etc.)

### Support & Troubleshooting

**Q: Migration failed with error X**  
A: Check logs, restore backup, investigate in staging, file issue.

**Q: Backfill created wrong number of profiles**  
A: Review dry-run output; check for edge cases (empty emails, duplicates within journey_requests).

**Q: Admin token not working**  
A: Verify `ADMIN_SECRET` set correctly in `.env.local`.

**Q: Visitor can't find their profile**  
A: Verify `visitor_profiles` table populated; check email/phone format consistency.

### Files Involved (Quick Reference)

**Migrations & Scripts:**
- `migrations/20260528_add_visitor_profiles.sql` — Table creation
- `scripts/backfill_visitors.js` — Email-based backfill
- `scripts/run_migration.js` — SQL runner (Node)

**APIs:**
- `src/app/api/visitors/profile/route.ts` — Profile query
- `src/app/api/visitors/otp/route.ts` — OTP management
- `src/app/api/visitors/duplicates/route.ts` — Merge (requires ADMIN_SECRET)

**UIs:**
- `src/app/visitors/profile/page.tsx` — Visitor search + view
- `src/app/admin/visitor-merge/page.tsx` — Admin merge panel

**Config:**
- `.env.local.example` — Env template
- `DEPLOYMENT_VISITOR_PROFILES.md` — Full deployment guide

---

**Last Updated:** May 28, 2026  
**Project Lead:** [Your Name]  
**Status:** Ready for Local Testing

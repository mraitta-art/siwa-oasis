# Visitor Profile Aggregation & Marketplace Integration

## Overview

This system aggregates all visitor requests (journey requests, form submissions, etc.) into unified **visitor profiles** indexed by email/phone. Admins can merge duplicate profiles, and visitors can view/manage their aggregated data with OTP verification.

**Key Features:**
- ✅ Automatic profile creation from existing requests (email-based)
- ✅ Admin merge UI for handling duplicates
- ✅ Visitor self-service profile lookup & OTP verification
- ✅ Comprehensive audit logging (all actions logged)
- ✅ API-first architecture (secure endpoints with ADMIN_SECRET)
- ✅ One-by-one execution guide (zero downtime migration)

## Quick Start

### 1. Setup Environment

Copy and fill `.env.local`:
```bash
cp .env.local.example .env.local
# Edit .env.local with your DB and ADMIN_SECRET
```

### 2. Run Migration & Backfill

```bash
# Local testing
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql

npm run backfill:dry
npm run backfill
```

### 3. Test UIs

```bash
npm run dev
# http://localhost:3000/visitors/profile — Visitor search
# http://localhost:3000/admin/visitor-merge — Admin merge (with token)
```

### 4. Deploy to Production

Follow [DEPLOYMENT_VISITOR_PROFILES.md](DEPLOYMENT_VISITOR_PROFILES.md) for step-by-step prod sync.

## Architecture

### Data Model

**visitor_profiles** (new table):
```sql
id (UUID) — Profile identifier
primary_name (string) — Optional customer name
emails (JSON array) — All known emails for this visitor
phones (JSON array) — All known phone numbers
metadata (JSON) — Custom fields, merge history, etc.
created_at, updated_at — Timestamps
```

**journey_requests** (modified):
- Added column: `visitor_id (UUID)` — Foreign key to `visitor_profiles`

### Workflows

**Visitor Journey:**
1. Visitor goes to `/visitors/profile`
2. Searches by email, phone, or ID
3. System finds or creates `visitor_profiles` entry
4. Visitor verifies identity with OTP
5. Visitor views aggregated data (all requests, offers, interactions)

**Admin Merge Workflow:**
1. Admin goes to `/admin/visitor-merge`
2. Enters ADMIN_SECRET token (from .env.local)
3. Loads list of duplicate emails from `journey_requests`
4. Clicks "Create profile and merge" for each duplicate
5. System creates single profile, combines emails/phones, updates all requests

## API Endpoints

### Public APIs

**GET /api/visitors/profile**
```bash
# Query by email
curl "http://localhost:3000/api/visitors/profile?email=user@example.com"
# Query by phone
curl "http://localhost:3000/api/visitors/profile?phone=+1234567890"
# Query by ID
curl "http://localhost:3000/api/visitors/profile?id=uuid-here"

Response:
{
  "profile": {
    "id": "uuid",
    "primary_name": null,
    "emails": ["user@example.com", "user2@example.com"],
    "phones": ["+1234567890"],
    "metadata": {...}
  }
}
```

**POST /api/visitors/otp**
```bash
# Request OTP
curl -X POST http://localhost:3000/api/visitors/otp \
  -H "Content-Type: application/json" \
  -d '{"action":"request","email":"user@example.com"}'

# Verify OTP
curl -X POST http://localhost:3000/api/visitors/otp \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","email":"user@example.com","code":"123456"}'
```

### Admin APIs (Require ADMIN_SECRET Token)

**GET /api/visitors/duplicates** (with token)
```bash
$token = $env:ADMIN_SECRET
curl -H "Authorization: Bearer $token" http://localhost:3000/api/visitors/duplicates

Response:
{
  "duplicates": [
    {
      "email": "user@example.com",
      "profiles": [...]
    }
  ]
}
```

**POST /api/visitors/duplicates** (with token)
```bash
curl -X POST \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}' \
  http://localhost:3000/api/visitors/duplicates

Response:
{
  "ok": true,
  "targetId": "new-profile-uuid"
}
```

## Scripts & Tools

### `scripts/backfill_visitors.js`

Migrates existing `journey_requests` into `visitor_profiles`.

```bash
# Dry-run (preview changes)
npm run backfill:dry

# Apply changes
npm run backfill
```

**Behavior:**
- Groups by unique `customer_email`
- Creates one `visitor_profiles` row per email
- Updates `journey_requests.visitor_id` to point to profile
- Logs all actions to `audit_log`
- Supports environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

### `scripts/run_migration.js`

Executes SQL migration files without requiring `mysql` client.

```bash
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql --dry
npm run migrate:file -- migrations/20260528_add_visitor_profiles.sql
```

## Deployment

### Local Testing

1. Backup local DB
2. Run migration dry-run
3. Run migration (apply)
4. Run backfill dry-run
5. Run backfill (apply)
6. Test UIs: `/visitors/profile`, `/admin/visitor-merge`

### Production Deployment

1. Schedule maintenance window (e.g., 2 AM)
2. Backup production DB
3. Repeat migration + backfill steps from local
4. Deploy code: `git push` + `npm install` + `npm run build`
5. Restart Node process
6. Verify audit log

See [DEPLOYMENT_VISITOR_PROFILES.md](DEPLOYMENT_VISITOR_PROFILES.md) for detailed steps.

## Execution Checklist

Use [EXECUTION_CHECKLIST.md](EXECUTION_CHECKLIST.md) to track progress:
- Pre-execution verification
- Step-by-step local testing
- Production migration schedule
- Rollback procedure
- Post-deployment tasks

## Security Notes

- **ADMIN_SECRET**: Strong token (32+ chars) controls admin APIs. Set in `.env.local`, do NOT commit.
- **OTP Verification**: In-memory store in dev (shows OTP). Integrate with email/SMS service in production.
- **Audit Logging**: All profile merges logged to `audit_log` table.
- **Database Backups**: Always backup before migrations. Rollback procedure documented.

## Files Overview

| File | Purpose |
|------|---------|
| `migrations/20260528_add_visitor_profiles.sql` | Table creation + schema changes |
| `scripts/backfill_visitors.js` | Populate profiles from existing data |
| `scripts/run_migration.js` | Execute SQL migrations from Node |
| `src/app/api/visitors/profile/route.ts` | Get visitor profile by email/phone/id |
| `src/app/api/visitors/otp/route.ts` | OTP request + verify |
| `src/app/api/visitors/duplicates/route.ts` | List duplicates + merge (admin only) |
| `src/app/visitors/profile/page.tsx` | Visitor self-service UI |
| `src/app/admin/visitor-merge/page.tsx` | Admin merge control panel |
| `src/lib/admin-auth.ts` | ADMIN_SECRET token validation |
| `src/lib/otp.ts` | OTP generation + verification |
| `.env.local.example` | Environment template |
| `DEPLOYMENT_VISITOR_PROFILES.md` | Full deployment + sync guide |
| `EXECUTION_CHECKLIST.md` | Step-by-step execution tracker |

## Troubleshooting

**Issue: "connect ECONNREFUSED 127.0.0.1:3306"**  
→ DB not running. Start MySQL/database service.

**Issue: ADMIN_SECRET token rejected**  
→ Verify env var set: `echo $env:ADMIN_SECRET`

**Issue: OTP not received**  
→ In dev, OTP shown in response + server logs. Integration with email/SMS needed for prod.

**Issue: Profiles not created**  
→ Check dry-run output. Verify `journey_requests` has `customer_email` values.

## Next Steps

1. ✅ **Local Testing** — Run full suite locally, verify all UIs work
2. ✅ **Staging Validation** — Test on staging environment
3. ✅ **Production Deploy** — Follow deployment guide, schedule maintenance window
4. 🔲 **Email/SMS OTP** — Replace stub OTP service with real email/SMS provider
5. 🔲 **Visitor Edit Form** — Add form builder to let visitors edit profile fields
6. 🔲 **Advanced Merge** — Phone+email similarity matching, fuzzy deduplication

## Support

For issues, check:
1. `EXECUTION_CHECKLIST.md` — Execution status & troubleshooting
2. `DEPLOYMENT_VISITOR_PROFILES.md` — Deployment reference
3. Server logs — Node/Next.js error details
4. Database logs — SQL errors
5. `audit_log` table — Recent actions

---

**Last Updated:** May 28, 2026  
**Version:** 1.0.0  
**Status:** Ready for Local Testing & Staging Validation

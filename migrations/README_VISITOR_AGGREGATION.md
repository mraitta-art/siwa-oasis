Visitor aggregation migration & backfill
=====================================

This document explains how to add `visitor_profiles`, backfill profiles from existing `journey_requests`, and safely link requests to profiles.

Files added:
- `migrations/20260528_add_visitor_profiles.sql` — SQL migration to create table and add column
- `scripts/backfill_visitors.js` — Node script to backfill profiles from `journey_requests` (email-based). Uses env vars and supports `--dry`.

Preconditions
-------------
- Make a full database backup before running any migration or backfill.

Run migration (SQL)
-------------------
Run the SQL in `migrations/20260528_add_visitor_profiles.sql` using your preferred MySQL client.

Backfill (dry-run)
-------------------
1. Install dependencies (if not present):
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
npm install mysql2 uuid
```

2. Prepare environment variables (example `.env.local`):
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=siwa_oasis
```

3. Run dry-run to preview actions:
```bash
node scripts/backfill_visitors.js --dry
```

Backfill (apply)
-----------------
After reviewing dry-run output, run without `--dry` to apply changes:
```bash
node scripts/backfill_visitors.js
```

Notes & next steps
------------------
- The script creates one profile per unique email. If you want phone-based or more advanced deduplication, modify the script.
- After backfill, consider adding email verification flow, merge UI for duplicates, and expand linking to other request tables.
- All operations are logged to `audit_log` by the script.

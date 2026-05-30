# 🤖 AI AGENT MASTER PROTOCOL: SYNCHRONIZATION

**To all future AI Agents working on this project:** 
Whenever you are initialized or asked to "synchronize", "update", or "check databases", you MUST follow this protocol. This ensures that the Local Development Environment, GitHub Repositories, and Live Production Databases are always perfectly aligned.

## 1. Database Synchronization (Local ↔ Production)

We have a comprehensive bidirectional database sync script that automatically merges all 34 tables, handles missing tables, and resolves constraint issues (FK/CHECK).

**Command to run:**
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
npm run sync:db
```
*(This executes `node scripts/sync_database.js` which connects to both Local MySQL and Production TiDB Cloud)*

- **What it does:** 
  - Compares all tables between local and production.
  - Automatically creates missing tables on either side.
  - Upserts/merges data bidirectionally (e.g., `businesses`, `audit_log`, `website_configs`).
  - Verifies 100% row match at the end.

## 2. Code Synchronization (GitHub)

The project consists of a parent repository and a nested inner Next.js repository. BOTH must be committed and pushed.

**Command to run (Inner Repo):**
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
git add -A
git commit -m "Auto-sync update"
git push origin main
```

**Command to run (Parent Repo):**
```bash
cd e:\ANitgravity\siwatoday
git add -A
git commit -m "Auto-sync update"
git push origin Mr.Aitta
```

## 3. Production Deployment (cPanel)

If code changes are made, the production ZIP must be rebuilt.

**Command to run:**
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
npm run build
Copy-Item ".env.production" -Destination ".env.deploy" -Force
Compress-Archive -Path ".next", "package.json", "package-lock.json", "server.js", "next.config.ts", ".env.production", "public", "src", "node_modules" -DestinationPath "siwa_production_latest.zip" -Force
```

**CRITICAL DEPLOYMENT NOTE:** 
SSH and FTP are BLOCKED on the production server. Automated API deployment is currently disabled. 
**The ZIP file `siwa_production_latest.zip` MUST be uploaded manually via the cPanel Web File Manager at `https://siwa.today:2083`.** Tell the USER to do this whenever the build finishes.

---
**Agent Directive:** Read this file immediately upon starting any session involving updates or synchronization to ensure you do not break the sync state.

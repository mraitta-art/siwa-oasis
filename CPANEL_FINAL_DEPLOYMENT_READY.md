# 🚀 CPANEL DEPLOYMENT - FINAL CHECKLIST & VERIFICATION

> **Date:** May 1, 2026  
> **Status:** Ready for Production  
> **Version:** Siwa Oasis v0.1.0

---

## ✅ PRE-DEPLOYMENT DATABASE VERIFICATION

### Database Schema Status
- ✓ Schema file: `schema.sql` (385+ lines)
- ✓ Migration file: `scratch/migration_section_types.sql` (Ready)
- ✓ Tables: 18+ tables with proper relationships
- ✓ Seed data: Default accounts, business types, sections
- ✓ Character set: UTF-8 MB4 (supports all languages)

### Default Admin Accounts (Auto-Created by auth.ts)
When database is empty, first login will auto-create these:

```
Email: super@siwa.com
Password: super123
Role: super_admin
Tier: premium

Email: content@siwa.com
Password: content123
Role: content_admin
Tier: premium

Email: salesmanager@siwa.com
Password: sales123
Role: sales_manager
Tier: premium

Email: support@siwa.com
Password: support123
Role: support_agent
Tier: basic

Email: salesman@siwa.com
Password: salesman123
Role: salesman
Tier: free

Email: vendor@siwa.com
Password: vendor123
Role: vendor
Tier: free
```

⚠️ **CHANGE THESE PASSWORDS IMMEDIATELY AFTER FIRST LOGIN!**

---

## 📦 DEPLOYMENT FILES CHECKLIST

### Essential Files to Upload

```
✓ src/              - Application source code
✓ public/           - Static assets (images, CSS, fonts)
✓ .next/            - Pre-built Next.js app (CRITICAL)
✓ server.js         - Node.js startup file
✓ package.json      - Dependencies list
✓ package-lock.json - Dependency lock
✓ next.config.ts    - Next.js configuration
✓ tsconfig.json     - TypeScript configuration
```

### Database Files

```
✓ schema.sql                               - Main database schema
✓ scratch/migration_section_types.sql     - Migration for new features
✓ scratch/seed_*.sql                      - Additional seed data (optional)
```

### Configuration Files

```
✓ .env.example     - Environment variables template
✓ deployment-config.json - Deployment settings
```

---

## 🔧 ENVIRONMENT VARIABLES FOR CPANEL

Save these in cPanel → Setup Node.js App → Environment Variables:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=hsnfzljy_siwa_admin
DB_PASSWORD=PiCo@@4##73
DB_NAME=hsnfzljy_siwa_oasis
JWT_SECRET=5b9c2a8d3e7f1b4a6d9c0e2f5a8b3d7e1f4a6c9d0b2e5f8a3d6e9f0a2b5c8d1e
SESSION_COOKIE_NAME=siwa_session
NEXT_PUBLIC_APP_URL=https://siwify.com
NODE_ENV=production
```

**Generate new JWT_SECRET for production:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ DATABASE SETUP ON CPANEL

### Step 1: Create Database
1. cPanel → MySQL Databases
2. Create Database: `hsnfzljy_siwa_oasis`
3. Create User: `hsnfzljy_siwa_admin` with password `PiCo@@4##73`
4. Add user to database with **ALL PRIVILEGES**

### Step 2: Import Schema
1. cPanel → phpMyAdmin
2. Select database: `hsnfzljy_siwa_oasis`
3. Click "Import" tab
4. Upload file: `schema.sql`
5. Click "Go"
6. Wait for success message

### Step 3: Run Migration
1. Click "SQL" tab in phpMyAdmin
2. Copy/paste contents of: `scratch/migration_section_types.sql`
3. Click "Go"
4. Verify no errors

### Step 4: Verify Tables Created
Run this SQL query in phpMyAdmin:

```sql
SHOW TABLES;
```

Should display 18+ tables:
```
profiles, locations, business_types, sections, field_definitions,
form_fields, form_templates, form_submissions, business_cards,
custom_expressions, search_policies, search_engines, 
website_templates, businesses, upgrade_requests, audit_log,
activity_log, subscription_tiers, minisite_templates, 
experience_packages
```

### Step 5: Verify Default Data
```sql
-- Check admin accounts
SELECT id, email, role, display_name FROM profiles;

-- Check business types
SELECT id, name, is_parent FROM business_types LIMIT 10;

-- Check sections
SELECT id, name, section_type FROM sections;

-- Check subscription tiers
SELECT * FROM subscription_tiers;
```

---

## 🚀 NODE.JS APP SETUP ON CPANEL

### Step 1: Create Application
1. cPanel → Setup Node.js App
2. Click "Create Application"
3. Configure:
   ```
   Node.js version: 20.x (or 18.x)
   Application mode: production
   Application root: public_html/siwa-oasis
   Application URL: siwify.com (or your domain)
   Application startup file: server.js
   ```
4. Click "Create"

### Step 2: Upload Files
1. Open File Manager
2. Navigate to: `/home/hsnfzljy/public_html/siwa-oasis`
3. Upload these folders and files:
   - `.next/` folder
   - `public/` folder
   - `src/` folder
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `next.config.ts`
   - `tsconfig.json`

### Step 3: Install Dependencies
1. In Setup Node.js App, click "Run NPM Install"
2. Wait 2-5 minutes
3. Check for success message

### Step 4: Add Environment Variables
In Setup Node.js App → Environment Variables, add:

| Variable | Value |
|----------|-------|
| DB_HOST | localhost |
| DB_PORT | 3306 |
| DB_USER | hsnfzljy_siwa_admin |
| DB_PASSWORD | PiCo@@4##73 |
| DB_NAME | hsnfzljy_siwa_oasis |
| JWT_SECRET | [64-char hex string] |
| SESSION_COOKIE_NAME | siwa_session |
| NEXT_PUBLIC_APP_URL | https://siwify.com |
| NODE_ENV | production |

### Step 5: Start Application
1. Click "Restart" button
2. Wait for green dot (Running status)
3. Check status shows "Running"

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Homepage
```
URL: https://siwify.com
Expected: Page loads without errors
Action: Open browser console (F12) and check for errors
```

### Test 2: Login
```
URL: https://siwify.com/login
Email: super@siwa.com
Password: super123
Expected: Redirects to admin dashboard
```

### Test 3: Admin Dashboard
```
URL: https://siwify.com/admin/governance
Expected: Governance Orchestrator page loads
Check: All sections and data visible
```

### Test 4: Database Connection
```
URL: https://siwify.com/admin/form-builder-enhanced
Expected: Form builder loads
Action: Create test business type
Check: Data saves to database
```

### Test 5: View Logs
```
cPanel → Setup Node.js App → "View Logs"
Check: No error messages
Expected: Startup logs show "Ready on port [PORT]"
```

---

## 🔒 SECURITY CHECKLIST

After deployment:

- [ ] Change all default admin passwords
- [ ] Enable SSL/HTTPS (verify green lock in browser)
- [ ] Check `.env` file is NOT publicly accessible
  - Test: Visit `https://siwify.com/.env`
  - Should show: 404 or 403 error (NOT file contents)
- [ ] Review audit log for suspicious activity
- [ ] Set backup schedule in cPanel
- [ ] Enable database backups

---

## 🆘 TROUBLESHOOTING

### Issue: 502 Bad Gateway
**Solution:**
1. Check Node.js version: 20.x or 18.x required
2. View logs in cPanel
3. Increase memory allocation to 1024 MB
4. Verify `server.js` exists in app root
5. Click "Restart"

### Issue: Database Connection Error
**Solution:**
1. Verify DB credentials in environment variables
2. Check database exists: cPanel → MySQL Databases
3. Verify user has ALL PRIVILEGES
4. Ensure DB_HOST is `localhost` (not 127.0.0.1)
5. Test connection: cPanel → phpMyAdmin

### Issue: Build or NPM Install Fails
**Solution:**
1. Check disk space: cPanel → Statistics
2. Verify Node.js version compatibility
3. Delete `node_modules` folder and try again
4. Check `package.json` is valid JSON

### Issue: 404 Errors on Routes
**Solution:**
1. Check `.next/` folder was uploaded
2. Verify Apache `mod_rewrite` enabled
3. Restart Node.js app
4. Check browser console for errors

### Issue: White Screen
**Solution:**
1. Check browser console (F12) for errors
2. Verify all environment variables set
3. Check `.next/` folder exists
4. View app logs: cPanel → Setup Node.js App → View Logs

---

## 📞 SUPPORT INFORMATION

**Having issues?**

1. Check the troubleshooting section above
2. View application logs in cPanel
3. Check browser console (F12)
4. Verify database connection
5. Ensure all files were uploaded correctly
6. Verify Node.js version is 20.x or 18.x

**Critical Files to Backup:**
- `.env` file (environment variables)
- Database (export from phpMyAdmin regularly)
- `/home/hsnfzljy/public_html/siwa-oasis` folder

---

## 📋 FINAL SIGN-OFF

```
Project: Siwa Oasis Platform
Version: 0.1.0
Node.js: 20.x (LTS)
Next.js: 15.1.0
React: 19.0.0
Database: MySQL 5.7+
Status: ✅ READY FOR PRODUCTION

Deployment Date: _______________
Deployed By: _______________
Verified By: _______________
```

---

**Last Updated:** May 1, 2026  
**Next Steps:** Follow the deployment steps above and test thoroughly before going live!

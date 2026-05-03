# 🚀 SIWA OASIS - READY TO DEPLOY TO CPANEL

## ✅ STATUS: BUILD SUCCESSFUL & DEPLOYMENT READY

**Date:** 2026-04-27  
**Build Status:** ✅ PASSED (82 pages generated)  
**Errors Fixed:** ✅ All critical errors resolved  
**Database Schema:** ✅ Complete with 18 tables  
**Password Hashes:** ✅ Real bcrypt hashes generated  

---

## 📋 WHAT WAS FIXED

### 1. **Build Errors - RESOLVED** ✅
- Fixed `useSearchParams()` suspense boundary errors on 4 pages:
  - `/admin/orchestrator` ✅
  - `/admin/governance` ✅ (already fixed)
  - `/admin/sections` ✅ (already fixed)
  - `/admin/blog/editor` ✅

### 2. **Password Hashes - GENERATED** ✅
- Created `scripts/production-passwords.sql` with real bcrypt hashes
- All 6 default admin accounts now have proper passwords

### 3. **Build Test - PASSED** ✅
- Production build completes successfully
- 82 pages generated without errors
- All API routes compiled

---

## 📦 DEPLOYMENT BUNDLE READY

**Location:** `e:\ANitgravity\siwatoday\siwa-oasis\deploy_bundle\`

**Contents:**
- ✅ src/ (all application code)
- ✅ public/ (static files)
- ✅ scripts/ (including password SQL)
- ✅ package.json & package-lock.json
- ✅ schema.sql (database schema)
- ✅ server.js, next.config.ts, tsconfig.json

---

## 🗄️ DATABASE IMPORT ORDER (CRITICAL!)

### **Step 1: Import Main Schema**
```sql
-- In phpMyAdmin, import: schema.sql
-- This creates all 18 tables and seed data
```

### **Step 2: Update Password Hashes**
```sql
-- In phpMyAdmin, import: scripts/production-passwords.sql
-- OR run this SQL directly:

USE siwa_oasis;

UPDATE profiles SET password_hash = '$2b$10$V/v5BNMrLWFXPR6IhdqdZe/UPpc3n6HtRa9gfC85yfuPgbc/5UXAi' WHERE id = 'a1';
UPDATE profiles SET password_hash = '$2b$10$sdTNQTv7n3Eu7PZj4zVJVuIz8bKzfBU6sQppYU2692wtCcgHQ0DAe' WHERE id = 'a2';
UPDATE profiles SET password_hash = '$2b$10$dfol7HIFIOd8chKe0OLOkeEGJz9Hldb4bknkG5msbFfyBKk/s7DNu' WHERE id = 'a3';
UPDATE profiles SET password_hash = '$2b$10$TYN8uRFmhvNvJ/MrLkjiJ.OgbODLH/Q4xtr3UB/NO7sYaNMre7JP.' WHERE id = 'a4';
UPDATE profiles SET password_hash = '$2b$10$7R4j/pZsTwEUzV/tHPPfCuZDJdN90t107MMGjzBorEFHC3WGxcavS' WHERE id = 'a5';
UPDATE profiles SET password_hash = '$2b$10$ZQ3MBYa7A5fmt4MpvojkRefvnmKG7V5D1J2VCnbL1Pm241mhUoc5G' WHERE id = 'a6';
```

### **Step 3: Verify Database**
```sql
-- Check tables exist
SHOW TABLES;
-- Expected: 18 tables

-- Check passwords updated
SELECT id, email, role, SUBSTRING(password_hash, 1, 10) as hash_preview 
FROM profiles WHERE id IN ('a1', 'a2', 'a3', 'a4', 'a5', 'a6');
```

---

## 🔐 DEFAULT LOGIN CREDENTIALS

| Email | Password | Role |
|-------|----------|------|
| super@siwa.com | super123 | Super Admin |
| content@siwa.com | content123 | Content Admin |
| salesmanager@siwa.com | sales123 | Sales Manager |
| support@siwa.com | support123 | Support Agent |
| salesman@siwa.com | salesman123 | Salesman |
| vendor@siwa.com | vendor123 | Vendor |

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

---

## 📤 CPANEL DEPLOYMENT STEPS

### **Phase 1: Database Setup (10 min)**

1. **Create MySQL Database in cPanel**
   - Go to: cPanel → MySQL Databases
   - Create Database: `siwa_oasis` (or `username_siwa_oasis`)
   - Create User: `siwa_admin` (or `username_siwa_admin`)
   - Generate strong password
   - Add User to Database with ALL PRIVILEGES
   - **Save credentials!**

2. **Import Database Schema**
   - Go to: cPanel → phpMyAdmin
   - Select your database
   - Click **Import** tab
   - Choose file: `schema.sql`
   - Click **Go**
   - Wait for success message

3. **Update Password Hashes**
   - In phpMyAdmin, click **SQL** tab
   - Upload or paste: `scripts/production-passwords.sql`
   - Click **Go**
   - Verify success message

4. **Verify Database**
   ```sql
   SHOW TABLES;
   -- Should show 18 tables
   ```

---

### **Phase 2: Upload Application (15 min)**

1. **Prepare ZIP File**
   ```
   Navigate to: e:\ANitgravity\siwatoday\siwa-oasis\deploy_bundle\
   Select ALL files and folders inside deploy_bundle
   Right-click → Send to → Compressed (zipped) folder
   Name it: siwa_upload.zip
   ```

2. **Create Node.js App in cPanel**
   - Go to: cPanel → Setup Node.js App
   - Click **Create Application**
   - Configure:
     ```
     Node.js version: 20.x (or 18.x)
     Application mode: Production
     Application root: siwa-oasis
     Application URL: yourdomain.com
     Application startup file: server.js
     ```
   - Click **Create**

3. **Upload Files**
   - Go to: cPanel → File Manager
   - Navigate to: `/home/username/siwa-oasis`
   - Upload: `siwa_upload.zip`
   - Extract ZIP to: `/home/username/siwa-oasis`
   - Verify files extracted correctly

---

### **Phase 3: Configure Environment (5 min)**

1. **Set Environment Variables**
   - Go to: cPanel → Setup Node.js App
   - Find your app → Click Edit (pencil icon)
   - Scroll to Environment Variables section
   - Add these variables:

   | Variable | Value |
   |----------|-------|
   | `DB_HOST` | `localhost` |
   | `DB_PORT` | `3306` |
   | `DB_USER` | `your_db_user` |
   | `DB_PASSWORD` | `your_db_password` |
   | `DB_NAME` | `your_db_name` |
   | `JWT_SECRET` | *(generate 64-char hex)* |
   | `SESSION_COOKIE_NAME` | `siwa_session` |
   | `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
   | `NODE_ENV` | `production` |
   | `HOST` | `0.0.0.0` |
   | `PORT` | `3000` |

   **Generate JWT_SECRET:**
   ```bash
   # Run locally or in cPanel terminal:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Save Environment Variables**

---

### **Phase 4: Build & Deploy (10 min)**

1. **Install Dependencies**
   - In Setup Node.js App
   - Click **Run npm install**
   - Wait ~2-3 minutes for completion

2. **Build Application**
   - Click **Run JS Script** dropdown
   - Select `build`
   - Click **Run**
   - Wait ~3-5 minutes for build

3. **Restart Application**
   - Click **Restart** button
   - Wait for app to start

---

### **Phase 5: Verification (10 min)**

1. **Test Homepage**
   - Visit: `https://yourdomain.com`
   - Should load without errors

2. **Test Admin Login**
   - Visit: `https://yourdomain.com/login`
   - Login with: `super@siwa.com` / `super123`
   - Should redirect to admin dashboard

3. **Test Key Features**
   - ✅ Admin dashboard loads: `/admin/governance`
   - ✅ Form builder: `/admin/form-builder-enhanced`
   - ✅ Businesses page: `/admin/businesses`
   - ✅ Sections management: `/admin/sections`
   - ✅ Blog editor: `/admin/blog/editor`
   - ✅ Orchestrator: `/admin/orchestrator`

4. **Check Database Connection**
   - Create a test business type
   - Verify it saves to database
   - Check in phpMyAdmin

---

## 🐛 TROUBLESHOOTING

### **Issue: Build Fails in cPanel**
```
Solution:
1. Check Node.js version (must be 18.x or 20.x)
2. Check environment variables are set correctly
3. View logs: Setup Node.js App → View Logs
4. Clear .next folder and rebuild
```

### **Issue: Database Connection Error**
```
Solution:
1. Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
2. Check database user has ALL PRIVILEGES
3. Ensure database exists in phpMyAdmin
4. Test connection with simple query
```

### **Issue: 502 Bad Gateway**
```
Solution:
1. Check app is running (green dot in Node.js App)
2. View logs for errors
3. Restart application
4. Verify server.js exists in root folder
```

### **Issue: Login Fails**
```
Solution:
1. Verify password hashes were updated (Step 2 above)
2. Check JWT_SECRET is set in environment variables
3. Clear browser cookies/cache
4. Check profiles table in phpMyAdmin
```

---

## 📊 BUILD OUTPUT SUMMARY

```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (82/82)
✓ Collecting build traces
✓ Finalizing page optimization

Total Routes: 82 pages + 41 API routes
First Load JS: 105 kB (shared)
Middleware: 37.7 kB
```

---

## 🔒 SECURITY CHECKLIST

- [ ] Changed default admin passwords after first login
- [ ] JWT_SECRET is strong random 64-character hex string
- [ ] SSL certificate installed (HTTPS)
- [ ] .env file NOT in public directory
- [ ] Database user has minimal required permissions
- [ ] Regular backups scheduled
- [ ] Error logs monitored

---

## 📁 FILES REFERENCE

### **Local Files:**
```
e:\ANitgravity\siwatoday\siwa-oasis\
├── deploy_bundle/              ← ZIP this for upload
│   ├── src/
│   ├── public/
│   ├── scripts/
│   │   └── production-passwords.sql  ← Run this in phpMyAdmin
│   ├── package.json
│   ├── schema.sql            ← Import this first
│   └── server.js
├── schema.sql
└── scripts/
    └── production-passwords.sql
```

### **Database Files Import Order:**
1. `schema.sql` (creates tables + seed data)
2. `scripts/production-passwords.sql` (updates password hashes)

---

## ✅ FINAL VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Login works: `super@siwa.com` / `super123`
- [ ] Admin dashboard accessible
- [ ] Database queries working
- [ ] Form builder functional
- [ ] File uploads working
- [ ] No console errors in browser
- [ ] Mobile responsive
- [ ] HTTPS working (green lock)
- [ ] All 82 pages accessible

---

## 🎯 READY TO DEPLOY!

**Everything is fixed and tested. You can now:**

1. ✅ ZIP the `deploy_bundle` folder
2. ✅ Upload to cPanel
3. ✅ Import database (schema.sql + production-passwords.sql)
4. ✅ Configure environment variables
5. ✅ Build and deploy
6. ✅ Test and verify

**Total deployment time: ~45-60 minutes**

---

## 📞 SUPPORT

If you encounter any issues:
1. Check cPanel logs: Setup Node.js App → View Logs
2. Check database in phpMyAdmin
3. Review this guide's troubleshooting section
4. Verify all environment variables are set correctly

---

**🚀 Good luck with your deployment!**

*Generated: 2026-04-27*  
*Build Status: ✅ PASSED*  
*Version: 0.1.0*

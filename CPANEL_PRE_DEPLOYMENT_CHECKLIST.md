# 📋 CPANEL PRE-DEPLOYMENT INFORMATION GATHERING CHECKLIST

## ⚠️ IMPORTANT: Complete This BEFORE Uploading Anything to cPanel

This document ensures you gather ALL necessary information from your cPanel hosting provider BEFORE attempting deployment. This prevents failed deployments, data loss, and configuration errors.

---

## 🎯 PURPOSE

Before deploying your Next.js application to cPanel, you must verify:
1. ✅ Your cPanel supports Node.js applications
2. ✅ You have the correct versions and permissions
3. ✅ All required credentials and configurations are ready
4. ✅ Your hosting environment is compatible with Next.js 15

---

## 📊 SECTION 1: CPANEL CAPABILITY VERIFICATION

### 1.1 Node.js Support Check
**Contact your hosting provider or check cPanel for:**

- [ ] **Is "Setup Node.js App" available in cPanel?**
  - Location: cPanel Home → Software section
  - If NOT visible, contact hosting support to enable it
  
- [ ] **What Node.js versions are available?**
  - Required: Node.js **18.x** or **20.x** (LTS versions)
  - Recommended: **20.x** (Latest LTS)
  - ❌ NOT Compatible: Node.js 16.x or below, Node.js 21+
  
- [ ] **How to check:**
  1. Login to cPanel
  2. Look for "Setup Node.js App" or "Node.js Selector"
  3. Click it and see available versions in dropdown
  
- [ ] **If Node.js app feature is missing:**
  - Contact hosting support: "Please enable CloudLinux Node.js Selector or CageFS Node.js support"
  - Alternative: Consider upgrading hosting plan or switching providers

### 1.2 Resource Allocation Check
**Verify your hosting plan has sufficient resources:**

- [ ] **RAM Allocation for Node.js App:**
  - Minimum: **512 MB**
  - Recommended: **1024 MB (1 GB)** or higher
  - Where to check: cPanel → Setup Node.js App → Memory Limit setting
  
- [ ] **Disk Space Available:**
  - Minimum: **2 GB** free space
  - Where to check: cPanel Home → Statistics sidebar (right side)
  
- [ ] **CPU Allocation:**
  - Check if your plan has CPU limits
  - Where to check: cPanel → Resource Usage or CPU Usage
  
- [ ] **Process Limits:**
  - Some hosts limit number of Node.js processes
  - Ask support: "What is the maximum number of Node.js processes allowed?"

### 1.3 Apache/Server Configuration
**Verify server compatibility:**

- [ ] **Is Apache web server installed?**
  - Required for .htaccess rewrite rules
  - Most cPanel hosts use Apache by default
  
- [ ] **Is mod_rewrite enabled?**
  - Required for URL routing
  - Ask support if unsure
  
- [ ] **Is mod_proxy enabled?**
  - Required for proxying requests to Node.js
  - Usually enabled by default on cPanel
  
- [ ] **Passenger or Phusion Passenger installed?**
  - This is what cPanel uses to run Node.js apps
  - Version should be 5.x or higher

---

## 🔐 SECTION 2: CREDENTIALS & ACCESS INFORMATION

### 2.1 cPanel Login Details
**Gather and store securely:**

- [ ] **cPanel URL:** _________________________________
  - Example: https://yourdomain.com/cpanel or https://server.hosting.com:2083
  
- [ ] **cPanel Username:** _________________________________
  
- [ ] **cPanel Password:** _________________________________
  - Store in password manager, NOT in plain text files

### 2.2 Database Credentials
**Create these in cPanel → MySQL Databases:**

#### Database Creation Steps:
1. Go to cPanel → **MySQL Databases**
2. Create Database:
   - [ ] **Database Name:** _________________________________
     - Format: `username_dbname` (cPanel auto-adds prefix)
     - Example: `siwatoday_main` or `youruser_siwa`
   
3. Create Database User:
   - [ ] **Database Username:** _________________________________
     - Format: `username_dbuser`
     - Example: `siwatoday_admin` or `youruser_siwauser`
   
   - [ ] **Database Password:** _________________________________
     - Use cPanel's Password Generator
     - Strength: Very Strong (100+)
     - **SAVE THIS IMMEDIATELY**

4. Add User to Database:
   - [ ] Select user and database
   - [ ] Check **ALL PRIVILEGES**
   - [ ] Click "Add"
   - [ ] Confirm success message

5. Record Final Credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=_________________ (full username with prefix)
   DB_PASSWORD=_________________ (the password you saved)
   DB_NAME=_________________ (full database name with prefix)
   ```

6. **Test Database Access:**
   - [ ] Go to phpMyAdmin in cPanel
   - [ ] Select your database
   - [ ] Run query: `SELECT 1;`
   - [ ] Should return: `1`

### 2.3 Domain Information
**Document your domain setup:**

- [ ] **Primary Domain:** _________________________________
  - Example: yourdomain.com
  
- [ ] **Will app run on:** 
  - [ ] Main domain (yourdomain.com)
  - [ ] Subdomain (app.yourdomain.com) ← **RECOMMENDED**
  - [ ] Addon domain (different-domain.com)
  
- [ ] **If subdomain, name:** _________________________________
  - Example: app, siwa, oasis, admin
  
- [ ] **SSL Certificate Status:**
  - [ ] Already installed (Let's Encrypt / AutoSSL)
  - [ ] Need to install (cPanel → SSL/TLS Status)
  - [ ] Will install after deployment

### 2.4 SSH Access (Optional but Helpful)
**If you need SSH for troubleshooting:**

- [ ] **SSH Enabled?** 
  - Check with hosting provider
  - Not required but helpful for debugging
  
- [ ] **SSH Host:** _________________________________
  - Example: yourdomain.com or server IP
  
- [ ] **SSH Port:** _________________________________
  - Default: 22 or 2222 (cPanel)
  
- [ ] **SSH Username:** _________________________________
  - Usually same as cPanel username
  
- [ ] **SSH Password/Key:** _________________________________

---

## 🗄️ SECTION 3: DATABASE PREPARATION

### 3.1 Schema Files Ready
**Ensure these files are prepared:**

- [ ] **Main Schema File:** `schema.sql`
  - Location: `e:\ANitgravity\siwatoday\siwa-oasis\schema.sql`
  - Contains: Full database structure and initial data
  
- [ ] **Migration Files (if any):**
  - [ ] `scratch/migration_section_types.sql`
  - List any other migrations: _________________________________

### 3.2 Default Passwords to Change
**⚠️ SECURITY RISK: Change these immediately after deployment!**

Current default admin accounts in schema.sql:
```
Email: super@siwa.com
Password: super123

Email: admin@siwa.com  
Password: admin123
```

**Action Required:**
- [ ] Generate new bcrypt hashes for production passwords
- [ ] Command to generate hash:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('YOUR_NEW_PASSWORD', 10))"
  ```
- [ ] Or use online bcrypt generator (search "bcrypt hash generator")
- [ ] Plan to update passwords via phpMyAdmin after deployment

### 3.3 Database Import Plan
**Steps to execute in order:**

1. [ ] Login to cPanel → phpMyAdmin
2. [ ] Select your database from left sidebar
3. [ ] Click **Import** tab
4. [ ] Choose file: `schema.sql`
5. [ ] Click **Go**
6. [ ] Wait for "Import has been successfully finished" message
7. [ ] If migrations exist:
   - [ ] Click **SQL** tab
   - [ ] Copy/paste migration SQL
   - [ ] Click **Go**
8. [ ] Verify tables created:
   ```sql
   SHOW TABLES;
   ```
   Should show 18+ tables including: profiles, business_types, sections, form_fields, etc.

---

## 🔑 SECTION 4: ENVIRONMENT VARIABLES PREPARATION

### 4.1 Generate Security Keys
**Run these commands locally BEFORE deployment:**

#### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **JWT_SECRET Generated:** _________________________________
  - Should be 64 character hex string
  - Example: a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
  - **KEEP THIS SECURE - Do not share**

#### Generate Session Secret (optional extra security):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

- [ ] **Additional Secret (if needed):** _________________________________

### 4.2 Complete Environment Variables List
**Fill in ALL values before deployment:**

```
# ========================================
# SIWA OASIS - Production Environment Variables
# ========================================
# Prepared Date: ___________________
# Domain: ___________________
# ========================================

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=_________________
DB_PASSWORD=_________________
DB_NAME=_________________

# Authentication & Security
JWT_SECRET=_________________
SESSION_COOKIE_NAME=siwa_session

# Application Configuration
NEXT_PUBLIC_APP_URL=https://_________________
NODE_ENV=production

# Server Configuration (for cPanel)
HOST=0.0.0.0
PORT=3000
```

**Double-check:**
- [ ] All fields filled in
- [ ] No spaces before/after values
- [ ] JWT_SECRET is 64 characters
- [ ] DB credentials tested in phpMyAdmin
- [ ] URL uses https:// (not http://)

---

## 📦 SECTION 5: APPLICATION BUNDLE VERIFICATION

### 5.1 Build the Deployment Bundle
**Execute these commands locally:**

```bash
cd e:\ANitgravity\siwatoday\siwa-oasis

# Run deployment preparation script
node scripts/deploy-prepare.js
```

- [ ] Script ran successfully
- [ ] Output showed all files included
- [ ] No errors in console

### 5.2 Verify Bundle Contents
**Check `deploy_bundle` folder has:**

- [ ] `src/` directory
- [ ] `public/` directory
- [ ] `scripts/` directory
- [ ] `.next/` directory (build output)
- [ ] `package.json` (with simplified build script)
- [ ] `package-lock.json`
- [ ] `tsconfig.json`
- [ ] `next.config.ts`
- [ ] `.env.example`
- [ ] `server.js`
- [ ] `.htaccess` (NEW - for cPanel routing)
- [ ] `schema.sql`
- [ ] `DEPLOYMENT.md`

### 5.3 Critical File Checks
**Verify these specific files:**

#### Check package.json build script:
```bash
cat deploy_bundle/package.json
```
Should show:
```json
"scripts": {
  "build": "next build",
  "build:production": "next build"
}
```

- [ ] ✅ Build script is `next build` (NOT `NODE_OPTIONS=...`)

#### Check .htaccess exists:
```bash
cat deploy_bundle/.htaccess
```
Should contain Apache rewrite rules.

- [ ] ✅ .htaccess file exists with rewrite rules

#### Check next.config.ts:
```bash
cat deploy_bundle/next.config.ts
```
Should NOT contain `swcMinify: true`.

- [ ] ✅ No deprecated swcMinify option

### 5.4 Create ZIP File
**Prepare final upload package:**

1. [ ] Navigate to `deploy_bundle` folder
2. [ ] Select ALL files and folders (Ctrl+A)
3. [ ] Right-click → Send to → Compressed (zipped) folder
4. [ ] Name it: `siwa_upload.zip`
5. [ ] Note file size: ___________________ MB
6. [ ] Verify ZIP is not corrupted:
   - Double-click to open
   - Should see all files inside

---

## 🚀 SECTION 6: CPANEL DEPLOYMENT PLAN

### 6.1 Deployment Order (CRITICAL - Follow Exactly)

**Phase 1: Database Setup** (Do this FIRST)
1. [ ] Create MySQL Database in cPanel
2. [ ] Create Database User
3. [ ] Add User to Database with ALL PRIVILEGES
4. [ ] Import schema.sql via phpMyAdmin
5. [ ] Run migrations (if any)
6. [ ] Verify tables created

**Phase 2: Node.js App Creation**
1. [ ] Go to cPanel → Setup Node.js App
2. [ ] Click "Create Application"
3. [ ] Configure settings (see Section 7)
4. [ ] Click "Create"

**Phase 3: File Upload**
1. [ ] Open cPanel File Manager
2. [ ] Navigate to app root directory
3. [ ] Upload `siwa_upload.zip`
4. [ ] Extract ZIP in same directory
5. [ ] Verify files extracted correctly

**Phase 4: Environment Configuration**
1. [ ] Go back to Setup Node.js App
2. [ ] Edit the application
3. [ ] Add all environment variables (from Section 4.2)
4. [ ] Click "Save"

**Phase 5: Install & Build**
1. [ ] Click "Run npm install"
2. [ ] Wait for completion (~2-3 minutes)
3. [ ] Click "Run JS Script" → select "build"
4. [ ] Wait for build (~3-5 minutes)
5. [ ] Click "Restart"

**Phase 6: Verification**
1. [ ] Check app shows green "running" indicator
2. [ ] Visit your domain in browser
3. [ ] Test homepage loads
4. [ ] Test admin login
5. [ ] Check for console errors

### 6.2 Rollback Plan (If Something Goes Wrong)

**If deployment fails:**

1. **Don't Panic!** Your data is safe if you followed database steps first.

2. **Diagnose:**
   - [ ] Check logs: Setup Node.js App → View Logs
   - [ ] Note specific error messages
   - [ ] Screenshot the error

3. **Common Fixes:**
   - [ ] Memory issue → Increase to 1024MB
   - [ ] Build failed → Re-extract ZIP, try build again
   - [ ] 502 error → Check environment variables
   - [ ] App won't start → Verify Node.js version is 18.x or 20.x

4. **Full Rollback (if needed):**
   - [ ] Delete Node.js app in cPanel
   - [ ] Delete all files via File Manager
   - [ ] Start fresh with new app
   - [ ] Database remains intact (don't delete it!)

---

## ⚙️ SECTION 7: CPANEL CONFIGURATION TEMPLATE

### 7.1 Node.js Application Settings
**Use these exact settings when creating the app:**

```
┌─────────────────────────────────────────────────┐
│ Node.js Application Configuration               │
├─────────────────────────────────────────────────┤
│ Node.js version:      20.x (or 18.x)            │
│ Application mode:     Production                │
│ Application root:     siwa-oasis                │
│ Application URL:      yourdomain.com            │
│ Application startup   server.js                 │
│ file:                                             │
│                                                 │
│ Passenger log file:   [Auto-generated]          │
│ Memory Limit:         1024 MB                   │
└─────────────────────────────────────────────────┘
```

**Important Notes:**
- **Application root**: This creates folder `/home/username/siwa-oasis`
- **Application URL**: Can be changed later to subdomain
- **Memory Limit**: Set to 1024 MB minimum (critical for build)

### 7.2 Environment Variables Entry Form
**Enter these one by one in cPanel → Setup Node.js App → Edit → Environment Variables:**

| # | Variable Name | Value | Notes |
|---|--------------|-------|-------|
| 1 | `DB_HOST` | `localhost` | Usually localhost |
| 2 | `DB_PORT` | `3306` | Default MySQL port |
| 3 | `DB_USER` | `_______` | Full username with cPanel prefix |
| 4 | `DB_PASSWORD` | `_______` | The database password |
| 5 | `DB_NAME` | `_______` | Full database name with prefix |
| 6 | `JWT_SECRET` | `_______` | 64-char hex string you generated |
| 7 | `SESSION_COOKIE_NAME` | `siwa_session` | Keep as is |
| 8 | `NEXT_PUBLIC_APP_URL` | `https://_______` | Your domain with https |
| 9 | `NODE_ENV` | `production` | Must be "production" |
| 10 | `HOST` | `0.0.0.0` | For cPanel compatibility |
| 11 | `PORT` | `3000` | Default port |

**Tips:**
- Enter one variable at a time
- Click "Save" after adding all
- Double-check for typos (especially DB credentials)
- No spaces before or after values

---

## 🔍 SECTION 8: PRE-FLIGHT VERIFICATION CHECKLIST

### 8.1 Final Checks BEFORE Uploading

**Answer YES to all before proceeding:**

- [ ] Do I have cPanel login credentials?
- [ ] Is "Setup Node.js App" available in my cPanel?
- [ ] Is Node.js 18.x or 20.x available?
- [ ] Have I created the MySQL database?
- [ ] Have I created the database user?
- [ ] Have I added user to database with ALL PRIVILEGES?
- [ ] Have I imported schema.sql via phpMyAdmin?
- [ ] Have I verified tables were created?
- [ ] Have I generated a JWT_SECRET (64 chars)?
- [ ] Have I filled in ALL environment variables?
- [ ] Have I run `node scripts/deploy-prepare.js`?
- [ ] Does `deploy_bundle/package.json` have `"build": "next build"`?
- [ ] Does `deploy_bundle/.htaccess` exist?
- [ ] Have I created `siwa_upload.zip` from deploy_bundle?
- [ ] Do I have at least 2GB free disk space?
- [ ] Do I have a plan to change default admin passwords?

### 8.2 Hosting Provider Compatibility Questions
**If unsure about anything, ask your hosting support:**

```
Subject: Node.js Application Deployment Requirements

Hello,

I need to deploy a Next.js 15 application to my cPanel hosting. 
Please confirm the following:

1. Is "Setup Node.js App" or "Node.js Selector" available in my cPanel?
2. What Node.js versions are available? (Need 18.x or 20.x)
3. What is the maximum memory I can allocate to a Node.js app?
4. Is mod_rewrite and mod_proxy enabled on Apache?
5. Are there any restrictions on Node.js applications?
6. What is the process limit for Node.js apps?
7. Is Phusion Passenger installed? What version?

Thank you.
```

---

## 📝 SECTION 9: DEPLOYMENT LOG TEMPLATE

**Use this to track your deployment:**

```
===========================================
SIWA OASIS DEPLOYMENT LOG
===========================================
Date: ___________________
Time Started: ___________________
Domain: ___________________
cPanel Username: ___________________
===========================================

PHASE 1: DATABASE SETUP
------------------------
[ ] Database Created: ___________________ (name)
[ ] User Created: ___________________ (username)
[ ] User Added to DB: YES/NO
[ ] Schema Imported: YES/NO
[ ] Migrations Run: YES/NO
[ ] Tables Verified: YES/NO (count: ___)
Time Completed: ___________________

PHASE 2: NODE.JS APP CREATION
------------------------------
[ ] Node.js App Created: YES/NO
[ ] Node Version: ___________________
[ ] App Root: ___________________
[ ] App URL: ___________________
[ ] Startup File: server.js
[ ] Memory Limit: ___________________ MB
Time Completed: ___________________

PHASE 3: FILE UPLOAD
--------------------
[ ] ZIP Uploaded: YES/NO
[ ] ZIP Extracted: YES/NO
[ ] Files Verified: YES/NO
Time Completed: ___________________

PHASE 4: ENVIRONMENT VARIABLES
------------------------------
[ ] All Variables Added: YES/NO
[ ] Count: ___ / 11 variables
[ ] Saved: YES/NO
Time Completed: ___________________

PHASE 5: INSTALL & BUILD
------------------------
[ ] npm install: SUCCESS/FAILED
  - Time: ___________________
[ ] Build: SUCCESS/FAILED
  - Time: ___________________
  - Errors: ___________________
[ ] App Restarted: YES/NO
Time Completed: ___________________

PHASE 6: VERIFICATION
---------------------
[ ] App Running: YES/NO (green indicator)
[ ] Homepage Loads: YES/NO
[ ] Admin Login Works: YES/NO
[ ] No Console Errors: YES/NO
[ ] HTTPS Working: YES/NO
Time Completed: ___________________

ISSUES ENCOUNTERED:
-------------------
1. _________________________________
   Resolution: _________________________________

2. _________________________________
   Resolution: _________________________________

NOTES:
------
_________________________________________
_________________________________________

===========================================
DEPLOYMENT STATUS: SUCCESS / FAILED
===========================================
```

---

## 🆘 SECTION 10: EMERGENCY CONTACTS & RESOURCES

### 10.1 Support Contacts
**Fill in before deployment:**

- [ ] **Hosting Support Email:** _________________________________
- [ ] **Hosting Support Phone:** _________________________________
- [ ] **Hosting Support Chat:** URL: _________________________________
- [ ] **Support Ticket System:** URL: _________________________________

### 10.2 Important Documentation Links
**Bookmark these:**

- [ ] cPanel Documentation: https://documentation.cpanel.net/
- [ ] Node.js App Guide: https://docs.cloudlinux.com/index.html#node-js-selector
- [ ] Next.js Deployment: https://nextjs.org/docs/deployment
- [ ] MySQL/phpMyAdmin Guide: https://docs.phpmyadmin.net/

### 10.3 Local Support Files
**Keep these handy during deployment:**

- [ ] `TESTING_AND_DEPLOYMENT_FIXES.md` - Troubleshooting guide
- [ ] `DEPLOYMENT.md` - Quick deployment steps
- [ ] `schema.sql` - Database schema
- [ ] This file - Pre-deployment checklist

---

## ✅ FINAL CONFIRMATION

**Before you start the deployment, confirm:**

- [ ] I have completed ALL sections above
- [ ] I have gathered ALL required credentials
- [ ] I have verified cPanel compatibility
- [ ] I have prepared the deployment bundle
- [ ] I have a rollback plan
- [ ] I understand the deployment order
- [ ] I have support contacts ready
- [ ] I have set aside 1-2 hours for deployment

**Signature (mental commitment!):** _________________________________

**Date:** _________________________________

**Time to deploy:** _________________________________

---

## 🎯 POST-DEPLOYMENT IMMEDIATE ACTIONS

**Within first 10 minutes after successful deployment:**

1. [ ] **Change default admin passwords**
   - Login as super@siwa.com
   - Go to admin panel
   - Change password immediately
   - Or update via phpMyAdmin with new bcrypt hash

2. [ ] **Test critical features:**
   - [ ] Admin dashboard loads
   - [ ] Can create/edit entries
   - [ ] Database queries working
   - [ ] File uploads working (test image upload)
   - [ ] Authentication working (login/logout cycle)

3. [ ] **Setup SSL if not already:**
   - cPanel → SSL/TLS Status → Run AutoSSL
   - Wait for certificate installation

4. [ ] **Setup backups:**
   - cPanel → Backup Wizard
   - Schedule weekly backups
   - Include: Home directory + MySQL databases

5. [ ] **Monitor for 24 hours:**
   - Check logs daily
   - Monitor resource usage
   - Verify no errors in browser console

---

**REMEMBER: Database first, files second, config third, build last!**

**Good luck with your deployment! 🚀**

---

*Document Version: 1.0*  
*Created: 2026-04-28*  
*Next.js Version: 15.1.0*  
*Compatible cPanel Node.js: 18.x, 20.x*

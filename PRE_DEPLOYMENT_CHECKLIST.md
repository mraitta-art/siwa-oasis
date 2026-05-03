# 📋 PRE-DEPLOYMENT CHECKLIST

**Print this and fill it out before uploading to cPanel**

---

## 📅 DEPLOYMENT INFORMATION

Date: _______________________
Project: Siwa Oasis
Version: 1.0.0
Deployed By: _______________________

---

## 💻 SYSTEM COMPATIBILITY

### Node.js Version (CHECK ONE)
- [ ] Node.js 18.x (Compatible ✓)
- [ ] Node.js 20.x (Recommended ✓✓)
- [ ] Node.js 21+ (NOT RECOMMENDED ✗)
- [ ] Other: ____________

**Your cPanel Node.js Version:** ____________

---

## 🔐 DATABASE CREDENTIALS

Fill these out AFTER creating in cPanel MySQL Databases:

```
Database Host:        localhost ✓ (pre-filled)
Database Port:        3306 ✓ (pre-filled)
Database Name:        ___________________________________
Database User:        ___________________________________
Database Password:    ___________________________________
```

### Database Creation Steps (CHECK WHEN DONE)
- [ ] Created database in cPanel → MySQL Databases
- [ ] Created database user with strong password
- [ ] Added user to database with ALL PRIVILEGES
- [ ] Noted credentials above
- [ ] Tested connection (optional via PHP script)

---

## 🗄️ DATABASE SCHEMA

### Files to Import
- [ ] schema.sql (main schema - 385 lines)
- [ ] scratch/migration_section_types.sql (new features)

### Import Verification
Run these in phpMyAdmin after import:

```sql
-- Check 1: Tables exist
SHOW TABLES;
-- Expected: 18+ tables

-- Check 2: Section type column exists
DESCRIBE sections;
-- Expected: section_type column visible

-- Check 3: Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'YOUR_DB_NAME';
-- Expected: 18 or more
```

- [ ] Imported schema.sql successfully
- [ ] Ran migration_section_types.sql successfully
- [ ] Verified tables created (count: _____)
- [ ] Verified section_type column exists
- [ ] No SQL errors during import

---

## 🔑 ENVIRONMENT VARIABLES

Generate and fill these out:

### Required Variables

| Variable | Value | Status |
|----------|-------|--------|
| `DB_HOST` | `localhost` | ✓ Ready |
| `DB_PORT` | `3306` | ✓ Ready |
| `DB_USER` | ___________________ | ☐ Fill |
| `DB_PASSWORD` | ___________________ | ☐ Fill |
| `DB_NAME` | ___________________ | ☐ Fill |

### Security Variables

```
Generate JWT_SECRET:
Run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET: _________________________________________________________________
(64 character hex string)
```

| Variable | Value | Status |
|----------|-------|--------|
| `JWT_SECRET` | ___________________ | ☐ Generate |
| `SESSION_COOKIE_NAME` | `siwa_session` | ✓ Ready |

### Application Variables

| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_APP_URL` | https://_____________ | ☐ Fill domain |
| `NODE_ENV` | `production` | ✓ Ready |
| `HOST` | `0.0.0.0` | ✓ Ready |
| `PORT` | `3000` | ✓ Ready |

---

## 🌐 DOMAIN & HOSTING

### Domain Information
```
Domain Name:          https://_______________________________________
Subdomain (if any):   _______________________________________________
cPanel Username:      _______________________________________________
```

### SSL Certificate
- [ ] SSL certificate installed (Let's Encrypt recommended)
- [ ] HTTPS working (test in browser)
- [ ] Certificate not expired
- [ ] Auto-renewal enabled

---

## 📦 APPLICATION BUNDLE

### Generate Bundle
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
node scripts/deploy-prepare.js
```

- [ ] Ran deploy-prepare.js successfully
- [ ] deploy_bundle/ folder created
- [ ] Created siwa_upload.zip from deploy_bundle contents
- [ ] ZIP file size: ____________ MB
- [ ] ZIP contains: src/, public/, package.json, server.js, etc.

### Bundle Verification Checklist
Open siwa_upload.zip and verify these files exist:

- [ ] package.json
- [ ] package-lock.json
- [ ] server.js
- [ ] next.config.ts
- [ ] tsconfig.json
- [ ] .env.example
- [ ] schema.sql
- [ ] src/app/ (folder)
- [ ] src/components/ (folder)
- [ ] src/lib/ (folder)
- [ ] public/ (folder)

---

## 🚀 CPANEL SETUP

### Node.js Application Configuration

Fill these out when creating app in cPanel:

```
Application Mode:     Production ✓
Application Root:     /home/__________/siwa-oasis
Application URL:      https://______________________________
Application URL 2:    (leave blank if not using)
Startup File:         server.js
Node.js Version:      _______ (18.x or 20.x)
```

### Setup Steps (CHECK WHEN DONE)
- [ ] Created Node.js app in cPanel
- [ ] Application root set correctly
- [ ] Application URL configured
- [ ] Startup file: server.js
- [ ] Node.js version: _______
- [ ] App created successfully

---

## 📤 FILE UPLOAD

### Upload Steps
- [ ] Opened cPanel File Manager
- [ ] Navigated to: /home/username/siwa-oasis
- [ ] Uploaded siwa_upload.zip
- [ ] Upload completed successfully
- [ ] Extracted ZIP file
- [ ] Extraction completed without errors
- [ ] Verified files in directory

### Post-Extraction Verification
Check these files/folders exist in cPanel File Manager:

- [ ] src/
- [ ] public/
- [ ] package.json
- [ ] server.js
- [ ] next.config.ts
- [ ] .env.example

---

## ⚙️ ENVIRONMENT CONFIGURATION

### Add to Node.js App Environment Variables

In cPanel → Setup Node.js App → Edit → Environment Variables:

- [ ] DB_HOST = localhost
- [ ] DB_PORT = 3306
- [ ] DB_USER = ________________
- [ ] DB_PASSWORD = ________________
- [ ] DB_NAME = ________________
- [ ] JWT_SECRET = ________________
- [ ] SESSION_COOKIE_NAME = siwa_session
- [ ] NEXT_PUBLIC_APP_URL = ________________
- [ ] NODE_ENV = production

- [ ] Saved environment variables

---

## 🔨 BUILD & DEPLOY

### Build Process
In cPanel → Setup Node.js App:

- [ ] Clicked "Run npm install"
- [ ] npm install completed successfully (took ~2-3 min)
- [ ] No errors in npm install output
- [ ] Clicked "Run JS Script" → selected "build"
- [ ] Build completed successfully (took ~3-5 min)
- [ ] No errors in build output
- [ ] Clicked "Restart"
- [ ] App restarted successfully

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Basic Tests
- [ ] Homepage loads: https://yourdomain.com
- [ ] No 502 Bad Gateway error
- [ ] No 500 Internal Server Error
- [ ] Page loads in under 5 seconds
- [ ] No console errors in browser (F12 → Console)

### Admin Tests
- [ ] Login page loads: https://yourdomain.com/login
- [ ] Can login with: super@siwa.com / super123
- [ ] Admin dashboard loads: /admin/governance
- [ ] Form builder accessible: /admin/form-builder-enhanced
- [ ] Tree view preview shows correctly
- [ ] Sections display with color badges

### Database Tests
- [ ] Can view business types
- [ ] Can create new section
- [ ] Can add field to form
- [ ] Data saves to database
- [ ] No database connection errors

### Feature Tests
- [ ] Form builder tree view works
- [ ] Live preview updates
- [ ] Section inheritance shows correctly
- [ ] Can export/import data
- [ ] File uploads work (test image)
- [ ] Search functionality works

---

## 🔒 SECURITY HARDENING

### Immediate Actions (DO THESE FIRST!)
- [ ] Changed default super@siwa.com password
- [ ] Changed default content@siwa.com password
- [ ] Changed default vendor@siwa.com password
- [ ] JWT_SECRET is strong random string (64 chars)
- [ ] .env file NOT accessible publicly

### Generate New Passwords
```
1. Go to: https://www.bcrypt-generator.com/
2. Enter new password
3. Rounds: 10
4. Copy bcrypt hash
5. Run in phpMyAdmin SQL:

UPDATE profiles 
SET password_hash = 'PASTE_HASH_HERE' 
WHERE email = 'super@siwa.com';
```

- [ ] Updated super@siwa.com password
- [ ] Updated content@siwa.com password
- [ ] Updated vendor@siwa.com password
- [ ] Tested login with new password

### Ongoing Security
- [ ] SSL certificate active (HTTPS)
- [ ] Regular backups scheduled (weekly minimum)
- [ ] Error logs monitored
- [ ] Database backups enabled
- [ ] File permissions correct (644 for files, 755 for dirs)

---

## 📊 PERFORMANCE CHECKS

### Resource Usage
Check in cPanel → Metrics:

- [ ] CPU usage under 50%
- [ ] Memory usage under 512MB
- [ ] Disk usage acceptable
- [ ] Bandwidth within limits

### Optimization
- [ ] Images optimized
- [ ] CSS/JS minified (Next.js does this automatically)
- [ ] Database indexes working
- [ ] Caching enabled (if applicable)

---

## 📝 BACKUP PLAN

### Initial Backup
- [ ] Exported database via phpMyAdmin
- [ ] Saved as: backup_initial_[DATE].sql
- [ ] Downloaded backup to local computer
- [ ] Verified backup file opens correctly

### Backup Schedule
- [ ] Weekly database backups scheduled
- [ ] Monthly full backups (files + database)
- [ ] Backups stored off-site (Google Drive, Dropbox, etc.)

---

## 🐛 TROUBLESHOOTING PREPAREDNESS

### Log Locations
```
Node.js App Logs:    cPanel → Setup Node.js App → View Logs
Error Logs:          cPanel → Errors
Access Logs:         cPanel → Raw Access Logs
```

### Common Issues Quick Reference

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check app is running, restart it |
| Database error | Verify env variables, test connection |
| Build fails | Check Node version, clear .next cache |
| Permission denied | Extract via File Manager, not SSH |

- [ ] Noted log locations
- [ ] Reviewed troubleshooting guide
- [ ] Know how to access cPanel logs

---

## 📞 SUPPORT INFORMATION

### Important URLs
```
Homepage:             https://_____________________________
Admin Login:          https://_________________/login
Admin Dashboard:      https://_________________/admin/governance
Form Builder:         https://_________________/admin/form-builder-enhanced
cPanel:               https://_________________:2083
phpMyAdmin:           https://_________________/phpmyadmin
```

### File Locations
```
App Root:             /home/__________/siwa-oasis
Database Backup:      /home/__________/backups/
Logs:                 /home/__________/siwa-oasis/logs/
```

---

## ✅ FINAL SIGN-OFF

### Pre-Deployment Checklist Complete
- [ ] All sections above checked off
- [ ] No unresolved issues
- [ ] All credentials documented and stored securely
- [ ] Backup completed
- [ ] Ready to deploy

**Signature:** _______________________  
**Date:** _______________________  
**Time:** _______________________

---

## 📌 NOTES & OBSERVATIONS

Use this space for any notes during deployment:

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## 🔄 POST-DEPLOYMENT NOTES

After deployment, record any issues or observations:

```
Deployment Start Time: ________________
Deployment End Time: ________________
Total Time: ________________

Issues Encountered:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

Resolutions:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

Next Steps:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```

---

**🎉 Deployment Complete!**

Save this checklist for future reference and updates.

---

*Version: 1.0.0*  
*Date: 2026-04-25*

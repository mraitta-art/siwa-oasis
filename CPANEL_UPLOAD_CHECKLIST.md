# 🚀 CPANEL DEPLOYMENT CHECKLIST
## Siwa Oasis - Complete Upload Guide

**Date:** April 28, 2026  
**Status:** Ready for Independent Deployment

---

## 📋 PRE-DEPLOYMENT PREPARATION

### ✅ Files Ready in `deploy_bundle/`:
- [x] `.next/` - Pre-built Next.js application
- [x] `public/` - Static assets and uploads
- [x] `src/` - Source code
- [x] `scripts/` - Deployment scripts
- [x] `package.json` - Dependencies list
- [x] `package-lock.json` - Locked dependencies
- [x] `server.js` - Application startup file
- [x] `next.config.ts` - Next.js configuration
- [x] `tsconfig.json` - TypeScript configuration
- [x] `schema.sql` - Database schema
- [x] `.env.example` - Environment variables template

---

## 🎯 PHASE 1: DATABASE SETUP (10 minutes)

### Step 1: Create MySQL Database
- [ ] Login to cPanel
- [ ] Go to **MySQL Databases**
- [ ] Create new database: `siwatoday_main` (or your choice)
- [ ] Create database user: `siwatoday_admin` (or your choice)
- [ ] Create strong password (save it!)
- [ ] Add user to database with **ALL PRIVILEGES**

### Step 2: Record Your Database Credentials
```
Database Name:  _______________________
Database User:  _______________________
Database Pass:  _______________________
Host:           localhost
Port:           3306
```

### Step 3: Import Database Schema
- [ ] Go to **phpMyAdmin** in cPanel
- [ ] Select your database
- [ ] Click **Import** tab
- [ ] Choose file: `schema.sql` from deploy_bundle
- [ ] Click **Go**
- [ ] Verify tables created successfully

---

## 📤 PHASE 2: UPLOAD FILES (15-20 minutes)

### Method: Upload via File Manager

#### Step 1: Create Application Directory
- [ ] Go to **File Manager** in cPanel
- [ ] Navigate to: `/home/hsnfzljy/public_html/`
- [ ] Create folder: `siwa-oasis`
- [ ] Open the `siwa-oasis` folder

#### Step 2: Upload Folders (Drag & Drop or Upload button)
- [ ] Upload `.next/` folder (IMPORTANT! - pre-built app)
- [ ] Upload `public/` folder
- [ ] Upload `src/` folder
- [ ] Upload `scripts/` folder

#### Step 3: Upload Files
- [ ] Upload `package.json`
- [ ] Upload `package-lock.json`
- [ ] Upload `server.js` (CRITICAL - startup file)
- [ ] Upload `next.config.ts`
- [ ] Upload `tsconfig.json`
- [ ] Upload `schema.sql` (backup copy)
- [ ] Upload `.env.example`

#### Step 4: Verify Upload
- [ ] Check all folders are present
- [ ] Check all files are present
- [ ] Verify file sizes match original

---

## ⚙️ PHASE 3: NODE.JS APP SETUP (10 minutes)

### Step 1: Create Node.js Application
- [ ] Go to **Setup Node.js App** in cPanel
- [ ] Click **Create Application**

### Step 2: Configure Application Settings
```
Node.js Version:     20.x (or 18.x)
Application Mode:    production
Application Root:    public_html/siwa-oasis
Application URL:     yourdomain.com (or subdomain)
Application Startup File:  server.js
```

- [ ] Select Node.js version: **20.x**
- [ ] Set Application Mode: **production**
- [ ] Set Application Root: `public_html/siwa-oasis`
- [ ] Set Application URL: your domain
- [ ] Set Application Startup File: `server.js`
- [ ] Click **Create**

### Step 3: Install Dependencies
- [ ] Wait for app to be created
- [ ] Click **"Run NPM Install"** button
- [ ] Wait for installation to complete (may take 2-5 minutes)
- [ ] Verify no errors in output

### Step 4: Add Environment Variables
Scroll down to **Environment Variables** section and add:

| Variable Name | Value | Required |
|--------------|-------|----------|
| `DB_HOST` | `localhost` | ✅ Yes |
| `DB_PORT` | `3306` | ✅ Yes |
| `DB_USER` | [your database user] | ✅ Yes |
| `DB_PASSWORD` | [your database password] | ✅ Yes |
| `DB_NAME` | [your database name] | ✅ Yes |
| `JWT_SECRET` | [64-char hex string] | ✅ Yes |
| `SESSION_COOKIE_NAME` | `siwa_session` | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |

- [ ] Add all environment variables above
- [ ] Double-check values for typos
- [ ] Click **Save** or **Apply**

### Step 5: Start Application
- [ ] Click **"Restart"** button (top right)
- [ ] Wait for app to start (green dot should appear)
- [ ] Check status shows as "Running"

---

## ✅ PHASE 4: VERIFICATION (10 minutes)

### Test Your Application

#### 1. Homepage
- [ ] Visit: `https://yourdomain.com`
- [ ] Page loads without errors
- [ ] No console errors in browser (F12)

#### 2. Admin Login
- [ ] Visit: `https://yourdomain.com/login`
- [ ] Login with:
  - Email: `super@siwa.com`
  - Password: `super123`
- [ ] Redirects to admin dashboard

#### 3. Admin Dashboard
- [ ] Visit: `https://yourdomain.com/admin/governance`
- [ ] Dashboard loads successfully
- [ ] No errors displayed

#### 4. Key Features
- [ ] Form Builder: `/admin/form-builder-enhanced`
- [ ] Businesses: `/admin/businesses`
- [ ] Sections: `/admin/sections`
- [ ] Blog Editor: `/admin/blog/editor`

#### 5. Database Connection
- [ ] Create a test item (business type, section, etc.)
- [ ] Verify it saves successfully
- [ ] Check in phpMyAdmin that data is stored

---

## 🔒 PHASE 5: SECURITY (5 minutes)

### Immediate Actions After Deployment

- [ ] **Change default admin password:**
  - Login to admin dashboard
  - Go to profile/settings
  - Change password from `super123`

- [ ] **Update other default accounts:**
  - `content@siwa.com`
  - `vendor@siwa.com`

- [ ] **Verify SSL/HTTPS:**
  - Website loads with `https://`
  - Green lock icon in browser
  - If not, run AutoSSL in cPanel

- [ ] **Verify .env not accessible:**
  - Try visiting: `https://yourdomain.com/.env`
  - Should show 404 or 403 error (not the file contents)

---

## 🛠️ TROUBLESHOOTING GUIDE

### Issue: App Won't Start
**Solution:**
1. Check Node.js version is 20.x or 18.x
2. Verify `server.js` exists in root folder
3. Click "View Logs" in Node.js App
4. Check environment variables are correct
5. Click "Restart"

### Issue: Database Connection Error
**Solution:**
1. Verify DB credentials in environment variables
2. Check database exists in phpMyAdmin
3. Verify user has ALL PRIVILEGES
4. Ensure DB_HOST is `localhost` (not 127.0.0.1)

### Issue: 502 Bad Gateway
**Solution:**
1. Check app is running (green dot in Node.js App)
2. View logs for errors
3. Increase memory allocation (if available)
4. Click "Restart"

### Issue: Build/Install Fails
**Solution:**
1. Check `package.json` exists
2. Click "Run NPM Install" again
3. View logs for specific error
4. Verify Node.js version compatibility

### Issue: White Screen
**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify `.next` folder was uploaded
4. Check environment variables

---

## 📊 IMPORTANT URLs

| Page | URL |
|------|-----|
| Homepage | `https://yourdomain.com` |
| Login | `https://yourdomain.com/login` |
| Admin Dashboard | `https://yourdomain.com/admin/governance` |
| Form Builder | `https://yourdomain.com/admin/form-builder-enhanced` |
| Blog Manager | `https://yourdomain.com/admin/blog` |
| Businesses | `https://yourdomain.com/admin/businesses` |

---

## 🔑 DEFAULT CREDENTIALS (CHANGE IMMEDIATELY!)

```
Super Admin:
Email:    super@siwa.com
Password: super123

Content Manager:
Email:    content@siwa.com
Password: content123

Vendor:
Email:    vendor@siwa.com
Password: vendor123

⚠️ MUST CHANGE ALL PASSWORDS AFTER FIRST LOGIN!
```

---

## 📝 ENVIRONMENT VARIABLES REFERENCE

### Generate JWT_SECRET:
```javascript
// Run in Node.js:
console.log(require('crypto').randomBytes(32).toString('hex'));
// Copy the 64-character output
```

### Required Variables:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=siwatoday_admin
DB_PASSWORD=[your_password]
DB_NAME=siwatoday_main
JWT_SECRET=[64_char_hex_string]
SESSION_COOKIE_NAME=siwa_session
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 🎯 POST-DEPLOYMENT CHECKLIST

- [ ] All tests passed in Phase 4
- [ ] Default passwords changed
- [ ] SSL certificate active
- [ ] Environment variables secure
- [ ] Database backup created
- [ ] Bookmarked admin URLs
- [ ] Noted down credentials securely
- [ ] Tested on mobile device
- [ ] No console errors in browser

---

## 📞 SUPPORT RESOURCES

### Log Locations:
- **Node.js Logs:** cPanel → Setup Node.js App → View Logs
- **Error Logs:** cPanel → Errors
- **Access Logs:** cPanel → Raw Access Logs

### cPanel Tools Used:
- File Manager
- MySQL Databases
- phpMyAdmin
- Setup Node.js App
- Let's Encrypt SSL (if needed)

---

## ⚠️ IMPORTANT NOTES

1. **DO NOT run `npm run build`** - The `.next` folder is already pre-built
2. **DO upload `.next` folder** - Contains the compiled application
3. **DO use "Run NPM Install" button** - Installs dependencies on cPanel
4. **DO set startup file to `server.js`** - Required for app to start
5. **DO use Node.js 20.x** - Required version for Next.js 15
6. **DON'T upload `node_modules`** - Let cPanel create it fresh

---

## ✅ DEPLOYMENT COMPLETE!

Once all checkboxes are complete, your Siwa Oasis platform is live and ready to use!

**Estimated Total Time:** 45-60 minutes  
**Difficulty Level:** Medium (follow steps carefully)

---

**Good luck with your deployment! 🚀**

*Generated: April 28, 2026*  
*Version: 1.0.0*

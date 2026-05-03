# 🚀 QUICK DEPLOYMENT GUIDE
## Siwa Oasis - Upload to cPanel (No Terminal Required)

---

## 📦 WHAT YOU HAVE:

**Location:** `e:\ANitgravity\siwatoday\siwa-oasis\deploy_bundle\`

**Files ready to upload:**
- ✅ `.next/` - Pre-built application (DO NOT REBUILD!)
- ✅ `public/` - Static files
- ✅ `src/` - Source code
- ✅ `scripts/` - Scripts
- ✅ `package.json` - Dependencies
- ✅ `package-lock.json` - Dependency lock
- ✅ `server.js` - Startup file
- ✅ `next.config.ts` - Configuration
- ✅ `tsconfig.json` - TypeScript config
- ✅ `schema.sql` - Database schema
- ✅ `.env.example` - Environment template

---

## ⏱️ ESTIMATED TIME: 45-60 MINUTES

---

## 🎯 STEP-BY-STEP PROCESS:

### PHASE 1: DATABASE (10 min)
### PHASE 2: UPLOAD FILES (20 min)
### PHASE 3: NODE.JS SETUP (10 min)
### PHASE 4: TEST (10 min)
### PHASE 5: SECURE (5 min)

---

## 📋 PHASE 1: DATABASE SETUP

### 1.1 Create Database in cPanel

1. Login to cPanel
2. Click **MySQL Databases**
3. Create database: `siwa_main`
4. Create user: `siwa_admin`
5. Set strong password
6. Add user to database with **ALL PRIVILEGES**

### 1.2 Import Schema

1. Go to **phpMyAdmin**
2. Select your database
3. Click **Import**
4. Upload: `schema.sql` from deploy_bundle
5. Click **Go**

✅ **Database Ready!**

---

## 📤 PHASE 2: UPLOAD FILES

### 2.1 Access File Manager

1. Go to cPanel → **File Manager**
2. Navigate to: `/home/hsnfzljy/public_html/`
3. Create folder: `siwa-oasis`
4. Open the `siwa-oasis` folder

### 2.2 Upload Folders

Upload these folders one by one:

1. **`.next/`** folder ⚠️ (MOST IMPORTANT!)
2. **`public/`** folder
3. **`src/`** folder
4. **`scripts/`** folder

### 2.3 Upload Files

Upload these files:

1. `package.json`
2. `package-lock.json`
3. `server.js` ⚠️ (CRITICAL!)
4. `next.config.ts`
5. `tsconfig.json`
6. `schema.sql`
7. `.env.example`

✅ **Files Uploaded!**

---

## ⚙️ PHASE 3: NODE.JS APP SETUP

### 3.1 Create Application

1. Go to cPanel → **Setup Node.js App**
2. Click **Create Application**

### 3.2 Configure Settings

Fill in:

```
Node.js Version:      20.x
Application Mode:     production
Application Root:     public_html/siwa-oasis
Application URL:      yourdomain.com
Application Startup File:  server.js
```

Click **Create**

### 3.3 Install Dependencies

1. Wait for app creation
2. Click **"Run NPM Install"** button
3. Wait 2-5 minutes for completion

### 3.4 Add Environment Variables

Add these 9 variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | [your db user] |
| `DB_PASSWORD` | [your db password] |
| `DB_NAME` | [your db name] |
| `JWT_SECRET` | [64-char hex] |
| `SESSION_COOKIE_NAME` | `siwa_session` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `NODE_ENV` | `production` |

Click **Save**

### 3.5 Start App

1. Click **"Restart"** button (top right)
2. Wait for green dot (running status)

✅ **App Running!**

---

## ✅ PHASE 4: VERIFICATION

### Test These URLs:

1. **Homepage:** `https://yourdomain.com`
   - Should load without errors

2. **Login:** `https://yourdomain.com/login`
   - Login with: `super@siwa.com` / `super123`

3. **Admin:** `https://yourdomain.com/admin/governance`
   - Dashboard should load

4. **Form Builder:** `https://yourdomain.com/admin/form-builder-enhanced`
   - Should work

5. **Businesses:** `https://yourdomain.com/admin/businesses`
   - Should work

✅ **All Working!**

---

## 🔒 PHASE 5: SECURITY

### Change Passwords:

1. Login to admin dashboard
2. Change password for:
   - `super@siwa.com`
   - `content@siwa.com`
   - `vendor@siwa.com`

### Verify SSL:

- Website loads with `https://`
- Green lock icon in browser

✅ **Secured!**

---

## 🎉 DEPLOYMENT COMPLETE!

Your Siwa Oasis platform is now live!

---

## 🆘 TROUBLESHOOTING:

### App won't start?
- Check Node.js version is 20.x
- Verify `server.js` exists
- View logs in Node.js App
- Click "Restart"

### Database error?
- Check environment variables
- Verify database exists in phpMyAdmin
- Ensure user has ALL PRIVILEGES

### 502 error?
- App is restarting, wait 30 seconds
- Check logs for errors
- Click "Restart" again

### White screen?
- Open browser console (F12)
- Check for JavaScript errors
- Verify `.next` folder was uploaded

---

## 📝 IMPORTANT NOTES:

⚠️ **DO NOT:**
- ❌ Run `npm run build` (already built!)
- ❌ Upload `node_modules/` (let cPanel create it)
- ❌ Use Node.js 16.x or 21+
- ❌ Forget environment variables

✅ **DO:**
- ✅ Upload `.next/` folder
- ✅ Use "Run NPM Install" button
- ✅ Set startup file to `server.js`
- ✅ Use Node.js 20.x
- ✅ Add all 9 environment variables

---

## 📞 SUPPORT:

**Log Locations:**
- Node.js Logs: Setup Node.js App → View Logs
- Error Logs: cPanel → Errors

**Files Reference:**
- Checklist: `CPANEL_UPLOAD_CHECKLIST.md`
- Env Template: `ENVIRONMENT_VARIABLES_TEMPLATE.md`

---

**Ready to deploy? Follow these steps and you'll be live in under an hour!** 🚀

*Generated: April 28, 2026*

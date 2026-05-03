# 🚀 CPANEL DEPLOYMENT QUICK REFERENCE CARD

**Print this page and keep it next to you during deployment!**

---

## 📋 INFORMATION TO GATHER BEFORE STARTING

### From Your Hosting Provider/cPanel:
```
□ cPanel URL: _________________________________
□ cPanel Username: _________________________________
□ Node.js Versions Available: _______ (need 18.x or 20.x)
□ Memory Limit Available: _______ MB (need 1024+ MB)
□ Hosting Support Contact: _________________________________
```

### Database Credentials (Create in cPanel → MySQL Databases):
```
□ DB_HOST: localhost
□ DB_PORT: 3306
□ DB_USER: _________________________________ (with cPanel prefix)
□ DB_PASSWORD: _________________________________ (save immediately!)
□ DB_NAME: _________________________________ (with cPanel prefix)
```

### Domain Information:
```
□ Domain: _________________________________
□ Will use: □ Main Domain  □ Subdomain (name: _______)
□ SSL Status: □ Installed  □ Need to Install
```

### Security Keys (Generate Locally):
```bash
# Run this command to generate JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```
□ JWT_SECRET: _________________________________ (64 characters)
```

---

## ⚠️ CRITICAL DEPLOYMENT ORDER

### PHASE 1: DATABASE (Do This FIRST!)
```
1. cPanel → MySQL Databases
2. Create Database
3. Create User
4. Add User to Database (ALL PRIVILEGES)
5. phpMyAdmin → Import schema.sql
6. Verify tables created (SHOW TABLES;)
```

### PHASE 2: CREATE NODE.JS APP
```
1. cPanel → Setup Node.js App → Create Application
2. Settings:
   - Node.js version: 20.x (or 18.x)
   - Application mode: Production
   - Application root: siwa-oasis
   - Application URL: yourdomain.com
   - Application startup file: server.js
   - Memory Limit: 1024 MB
3. Click Create
```

### PHASE 3: UPLOAD FILES
```
1. cPanel → File Manager
2. Navigate to: /home/username/siwa-oasis
3. Upload: siwa_upload.zip
4. Extract ZIP (right-click → Extract)
5. Verify files extracted
```

### PHASE 4: ENVIRONMENT VARIABLES
```
cPanel → Setup Node.js App → Edit → Environment Variables:

DB_HOST = localhost
DB_PORT = 3006
DB_USER = (your db user)
DB_PASSWORD = (your db password)
DB_NAME = (your db name)
JWT_SECRET = (your 64-char secret)
SESSION_COOKIE_NAME = siwa_session
NEXT_PUBLIC_APP_URL = https://yourdomain.com
NODE_ENV = production
HOST = 0.0.0.0
PORT = 3000
```

### PHASE 5: INSTALL & BUILD
```
1. Click "Run npm install" (wait 2-3 min)
2. Click "Run JS Script" → build (wait 3-5 min)
3. Click "Restart"
4. Verify green "running" indicator
```

### PHASE 6: TEST
```
1. Visit: https://yourdomain.com
2. Login: https://yourdomain.com/login
   - Email: super@siwa.com
   - Password: super123
3. CHANGE PASSWORD IMMEDIATELY!
```

---

## 🆑 TROUBLESHOOTING QUICK FIXES

### Build Fails with "NODE_OPTIONS not recognized"
```
SOLUTION: Already fixed in your version!
If still happening, re-run: node scripts/deploy-prepare.js
Create new ZIP and upload again
```

### Build Fails with Memory Error
```
SOLUTION: Increase memory in Setup Node.js App
Set Memory Limit to: 1024 MB or 2048 MB
```

### 502 Bad Gateway
```
CHECKLIST:
□ App shows green "running" indicator?
□ Environment variables correct?
□ server.js exists in app folder?
□ Check logs: Setup Node.js App → View Logs
```

### App Won't Start
```
TRY:
1. Check logs for errors
2. Verify Node.js version is 18.x or 20.x
3. Re-check all environment variables
4. Restart the app
5. Re-extract ZIP file
```

### Routes Return 404
```
CHECK:
□ .htaccess file exists in app root?
□ Contains rewrite rules?
□ Apache mod_rewrite enabled? (ask hosting support)
```

---

## 🔐 SECURITY CHECKLIST (First 10 Minutes)

```
□ Change default admin password immediately!
□ Verify SSL/HTTPS is working
□ Test backup system
□ Check error logs
□ Update JWT_SECRET if it was shared/stored insecurely
```

---

## 📞 EMERGENCY ACTIONS

### If Everything Breaks:
```
1. DON'T DELETE THE DATABASE!
2. Check logs: Setup Node.js App → View Logs
3. Take screenshot of errors
4. Contact hosting support if needed
5. Can always delete app and start fresh (database stays safe)
```

### Rollback Steps:
```
1. cPanel → Setup Node.js App → Delete app
2. File Manager → Delete all files in app folder
3. Start over from Phase 2
4. Database remains intact
```

---

## ✅ PRE-FLIGHT CHECK (Answer YES to All)

```
□ cPanel has "Setup Node.js App" feature?
□ Node.js 18.x or 20.x available?
□ Database created and user added?
□ Schema imported successfully?
□ JWT_SECRET generated (64 chars)?
□ All environment variables ready?
□ siwa_upload.zip created from deploy_bundle?
□ At least 2GB free disk space?
□ 1-2 hours available for deployment?
```

---

## 📊 DEPLOYMENT TIME ESTIMATES

```
Database Setup:        10-15 minutes
Node.js App Creation:   5 minutes
File Upload/Extract:   10-15 minutes (depends on internet speed)
Environment Config:     5 minutes
npm install:            2-3 minutes
Build Process:          3-5 minutes
Testing:               15-20 minutes
─────────────────────────────────────
TOTAL:                 50-65 minutes
```

---

## 🎯 KEY POINTS TO REMEMBER

1. **Database FIRST, files SECOND, build LAST**
2. **Memory limit must be 1024MB+ for build**
3. **Use Node.js 18.x or 20.x (not 16, not 21+)**
4. **Change default passwords immediately**
5. **Keep this card handy during deployment**
6. **Don't panic if errors occur - check logs!**
7. **Database is safe even if app deployment fails**

---

## 📝 NOTES SECTION

```
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Good Luck! You've Got This! 🚀**

*Remember: Take your time, follow the order, and double-check everything.*

---

*Quick Reference v1.0 | Next.js 15.1.0 | Node.js 18.x/20.x*

# 🖱️ CPANEL WIZARD CLICK-BY-CLICK GUIDE
## (No Terminal Required - Just Clicks!)

---

## 📌 QUICK REFERENCE: Where to Click in cPanel

### 🔵 DATABASE SETUP (5 Clicks)

```
1. cPanel Home
   ↓ Click "MySQL Databases"

2. MySQL Databases Wizard
   ↓ Type database name → Click "Create Database"
   ↓ Type username → Generate password → Click "Create User"
   ↓ Select user + database → Check "ALL PRIVILEGES" → Click "Add"

3. cPanel Home
   ↓ Click "phpMyAdmin"

4. phpMyAdmin
   ↓ Click database name (left sidebar)
   ↓ Click "Import" tab (top menu)
   ↓ Click "Choose File" → Select schema.sql
   ↓ Click "Go" button

5. ✅ Database Ready!
```

---

### 🔵 CREATE NODE.JS APP (3 Clicks)

```
1. cPanel Home
   ↓ Click "Setup Node.js App"

2. Setup Node.js App
   ↓ Click "+ Create Application"

3. Fill Form:
   • Node.js version: 20.x ▼
   • Application mode: Production ▼
   • Application root: siwa-oasis
   • Application URL: yourdomain.com ▼
   • Application startup file: server.js
   • Memory Limit: 1024 MB
   ↓ Click "Create"

4. ✅ App Created!
```

---

### 🔵 UPLOAD FILES (4 Clicks)

```
1. cPanel Home
   ↓ Click "File Manager"

2. File Manager
   ↓ Click "siwa-oasis" folder (left sidebar)
   ↓ Click "Upload" button (top toolbar)

3. Upload Wizard
   ↓ Drag/drop siwa_upload.zip
   ↓ Wait for 100%
   ↓ Click "Go Back to..."

4. File Manager
   ↓ Right-click siwa_upload.zip
   ↓ Click "Extract"
   ↓ Click "Extract Files"
   ↓ Click "Reload"

5. ✅ Files Uploaded!
```

---

### 🔵 CONFIGURE ENVIRONMENT (13 Clicks)

```
1. cPanel Home
   ↓ Click "Setup Node.js App"

2. Setup Node.js App
   ↓ Click Edit (pencil icon) for your app

3. Environment Variables Section
   ↓ Click "Add Variable" (repeat 11 times)
   
   Add these:
   1. DB_HOST = localhost
   2. DB_PORT = 3306
   3. DB_USER = your_full_db_username
   4. DB_PASSWORD = your_db_password
   5. DB_NAME = your_full_db_name
   6. JWT_SECRET = 64_character_hex_string
   7. SESSION_COOKIE_NAME = siwa_session
   8. NEXT_PUBLIC_APP_URL = https://yourdomain.com
   9. NODE_ENV = production
   10. HOST = 0.0.0.0
   11. PORT = 3000

4. ↓ Click "Save"

5. ✅ Configuration Saved!
```

---

### 🔵 BUILD & START (3 Clicks)

```
1. Setup Node.js App
   ↓ Click "Run npm install" button
   ↓ Wait 2-3 minutes

2. Setup Node.js App
   ↓ Click "Run JS Script" dropdown ▼
   ↓ Select "build"
   ↓ Click "Run" button
   ↓ Wait 3-5 minutes

3. Setup Node.js App
   ↓ Click "Restart" button
   ↓ Look for green dot (running)

4. ✅ App Running!
```

---

## 🎯 COMPLETE CLICK SEQUENCE

### Total Clicks: ~30 clicks (15-20 minutes)

```
PHASE 1: DATABASE (5 minutes)
  1. Click "MySQL Databases"
  2. Create database (2 clicks)
  3. Create user (3 clicks)
  4. Add user to database (3 clicks)
  5. Click "phpMyAdmin"
  6. Import schema.sql (4 clicks)

PHASE 2: NODE.JS APP (3 minutes)
  7. Click "Setup Node.js App"
  8. Click "Create Application"
  9. Fill form + Click "Create"

PHASE 3: UPLOAD FILES (5 minutes)
  10. Click "File Manager"
  11. Navigate to folder (1 click)
  12. Click "Upload"
  13. Upload ZIP (wait)
  14. Extract ZIP (3 clicks)

PHASE 4: CONFIGURE (3 minutes)
  15. Click "Setup Node.js App"
  16. Click Edit (pencil icon)
  17. Add 11 variables (12 clicks)
  18. Click "Save"

PHASE 5: BUILD & START (5 minutes)
  19. Click "Run npm install" (wait 2-3 min)
  20. Select "build" + Click "Run" (wait 3-5 min)
  21. Click "Restart"

PHASE 6: TEST (2 minutes)
  22. Open browser → Visit your domain
  23. Test login page

TOTAL: ~30 clicks, 15-20 minutes
```

---

## 🖼️ VISUAL BUTTON GUIDE

### Setup Node.js App Buttons:

```
┌──────────────────────────────────────────────────┐
│ Setup Node.js App                                │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ siwa-oasis                  [● Running]  │    │
│ │ URL: yourdomain.com                      │    │
│ │                                          │    │
│ │ [✏️ Edit] [🗑️ Delete]                   │    │
│ │                                          │    │
│ │ ┌──────────────────┐  ┌───────────────┐ │    │
│ │ │ Run npm install  │  │ Run JS Script│ │    │
│ │ │                  │  │ [build ▼] [▶]│ │    │
│ │ └──────────────────┘  └───────────────┘ │    │
│ │                                          │    │
│ │ [🔄 Restart]    [📋 View Logs]          │    │
│ └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘

Click Order:
1. Run npm install (wait)
2. Run JS Script → build → Run (wait)
3. Restart
```

---

## 📋 PRINTABLE CHECKLIST

### Before You Start:
```
□ siwa_upload.zip created (from deploy_bundle_cpanel/)
□ Database credentials ready (username, password, DB name)
□ JWT_SECRET generated (64 characters)
□ Domain name ready
□ 20-30 minutes available
```

### Database Setup:
```
□ MySQL Databases → Created database
□ MySQL Databases → Created user
□ MySQL Databases → User added with ALL PRIVILEGES
□ phpMyAdmin → schema.sql imported
□ Tables verified (SHOW TABLES;)
```

### Node.js App:
```
□ Setup Node.js App → App created
□ Node.js version: 20.x
□ Application mode: Production
□ Application root: siwa-oasis
□ Startup file: server.js
□ Memory Limit: 1024 MB
```

### File Upload:
```
□ File Manager → Opened siwa-oasis folder
□ siwa_upload.zip uploaded
□ ZIP extracted
□ Files verified (src/, public/, package.json, server.js, etc.)
```

### Configuration:
```
□ All 11 environment variables added
□ Configuration saved
```

### Build & Start:
```
□ "Run npm install" clicked (completed)
□ "build" script run (completed)
□ "Restart" clicked
□ Green dot showing (running)
```

### Testing:
```
□ Homepage loads
□ Login page works
□ Can login with admin credentials
□ No browser console errors
```

---

## 🔍 WHERE TO FIND THINGS IN CPANEL

### Common cPanel Layout:

```
┌─────────────────────────────────────────────┐
│              CPANEL HOME                    │
├─────────────────────────────────────────────┤
│                                             │
│  FILES                  DATABASE            │
│  □ File Manager         □ MySQL Databases   │
│  □ Backup               □ phpMyAdmin        │
│  □ Disk Usage                                 │
│                                             │
│  DOMAINS                SOFTWARE            │
│  □ Domains              □ Setup Node.js App │
│  □ SSL/TLS Status     □ MultiPHP Manager    │
│  □ Redirects                                  │
│                                             │
│  METRICS                SECURITY            │
│  □ Metrics              □ SSL/TLS           │
│  □ Errors               □ IP Blocker        │
│                                             │
└─────────────────────────────────────────────┘

You need:
  → File Manager (FILES section)
  → MySQL Databases (DATABASE section)
  → phpMyAdmin (DATABASE section)
  → Setup Node.js App (SOFTWARE section)
```

---

## ⚡ QUICK TROUBLESHOOTING (Button Clicks Only)

### App Not Running?
```
1. Setup Node.js App
2. Click "Restart"
3. Check for green dot
```

### Build Failed?
```
1. Setup Node.js App
2. Click "View Logs"
3. Read error message
4. Common fixes:
   - Memory? Edit app → Increase to 1024 MB
   - Files? File Manager → Re-extract ZIP
```

### Can't Login to Database?
```
1. Setup Node.js App → Edit
2. Check:
   - DB_HOST = localhost
   - DB_USER = correct (with prefix)
   - DB_PASSWORD = correct
   - DB_NAME = correct (with prefix)
```

### 404 Errors on Pages?
```
1. File Manager
2. Check .htaccess exists
3. If missing:
   - Re-run locally: node scripts/prepare-deployment-advanced.js
   - Create new ZIP
   - Re-upload and extract
```

---

## 💡 PRO TIPS FOR WIZARD USERS

### 1. Always Use These Settings:
```
Node.js version: 20.x (or 18.x)
Application mode: Production
Memory Limit: 1024 MB (minimum!)
Startup file: server.js
```

### 2. Environment Variables - Copy/Paste:
```
DB_HOST = localhost
DB_PORT = 3306
SESSION_COOKIE_NAME = siwa_session
NODE_ENV = production
HOST = 0.0.0.0
PORT = 3000
```
(These 6 are always the same - copy them!)

### 3. Build Order (IMPORTANT!):
```
1. Run npm install (FIRST!)
2. Run build (SECOND!)
3. Restart (THIRD!)
```

### 4. If Something Fails:
```
1. Check "View Logs" button
2. Read the error
3. Most common: Memory limit → Increase to 1024 MB
```

---

## 📞 Need Help?

### Contact Your Hosting Support:

**Copy-paste this message:**

```
Hello,

I'm deploying a Next.js application using cPanel wizards only (no SSH/terminal).

I need help with:
[Describe your issue]

I'm using:
- Setup Node.js App wizard
- File Manager for uploads
- phpMyAdmin for database

Can you assist with this wizard-only approach?

Thank you!
```

---

**Print this page and keep it next to you during deployment!**

**Total Time: 15-20 minutes | Total Clicks: ~30 | No Terminal Required!** ✅

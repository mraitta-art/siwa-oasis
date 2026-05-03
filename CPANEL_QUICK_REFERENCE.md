# 🚀 CPANEL QUICK DEPLOYMENT CARD

## ⚡ 5-MINUTE SETUP REFERENCE

### 1️⃣ CREATE DATABASE (2 min)
```
cPanel → MySQL Databases
├─ Database Name: hsnfzljy_siwa_oasis
├─ User: hsnfzljy_siwa_admin
├─ Password: PiCo@@4##73
└─ Privileges: ✓ ALL PRIVILEGES
```

### 2️⃣ IMPORT SCHEMA (2 min)
```
cPanel → phpMyAdmin → hsnfzljy_siwa_oasis
├─ Import → schema.sql → Go
└─ Run Migration:
   SQL tab → paste migration_section_types.sql → Go
```

### 3️⃣ CREATE NODE APP (1 min)
```
cPanel → Setup Node.js App → Create
├─ Node.js: 20.x
├─ Mode: production
├─ Root: public_html/siwa-oasis
├─ URL: siwify.com
└─ Startup: server.js
```

### 4️⃣ UPLOAD FILES
```
File Manager → public_html/siwa-oasis/
Upload:
├─ .next/
├─ public/
├─ src/
├─ server.js
├─ package.json
└─ package-lock.json
```

### 5️⃣ NPM INSTALL
```
Setup Node.js App → Run NPM Install
Wait 2-5 minutes...
```

### 6️⃣ ENV VARIABLES
```
Setup Node.js App → Environment Variables
Add all from: .env file
```

### 7️⃣ START APP
```
Setup Node.js App → Restart
Green dot = Ready!
```

---

## 📊 QUICK STATS

| Item | Value |
|------|-------|
| **Database Tables** | 18+ |
| **Default Admin Accounts** | 6 |
| **Business Type Categories** | 6 Parent + 20+ Child |
| **Sections** | 21 |
| **Build Size** | ~150 MB |
| **Disk Required** | 2 GB minimum |
| **RAM Required** | 512 MB minimum |
| **Node.js Version** | 20.x LTS |
| **Setup Time** | ~15 minutes |

---

## 🔐 DEFAULT CREDENTIALS

```
super@siwa.com / super123
content@siwa.com / content123
salesmanager@siwa.com / sales123
support@siwa.com / support123
salesman@siwa.com / salesman123
vendor@siwa.com / vendor123

⚠️ CHANGE ALL PASSWORDS AFTER FIRST LOGIN!
```

---

## 🔗 IMPORTANT URLS

| Page | URL |
|------|-----|
| **Homepage** | https://siwify.com |
| **Login** | https://siwify.com/login |
| **Admin** | https://siwify.com/admin/governance |
| **Form Builder** | https://siwify.com/admin/form-builder-enhanced |
| **Businesses** | https://siwify.com/admin/businesses |
| **Blog** | https://siwify.com/admin/blog |
| **Sections** | https://siwify.com/admin/sections |

---

## ✅ VERIFICATION CHECKLIST

```
After deployment, verify:
□ Homepage loads (no 502 error)
□ Can login with super@siwa.com
□ Admin dashboard accessible
□ Forms load without errors
□ Database connection working
□ No console errors in browser (F12)
□ SSL certificate active (green lock)
□ .env file not publicly accessible
```

---

## 🆘 COMMON FIXES

| Problem | Solution |
|---------|----------|
| **502 Bad Gateway** | Restart app, check memory allocation, verify Node.js 20.x |
| **DB Connection Error** | Check credentials, verify localhost (not 127.0.0.1) |
| **404 on Routes** | Upload .next/ folder, restart app |
| **npm Install Fails** | Check disk space (2GB+), Node.js version |
| **White Screen** | Check browser console (F12), verify all env vars |
| **404 on Files** | Verify public/ folder uploaded correctly |

---

## 📞 QUICK COMMANDS

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check App Status:
```
cPanel → Setup Node.js App → View Logs
```

### Restart App:
```
cPanel → Setup Node.js App → Restart button
```

### View Database:
```
cPanel → phpMyAdmin → Select hsnfzljy_siwa_oasis
```

---

## 📁 FILE CHECKLIST

Must upload these files/folders:
```
✓ src/                   (Application code)
✓ public/                (Static assets)
✓ .next/                 (Pre-built app - CRITICAL!)
✓ server.js              (Startup script)
✓ package.json           (Dependencies)
✓ package-lock.json      (Dependency lock)
✓ next.config.ts         (Config)
✓ tsconfig.json          (TypeScript config)
```

---

## 🎯 SUCCESS INDICATORS

```
✓ App responds with green dot in Node.js App
✓ Homepage loads without errors
✓ Login page works
✓ Admin dashboard accessible
✓ Database queries returning data
✓ No 502/503 errors
✓ SSL certificate active
```

---

**Deployment Date: May 1, 2026**  
**Estimated Setup Time: 15 minutes**  
**Support: Check CPANEL_FINAL_DEPLOYMENT_READY.md for detailed instructions**

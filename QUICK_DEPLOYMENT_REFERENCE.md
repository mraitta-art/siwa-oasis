# 🚀 QUICK DEPLOYMENT REFERENCE CARD

**Print this one-pager for quick access during deployment**

---

## 📋 COMPATIBILITY

| Component | Required | Your Version |
|-----------|----------|--------------|
| **Node.js** | 18.x or 20.x | ____________ |
| **Next.js** | 15.1.0 | ✓ 15.1.0 |
| **React** | 19.0.0 | ✓ 19.0.0 |
| **MySQL** | 5.7+ or 10.3+ | ____________ |

---

## 🔐 CREDENTIALS (Fill Out)

```
DB_HOST:        localhost
DB_PORT:        3306
DB_USER:        _______________________
DB_PASSWORD:    _______________________
DB_NAME:        _______________________

JWT_SECRET:     _______________________
                (64-char hex string)

DOMAIN:         https://_______________
```

---

## 📦 DEPLOYMENT IN 5 STEPS

### 1️⃣ PREPARE BUNDLE (Local)
```bash
cd e:\ANitgravity\siwatoday\siwa-oasis
node scripts/deploy-prepare.js
# ZIP deploy_bundle/ → siwa_upload.zip
```

### 2️⃣ CREATE DATABASE (cPanel)
```
MySQL Databases → Create DB + User
phpMyAdmin → Import schema.sql
Run migration_section_types.sql
```

### 3️⃣ CREATE NODE APP (cPanel)
```
Setup Node.js App → Create
Version: 20.x (or 18.x)
Startup: server.js
Mode: Production
```

### 4️⃣ UPLOAD & CONFIGURE
```
File Manager → Upload siwa_upload.zip
Extract to app folder
Add Environment Variables (see below)
```

### 5️⃣ BUILD & LAUNCH
```
Setup Node.js App:
1. Run npm install
2. Run JS Script → build
3. Restart
```

---

## 🔑 ENVIRONMENT VARIABLES

| Variable | Value |
|----------|-------|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | [your db user] |
| `DB_PASSWORD` | [your db pass] |
| `DB_NAME` | [your db name] |
| `JWT_SECRET` | [64-char hex] |
| `SESSION_COOKIE_NAME` | `siwa_session` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `NODE_ENV` | `production` |

---

## ✅ VERIFICATION URLs

```
Homepage:         https://yourdomain.com
Login:            https://yourdomain.com/login
Admin:            https://yourdomain.com/admin/governance
Form Builder:     https://yourdomain.com/admin/form-builder-enhanced
```

### Default Login
```
Email:    super@siwa.com
Password: super123
⚠️ CHANGE IMMEDIATELY AFTER LOGIN!
```

---

## 🔄 UPDATE WORKFLOW

When making changes later:

```
1. Make code changes locally
2. Test: npm run dev
3. Bundle: node scripts/deploy-prepare.js
4. ZIP deploy_bundle/
5. Upload to cPanel
6. Extract (overwrite)
7. Rebuild: Run JS Script → build
8. Restart app
```

### If Database Changes:
```
1. Backup database first!
2. Upload migration SQL file
3. Run in phpMyAdmin → SQL tab
4. Then update code (steps above)
```

---

## 🆘 QUICK TROUBLESHOOTING

| Problem | Quick Fix |
|---------|-----------|
| **502 Error** | Restart app in Node.js App |
| **Build Fails** | Check Node version (18+), clear .next |
| **DB Error** | Verify env vars, check user privileges |
| **Permission Denied** | Extract via File Manager (not SSH) |
| **App Won't Start** | View logs, check server.js exists |

### View Logs
```
cPanel → Setup Node.js App → View Logs
OR
cPanel → Errors
```

---

## 📁 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `schema.sql` | Database schema (import first) |
| `migration_section_types.sql` | New features migration |
| `server.js` | Node.js startup file |
| `.env.example` | Environment template |
| `package.json` | Dependencies list |

---

## 📞 QUICK LINKS

- Full Guide: `CPANEL_DEPLOYMENT_GUIDE.md`
- Checklist: `PRE_DEPLOYMENT_CHECKLIST.md`
- Section Types: `GENERAL_ADDITIONAL_SECTIONS.md`
- Tree Preview: `ENHANCED_FORM_BUILDER_TREE_PREVIEW.md`

---

## ⏱️ ESTIMATED TIME

| Task | Time |
|------|------|
| Prepare bundle | 2 min |
| Create database | 10 min |
| Upload & extract | 5 min |
| Configure env vars | 5 min |
| Build & deploy | 10 min |
| Test & verify | 10 min |
| **TOTAL** | **~42 minutes** |

---

**💡 TIP: Save this file for quick reference during deployment!**

---

*Version: 1.0.0 | Date: 2026-04-25*

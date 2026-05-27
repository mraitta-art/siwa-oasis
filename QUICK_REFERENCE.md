# ⚡ SIWA Oasis - Quick Reference Card

## 🚀 One-Command Sync (After Initial Setup)

```powershell
cd e:\ANitgravity\siwatoday
.\MASTER_SYNC.ps1
```

---

## 📋 Setup Checklist (First Time Only)

```powershell
# 1. Install MySQL (if not already installed)
choco install mysql
# OR download from: https://dev.mysql.com/downloads/mysql/

# 2. Create local database
mysql -u root -p
# In MySQL prompt:
# CREATE DATABASE siwa_oasis;
# EXIT;

# 3. Install Node.js dependencies
npm install

# 4. Set up environment
# Copy ENVIRONMENT_VARIABLES_TEMPLATE to .env.local

# 5. Start development server
npm run dev
```

---

## 🔄 Regular Synchronization

### Option 1: Full Sync (Recommended)
```powershell
.\MASTER_SYNC.ps1
```
Syncs: ✅ GitHub + ✅ Database

### Option 2: GitHub Only
```powershell
.\sync_github.bat
# or
.\MASTER_SYNC.ps1 -GitHubOnly
```
Syncs: ✅ GitHub only

### Option 3: Database Only
```powershell
.\database_backups\sync_production_db.ps1
# or
.\MASTER_SYNC.ps1 -DatabaseOnly
```
Syncs: ✅ Database only

---

## 🗂️ Important Files

| File | Purpose |
|------|---------|
| `MASTER_SYNC.ps1` | Main sync orchestrator |
| `SYNCHRONIZATION_GUIDE.md` | Detailed guide |
| `ENVIRONMENT_SETUP.md` | Setup instructions |
| `SYNC_STATUS_REPORT.md` | Status & progress |
| `.gitignore` | Protects sensitive files |
| `database_backups/` | Database backups |

---

## 🗄️ Database Info

### Production (TiDB Cloud)
```
Host: gateway01.eu-central-1.prod.aws.tidbcloud.com
Port: 4000
DB: siwa_oasis
User: 3iv5fPeLo2ze3jn.root
```

### Local (MySQL)
```
Host: 127.0.0.1
Port: 3306
DB: siwa_oasis
User: root
```

---

## 🔗 GitHub Repository

```
URL: https://github.com/mraitta-art/siwa-oasis.git
Branch: main
Remote: origin
```

### Basic Git Commands
```powershell
git status           # Check status
git log --oneline    # View commits
git pull origin main # Get latest
git push origin main # Push changes
```

---

## 🔐 Credentials Location

⚠️ **SENSITIVE - DO NOT COMMIT**

- `.env` - Production credentials (ignored by .gitignore)
- `.env.local` - Local development (ignored by .gitignore)
- `database_backups/` - Database backups (ignored by .gitignore)

---

## 🆘 Quick Troubleshooting

### Git Issues
```powershell
# Reset to remote state
git reset --hard origin/main

# Fix authentication
git config --global credential.helper store
```

### MySQL Issues
```powershell
# Check if running
Get-Service MySQL80

# Start service
Start-Service MySQL80

# Restart
Restart-Service MySQL80
```

### PowerShell Script Issues
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📞 Documentation Links

- [Full Sync Guide](SYNCHRONIZATION_GUIDE.md)
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [Status Report](SYNC_STATUS_REPORT.md)
- [Deployment Guide](siwa-oasis/CPANEL_DEPLOYMENT_PACKAGE.md)

---

## ✅ Verification Commands

```powershell
# Git
git status
git remote -v

# MySQL
mysql -u root -p -e "SELECT 1;"
mysql -u root -e "USE siwa_oasis; SHOW TABLES;"

# Node
node --version
npm --version
npm list --depth=0

# Application
npm run build
npm run dev
```

---

**Quick Reference v1.0**  
**Updated: 2026-05-28**

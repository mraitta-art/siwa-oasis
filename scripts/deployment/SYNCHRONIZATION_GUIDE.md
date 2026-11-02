# 🔄 SIWA Oasis - Synchronization Guide

## Overview
This guide explains how to synchronize your local development environment with GitHub and production databases.

## Available Sync Scripts

### 1. **Master Sync Script** (Recommended)
Synchronizes GitHub and database in one operation.

**Windows (PowerShell):**
```powershell
.\MASTER_SYNC.ps1
```

**Options:**
```powershell
.\MASTER_SYNC.ps1 -GitHubOnly          # Only sync GitHub
.\MASTER_SYNC.ps1 -DatabaseOnly        # Only sync database
.\MASTER_SYNC.ps1 -NoBackup            # Skip database backup
.\MASTER_SYNC.ps1 -DeployProduction    # Flag for production deployment
```

---

### 2. **GitHub Synchronization**
Sync local code with GitHub repository.

**Windows (Batch):**
```batch
sync_github.bat
```

**Options:**
```batch
sync_github.bat --push-only   # Only push to GitHub
sync_github.bat --pull-only   # Only pull from GitHub
sync_github.bat --full-deploy # Prepare for production deployment
```

---

### 3. **Database Synchronization**
Sync production TiDB Cloud database to local MySQL.

**Windows (PowerShell):**
```powershell
.\database_backups\sync_production_db.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x ./database_backups/sync_production_db.sh
./database_backups/sync_production_db.sh
```

---

## Setup Instructions

### Prerequisites
1. **Git** - Download from https://git-scm.com/download/win
2. **MySQL Client** - Include with MySQL Server installation
3. **Node.js** - For building/running the application
4. **GitHub Access** - Clone URL: `https://github.com/mraitta-art/siwa-oasis.git`

### Initial Setup (First Time)

```powershell
# 1. Clone the repository
git clone https://github.com/mraitta-art/siwa-oasis.git
cd siwa-oasis

# 2. Install dependencies
npm install

# 3. Sync production database
.\database_backups\sync_production_db.ps1

# 4. Start development server
npm run dev
```

---

## Detailed Sync Workflow

### Complete Synchronization (Recommended)

```powershell
# Run the master sync script
.\MASTER_SYNC.ps1
```

**What it does:**
1. ✅ Checks Git status
2. ✅ Stages all changes
3. ✅ Creates a commit with timestamp
4. ✅ Pushes to GitHub (main branch)
5. ✅ Pulls latest from GitHub
6. ✅ Backs up production database
7. ✅ Syncs production data to local MySQL
8. ✅ Provides next steps

---

## Database Configuration

### Production (TiDB Cloud)
- **Host:** gateway01.eu-central-1.prod.aws.tidbcloud.com
- **Port:** 4000
- **Database:** siwa_oasis
- **User:** 3iv5fPeLo2ze3jn.root
- **SSL:** Required

### Local Development (MySQL)
- **Host:** 127.0.0.1 (localhost)
- **Port:** 3306
- **Database:** siwa_oasis
- **User:** root
- **Password:** (empty)

---

## GitHub Repository

- **URL:** https://github.com/mraitta-art/siwa-oasis.git
- **Branch:** main
- **Remote:** origin

### Common Git Commands

```powershell
# Check status
git status

# View recent commits
git log --oneline -10

# Create new branch
git checkout -b feature/your-feature

# Push specific branch
git push origin feature/your-feature
```

---

## Troubleshooting

### Git Issues
```powershell
# Reset local changes
git reset --hard origin/main

# Remove untracked files
git clean -fd

# Check remote configuration
git remote -v
```

### Database Issues
```powershell
# Test local MySQL connection
mysql -h 127.0.0.1 -u root -e "SELECT 1"

# Test production TiDB connection
mysql -h gateway01.eu-central-1.prod.aws.tidbcloud.com -P 4000 -u 3iv5fPeLo2ze3jn.root -p --ssl-mode=REQUIRED -e "SELECT 1"

# List local databases
mysql -u root -e "SHOW DATABASES;"
```

### Permission Issues (Windows)
If scripts won't execute:
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run script with bypass
powershell -ExecutionPolicy Bypass -File .\MASTER_SYNC.ps1
```

---

## Security Notes

⚠️ **Important Security Warnings:**

1. **Credentials Exposure:** Production credentials are embedded in scripts for convenience. For production use:
   - Store credentials in environment variables
   - Use GitHub Secrets for CI/CD
   - Never commit .env files

2. **Database Backups:** All backups are stored in `./database_backups/`
   - Keep backups secure and encrypted
   - Regularly delete old backups
   - Never store backups in public repositories

3. **Git History:** If credentials were committed:
   - Rotate all production passwords immediately
   - Use `git filter-branch` to remove from history
   - Force push to repository

---

## Deployment to Production

After synchronization:

1. **Test locally:**
   ```powershell
   npm run build
   npm start
   ```

2. **Create production bundle:**
   - See [CPANEL_DEPLOYMENT_PACKAGE.md](./CPANEL_DEPLOYMENT_PACKAGE.md)

3. **Upload to cPanel:**
   - Via File Manager (web interface)
   - Via FTP client
   - Via SSH/Terminal

4. **Database migration (if needed):**
   - Run any pending migrations
   - Verify data integrity
   - Test production application

---

## Automation (Optional)

### Windows Task Scheduler
Create automated sync jobs:

```powershell
# Create daily sync task
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-ExecutionPolicy Bypass -File C:\path\to\MASTER_SYNC.ps1"

$Trigger = New-ScheduledTaskTrigger -Daily -At 2AM

Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "SiwaSync" `
  -Description "Daily SIWA Oasis synchronization"
```

### GitHub Actions (CI/CD)
Set up automatic deployments in `.github/workflows/deploy.yml`

---

## Support & Documentation

- **GitHub Issues:** https://github.com/mraitta-art/siwa-oasis/issues
- **Deployment Guide:** [CPANEL_DEPLOYMENT_PACKAGE.md](./CPANEL_DEPLOYMENT_PACKAGE.md)
- **Database Guide:** [DATABASE_PREPARATION_VERIFICATION.md](./DATABASE_PREPARATION_VERIFICATION.md)
- **Environment Variables:** [ENVIRONMENT_VARIABLES_TEMPLATE.md](./ENVIRONMENT_VARIABLES_TEMPLATE.md)

---

**Last Updated:** 2026-05-28
**Version:** 1.0.0

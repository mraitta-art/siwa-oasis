# 🚀 SIWA Oasis - Environment Setup Guide

## ✅ Prerequisites Installation

### 1. **Git for Windows**
**Download:** https://git-scm.com/download/win

**Installation:**
- Run the installer
- Choose "Git Bash Here" option
- Use default settings
- Verify: `git --version`

```powershell
# Verify installation
git --version
git config --list
```

---

### 2. **MySQL Server & Client Tools**

#### Option A: MySQL Community Server (Recommended for Development)
**Download:** https://dev.mysql.com/downloads/mysql/

**Installation Steps:**
1. Download MySQL Server (latest stable version)
2. Run installer
3. Choose "Development Default" setup type
4. Configure MySQL Server as Windows Service
5. Set port to `3306`
6. Create root account with password
7. Start MySQL service

**Verify Installation:**
```powershell
# Check MySQL client
mysql --version

# Test connection
mysql -u root -p
# Enter your password when prompted
```

#### Option B: MySQL via Chocolatey (Faster)
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MySQL
choco install mysql

# Verify
mysql --version
```

#### Option C: MariaDB (MySQL Fork - Good Alternative)
```powershell
choco install mariadb
```

---

### 3. **Node.js & npm**
**Download:** https://nodejs.org/ (LTS version recommended)

**Installation:**
- Run installer
- Accept defaults
- Includes npm automatically

**Verify:**
```powershell
node --version
npm --version
```

---

### 4. **Text Editor / IDE (Optional but Recommended)**
- **Visual Studio Code:** https://code.visualstudio.com
- **WebStorm:** https://www.jetbrains.com/webstorm
- **Sublime Text:** https://www.sublimetext.com

---

## 🗄️ Local Database Setup

### Create Local MySQL Database

```powershell
# Connect to MySQL
mysql -u root -p

# Enter your root password when prompted
```

**In MySQL prompt:**
```sql
-- Create database
CREATE DATABASE siwa_oasis;

-- Create user (optional - for security)
CREATE USER 'siwa_admin'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON siwa_oasis.* TO 'siwa_admin'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SHOW USERS;
```

**Exit MySQL:**
```sql
EXIT;
```

---

## 🔐 Configure Environment Variables

### Create `.env.local` (Development)
In your project root, create `.env.local`:

```env
# Database - Local Development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_root_password
DB_NAME=siwa_oasis

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT (Generate your own in production!)
JWT_SECRET=your-256-bit-secret-here-change-for-production

# Session
SESSION_COOKIE_NAME=siwa_session_dev
```

### Create `.env.production` (Production - DO NOT COMMIT)
```env
# Database - Production TiDB Cloud
DB_HOST=gateway01.eu-central-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3iv5fPeLo2ze3jn.root
DB_PASSWORD=Dj2teUVtQyMYghF3
DB_NAME=siwa_oasis

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://siwa.today

# JWT (GENERATE NEW FOR PRODUCTION!)
JWT_SECRET=generate-new-64-char-secret-here

# Session
SESSION_COOKIE_NAME=siwa_session
```

---

## 📦 Project Setup

### 1. Clone Repository
```powershell
cd C:\path\to\your\workspace
git clone https://github.com/mraitta-art/siwa-oasis.git
cd siwa-oasis
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Synchronize Production Database
```powershell
# Option 1: Full sync (recommended first time)
.\MASTER_SYNC.ps1

# Option 2: Database only (if GitHub already synced)
.\database_backups\sync_production_db.ps1
```

### 4. Start Development Server
```powershell
npm run dev
```

Open browser: http://localhost:3000

---

## 🧪 Verification Checklist

### ✅ Git Setup
```powershell
cd e:\ANitgravity\siwatoday
git status              # Should show clean working directory
git remote -v          # Should show origin remote
git log --oneline      # Should show commits
```

### ✅ MySQL Setup
```powershell
# Test connection
mysql -u root -p
mysql> SELECT VERSION();
mysql> USE siwa_oasis;
mysql> SHOW TABLES;
mysql> EXIT;
```

### ✅ Node.js Setup
```powershell
cd e:\ANitgravity\siwatoday
npm list --depth=0      # Show installed packages
node --version          # Check Node version
npm --version           # Check npm version
```

### ✅ Application Setup
```powershell
npm run build           # Build check
npm run dev             # Start server
# Test at http://localhost:3000
```

---

## 🔄 Synchronization Quick Start

### Complete Sync (All-in-One)
```powershell
cd e:\ANitgravity\siwatoday
.\MASTER_SYNC.ps1
```

### GitHub Only
```powershell
.\sync_github.bat
# or
.\MASTER_SYNC.ps1 -GitHubOnly
```

### Database Only
```powershell
.\database_backups\sync_production_db.ps1
# or
.\MASTER_SYNC.ps1 -DatabaseOnly
```

---

## 🚨 Troubleshooting

### MySQL Connection Errors

**Error: "Can't connect to MySQL server"**
```powershell
# Check if MySQL service is running
Get-Service MySQL80  # or MariaDB101, etc.

# Start service if not running
Start-Service MySQL80

# Verify service status
Get-Service MySQL80 | Select-Object Status
```

**Error: "Access denied for user"**
```powershell
# Reset root password (Windows)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysqld --skip-grant-tables

# In another terminal
mysql -u root
mysql> FLUSH PRIVILEGES;
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
mysql> EXIT;

# Restart MySQL service
Restart-Service MySQL80
```

### Git Push Fails

**Error: "fatal: Authentication failed"**
```powershell
# Check git credentials
git config --list | grep credential

# Add GitHub token
git remote set-url origin https://[YOUR_TOKEN]@github.com/mraitta-art/siwa-oasis.git

# Or use SSH (recommended)
git remote set-url origin git@github.com:mraitta-art/siwa-oasis.git
```

### PowerShell Script Execution Error

**Error: "PowerShell script cannot be loaded"**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run script
.\MASTER_SYNC.ps1
```

---

## 🔐 Security Best Practices

1. **Never commit credentials:**
   - Keep `.env` in `.gitignore` ✅
   - Use environment variables in production ✅
   - Rotate credentials regularly ✅

2. **Database security:**
   - Use strong passwords ✅
   - Limit database user privileges ✅
   - Enable SSL for remote connections ✅

3. **Git security:**
   - Use SSH keys instead of HTTPS ✅
   - Enable branch protection on main ✅
   - Review commits before pushing ✅

---

## 📚 Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **MySQL Documentation:** https://dev.mysql.com/doc
- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com

---

## 🆘 Need Help?

If you encounter issues:

1. **Check error message** - Read the full error output
2. **Search documentation** - Check this guide first
3. **GitHub Issues** - https://github.com/mraitta-art/siwa-oasis/issues
4. **Stack Overflow** - Tag with [mysql], [git], [next.js]

---

**Last Updated:** 2026-05-28
**Version:** 1.0.0

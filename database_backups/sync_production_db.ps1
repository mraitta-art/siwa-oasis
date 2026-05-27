# PowerShell - Production TiDB Database Backup and Sync Script
# Purpose: Backup production database and sync to local development
# Usage: .\sync_production_db.ps1

Write-Host "🔄 Starting Production Database Backup & Sync Process..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Production Database Credentials (from .env)
$PROD_HOST = "gateway01.eu-central-1.prod.aws.tidbcloud.com"
$PROD_PORT = "4000"
$PROD_USER = "3iv5fPeLo2ze3jn.root"
$PROD_PASSWORD = "Dj2teUVtQyMYghF3"
$PROD_DB = "siwa_oasis"

# Local Database Credentials
$LOCAL_HOST = "127.0.0.1"
$LOCAL_PORT = "3306"
$LOCAL_USER = "root"
$LOCAL_PASSWORD = ""
$LOCAL_DB = "siwa_oasis"

# Backup directory
$BACKUP_DIR = "./database_backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR/siwa_oasis_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Step 1: Backup Production Database
Write-Host ""
Write-Host "📦 Step 1: Backing up production database from TiDB Cloud..." -ForegroundColor Yellow
$BackupCmd = @"
mysqldump -h $PROD_HOST -P $PROD_PORT -u $PROD_USER -p$PROD_PASSWORD `
  --ssl-mode=REQUIRED `
  --single-transaction `
  --quick `
  $PROD_DB
"@

try {
    mysqldump -h $PROD_HOST -P $PROD_PORT -u $PROD_USER -p"$PROD_PASSWORD" `
      --ssl-mode=REQUIRED `
      --single-transaction `
      --quick `
      $PROD_DB | Out-File -FilePath $BACKUP_FILE -Encoding UTF8
    
    if ($LASTEXITCODE -eq 0) {
        $BackupSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Host "✅ Production backup created: $BACKUP_FILE" -ForegroundColor Green
        Write-Host "   Size: $([Math]::Round($BackupSize, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "❌ Error backing up production database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Confirm before proceeding
Write-Host ""
Write-Host "⚠️  Step 2: Preparing local database..." -ForegroundColor Yellow
$confirm = Read-Host "⚠️  WARNING: This will replace your local database. Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Sync cancelled." -ForegroundColor Yellow
    exit 0
}

# Drop and recreate local database
try {
    $DropCmd = "DROP DATABASE IF EXISTS $LOCAL_DB; CREATE DATABASE $LOCAL_DB;"
    $ConnectionString = "Server=$LOCAL_HOST;Port=$LOCAL_PORT;User=$LOCAL_USER;"
    
    if ([string]::IsNullOrEmpty($LOCAL_PASSWORD)) {
        mysql -h $LOCAL_HOST -P $LOCAL_PORT -u $LOCAL_USER -e $DropCmd
    } else {
        mysql -h $LOCAL_HOST -P $LOCAL_PORT -u $LOCAL_USER -p"$LOCAL_PASSWORD" -e $DropCmd
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Local database reset" -ForegroundColor Green
    } else {
        Write-Host "❌ Error resetting local database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Import production backup to local
Write-Host ""
Write-Host "📥 Step 3: Importing production data to local database..." -ForegroundColor Yellow
try {
    if ([string]::IsNullOrEmpty($LOCAL_PASSWORD)) {
        Get-Content $BACKUP_FILE | mysql -h $LOCAL_HOST -P $LOCAL_PORT -u $LOCAL_USER $LOCAL_DB
    } else {
        Get-Content $BACKUP_FILE | mysql -h $LOCAL_HOST -P $LOCAL_PORT -u $LOCAL_USER -p"$LOCAL_PASSWORD" $LOCAL_DB
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Production data successfully imported to local database" -ForegroundColor Green
    } else {
        Write-Host "❌ Error importing backup to local database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Verification
Write-Host ""
Write-Host "🔍 Step 4: Verifying sync..." -ForegroundColor Yellow
try {
    $QueryCmd = "USE $LOCAL_DB; SHOW TABLES;"
    $TableCount = (mysql -h $LOCAL_HOST -P $LOCAL_PORT -u $LOCAL_USER -e $QueryCmd | Measure-Object -Line).Lines
    Write-Host "✅ Local database contains $TableCount tables" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify table count" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Production Database Sync Complete!" -ForegroundColor Green
Write-Host "   Backup saved to: $BACKUP_FILE" -ForegroundColor Green
Write-Host "   Local database updated: $LOCAL_DB" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

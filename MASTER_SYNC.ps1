# Master Synchronization Script (PowerShell)
# Purpose: Orchestrate all sync operations (GitHub, Database, Production)
# Usage: .\MASTER_SYNC.ps1 [options]

param(
    [switch]$GitHubOnly,
    [switch]$DatabaseOnly,
    [switch]$Interactive = $true,
    [switch]$NoBackup,
    [switch]$DeployProduction
)

# Configuration
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
}

function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "info"
    )
    $Color = $Colors[$Status]
    Write-Host $Message -ForegroundColor $Color
}

function Confirm-Action {
    param(
        [string]$Message
    )
    if (-not $Interactive) { return $true }
    $response = Read-Host "$Message (y/n)"
    return $response -eq "y"
}

# Main Script
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SIWA OASIS - Master Sync Script       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$StartTime = Get-Date

# Get current directory
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# ============================================
# PHASE 1: GitHub Synchronization
# ============================================
if (-not $DatabaseOnly) {
    Write-Host ""
    Write-Host "📦 PHASE 1: GitHub Synchronization" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    
    # Check if git is installed
    $gitVersion = git --version 2>$null
    if ($null -eq $gitVersion) {
        Write-Status "❌ Git is not installed" "Error"
        exit 1
    }
    Write-Status "✅ Git found: $gitVersion" "Success"
    
    # Check git status
    Write-Host ""
    Write-Status "📊 Current git status:" "Info"
    git status --short
    
    # Stage and commit
    Write-Host ""
    if (Confirm-Action "Stage and commit local changes?") {
        Write-Status "📝 Staging changes..." "Info"
        git add -A
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMsg = "Sync: Auto-update $timestamp"
        
        git commit -m $commitMsg
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✅ Changes committed" "Success"
        } else {
            Write-Status "⚠️  No changes to commit or commit failed" "Warning"
        }
    }
    
    # Push to GitHub
    Write-Host ""
    if (Confirm-Action "Push changes to GitHub?") {
        Write-Status "🚀 Pushing to GitHub..." "Info"
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✅ Successfully pushed to GitHub" "Success"
        } else {
            Write-Status "❌ Error pushing to GitHub" "Error"
        }
    }
    
    # Pull latest
    Write-Host ""
    Write-Status "📥 Pulling latest from GitHub..." "Info"
    git pull origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "✅ Successfully pulled latest" "Success"
    } else {
        Write-Status "⚠️  Warning during pull" "Warning"
    }
}

# ============================================
# PHASE 2: Database Synchronization
# ============================================
if (-not $GitHubOnly) {
    Write-Host ""
    Write-Host "🗄️  PHASE 2: Database Synchronization" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    
    # Check MySQL availability
    $mysqlVersion = mysql --version 2>$null
    if ($null -eq $mysqlVersion) {
        Write-Status "❌ MySQL/MariaDB is not installed" "Error"
        Write-Host "Please install MySQL client tools and try again" -ForegroundColor Yellow
    } else {
        Write-Status "✅ MySQL found: $mysqlVersion" "Success"
        
        # Database credentials
        $ProdHost = "gateway01.eu-central-1.prod.aws.tidbcloud.com"
        $ProdPort = 4000
        $ProdUser = "3iv5fPeLo2ze3jn.root"
        $ProdPassword = "Dj2teUVtQyMYghF3"
        $ProdDB = "siwa_oasis"
        
        $LocalHost = "127.0.0.1"
        $LocalPort = 3306
        $LocalUser = "root"
        $LocalPassword = ""
        $LocalDB = "siwa_oasis"
        
        # Create backup directory
        $BackupDir = "$ProjectRoot/database_backups"
        if (-not (Test-Path $BackupDir)) {
            New-Item -ItemType Directory -Path $BackupDir | Out-Null
        }
        
        # Create backup
        Write-Host ""
        if (-not $NoBackup) {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $BackupFile = "$BackupDir/siwa_oasis_backup_$timestamp.sql"
            
            Write-Status "📦 Backing up production database..." "Info"
            
            & mysqldump -h $ProdHost -P $ProdPort -u $ProdUser -p"$ProdPassword" `
              --ssl-mode=REQUIRED `
              --single-transaction `
              --quick `
              $ProdDB | Out-File -FilePath $BackupFile -Encoding UTF8
            
            if ($LASTEXITCODE -eq 0) {
                $BackupSize = (Get-Item $BackupFile).Length / 1MB
                Write-Status "✅ Backup created: $(Split-Path $BackupFile -Leaf) ($([Math]::Round($BackupSize, 2)) MB)" "Success"
            } else {
                Write-Status "❌ Error backing up database" "Error"
                exit 1
            }
        }
        
        # Sync database
        Write-Host ""
        if (Confirm-Action "⚠️  Sync production database to local? (will overwrite local DB)") {
            Write-Status "Resetting local database..." "Info"
            
            $DropCmd = "DROP DATABASE IF EXISTS $LocalDB; CREATE DATABASE $LocalDB;"
            & mysql -h $LocalHost -P $LocalPort -u $LocalUser -e $DropCmd
            
            if ($LASTEXITCODE -eq 0) {
                Write-Status "✅ Local database reset" "Success"
                
                Write-Status "📥 Importing production data..." "Info"
                $BackupFile = Get-ChildItem "$BackupDir/*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                
                if ($BackupFile) {
                    Get-Content $BackupFile.FullName | & mysql -h $LocalHost -P $LocalPort -u $LocalUser $LocalDB
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Status "✅ Production data imported successfully" "Success"
                    } else {
                        Write-Status "❌ Error importing database" "Error"
                    }
                }
            } else {
                Write-Status "❌ Error resetting local database" "Error"
            }
        }
    }
}

# ============================================
# PHASE 3: Summary
# ============================================
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
$Duration = (Get-Date) - $StartTime
Write-Status "✅ Synchronization Complete!" "Success"
Write-Host "   Duration: $($Duration.TotalSeconds) seconds" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Next steps
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review synchronized changes"
Write-Host "   2. Test application locally"
Write-Host "   3. Run tests: npm test"
Write-Host "   4. Build production bundle: npm run build"
Write-Host "   5. Deploy to cPanel (see CPANEL_DEPLOYMENT_PACKAGE.md)"
Write-Host ""

if ($DeployProduction) {
    Write-Status "🌐 Production deployment required - follow cPanel guide" "Warning"
}

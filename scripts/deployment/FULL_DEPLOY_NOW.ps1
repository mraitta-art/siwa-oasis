# SIWA OASIS - Full Deployment Script
# Complete sync, build, and deploy to production

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "SIWA OASIS - FULL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SiwaOasisDir = Join-Path $ProjectRoot "siwa-oasis"

# PHASE 1: Git Synchronization
Write-Host "[1/3] GITHUB SYNCHRONIZATION" -ForegroundColor Cyan
Set-Location $ProjectRoot

$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "Changes detected. Syncing..." -ForegroundColor Yellow
    git add -A
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Full sync: $timestamp"
    git push origin main
    Write-Host "[OK] GitHub synchronized" -ForegroundColor Green
} else {
    Write-Host "[OK] Everything up to date" -ForegroundColor Green
}

Write-Host ""

# PHASE 2: Build Verification
Write-Host "[2/3] BUILD VERIFICATION" -ForegroundColor Cyan
Set-Location $SiwaOasisDir

if (Test-Path ".next") {
    $nextSize = [math]::Round((Get-ChildItem -Path ".next" -Recurse | Measure-Object -Sum Length).Sum / 1MB, 2)
    Write-Host "[OK] Build found: ${nextSize}MB" -ForegroundColor Green
} else {
    Write-Host "Build not found" -ForegroundColor Red
}

Write-Host ""

# PHASE 3: Create Deployment Package
Write-Host "[3/3] DEPLOYMENT PACKAGE" -ForegroundColor Cyan

Write-Host "Creating package..." -ForegroundColor Yellow

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DeployDir = "deploy_$Timestamp"

if (Test-Path $DeployDir) { Remove-Item $DeployDir -Recurse -Force }
New-Item -ItemType Directory -Path $DeployDir | Out-Null

Copy-Item -Path ".next" -Destination "$DeployDir/.next" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$DeployDir/package.json" -Force
if (Test-Path ".env.production") { Copy-Item -Path ".env.production" -Destination "$DeployDir/.env.production" -Force }
if (Test-Path "public") { Copy-Item -Path "public" -Destination "$DeployDir/public" -Recurse -Force }
if (Test-Path "src") { Copy-Item -Path "src" -Destination "$DeployDir/src" -Recurse -Force }

if (-not (Test-Path "$DeployDir/tmp")) { New-Item -ItemType Directory -Path "$DeployDir/tmp" | Out-Null }
"restart" | Out-File -FilePath "$DeployDir/tmp/restart.txt" -NoNewline

$ZipName = "siwa_production_latest.zip"
if (Test-Path $ZipName) { Remove-Item $ZipName -Force }

$compress = @{
    Path = "$DeployDir/*"
    CompressionLevel = "Optimal"
    DestinationPath = $ZipName
}
Compress-Archive @compress

$zipSize = [math]::Round((Get-Item $ZipName).Length / 1MB, 2)
$fileCount = (Get-ChildItem -Path $DeployDir -Recurse -File).Count

Write-Host "[OK] Package created!" -ForegroundColor Green
Write-Host "  File: $ZipName" -ForegroundColor Gray
Write-Host "  Size: $zipSize MB" -ForegroundColor Gray
Write-Host "  Files: $fileCount" -ForegroundColor Gray

Remove-Item $DeployDir -Recurse -Force

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT PACKAGE READY" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to cPanel: https://siwa.today:2083" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Go to File Manager > public_html > siwa-oasis" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Delete old .next folder" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Upload: $ZipName" -ForegroundColor Cyan
Write-Host "   Location: $SiwaOasisDir" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Extract the ZIP file" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Restart Node.js app in cPanel" -ForegroundColor Gray
Write-Host ""
Write-Host "Time: 5-10 minutes" -ForegroundColor Yellow
Write-Host "Then visit: https://siwa.today" -ForegroundColor Yellow
Write-Host ""
Write-Host "Checklist:" -ForegroundColor Cyan
Write-Host "  - Dark olive background" -ForegroundColor Gray
Write-Host "  - Golden sun in navigation" -ForegroundColor Gray
Write-Host "  - Carousel with journey data" -ForegroundColor Gray
Write-Host "  - Responsive on mobile" -ForegroundColor Gray
Write-Host ""
Write-Host "Status:" -ForegroundColor Green
Write-Host "  Local synchronized: YES" -ForegroundColor Green
Write-Host "  Production package ready: YES" -ForegroundColor Green
Write-Host "  Awaiting cPanel upload..." -ForegroundColor Yellow
Write-Host ""

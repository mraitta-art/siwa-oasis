# SIWA OASIS - Deploy to siwa.today (cPanel)
# Purpose: Package and prepare build files for cPanel upload
# Run: .\DEPLOY_TO_CPANEL.ps1

Write-Host ""
Write-Host "[SIWA OASIS] Deploy to siwa.today" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to app directory
$AppPath = Join-Path $PSScriptRoot "siwa-oasis"
Set-Location $AppPath

# Step 1: Verify build
Write-Host "[BUILD] Step 1: Verifying build artifacts..." -ForegroundColor Yellow

if (-not (Test-Path ".next")) {
    Write-Host "[ERROR] .next directory not found!" -ForegroundColor Red
    Write-Host "   Run 'npm run build' first" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .next directory found" -ForegroundColor Green
Write-Host "   Size: $((Get-ChildItem -Path ".next" -Recurse | Measure-Object -Sum Length).Sum / 1MB)MB" -ForegroundColor Gray

Write-Host ""
Write-Host "[BUILD] Step 2: Creating deployment package..." -ForegroundColor Yellow

# Create deployment folder
$Timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$DeployDir = "siwa_production_deployment_$Timestamp"

if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DeployDir > $null

Write-Host "   * Copying .next folder..." -ForegroundColor Gray
Copy-Item -Path ".next" -Destination "$DeployDir/.next" -Recurse -Force

Write-Host "   * Copying package.json..." -ForegroundColor Gray
Copy-Item -Path "package.json" -Destination "$DeployDir/package.json" -Force

if (Test-Path ".env.production") {
    Write-Host "   * Copying .env.production..." -ForegroundColor Gray
    Copy-Item -Path ".env.production" -Destination "$DeployDir/.env" -Force
} else {
    Write-Host "[WARNING] .env.production not found - YOU MUST CREATE IT on cPanel" -ForegroundColor Yellow
}

if (Test-Path "public") {
    Write-Host "   * Copying public folder..." -ForegroundColor Gray
    Copy-Item -Path "public" -Destination "$DeployDir/public" -Recurse -Force
}

if (Test-Path "src") {
    Write-Host "   * Copying src folder..." -ForegroundColor Gray
    Copy-Item -Path "src" -Destination "$DeployDir/src" -Recurse -Force
}

# Clean up compiler cache and uploads
if (Test-Path "$DeployDir/.next/cache") {
    Write-Host "   * Removing compiler cache to optimize size..." -ForegroundColor Yellow
    Remove-Item "$DeployDir/.next/cache" -Recurse -Force
}

if (Test-Path "$DeployDir/public/uploads") {
    Write-Host "   * Cleaning uploads folder to prevent overwriting production uploads..." -ForegroundColor Yellow
    Remove-Item "$DeployDir/public/uploads/*" -Force -Recurse -ErrorAction SilentlyContinue
}

# Create tmp folder and restart.txt for automatic Passenger restart
$TmpDir = Join-Path $DeployDir "tmp"
if (-not (Test-Path $TmpDir)) {
    New-Item -ItemType Directory -Path $TmpDir > $null
}
$RestartFile = Join-Path $TmpDir "restart.txt"
Get-Date | Out-File -FilePath $RestartFile -Encoding ASCII
Write-Host "   * Created tmp/restart.txt for automatic server restart..." -ForegroundColor Gray

Write-Host ""
Write-Host "[BUILD] Step 3: Creating compressed archive..." -ForegroundColor Yellow

# Compress to latest zip
$ZipPath = "siwa_production_latest.zip"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Compress-Archive -Path $DeployDir -DestinationPath $ZipPath -Force
Write-Host "[OK] Created: $ZipPath" -ForegroundColor Green

Write-Host ""
Write-Host "[STATS] Package Contents:" -ForegroundColor Cyan
Write-Host "   Size: $([math]::Round((Get-Item $ZipPath).Length / 1MB, 2))MB" -ForegroundColor Gray
Write-Host "   Files: $($(Get-ChildItem -Path $DeployDir -Recurse | Measure-Object).Count)" -ForegroundColor Gray

# Clean up temporary deployment folder
if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Deployment package ready!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "UPLOAD TO CPANEL - 4 EASY STEPS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1] DOWNLOAD this file from your computer:" -ForegroundColor Cyan
Write-Host "   $ZipPath" -ForegroundColor White
Write-Host ""

Write-Host "[2] LOGIN to cPanel at:" -ForegroundColor Cyan
Write-Host "   https://siwa.today:2083" -ForegroundColor White
Write-Host "   OR" -ForegroundColor Gray
Write-Host "   cpanel.siwa.today" -ForegroundColor White
Write-Host ""

Write-Host "[3] UPLOAD via File Manager:" -ForegroundColor Cyan
Write-Host "   * Go to: public_html > siwa-oasis (or your app folder)" -ForegroundColor White
Write-Host "   * Click 'Upload' button" -ForegroundColor White
Write-Host "   * Select the .zip file from your computer" -ForegroundColor White
Write-Host "   * Wait for upload to complete" -ForegroundColor White
Write-Host "   * Right-click the .zip -> Extract" -ForegroundColor White
Write-Host ""

Write-Host "[4] RESTART app in cPanel:" -ForegroundColor Cyan
Write-Host "   * Go to: cPanel -> Setup Node.js App" -ForegroundColor White
Write-Host "   * Find: 'siwa-oasis' application" -ForegroundColor White
Write-Host "   * Click: 'Restart' button" -ForegroundColor White
Write-Host ""

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "LIVE SITE:" -ForegroundColor Yellow
Write-Host "   Mobile:  https://siwa.today" -ForegroundColor Cyan
Write-Host ""

Write-Host "VERIFY AFTER DEPLOYMENT (2-3 minutes):" -ForegroundColor Yellow
Write-Host "   * Dark olive background visible (#556B2F)" -ForegroundColor Gray
Write-Host "   * Golden sun icon in navigation" -ForegroundColor Gray
Write-Host "   * Carousel showing real journey data" -ForegroundColor Gray
Write-Host "   * Golden navigation arrows" -ForegroundColor Gray
Write-Host "   * Responsive on mobile device" -ForegroundColor Gray
Write-Host ""

Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "   * Still old version? -> Clear mobile browser cache" -ForegroundColor Gray
Write-Host "   * Page not loading? -> Check app status in cPanel" -ForegroundColor Gray
Write-Host "   * Styles missing? -> Hard refresh (Ctrl+Shift+Delete)" -ForegroundColor Gray
Write-Host ""

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "[READY] You are ready to deploy!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host ""

# Open folder
Write-Host "Opening deployment folder..." -ForegroundColor Gray
explorer.exe $PSScriptRoot

Write-Host "[OK] Done! Follow the 4 steps above to deploy." -ForegroundColor Green

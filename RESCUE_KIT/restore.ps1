# ==============================================================================
# SIWIFY / SIWA OASIS — 1-CLICK WINDOWS RESCUE & RESTORE SCRIPT
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   🚀 SIWIFY.COM — 1-CLICK WINDOWS BOOTSTRAPPER" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $CurrentDir

Set-Location $ProjectDir

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
    Pause
    Exit
}

# 2. Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Git is not in PATH. Please ensure Git is installed." -ForegroundColor Yellow
}

# 3. Run Universal Node Restorer
node "$CurrentDir\restore.js"

# 4. Ask to install dependencies & start
$choice = Read-Host "`nDo you want to run 'npm install' and start the dev server now? (y/n)"
if ($choice -eq 'y' -or $choice -eq 'Y') {
    Write-Host "`n📦 Installing project dependencies..." -ForegroundColor Green
    npm install
    Write-Host "`n🚀 Starting Local Server on http://localhost:3000..." -ForegroundColor Green
    npm run dev
}

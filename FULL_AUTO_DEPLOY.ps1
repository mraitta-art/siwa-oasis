#!/usr/bin/env pwsh
# SIWA OASIS - FULL AUTO DEPLOY (Build -> Package -> FTP)
# Target: siwa.today (cPanel / Node.js)

Set-Location "E:\ANitgravity\siwatoday\siwa-oasis"

$FTPServer  = "ftp.siwa.today"
$FTPUser    = "vercel"
$FTPPass    = "PiCo@@4##73"
$RemotePath = "/public_html/siwa-oasis"
$ZipName    = "siwa_production_latest.zip"
$TempDir    = "siwa_deploy_temp"

function Write-Step { param($msg, $color="Cyan")  Write-Host "" ; Write-Host $msg -ForegroundColor $color }
function Write-OK   { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err  { param($msg) Write-Host "[ERR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "     $msg" -ForegroundColor Gray }

Clear-Host
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  SIWA OASIS - FULL AUTO DEPLOY TO siwa.today     " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# STEP 1: Verify .next exists
Write-Step "STEP 1: Verifying build output..."
if (-not (Test-Path ".\.next")) {
    Write-Err ".next folder not found! Run: npm run build first"
    exit 1
}
Write-OK ".next folder found"

# STEP 2: Package
Write-Step "STEP 2: Packaging production build..."
if (Test-Path $TempDir)  { Remove-Item $TempDir -Recurse -Force }
if (Test-Path $ZipName)  { Remove-Item $ZipName -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Write-Info "Copying .next (excluding cache)..."
Copy-Item ".\.next" "$TempDir\.next" -Recurse -Force
if (Test-Path "$TempDir\.next\cache") { Remove-Item "$TempDir\.next\cache" -Recurse -Force }

Write-Info "Copying runtime files..."
Copy-Item ".\package.json"     "$TempDir\package.json" -Force
Copy-Item ".\server.js"        "$TempDir\server.js"    -Force
Copy-Item ".\.env.production"  "$TempDir\.env"         -Force

if (Test-Path ".\next.config.ts") {
    Copy-Item ".\next.config.ts" "$TempDir\next.config.ts" -Force
}

Write-Info "Compressing to ZIP..."
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipName -Force
Remove-Item $TempDir -Recurse -Force

$zipBytes = (Get-Item $ZipName).Length
$zipMBStr = [math]::Round($zipBytes / 1MB, 2).ToString() + " MB"
Write-OK "Package created: $ZipName ($zipMBStr)"

# STEP 3: FTP Upload
Write-Step "STEP 3: Uploading to FTP server ($FTPServer)..."

$ftpBase = "ftp://$FTPServer$RemotePath"
$creds   = New-Object System.Net.NetworkCredential($FTPUser, $FTPPass)

# Test connection
try {
    $test = [System.Net.FtpWebRequest]::Create("$ftpBase/")
    $test.Credentials = $creds
    $test.UseBinary   = $true
    $test.UsePassive  = $true
    $test.KeepAlive   = $false
    $test.Method      = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    $resp = $test.GetResponse()
    $resp.Close()
    Write-OK "FTP connection established to $FTPServer"
} catch {
    Write-Err "FTP connection failed: $_"
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Yellow
    Write-Host "  FALLBACK: Upload manually via cPanel             " -ForegroundColor Yellow
    Write-Host "  File: $(Get-Location)\$ZipName  ($zipMBStr)     " -ForegroundColor White
    Write-Host "  URL:  https://siwa.today:2083 -> File Manager   " -ForegroundColor White
    Write-Host "===================================================" -ForegroundColor Yellow
    Start-Process explorer.exe (Get-Location).Path
    exit 1
}

# Upload
Write-Info "Uploading $ZipName ($zipMBStr) ..."
try {
    $fileBytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $ZipName))
    $uploadReq  = [System.Net.FtpWebRequest]::Create("$ftpBase/$ZipName")
    $uploadReq.Credentials    = $creds
    $uploadReq.UseBinary      = $true
    $uploadReq.UsePassive     = $true
    $uploadReq.KeepAlive      = $false
    $uploadReq.Method         = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $uploadReq.ContentLength  = $fileBytes.Length
    $uploadReq.Timeout        = 300000
    $stream = $uploadReq.GetRequestStream()
    $stream.Write($fileBytes, 0, $fileBytes.Length)
    $stream.Close()
    $uploadResp = $uploadReq.GetResponse()
    $uploadResp.Close()
    Write-OK "Upload complete: $ZipName -> ftp.siwa.today"
} catch {
    Write-Err "Upload failed: $_"
    Write-Host "Please open cPanel and upload $ZipName manually" -ForegroundColor Yellow
    Start-Process explorer.exe (Get-Location).Path
    exit 1
}

# DONE
Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  UPLOAD COMPLETE - 2 MANUAL STEPS LEFT IN cPANEL " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  STEP A: File Manager -> /public_html/siwa-oasis" -ForegroundColor Cyan
Write-Host "          Right-click siwa_production_latest.zip" -ForegroundColor Cyan
Write-Host "          -> Extract -> Overwrite all -> Confirm  " -ForegroundColor Cyan
Write-Host ""
Write-Host "  STEP B: cPanel -> Setup Node.js App             " -ForegroundColor Cyan
Write-Host "          Find siwa-oasis -> click RESTART         " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then open: https://siwa.today                   " -ForegroundColor Green
Write-Host "  All new features will be LIVE!                  " -ForegroundColor Green
Write-Host ""

Start-Process "https://siwa.today:2083"

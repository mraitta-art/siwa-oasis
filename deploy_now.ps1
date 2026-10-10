#!/usr/bin/env pwsh
# SIWA OASIS - DEPLOY SCRIPT

$FTPServer  = "siwa.today"
$FTPUser    = "mraitta@gmail.com"
$FTPPass    = "PiCo@@4##73"
$RemotePath = "/public_html/siwa-oasis"
$ZipName    = "siwa_production_latest.zip"
$TempDir    = "siwa_deploy_temp"

Write-Host "=== STEP 1: Verify .next ===" -ForegroundColor Cyan
if (-not (Test-Path ".\.next")) {
    Write-Host "[ERR] .next not found! Run: npm run build first" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .next folder found" -ForegroundColor Green

Write-Host "=== STEP 2: Packaging ===" -ForegroundColor Cyan
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
if (Test-Path $ZipName) { Remove-Item $ZipName -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Copy-Item ".\.next" "$TempDir\.next" -Recurse -Force
if (Test-Path "$TempDir\.next\cache") { Remove-Item "$TempDir\.next\cache" -Recurse -Force }
Copy-Item ".\package.json"    "$TempDir\package.json" -Force
Copy-Item ".\server.js"       "$TempDir\server.js"    -Force
Copy-Item ".\.env.production" "$TempDir\.env"         -Force
if (Test-Path ".\next.config.ts") { Copy-Item ".\next.config.ts" "$TempDir\next.config.ts" -Force }
if (Test-Path ".\package-lock.json") { Copy-Item ".\package-lock.json" "$TempDir\package-lock.json" -Force }

Write-Host "Compressing..." -ForegroundColor Gray
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipName -Force
Remove-Item $TempDir -Recurse -Force

$zipMB = [math]::Round((Get-Item $ZipName).Length / 1MB, 2)
Write-Host "[OK] Package ready: $ZipName ($zipMB MB)" -ForegroundColor Green

Write-Host "=== STEP 3: FTP Upload ===" -ForegroundColor Cyan
$ftpBase = "ftp://$FTPServer$RemotePath"
$creds   = New-Object System.Net.NetworkCredential($FTPUser, $FTPPass)

# Test connection
Write-Host "Testing FTP connection..." -ForegroundColor Gray
$test = [System.Net.FtpWebRequest]::Create("$ftpBase/")
$test.Credentials = $creds
$test.UseBinary   = $true
$test.UsePassive  = $true
$test.KeepAlive   = $false
$test.Method      = [System.Net.WebRequestMethods+Ftp]::ListDirectory
$test.Timeout     = 30000
try {
    $resp = $test.GetResponse()
    $resp.Close()
    Write-Host "[OK] FTP connected to $FTPServer" -ForegroundColor Green
} catch {
    Write-Host "[ERR] FTP connection failed: $_" -ForegroundColor Red
    Write-Host "Please upload $ZipName manually via cPanel File Manager" -ForegroundColor Yellow
    Write-Host "cPanel: https://siwa.today:2083" -ForegroundColor Cyan
    Start-Process explorer.exe (Get-Location).Path
    exit 1
}

# Upload
Write-Host "Uploading $ZipName ($zipMB MB) - please wait..." -ForegroundColor Gray
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ZipName))
$up = [System.Net.FtpWebRequest]::Create("$ftpBase/$ZipName")
$up.Credentials   = $creds
$up.UseBinary     = $true
$up.UsePassive    = $true
$up.KeepAlive     = $false
$up.Method        = [System.Net.WebRequestMethods+Ftp]::UploadFile
$up.ContentLength = $fileBytes.Length
$up.Timeout       = 600000
try {
    $stream = $up.GetRequestStream()
    $stream.Write($fileBytes, 0, $fileBytes.Length)
    $stream.Close()
    $upResp = $up.GetResponse()
    $upResp.Close()
    Write-Host "[OK] Upload complete!" -ForegroundColor Green
} catch {
    Write-Host "[ERR] Upload failed: $_" -ForegroundColor Red
    Write-Host "Please upload $ZipName manually via cPanel File Manager" -ForegroundColor Yellow
    Start-Process explorer.exe (Get-Location).Path
    exit 1
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  UPLOAD DONE - 2 MANUAL STEPS LEFT IN cPANEL    " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  A) File Manager -> /public_html/siwa-oasis" -ForegroundColor Cyan
Write-Host "     Right-click siwa_production_latest.zip" -ForegroundColor Cyan
Write-Host "     -> Extract -> Overwrite all -> Confirm" -ForegroundColor Cyan
Write-Host ""
Write-Host "  B) Setup Node.js App -> siwa-oasis -> RESTART" -ForegroundColor Cyan
Write-Host ""
Write-Host "  cPANEL: https://siwa.today:2083" -ForegroundColor Yellow
Write-Host ""

Start-Process "https://siwa.today:2083"

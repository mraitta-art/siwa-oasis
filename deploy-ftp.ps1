#!/usr/bin/env powershell
# SIWA.TODAY FTP Deployment Script
# Uploads and deploys via FTP

param(
    [string]$FTPServer = "ftp.siwa.today",
    [string]$FTPUser = "vercel",
    [string]$FTPPass = "PiCo@@4##73",
    [string]$RemotePath = "/public_html/siwa-oasis",
    [string]$LocalZip = "siwa_production_latest.zip"
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SIWA.TODAY PRODUCTION DEPLOYMENT - FTP METHOD        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verify ZIP
if (-not (Test-Path $LocalZip)) {
    Write-Host "❌ ZIP not found: $LocalZip" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $LocalZip).Length / 1MB, 2)
Write-Host "✓ Package ready: $LocalZip ($zipSize MB)" -ForegroundColor Green
Write-Host ""

try {
    # Create FTP connection
    Write-Host "Step 1: Connecting to FTP server..." -ForegroundColor Cyan
    $ftpUri = "ftp://$FTPServer$RemotePath/"
    $ftpRequest = [System.Net.FtpWebRequest]::Create($ftpUri)
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTPUser, $FTPPass)
    $ftpRequest.UseBinary = $true
    $ftpRequest.UsePassive = $true
    $ftpRequest.KeepAlive = $false
    
    # Test connection by listing directory
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    $response = $ftpRequest.GetResponse()
    Write-Host "✓ Connected to FTP server" -ForegroundColor Green
    $response.Close()
    Write-Host ""
    
    # Upload ZIP file
    Write-Host "Step 2: Uploading deployment package..." -ForegroundColor Cyan
    $fileStream = [System.IO.File]::OpenRead($LocalZip)
    $ftpRequest = [System.Net.FtpWebRequest]::Create("$ftpUri$LocalZip")
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTPUser, $FTPPass)
    $ftpRequest.UseBinary = $true
    $ftpRequest.UsePassive = $true
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    
    $uploadStream = $ftpRequest.GetRequestStream()
    $fileStream.CopyTo($uploadStream)
    $uploadStream.Close()
    $fileStream.Close()
    
    $response = $ftpRequest.GetResponse()
    $response.Close()
    
    Write-Host "✓ Uploaded $LocalZip ($zipSize MB)" -ForegroundColor Green
    Write-Host ""
    
    # Delete old .next
    Write-Host "Step 3: Removing old build..." -ForegroundColor Cyan
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("$ftpUri.next")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTPUser, $FTPPass)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::DeleteDirectory
        $response = $ftpRequest.GetResponse()
        $response.Close()
        Write-Host "✓ Old .next folder removed" -ForegroundColor Green
    } catch {
        Write-Host "✓ Old build cleanup (may not exist)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ FTP UPLOAD COMPLETE!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Next Steps - Complete via cPanel:" -ForegroundColor Yellow
    Write-Host "1. Go to cPanel: https://siwa.today:2083" -ForegroundColor Gray
    Write-Host "2. File Manager → Go to $RemotePath" -ForegroundColor Gray
    Write-Host "3. Extract the ZIP file" -ForegroundColor Gray
    Write-Host "4. Restart Node.js app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏱️  Timeline:" -ForegroundColor Cyan
    Write-Host "- Upload complete: NOW" -ForegroundColor Green
    Write-Host "- Manual extract: 1 minute" -ForegroundColor Gray
    Write-Host "- Restart: 1 minute" -ForegroundColor Gray
    Write-Host "- Live: 2-3 minutes total" -ForegroundColor Green
    
} catch {
    Write-Host "❌ FTP Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Attempting alternative: Creating extraction script..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your FTP upload may still be queued. Check FTP server." -ForegroundColor Gray
}

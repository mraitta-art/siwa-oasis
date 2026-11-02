# SFTP Deployment Script for SIWA.TODAY
# This script deploys the production build to the live server

param(
    [string]$Host = "siwa.today",
    [string]$Username = "vercel",
    [string]$Password = "PiCo@@4##73",
    [string]$RemotePath = "/public_html/siwa-oasis",
    [string]$LocalZip = "siwa_production_20260530_032413.zip"
)

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        SIWA.TODAY PRODUCTION DEPLOYMENT           ║" -ForegroundColor Cyan
Write-Host "║          Via SFTP to Live Server                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if ZIP exists
if (-not (Test-Path $LocalZip)) {
    Write-Host "❌ ERROR: ZIP file not found: $LocalZip" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $LocalZip).Length / 1MB, 2)
Write-Host "✓ ZIP Found: $LocalZip ($zipSize MB)" -ForegroundColor Green
Write-Host "✓ Host: $Host" -ForegroundColor Green
Write-Host "✓ Username: $Username" -ForegroundColor Green
Write-Host "✓ Remote Path: $RemotePath" -ForegroundColor Green
Write-Host ""

# Create WinSCP PowerShell session
try {
    Write-Host "Connecting to server via SFTP..." -ForegroundColor Yellow
    
    Add-Type -Path "C:\Program Files (x86)\WinSCP\WinSCPnet.dll" -ErrorAction SilentlyContinue
    
    if (-not ("WinSCP.SessionOptions" -as [type])) {
        Write-Host "⚠ WinSCP not installed. Trying alternative method..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Create SFTP script manually using:" -ForegroundColor Cyan
        Write-Host "- FileZilla (free FTP/SFTP client)"
        Write-Host "- Or use cPanel File Manager directly" -ForegroundColor Gray
        exit 0
    }
    
    $sessionOptions = New-Object WinSCP.SessionOptions -Property @{
        Protocol = [WinSCP.Protocol]::Sftp
        HostName = $Host
        UserName = $Username
        Password = $Password
        PortNumber = 22
    }
    
    $session = New-Object WinSCP.Session
    $session.Open($sessionOptions)
    
    Write-Host "✓ Connected to server!" -ForegroundColor Green
    Write-Host ""
    
    # Step 1: Delete old .next folder
    Write-Host "Step 1: Removing old build..." -ForegroundColor Cyan
    try {
        $session.RemoveFiles("$RemotePath/.next/*").Check()
        Write-Host "✓ Old .next folder removed" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Warning: Could not remove old .next (may not exist)" -ForegroundColor Yellow
    }
    
    # Step 2: Upload ZIP
    Write-Host ""
    Write-Host "Step 2: Uploading deployment package..." -ForegroundColor Cyan
    $transferResult = $session.PutFiles($LocalZip, "$RemotePath/").Check()
    Write-Host "✓ ZIP uploaded successfully" -ForegroundColor Green
    
    # Step 3: Execute extraction on server
    Write-Host ""
    Write-Host "Step 3: Extracting files on server..." -ForegroundColor Cyan
    Write-Host "⚠ Note: Manual extraction needed in cPanel File Manager" -ForegroundColor Yellow
    
    $session.Close()
    
    Write-Host ""
    Write-Host "✓ SFTP upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to cPanel File Manager: https://siwa.today:2083" -ForegroundColor Gray
    Write-Host "2. Right-click ZIP → Extract" -ForegroundColor Gray
    Write-Host "3. Go to Setup Node.js App → Restart" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please deploy manually:" -ForegroundColor Yellow
    Write-Host "1. Open cPanel File Manager" -ForegroundColor Gray
    Write-Host "2. Upload ZIP file" -ForegroundColor Gray
    Write-Host "3. Extract and restart" -ForegroundColor Gray
}

# SIWA OASIS - Automatic cPanel Deployment
# Uploads ZIP to production and triggers restart

param(
    [string]$FtpHost = "siwa.today",
    [string]$Username = "vercel",
    [string]$Password = "PiCo@@4##73",
    [string]$RemotePath = "/public_html/siwa-oasis",
    [string]$LocalZip = "siwa-oasis/siwa_production_latest.zip"
)

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "SIWA OASIS - AUTOMATIC cPANEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Verify ZIP exists
if (-not (Test-Path $LocalZip)) {
    Write-Host "[ERROR] ZIP not found: $LocalZip" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $LocalZip).Length / 1MB, 2)
Write-Host "[OK] ZIP file found: $zipSize MB" -ForegroundColor Green
Write-Host ""

# Create FTP function
Write-Host "[STEP 1] Connecting to cPanel via FTP..." -ForegroundColor Yellow

try {
    $ftpServer = "ftp://$FtpHost$RemotePath/"
    $ftpUrl = "ftp://$Username`:$Password@$FtpHost$RemotePath/"
    
    Write-Host "  Server: $FtpHost" -ForegroundColor Gray
    Write-Host "  User: $Username" -ForegroundColor Gray
    Write-Host "  Path: $RemotePath" -ForegroundColor Gray
    Write-Host ""
    
    # Use WebClient for FTP upload
    Write-Host "[STEP 2] Uploading ZIP file..." -ForegroundColor Yellow
    
    $webclient = New-Object System.Net.WebClient
    $webclient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
    
    $localFile = (Get-Item $LocalZip).FullName
    $remoteFile = "ftp://$FtpHost$RemotePath/siwa_production_latest.zip"
    
    Write-Host "  From: $localFile" -ForegroundColor Gray
    Write-Host "  To: $remoteFile" -ForegroundColor Gray
    Write-Host "  Uploading..." -ForegroundColor Yellow
    
    $webclient.UploadFile($remoteFile, $localFile)
    
    Write-Host "  [OK] Upload complete!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] FTP upload failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Manual upload steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://siwa.today:2083" -ForegroundColor Gray
    Write-Host "2. File Manager > public_html > siwa-oasis" -ForegroundColor Gray
    Write-Host "3. Upload: $LocalZip" -ForegroundColor Gray
    Write-Host "4. Extract ZIP" -ForegroundColor Gray
    Write-Host "5. Restart Node.js app" -ForegroundColor Gray
    exit 1
}

Write-Host "[STEP 3] Extraction will happen automatically on cPanel..." -ForegroundColor Yellow
Write-Host "  The .zip will auto-extract via cPanel hooks" -ForegroundColor Gray
Write-Host ""

Write-Host "[STEP 4] App restart notice..." -ForegroundColor Yellow
Write-Host "  Manual action needed:" -ForegroundColor Yellow
Write-Host "  1. Go to cPanel > Setup Node.js App" -ForegroundColor Gray
Write-Host "  2. Find 'siwa-oasis' and click 'Restart'" -ForegroundColor Gray
Write-Host ""

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 2-3 minutes for server cache, then visit:" -ForegroundColor Cyan
Write-Host "  https://siwa.today" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify:" -ForegroundColor Cyan
Write-Host "  - Dark olive background" -ForegroundColor Gray
Write-Host "  - Golden sun navigation" -ForegroundColor Gray
Write-Host "  - Carousel with journey data" -ForegroundColor Gray
Write-Host "  - Responsive on mobile" -ForegroundColor Gray
Write-Host ""

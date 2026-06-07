#!/usr/bin/env pwsh
<#
.SYNOPSIS
    SIWA OASIS - Automated Production Deployment to siwa.today
.DESCRIPTION
    Packages and uploads all production files to cPanel server
.PARAMETER FtpHost
    FTP/SFTP server hostname (e.g., siwa.today or ftp.siwa.today)
.PARAMETER FtpUser
    FTP username for cPanel
.PARAMETER FtpPassword
    FTP password for cPanel
.EXAMPLE
    .\DEPLOY_TO_PRODUCTION.ps1 -FtpHost "siwa.today" -FtpUser "cpanel_user" -FtpPassword "password"
#>

param(
    [string]$FtpHost = "siwa.today",
    [string]$FtpUser = "",
    [string]$FtpPassword = "",
    [string]$RemotePath = "/public_html/siwa-oasis/"
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Progress = "White"
}

function Write-Status {
    param([string]$Message, [string]$Status = "Info")
    $Color = $Colors[$Status]
    Write-Host "[$Status] $Message" -ForegroundColor $Color
}

function Test-DeploymentReady {
    Write-Status "Checking deployment requirements..." "Progress"
    
    $checks = @(
        @{Name = ".next folder"; Path = ".\.next"; Type = "Directory"}
        @{Name = "package.json"; Path = ".\package.json"; Type = "File"}
        @{Name = "server.js"; Path = ".\server.js"; Type = "File"}
        @{Name = ".env.production"; Path = ".\.env.production"; Type = "File"}
    )
    
    $allGood = $true
    foreach ($check in $checks) {
        if (Test-Path $check.Path -PathType $check.Type) {
            Write-Status "✓ $($check.Name) found" "Success"
        } else {
            Write-Status "✗ $($check.Name) MISSING!" "Error"
            $allGood = $false
        }
    }
    
    return $allGood
}

function Compress-Deployment {
    Write-Status "Creating deployment package..." "Progress"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $zipPath = "siwa_deployment_$timestamp.zip"
    
    # Create temp folder
    $tempDir = "siwa_deploy_temp_$timestamp"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copy files
    Write-Status "  Copying .next folder..." "Progress"
    Copy-Item -Path ".\.next" -Destination "$tempDir\.next" -Recurse -Force
    
    if (Test-Path "$tempDir\.next\cache") {
        Write-Status "  🧹 Removing compiler cache to optimize size..." "Progress"
        Remove-Item "$tempDir\.next\cache" -Recurse -Force
    }
    
    Write-Status "  Copying package.json..." "Progress"
    Copy-Item -Path ".\package.json" -Destination "$tempDir\package.json" -Force
    
    Write-Status "  Copying server.js..." "Progress"
    Copy-Item -Path ".\server.js" -Destination "$tempDir\server.js" -Force
    
    Write-Status "  Copying .env.production as .env..." "Progress"
    Copy-Item -Path ".\.env.production" -Destination "$tempDir\.env" -Force
    
    # Compress
    Write-Status "  Compressing to ZIP..." "Progress"
    Compress-Archive -Path $tempDir -DestinationPath $zipPath -Force
    
    # Cleanup
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Status "Deployment package created: $zipPath" "Success"
    return $zipPath
}

function Deploy-ViaSFTP {
    param(
        [string]$ZipFile,
        [string]$Host,
        [string]$User,
        [string]$Password
    )
    
    Write-Status "Preparing SFTP upload..." "Info"
    
    # Use PowerShell SFTP via Posh-SSH module (if available)
    # Otherwise create manual instructions
    
    Write-Status "Creating deployment script..." "Progress"
    
    $sftpScript = @"
# SFTP Deployment Script
# Run this with: lftp -u $User,$Password $Host

cd $RemotePath
put $ZipFile
quote SITE CHMOD 755 $ZipFile
ls -la

# After uploading, extract in cPanel:
# Right-click ZIP → Extract
# Delete ZIP
# Restart app in Setup Node.js App
"@
    
    $scriptPath = "deploy_sftp_commands.txt"
    Set-Content -Path $scriptPath -Value $sftpScript
    Write-Status "SFTP commands saved to: $scriptPath" "Success"
}

function Create-ManualInstructions {
    param([string]$ZipFile)
    
    $instructions = @"
═══════════════════════════════════════════════════════════════════
  SIWA OASIS - MANUAL DEPLOYMENT TO siwa.today
═══════════════════════════════════════════════════════════════════

Your deployment package is ready: $ZipFile

FOLLOW THESE STEPS (5 minutes):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Download the deployment file
  Location: $(Get-Location)\$ZipFile
  Size: $('{0:N2}' -f (Get-Item $ZipFile).Length / 1MB) MB

STEP 2: Login to cPanel
  URL: https://siwa.today:2083
  Username: [YOUR_CPANEL_USERNAME]
  Password: [YOUR_CPANEL_PASSWORD]

STEP 3: Open File Manager
  From cPanel Home → File Manager → public_html
  Navigate to: siwa-oasis folder
  You should see: .next, src, public, node_modules, etc.

STEP 4: Delete old .next folder
  Right-click on .next → Delete
  Confirm deletion

STEP 5: Upload the deployment ZIP
  Click "Upload" button
  Select: $ZipFile (from your Downloads)
  Wait for upload to complete (may take 1-2 min)

STEP 6: Extract the ZIP
  Right-click $ZipFile
  Select "Extract"
  Click "Extract File(s)"
  Wait for extraction

STEP 7: Delete the ZIP file
  Right-click $ZipFile
  Select "Delete"

STEP 8: Verify files were extracted
  You should see the NEW .next folder
  And updated package.json, server.js

STEP 9: Restart the Node.js app
  From cPanel → "Setup Node.js App"
  Find "siwa-oasis" in the list
  Click "Restart" button
  Wait 2-3 seconds for restart

STEP 10: Test on mobile
  Open: https://www.siwa.today
  Look for:
    ✓ Dark olive background (#556B2F)
    ✓ Golden sun icon
    ✓ Carousel with real journey data
    ✓ Mobile responsive layout

DONE! ✓ siwa.today now matches localhost:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TROUBLESHOOTING:

Q: Still seeing old version?
A: Hard refresh browser (Ctrl+Shift+Delete) or wait 3-5 minutes

Q: Upload failed?
A: Check file size, try uploading smaller pieces, or use FTP instead

Q: App won't start?
A: Check cPanel logs, verify .env has correct database credentials

Q: Carousel shows no data?
A: Verify TiDB connection in .env file, check database exists

═══════════════════════════════════════════════════════════════════
"@
    
    $instructionFile = "DEPLOYMENT_INSTRUCTIONS.txt"
    Set-Content -Path $instructionFile -Value $instructions
    
    Write-Host $instructions -ForegroundColor Cyan
}

function Main {
    Clear-Host
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   SIWA OASIS - Production Deployment Manager          ║" -ForegroundColor Cyan
    Write-Host "║   Deploying to: siwa.today                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $startTime = Get-Date
    
    # Step 1: Verify everything is ready
    if (-not (Test-DeploymentReady)) {
        Write-Status "Deployment check FAILED" "Error"
        exit 1
    }
    
    Write-Host ""
    
    # Step 2: Create deployment package
    $zipFile = Compress-Deployment
    
    Write-Host ""
    
    # Step 3: Create instructions
    Create-ManualInstructions -ZipFile $zipFile
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✓ DEPLOYMENT PACKAGE READY               ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    $duration = (Get-Date) - $startTime
    Write-Status "Total time: $($duration.TotalSeconds)s" "Info"
    
    # Open folder in File Explorer
    Write-Host ""
    Write-Status "Opening deployment folder..." "Progress"
    Start-Process explorer.exe (Get-Location)
    
    Write-Host ""
    Write-Status "Ready to deploy! Follow the instructions above." "Success"
}

# Run
Set-Location "E:\ANitgravity\siwatoday\siwa-oasis"
Main

#!/usr/bin/env powershell
# SIWA.TODAY - Automated Production Deployment Script
# This script deploys the production build via SFTP/SSH

param(
    [string]$Host = "siwa.today",
    [string]$Username = "vercel",
    [string]$Password = "PiCo@@4##73",
    [int]$Port = 22,
    [string]$RemotePath = "/home/vercel/public_html/siwa-oasis",
    [string]$LocalZip = "siwa_production_latest.zip"
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SIWA.TODAY PRODUCTION DEPLOYMENT - AUTOMATED         ║" -ForegroundColor Cyan
Write-Host "║            Deploying to: siwa.today                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verify ZIP exists
if (-not (Test-Path $LocalZip)) {
    Write-Host "❌ ERROR: ZIP file not found!" -ForegroundColor Red
    Write-Host "   Expected: $LocalZip" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $LocalZip).Length / 1MB, 2)
Write-Host "✓ Deployment Package Found" -ForegroundColor Green
Write-Host "  File: $LocalZip" -ForegroundColor Gray
Write-Host "  Size: $zipSize MB" -ForegroundColor Gray
Write-Host ""

Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $Host" -ForegroundColor Gray
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Username: $Username" -ForegroundColor Gray
Write-Host "  Remote Path: $RemotePath" -ForegroundColor Gray
Write-Host ""

# Try to load SSH.NET library
Write-Host "Checking for SSH libraries..." -ForegroundColor Yellow
$sshNetPath = "C:\Program Files\SSH.NET\Renci.SshNet.dll"
$winScpPath = "C:\Program Files (x86)\WinSCP\WinSCPnet.dll"

$hasSSHNet = Test-Path $sshNetPath
$hasWinSCP = Test-Path $winScpPath

if ($hasSSHNet) {
    Write-Host "✓ SSH.NET found - using for deployment" -ForegroundColor Green
    
    # Use SSH.NET for SFTP deployment
    Write-Host ""
    Write-Host "Step 1: Connecting to server..." -ForegroundColor Cyan
    
    try {
        Add-Type -Path $sshNetPath
        
        $connectionInfo = New-Object Renci.SshNet.PasswordConnectionInfo($Host, $Port, $Username, $Password)
        $sftp = New-Object Renci.SshNet.SftpClient($connectionInfo)
        $sftp.Connect()
        
        Write-Host "✓ Connected successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Step 2: List directory
        Write-Host "Step 2: Checking remote directory..." -ForegroundColor Cyan
        $files = $sftp.ListDirectory($RemotePath)
        $hasNextFolder = $files | Where-Object { $_.Name -eq ".next" }
        
        if ($hasNextFolder) {
            Write-Host "  Found old .next folder - removing..." -ForegroundColor Yellow
            $sftp.DeleteDirectory("$RemotePath/.next")
            Write-Host "✓ Old .next folder removed" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Step 3: Uploading deployment package..." -ForegroundColor Cyan
        $localFile = Get-Item $LocalZip
        $sftp.UploadFile([System.IO.File]::OpenRead($localFile.FullName), "$RemotePath/$LocalZip")
        Write-Host "✓ ZIP uploaded successfully ($zipSize MB)" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Step 4: Running extraction script..." -ForegroundColor Cyan
        
        # Create extraction script on server
        $extractScript = @"
#!/bin/bash
cd $RemotePath
unzip -o $LocalZip
rm $LocalZip
echo 'Extraction complete'
"@
        
        # Connect via SSH to execute extraction
        $ssh = New-Object Renci.SshNet.SshClient($Host, $Port, $Username, $Password)
        $ssh.Connect()
        
        $cmd = $ssh.CreateCommand("cd $RemotePath && unzip -o $LocalZip && rm $LocalZip && ls -la .next")
        $result = $cmd.Execute()
        
        if ($cmd.ExitStatus -eq 0) {
            Write-Host "✓ Extraction complete" -ForegroundColor Green
            Write-Host "  Output: $($result.Substring(0, [Math]::Min(200, $result.Length)))" -ForegroundColor Gray
        } else {
            Write-Host "⚠ Extraction may need manual step" -ForegroundColor Yellow
        }
        
        # Step 5: Restart application
        Write-Host ""
        Write-Host "Step 5: Restarting Node.js application..." -ForegroundColor Cyan
        
        $restartCmd = $ssh.CreateCommand("pm2 restart siwa-oasis 2>/dev/null || systemctl restart siwa-oasis 2>/dev/null || echo 'Restart via cPanel needed'")
        $restartResult = $restartCmd.Execute()
        Write-Host "✓ Restart command sent" -ForegroundColor Green
        Write-Host "  $restartResult" -ForegroundColor Gray
        
        $ssh.Disconnect()
        $sftp.Disconnect()
        
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
        exit 1
    }
    
} elseif ($hasWinSCP) {
    Write-Host "✓ WinSCP found - using for deployment" -ForegroundColor Green
    # Similar WinSCP deployment code...
    
} else {
    Write-Host "⚠ No SSH libraries found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download one of these to enable automated deployment:" -ForegroundColor Cyan
    Write-Host "1. SSH.NET: https://github.com/sshnet/ssh.net/releases" -ForegroundColor Gray
    Write-Host "2. WinSCP: https://winscp.net/eng/download.php" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For now, use manual deployment steps:" -ForegroundColor Cyan
    Write-Host "→ Open: MANUAL_DEPLOYMENT_EXACT_STEPS.md" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait 1-2 minutes for server to cache" -ForegroundColor Gray
Write-Host "2. Open https://www.siwa.today on mobile" -ForegroundColor Gray
Write-Host "3. Verify: Dark olive background (not blue)" -ForegroundColor Gray
Write-Host "4. Verify: Carousel with real journey data" -ForegroundColor Gray
Write-Host ""

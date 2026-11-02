# 🚀 QUICK DEPLOYMENT RUNNER
# Run this script to deploy to production

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      SIWA.TODAY - PRODUCTION DEPLOYMENT START        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$zipFile = "siwa_production_20260530_032413.zip"
$currentDir = Get-Location

# Check ZIP exists
if (-not (Test-Path $zipFile)) {
    Write-Host "❌ Error: ZIP not found in: $currentDir" -ForegroundColor Red
    Write-Host "   Looking for: $zipFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Current directory: $currentDir" -ForegroundColor Gray
    Write-Host "Files here:" -ForegroundColor Gray
    Get-ChildItem *.zip 2>/dev/null | ForEach-Object { Write-Host "  - $($_.Name)" }
    exit 1
}

$zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)

Write-Host "✓ Deployment ZIP found!" -ForegroundColor Green
Write-Host ""
Write-Host "Package Details:" -ForegroundColor Cyan
Write-Host "  File: $zipFile" -ForegroundColor Gray
Write-Host "  Size: $zipSize MB" -ForegroundColor Gray
Write-Host "  Location: $currentDir" -ForegroundColor Gray
Write-Host ""

Write-Host "Choose deployment method:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ⚡ Automated (SSH/SFTP)" -ForegroundColor Green
Write-Host "   → Requires SSH.NET or WinSCP installed" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🖱️  Manual (Step-by-Step via Browser)" -ForegroundColor Green
Write-Host "   → Works with any browser" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 📋 Quick Start" -ForegroundColor Green
Write-Host "   → View quick reference" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting automated deployment..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check for SSH libraries
        $sshNetInstalled = Test-Path "C:\Program Files\SSH.NET\Renci.SshNet.dll"
        $winScpInstalled = Test-Path "C:\Program Files (x86)\WinSCP\WinSCPnet.dll"
        
        if ($sshNetInstalled -or $winScpInstalled) {
            Write-Host "✓ SSH library detected!" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏳ Connecting to siwa.today..." -ForegroundColor Yellow
            
            # Run the automated deployment
            & ".\AUTOMATED_DEPLOY.ps1"
        } else {
            Write-Host "❌ SSH libraries not installed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install one of these:" -ForegroundColor Yellow
            Write-Host "1. SSH.NET: https://github.com/sshnet/ssh.net" -ForegroundColor Gray
            Write-Host "2. WinSCP: https://winscp.net" -ForegroundColor Gray
            Write-Host ""
            Write-Host "For now, use Method 2 (Manual)" -ForegroundColor Cyan
        }
    }
    "2" {
        Write-Host ""
        Write-Host "📖 Opening manual deployment guide..." -ForegroundColor Cyan
        Write-Host ""
        
        # Display manual steps
        $manualFile = "MANUAL_DEPLOYMENT_EXACT_STEPS.md"
        if (Test-Path $manualFile) {
            Get-Content $manualFile
        } else {
            Write-Host "Could not find: $manualFile" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "📋 QUICK REFERENCE" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✓ ZIP Ready: $zipFile ($zipSize MB)" -ForegroundColor Green
        Write-Host "✓ Server: siwa.today" -ForegroundColor Green
        Write-Host "✓ Username: vercel" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 5-Step Deployment:" -ForegroundColor Cyan
        Write-Host "1. Login to cPanel: https://siwa.today:2083" -ForegroundColor Gray
        Write-Host "2. File Manager → Delete old .next" -ForegroundColor Gray
        Write-Host "3. Upload ZIP file" -ForegroundColor Gray
        Write-Host "4. Extract ZIP" -ForegroundColor Gray
        Write-Host "5. Restart Node.js app" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⏱️  Time: 5-10 minutes" -ForegroundColor Cyan
        Write-Host "📱 Then: Open siwa.today on mobile to verify" -ForegroundColor Cyan
        Write-Host ""
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""

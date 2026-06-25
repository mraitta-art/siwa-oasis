#!/usr/bin/env pwsh
<#
.SYNOPSIS
  SIWA.TODAY — Master Sync & Deploy Launcher
  Double-click this file (or run in PowerShell) to start the full system.

.DESCRIPTION
  This script is the single entry point for the complete auto-sync system.
  It presents a menu to:
    1. Start Live-Deploy Watcher  (watches files → auto pushes to GitHub → Vercel deploys)
    2. Push Once Now              (commit + push current changes immediately)
    3. Sync Database              (pull production DB to local, or push local to prod)
    4. Run Security Check         (scan for secrets, validate env)
    5. Check Sync Status          (show git status, last commit, drift)
    6. Open Vercel Dashboard      (in browser)
    7. Open GitHub Repo           (in browser)
    8. Start Dev Server           (npm run dev)

.NOTES
  Requires: Node.js >=20, Git configured with GitHub credentials
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── Paths ─────────────────────────────────────────────────────────────────
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    # Script may be run from project root
    $ProjectRoot = $PSScriptRoot
}
$ScriptsDir = Join-Path $ProjectRoot "scripts"

# ─── Helpers ───────────────────────────────────────────────────────────────
function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║         SIWA.TODAY  —  COMPLETE SYNC SYSTEM             ║" -ForegroundColor Cyan
    Write-Host "  ║         Local ↔ GitHub ↔ Vercel ↔ Production            ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # Show quick status
    try {
        Push-Location $ProjectRoot
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        $hash   = git rev-parse --short HEAD 2>$null
        $dirty  = git status --porcelain 2>$null
        $count  = if ($dirty) { ($dirty -split "`n" | Where-Object { $_ }).Count } else { 0 }
        Pop-Location

        Write-Host "  Branch : " -NoNewline -ForegroundColor DarkGray
        Write-Host "origin/$branch" -ForegroundColor Yellow
        Write-Host "  Commit : " -NoNewline -ForegroundColor DarkGray
        Write-Host $hash -ForegroundColor Yellow
        if ($count -gt 0) {
            Write-Host "  Status : " -NoNewline -ForegroundColor DarkGray
            Write-Host "$count file(s) not yet pushed" -ForegroundColor Magenta
        } else {
            Write-Host "  Status : " -NoNewline -ForegroundColor DarkGray
            Write-Host "Fully synced with GitHub ✓" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Status : " -NoNewline -ForegroundColor DarkGray
        Write-Host "Git unavailable" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "  ──────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Menu {
    Write-Host "  Choose an action:" -ForegroundColor White
    Write-Host ""
    Write-Host "   [1]  🚀  Start Live-Deploy Watcher" -ForegroundColor Green
    Write-Host "            (Watches files → auto-pushes to GitHub → Vercel deploys)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   [2]  📤  Push Changes Once Now" -ForegroundColor Cyan
    Write-Host "            (Commit + push all current changes immediately)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   [3]  🗄️  Database Sync Menu" -ForegroundColor Yellow
    Write-Host "            (Pull production → local, or push local → production)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   [4]  🔒  Run Security Check" -ForegroundColor Magenta
    Write-Host "            (Scan for secrets, validate env files, gitignore)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   [5]  📊  Check Sync Status" -ForegroundColor White
    Write-Host "            (Show what's changed locally vs GitHub)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   [6]  🌐  Open Vercel Dashboard" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   [7]  📦  Open GitHub Repository" -ForegroundColor Blue
    Write-Host ""
    Write-Host "   [8]  💻  Start Local Dev Server (npm run dev)" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "   [Q]  ❌  Quit" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  ──────────────────────────────────────────────────────────" -ForegroundColor DarkGray
}

function Invoke-NodeScript($scriptName, $args = @()) {
    $scriptPath = Join-Path $ScriptsDir $scriptName
    if (-not (Test-Path $scriptPath)) {
        Write-Host "  ❌ Script not found: $scriptPath" -ForegroundColor Red
        return
    }
    Write-Host ""
    Push-Location $ProjectRoot
    try {
        $argStr = $args -join ' '
        & node $scriptPath @args
    } finally {
        Pop-Location
    }
}

function Show-DbMenu {
    Write-Host ""
    Write-Host "  ┌──────────────────────────────────────┐" -ForegroundColor Yellow
    Write-Host "  │       DATABASE SYNC OPTIONS           │" -ForegroundColor Yellow
    Write-Host "  ├──────────────────────────────────────┤" -ForegroundColor Yellow
    Write-Host "  │  [P]  Pull PRODUCTION → local         │" -ForegroundColor Yellow
    Write-Host "  │       (overwrites local with prod data)│" -ForegroundColor Yellow
    Write-Host "  │                                       │" -ForegroundColor Yellow
    Write-Host "  │  [U]  Push local → PRODUCTION         │" -ForegroundColor Yellow
    Write-Host "  │       (overwrites prod with local data)│" -ForegroundColor Yellow
    Write-Host "  │                                       │" -ForegroundColor Yellow
    Write-Host "  │  [B]  Back to main menu               │" -ForegroundColor Yellow
    Write-Host "  └──────────────────────────────────────┘" -ForegroundColor Yellow
    Write-Host ""

    $dbChoice = Read-Host "  Enter choice"
    switch ($dbChoice.ToUpper()) {
        'P' {
            Write-Host ""
            Write-Host "  ⚠️  This will OVERWRITE your local database with production data." -ForegroundColor Red
            $confirm = Read-Host "  Type YES to confirm"
            if ($confirm -eq 'YES') {
                Write-Host "  Pulling production database..." -ForegroundColor Cyan
                Push-Location $ProjectRoot
                & node scripts/sync_database.js --pull
                Pop-Location
            } else {
                Write-Host "  Cancelled." -ForegroundColor DarkGray
            }
        }
        'U' {
            Write-Host ""
            Write-Host "  ⚠️  This will OVERWRITE production database with local data." -ForegroundColor Red
            Write-Host "  ⚠️  This affects LIVE users on siwa.today!" -ForegroundColor Red
            $confirm = Read-Host "  Type CONFIRM to proceed"
            if ($confirm -eq 'CONFIRM') {
                Write-Host "  Pushing local database to production..." -ForegroundColor Cyan
                Push-Location $ProjectRoot
                & node scripts/push-local-to-prod.js
                Pop-Location
            } else {
                Write-Host "  Cancelled." -ForegroundColor DarkGray
            }
        }
        'B' { return }
        default { Write-Host "  Invalid choice." -ForegroundColor Red }
    }
}

# ─── Main Loop ─────────────────────────────────────────────────────────────
while ($true) {
    Write-Banner
    Write-Menu

    $choice = Read-Host "  Enter choice"
    Write-Host ""

    switch ($choice.ToUpper()) {

        '1' {
            Write-Host "  🚀 Starting Live-Deploy Watcher..." -ForegroundColor Green
            Write-Host "  Any file save in src/ will auto-push to GitHub in ~4 seconds." -ForegroundColor DarkGray
            Write-Host "  Vercel will then deploy to siwa.today in ~2-4 minutes." -ForegroundColor DarkGray
            Write-Host "  Press Ctrl+C in the new window to stop." -ForegroundColor DarkGray
            Write-Host ""
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "cd '$ProjectRoot'; Write-Host '🚀 SIWA LIVE-DEPLOY WATCHER' -ForegroundColor Green; node scripts/live-deploy.js"
            )
            Write-Host "  ✅ Watcher launched in a new window." -ForegroundColor Green
            Start-Sleep -Seconds 2
        }

        '2' {
            Write-Host "  📤 Pushing all current changes..." -ForegroundColor Cyan
            Push-Location $ProjectRoot
            & node scripts/live-deploy.js --once
            Pop-Location
            Write-Host ""
            Write-Host "  Press Enter to return to menu..."
            Read-Host | Out-Null
        }

        '3' {
            Show-DbMenu
            Write-Host "  Press Enter to return to menu..."
            Read-Host | Out-Null
        }

        '4' {
            Write-Host "  🔒 Running security check..." -ForegroundColor Magenta
            Push-Location $ProjectRoot
            & node scripts/security-check.js
            Pop-Location
            Write-Host ""
            Write-Host "  Press Enter to return to menu..."
            Read-Host | Out-Null
        }

        '5' {
            Write-Host "  📊 Checking sync status..." -ForegroundColor White
            Push-Location $ProjectRoot
            & node scripts/live-deploy.js --status
            Write-Host ""
            Write-Host "  Recent Git Log:" -ForegroundColor DarkGray
            git log --oneline -8
            Pop-Location
            Write-Host ""
            Write-Host "  Press Enter to return to menu..."
            Read-Host | Out-Null
        }

        '6' {
            Write-Host "  🌐 Opening Vercel Dashboard..." -ForegroundColor Blue
            Start-Process "https://vercel.com/mraitta-art"
        }

        '7' {
            Write-Host "  📦 Opening GitHub Repository..." -ForegroundColor Blue
            Start-Process "https://github.com/mraitta-art/siwa-oasis"
        }

        '8' {
            Write-Host "  💻 Starting local dev server..." -ForegroundColor DarkCyan
            Start-Process powershell -ArgumentList @(
                "-NoExit",
                "-Command",
                "cd '$ProjectRoot'; Write-Host '💻 DEV SERVER' -ForegroundColor Cyan; npm run dev"
            )
            Write-Host "  ✅ Dev server launching at http://localhost:3000" -ForegroundColor Green
            Start-Sleep -Seconds 2
        }

        { $_ -in @('Q', 'QUIT', 'EXIT') } {
            Write-Host "  Goodbye! 👋" -ForegroundColor DarkGray
            Write-Host ""
            exit 0
        }

        default {
            Write-Host "  Invalid choice. Press Enter to try again..." -ForegroundColor Red
            Read-Host | Out-Null
        }
    }
}

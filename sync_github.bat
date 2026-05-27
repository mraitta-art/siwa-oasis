@echo off
REM GitHub Synchronization Script
REM Purpose: Sync local code with GitHub and optionally deploy to production
REM Usage: sync_github.bat [--push-only] [--pull-only] [--full-deploy]

setlocal enabledelayedexpansion

echo.
echo ================================================
echo 🔄 GitHub Synchronization Script
echo ================================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed or not in PATH
    exit /b 1
)

REM Parse command line arguments
set ACTION=full
set DEPLOY=0

for %%A in (%*) do (
    if "%%A"=="--push-only" set ACTION=push-only
    if "%%A"=="--pull-only" set ACTION=pull-only
    if "%%A"=="--full-deploy" set DEPLOY=1
)

REM Step 1: Check current git status
echo 📊 Step 1: Checking local changes...
git status

REM Step 2: Stage all changes (except those in .gitignore)
if "!ACTION!"=="pull-only" (
    echo ⏭️  Skipping local commit (pull-only mode)
    goto pull_changes
)

echo.
echo 📝 Step 2: Staging changes...
git add -A

REM Show what will be committed
git status --short
set /p CONFIRM="Continue with commit? (y/n): "
if /i not "!CONFIRM!"=="y" (
    echo ❌ Aborted by user
    exit /b 1
)

REM Step 3: Commit changes
echo.
echo 📦 Step 3: Creating commit...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

git commit -m "Sync: Update from local [%mydate% %mytime%]" || (
    echo ⚠️  No changes to commit or commit failed
)

REM Step 4: Push to GitHub
if "!ACTION!"=="pull-only" goto pull_changes

echo.
echo 🚀 Step 4: Pushing to GitHub (branch: main)...
git push origin main

if !errorlevel! neq 0 (
    echo ❌ Error pushing to GitHub
    echo Try: git push -u origin main
    exit /b 1
)
echo ✅ Successfully pushed to GitHub

:pull_changes
REM Step 5: Pull latest from GitHub
echo.
echo 📥 Step 5: Pulling latest from GitHub...
git pull origin main

if !errorlevel! neq 0 (
    echo ⚠️  Warning: Some conflicts or errors during pull
)

REM Step 6: Display summary
echo.
echo ================================================
echo ✅ GitHub Sync Complete!
echo ================================================
echo.
echo 📊 Current Status:
git log --oneline -5
echo.
git branch -v
echo.

REM Optional: Deploy to production
if "!DEPLOY!"=="1" (
    echo.
    echo 🌐 Step 6: Deploying to production...
    echo ⚠️  Deployment requires manual upload to cPanel
    echo    See: CPANEL_DEPLOYMENT_PACKAGE.md for instructions
    echo.
    echo To deploy:
    echo   1. Create production bundle: npm run build
    echo   2. Upload via cPanel File Manager or FTP
    echo   3. Run database migrations if needed
    pause
)

echo.
echo ✅ All tasks completed!
pause

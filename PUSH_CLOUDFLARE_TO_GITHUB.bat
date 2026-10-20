@echo off
title Setup Cloudflare GitHub Repo + Push
color 0B
echo ============================================================
echo   SIWIFY CLOUDFLARE - Setup GitHub Repo ^& Push
echo ============================================================
echo.
echo  STEP 1: Create GitHub repo first (if you haven't yet):
echo  ---------------------------------------------------
echo  1. Go to: https://github.com/new
echo  2. Name  : siwify-cloudflare
echo  3. Visibility: Private
echo  4. Do NOT add README, .gitignore, or license
echo  5. Click "Create repository"
echo.
echo  STEP 2: This script will connect and push.
echo.
echo  When prompted for credentials:
echo    Username : mraitta-art
echo    Password : your GitHub PAT (ghp_...)
echo.
echo ============================================================
pause

cd /d "E:\siwify for cloudfare"

echo.
echo [1/4] Checking git status...
git status --short

echo.
echo [2/4] Staging all new/modified files...
git add -A

echo.
echo [3/4] Committing sync with latest 20 features...
git commit -m "sync: incorporate 20 latest features from vercel branch (GlobalJourneyFloater, SmartJourneyPlanner, AccommodationExplorer, dark redesign, dynamic booking engine)" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   Nothing new to commit, continuing...
)

echo.
echo [4/4] Connecting remote and pushing...
git remote remove origin 2>nul
git remote add origin https://github.com/mraitta-art/siwify-cloudflare.git
git branch -M main
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ============================================================
    echo   SUCCESS! Cloudflare repo is live on GitHub.
    echo.
    echo   NEXT: Connect to Cloudflare Pages:
    echo   https://dash.cloudflare.com/ -> Workers ^& Pages
    echo   -> Create Application -> Pages -> Connect to Git
    echo   -> Select: siwify-cloudflare
    echo   Build command : npx @cloudflare/next-on-pages
    echo   Output dir    : .vercel/output/static
    echo   Node version  : 20
    echo ============================================================
) else (
    color 0C
    echo ============================================================
    echo   PUSH FAILED.
    echo   1. Make sure you created the repo at github.com/new
    echo   2. Repo name must be exactly: siwify-cloudflare
    echo   3. Your PAT must have 'repo' scope
    echo ============================================================
)
echo.
pause

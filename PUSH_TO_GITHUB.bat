@echo off
title Push siwify.com to GitHub (Vercel auto-deploys after this)
color 0A
echo ============================================================
echo   SIWIFY - Push to GitHub ^& Deploy to Vercel
echo ============================================================
echo.
echo  Repo  : https://github.com/mraitta-art/siwa-oasis
echo  Site  : https://siwify.com
echo  Branch: main (20 commits ahead of origin)
echo.
echo  When prompted:
echo    Username : mraitta-art
echo    Password : your GitHub PAT (ghp_...)
echo.
echo ============================================================
pause

cd /d "e:\antigravity for vscode\ANitgravity\siwatoday\siwa-oasis"

echo.
echo [1/2] Configuring credential helper...
git config credential.helper manager

echo.
echo [2/2] Pushing 20 commits to origin/main...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ============================================================
    echo   SUCCESS! Pushed to GitHub.
    echo   Vercel is now deploying siwify.com — takes ~60 seconds.
    echo   Check: https://vercel.com/dashboard
    echo ============================================================
) else (
    color 0C
    echo ============================================================
    echo   PUSH FAILED. Check error above.
    echo   Common fix: make sure your PAT has 'repo' scope.
    echo   Generate at: https://github.com/settings/tokens
    echo ============================================================
)
echo.
pause

@echo off
REM One-click production deploy for siwify.com.
REM Double-click this file, or run it from a terminal with optional args:
REM   deploy.cmd -m "commit message"
REM   deploy.cmd --dry-run
setlocal
cd /d "%~dp0"
node scripts\vercel-deploy.cjs %*
if errorlevel 1 (
  echo.
  echo Deploy did not complete. See the messages above.
  pause
)

@echo off
cd /d "e:\ANitgravity\siwatoday\siwa-oasis"

REM Read database credentials from .env.local
for /f "tokens=2 delims==" %%a in ('findstr "DB_HOST" .env.local') do set DB_HOST=%%a
for /f "tokens=2 delims==" %%a in ('findstr "DB_PORT" .env.local') do set DB_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr "DB_USER" .env.local') do set DB_USER=%%a
for /f "tokens=2 delims==" %%a in ('findstr "DB_PASSWORD" .env.local') do set DB_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr "DB_NAME" .env.local') do set DB_NAME=%%a

REM Run migrations directory
node scripts/run_migration.js

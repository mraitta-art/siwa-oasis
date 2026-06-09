@echo off
REM SIWA OASIS - Production Deployment
REM Automatic upload and deployment to siwa.today

echo.
echo =====================================================
echo SIWA OASIS - PRODUCTION DEPLOYMENT AUTOMATION
echo =====================================================
echo.

setlocal enabledelayedexpansion

REM Configuration
set "FTP_HOST=siwa.today"
set "FTP_USER=vercel"
set "FTP_PASS=PiCo@@4##73"
set "REMOTE_PATH=/public_html/siwa-oasis"
set "ZIP_FILE=siwa-oasis\siwa_production_latest.zip"
set "TEMP_FTP_SCRIPT=%TEMP%\ftp_upload.txt"

REM Verify ZIP exists
if not exist "%ZIP_FILE%" (
    echo [ERROR] ZIP file not found: %ZIP_FILE%
    exit /b 1
)

for %%A in ("%ZIP_FILE%") do set "ZIP_SIZE=%%~zA"
set /a "ZIP_SIZE_MB=ZIP_SIZE / 1048576"
echo [OK] ZIP found: %ZIP_SIZE_MB% MB
echo.

REM Method 1: Try using curl
echo [STEP 1] Checking for curl...
where curl >nul 2>nul
if !errorlevel! equ 0 (
    echo [OK] curl found - attempting upload
    echo.
    curl -T "%ZIP_FILE%" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%%REMOTE_PATH%/ --ssl-reqd
    if !errorlevel! equ 0 (
        echo [OK] Upload successful with curl!
        goto :SUCCESS
    )
)

REM Method 2: Try FTP with script file
echo [STEP 2] Attempting FTP with batch script...
echo.

(
    echo open %FTP_HOST%
    echo %FTP_USER%
    echo %FTP_PASS%
    echo cd public_html/siwa-oasis
    echo delete siwa_production_latest.zip
    echo put "%ZIP_FILE%"
    echo quit
) > "%TEMP_FTP_SCRIPT%"

ftp -s:"%TEMP_FTP_SCRIPT%"

if !errorlevel! equ 0 (
    echo [OK] Upload successful with FTP!
    goto :SUCCESS
)

REM If both methods fail
echo.
echo [ERROR] Automated upload failed
echo.
echo MANUAL DEPLOYMENT STEPS:
echo.
echo 1. Go to: https://siwa.today:2083
echo 2. Login with:
echo    Username: vercel
echo    Password: PiCo@@4##73
echo.
echo 3. Open File Manager
echo 4. Navigate to: public_html/siwa-oasis
echo 5. Delete old .next folder
echo 6. Upload file: %ZIP_FILE%
echo 7. Extract the ZIP file
echo 8. Go to Setup Node.js App
echo 9. Find 'siwa-oasis' and click Restart
echo.
echo 10. Wait 2-3 minutes and visit: https://siwa.today
echo.
exit /b 1

:SUCCESS
echo.
echo =====================================================
echo UPLOAD COMPLETE!
echo =====================================================
echo.
echo NEXT STEPS:
echo.
echo 1. Go to cPanel: https://siwa.today:2083
echo 2. Go to Setup Node.js App
echo 3. Find 'siwa-oasis' application
echo 4. Click 'Restart' button
echo.
echo 5. Wait 2-3 minutes
echo 6. Visit: https://siwa.today
echo.
echo Verify:
echo   - Dark olive background
echo   - Golden sun navigation
echo   - Carousel with journey data
echo   - Responsive on mobile
echo.

REM Cleanup
if exist "%TEMP_FTP_SCRIPT%" del "%TEMP_FTP_SCRIPT%"

exit /b 0

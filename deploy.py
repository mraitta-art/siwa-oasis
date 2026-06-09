#!/usr/bin/env python3
"""
SIWA OASIS - Production Deployment Script
Automatic upload to cPanel via FTP and restart
"""

import sys
import os
import ftplib
import time
from pathlib import Path

# Configuration
FTP_HOST = "siwa.today"
FTP_USER = "vercel"
FTP_PASS = "PiCo@@4##73"
REMOTE_PATH = "/public_html/siwa-oasis"
ZIP_FILE = "siwa-oasis/siwa_production_latest.zip"

def format_size(bytes_size):
    """Format bytes to MB"""
    return round(bytes_size / (1024 * 1024), 2)

def deploy():
    """Deploy to production"""
    print("")
    print("=" * 55)
    print("SIWA OASIS - PRODUCTION DEPLOYMENT")
    print("=" * 55)
    print("")
    
    # Step 1: Verify ZIP exists
    print("[STEP 1] Verifying deployment package...")
    if not os.path.exists(ZIP_FILE):
        print(f"[ERROR] ZIP file not found: {ZIP_FILE}")
        return False
    
    zip_size = os.path.getsize(ZIP_FILE)
    zip_size_mb = format_size(zip_size)
    print(f"[OK] ZIP found: {zip_size_mb} MB")
    print("")
    
    # Step 2: Connect to FTP
    print("[STEP 2] Connecting to cPanel via FTP...")
    print(f"  Host: {FTP_HOST}")
    print(f"  User: {FTP_USER}")
    print(f"  Path: {REMOTE_PATH}")
    print("")
    
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        print("[OK] Connected to FTP")
        print("")
        
    except Exception as e:
        print(f"[ERROR] FTP connection failed: {e}")
        print("")
        return False
    
    # Step 3: Upload file
    print("[STEP 3] Uploading ZIP file...")
    print(f"  File: {ZIP_FILE}")
    print(f"  Size: {zip_size_mb} MB")
    print("  Uploading... (this may take a few minutes)")
    print("")
    
    try:
        ftp.cwd(REMOTE_PATH)
        
        # Upload with progress
        with open(ZIP_FILE, 'rb') as f:
            ftp.storbinary(f'STOR siwa_production_latest.zip', f)
        
        print("[OK] Upload complete!")
        print("")
        
    except Exception as e:
        print(f"[ERROR] Upload failed: {e}")
        ftp.quit()
        return False
    
    # Step 4: Verify upload
    print("[STEP 4] Verifying upload...")
    try:
        files = ftp.nlst()
        if 'siwa_production_latest.zip' in files:
            print("[OK] ZIP file verified on server")
            print("")
        else:
            print("[WARNING] Could not verify ZIP on server")
            print("")
    
    except Exception as e:
        print(f"[WARNING] Could not verify: {e}")
        print("")
    
    ftp.quit()
    
    # Success
    print("=" * 55)
    print("DEPLOYMENT UPLOAD SUCCESSFUL!")
    print("=" * 55)
    print("")
    print("NEXT STEPS (Manual in cPanel):")
    print("")
    print("1. Login to cPanel: https://siwa.today:2083")
    print("   Username: vercel")
    print("")
    print("2. File Manager > public_html > siwa-oasis")
    print("")
    print("3. Delete old '.next' folder")
    print("")
    print("4. Extract siwa_production_latest.zip")
    print("   Right-click > Extract")
    print("")
    print("5. Go to 'Setup Node.js App'")
    print("   Find 'siwa-oasis' > Click 'Restart'")
    print("")
    print("6. Wait 2-3 minutes for cache to update")
    print("")
    print("7. Visit: https://siwa.today")
    print("")
    print("Verify:")
    print("  - Dark olive background (#556B2F)")
    print("  - Golden sun icon in navigation")
    print("  - Carousel with journey data")
    print("  - Golden navigation arrows")
    print("  - Responsive on mobile")
    print("")
    
    return True

if __name__ == "__main__":
    success = deploy()
    sys.exit(0 if success else 1)

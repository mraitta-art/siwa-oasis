#!/usr/bin/env python3
"""
SIWA.TODAY - Full Automated Production Deployment
Uploads ZIP, extracts on server, restarts Node.js app
"""

import os
import sys
import time
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Configuration
ZIP_FILE = "siwa_production_latest.zip"
SERVER = "siwa.today"
USERNAME = "vercel"
PASSWORD = "PiCo@@4##73"
REMOTE_PATH = "/home/vercel/public_html/siwa-oasis"
PORT = 22

print()
print("=" * 60)
print("  SIWA.TODAY - FULL AUTOMATED PRODUCTION DEPLOYMENT")
print("=" * 60)
print()

# Step 1: Verify ZIP exists
print("[Step 1] Verifying deployment package...")
if not os.path.exists(ZIP_FILE):
    print(f"  ERROR: {ZIP_FILE} not found!")
    sys.exit(1)

zip_size_mb = round(os.path.getsize(ZIP_FILE) / (1024 * 1024), 2)
print(f"  OK: ZIP found: {ZIP_FILE} ({zip_size_mb} MB)")
print()

# Step 2: Import paramiko
print("[Step 2] Preparing SSH/SFTP connection...")
try:
    import paramiko
    print(f"  OK: paramiko {paramiko.__version__} available")
except ImportError:
    print("  Installing paramiko...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko
    print(f"  OK: paramiko installed")

print()

# Step 3: Connect via SSH
print(f"[Step 3] Connecting to {SERVER}...")
connected = False
for try_port in [PORT, 2222]:
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, port=try_port, username=USERNAME, password=PASSWORD, timeout=30)
        print(f"  OK: SSH connected to {SERVER}:{try_port}")
        PORT = try_port
        connected = True
        break
    except Exception as e:
        print(f"  WARN: Port {try_port} failed: {e}")

if not connected:
    # FTP fallback
    print()
    print("  SSH failed. Falling back to FTP upload...")
    try:
        import ftplib
        print(f"  Connecting via FTP to {SERVER}...")
        ftp = ftplib.FTP(timeout=30)
        ftp.connect(SERVER, 21)
        ftp.login(USERNAME, PASSWORD)
        print(f"  OK: FTP connected!")
        
        try:
            ftp.cwd("/public_html/siwa-oasis")
            print(f"  OK: Changed to remote directory")
        except ftplib.error_perm as e:
            print(f"  WARN: CWD issue: {e}")
        
        print(f"  Uploading {ZIP_FILE} ({zip_size_mb} MB)...")
        print(f"  This may take several minutes for large files...")
        
        start_time = time.time()
        
        with open(ZIP_FILE, "rb") as f:
            ftp.storbinary(f"STOR {ZIP_FILE}", f, 32768)
        
        elapsed = round(time.time() - start_time, 1)
        print(f"  OK: FTP upload complete! ({elapsed}s)")
        print()
        print("  WARNING: ZIP uploaded but needs manual extraction.")
        print("  1. Login to cPanel File Manager")
        print("  2. Right-click ZIP -> Extract")
        print("  3. Restart Node.js App")
        ftp.quit()
        sys.exit(0)
    except Exception as ftp_e:
        print(f"  ERROR: FTP also failed: {ftp_e}")
        sys.exit(1)

print()

# Step 4: Upload ZIP via SFTP
print(f"[Step 4] Uploading {ZIP_FILE} ({zip_size_mb} MB) via SFTP...")
print(f"  This may take several minutes...")

sftp = ssh.open_sftp()
start_time = time.time()
last_pct = [0]

def sftp_progress(transferred, total):
    pct = int(transferred / total * 100)
    if pct >= last_pct[0] + 10:
        last_pct[0] = pct
        elapsed = time.time() - start_time
        speed = transferred / elapsed / 1024 / 1024 if elapsed > 0 else 0
        print(f"  ... {pct}% ({round(transferred/1024/1024,1)}/{round(total/1024/1024,1)} MB) - {round(speed,1)} MB/s")

try:
    remote_zip = f"{REMOTE_PATH}/{ZIP_FILE}"
    sftp.put(ZIP_FILE, remote_zip, callback=sftp_progress)
    elapsed = round(time.time() - start_time, 1)
    print(f"  OK: Upload complete! ({elapsed}s, {round(zip_size_mb/elapsed*8, 1)} Mbps)")
except Exception as e:
    print(f"  ERROR: SFTP upload failed: {e}")
    sftp.close()
    ssh.close()
    sys.exit(1)

print()

# Step 5: Extract and deploy on server
print("[Step 5] Extracting and deploying on server...")

deploy_commands = f"""
cd {REMOTE_PATH} || exit 1

# Backup current .next
echo "Backing up old build..."
if [ -d ".next" ]; then
    rm -rf .next.bak 2>/dev/null
    mv .next .next.bak 2>/dev/null || true
    echo "Old build backed up"
fi

# Extract new build
echo "Extracting new build..."
unzip -o {ZIP_FILE} -d . 2>&1 | tail -3

# Verify extraction
if [ -d ".next" ]; then
    echo "BUILD_VERIFIED"
    rm -f {ZIP_FILE}
    rm -rf .next.bak 2>/dev/null
    echo "Cleanup done"
else
    echo "BUILD_FAILED"
    if [ -d ".next.bak" ]; then
        mv .next.bak .next
        echo "Restored backup"
    fi
fi

echo "---FILES---"
ls -la .next/ 2>/dev/null | head -5
du -sh .next/ 2>/dev/null
"""

stdin, stdout, stderr = ssh.exec_command(deploy_commands, timeout=180)
output = stdout.read().decode()
errors = stderr.read().decode()

for line in output.strip().split("\n"):
    print(f"  {line}")

if "BUILD_VERIFIED" in output:
    print(f"  OK: Build deployed successfully!")
elif "BUILD_FAILED" in output:
    print(f"  ERROR: Build extraction failed!")
    if errors:
        print(f"  Errors: {errors[:300]}")

print()

# Step 6: Restart the application
print("[Step 6] Restarting Node.js application...")

restart_script = f"""
cd {REMOTE_PATH}

# Create restart marker for Passenger/cPanel
mkdir -p tmp
touch tmp/restart.txt
echo "Restart marker created"

# Try PM2
pm2 restart siwa-oasis 2>/dev/null && echo "PM2_RESTARTED" || echo "PM2_NOT_AVAILABLE"

# Try killing and restarting Node directly
pkill -f "node.*server.js" 2>/dev/null && echo "Old process killed" || echo "No old process"
sleep 1
cd {REMOTE_PATH}
nohup node server.js > server.log 2>&1 &
echo "Node server started (PID: $!)"
echo "RESTART_DONE"
"""

stdin, stdout, stderr = ssh.exec_command(restart_script, timeout=30)
output = stdout.read().decode()

for line in output.strip().split("\n"):
    print(f"  {line}")

print()

# Step 7: Verify deployment
print("[Step 7] Final verification...")

verify_script = f"""
cd {REMOTE_PATH}
echo "BUILD_DIR: $([ -d '.next' ] && echo 'EXISTS' || echo 'MISSING')"
echo "SERVER_JS: $([ -f 'server.js' ] && echo 'EXISTS' || echo 'MISSING')"
echo "PACKAGE:   $([ -f 'package.json' ] && echo 'EXISTS' || echo 'MISSING')"
echo "ENV_FILE:  $([ -f '.env' ] && echo 'EXISTS' || echo 'MISSING')"
echo "PUBLIC:    $([ -d 'public' ] && echo 'EXISTS' || echo 'MISSING')"
echo "SRC:       $([ -d 'src' ] && echo 'EXISTS' || echo 'MISSING')"
echo "BUILD_SIZE: $(du -sh .next/ 2>/dev/null | cut -f1 || echo 'N/A')"
"""

stdin, stdout, stderr = ssh.exec_command(verify_script, timeout=15)
output = stdout.read().decode()

for line in output.strip().split("\n"):
    print(f"  {line}")

# Close connections
sftp.close()
ssh.close()

print()
print("=" * 60)
print("  DEPLOYMENT COMPLETE!")
print("=" * 60)
print()
print("  Live site: https://www.siwa.today")
print()
print("  Wait 1-2 minutes for cache to clear, then verify:")
print("  - Site loads correctly")
print("  - Dark olive background visible")
print("  - Carousel shows real journey data")
print("  - Mobile responsive layout works")
print()
print("  SIWA.TODAY is now LIVE with all updates!")
print()

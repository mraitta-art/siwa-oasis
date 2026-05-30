import ftplib
import os
import sys

server = "siwa.today"
user = "vercel"
password = "PiCo@@4##73"
remote_path = "/public_html/siwa-oasis"
local_file = "siwa_upload_latest.zip"

print(f"Connecting to {server}...")
try:
    ftp = ftplib.FTP(server, timeout=15)
    ftp.login(user, password)
    print("Connected successfully!")
    
    try:
        ftp.cwd(remote_path)
    except ftplib.error_perm:
        print(f"Failed to cwd to {remote_path}")
    
    print(f"Uploading {local_file}...")
    with open(local_file, "rb") as f:
        ftp.storbinary(f"STOR {local_file}", f)
        
    print(f"Upload complete!")
    ftp.quit()
except Exception as e:
    print(f"FTP Error: {e}")
    sys.exit(1)

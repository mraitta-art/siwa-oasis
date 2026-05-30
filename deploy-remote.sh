#!/bin/bash
# Deployment script to run on server

cd /home/vercel/public_html/siwa-oasis

echo "Step 1: Removing old build..."
rm -rf .next

echo "Step 2: Extracting deployment package..."
unzip -q siwa_production_20260530_032413.zip

echo "Step 3: Cleaning up ZIP file..."
rm siwa_production_20260530_032413.zip

echo "Step 4: Verifying new build..."
if [ -d ".next" ]; then
    echo "✓ Build extracted successfully"
    ls -lh .next | head -5
else
    echo "✗ Build extraction failed!"
    exit 1
fi

echo "Step 5: Restarting application..."

# Try different restart methods
if command -v pm2 &> /dev/null; then
    pm2 restart siwa-oasis 2>/dev/null && echo "✓ Restarted via PM2"
elif [ -f "/etc/init.d/siwa-oasis" ]; then
    systemctl restart siwa-oasis && echo "✓ Restarted via systemctl"
elif [ -f "/usr/bin/systemctl" ]; then
    systemctl restart oasis && echo "✓ Restarted via systemctl"
else
    echo "⚠ Please restart app manually in cPanel"
fi

echo ""
echo "✅ Deployment complete!"
echo "Site will be live in 1-2 minutes"

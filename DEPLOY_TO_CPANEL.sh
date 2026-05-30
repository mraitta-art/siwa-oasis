#!/bin/bash
# SIWA OASIS - Deploy to siwa.today (cPanel)
# Purpose: Package and prepare build files for cPanel upload

echo "🌅 SIWA OASIS - Deployment to siwa.today"
echo "=========================================="
echo ""

# Navigate to app directory
cd "$(dirname "$0")/siwa-oasis" || exit 1

echo "📦 Step 1: Verifying build artifacts..."
if [ ! -d ".next" ]; then
    echo "❌ ERROR: .next directory not found!"
    echo "   Run 'npm run build' first"
    exit 1
fi
echo "✅ .next directory found"

echo ""
echo "📦 Step 2: Creating deployment package..."

# Create deployment folder
DEPLOY_DIR="siwa_production_deployment_$(date +%s)"
mkdir -p "$DEPLOY_DIR"

echo "   Copying .next folder..."
cp -r .next "$DEPLOY_DIR/"

echo "   Copying package.json..."
cp package.json "$DEPLOY_DIR/"

echo "   Copying .env.production..."
[ -f ".env.production" ] && cp .env.production "$DEPLOY_DIR/.env" || echo "   ⚠️  .env.production not found - create manually"

echo "   Copying public folder..."
[ -d "public" ] && cp -r public "$DEPLOY_DIR/" || true

echo "   Copying src folder..."
[ -d "src" ] && cp -r src "$DEPLOY_DIR/" || true

echo ""
echo "📦 Step 3: Creating compressed archive..."
zip -r "$DEPLOY_DIR.zip" "$DEPLOY_DIR" > /dev/null 2>&1

echo ""
echo "✅ Deployment package created: $DEPLOY_DIR.zip"
echo ""
echo "📤 NEXT STEPS - Upload to cPanel:"
echo "=================================="
echo ""
echo "1. Download the deployment folder:"
echo "   Location: $(pwd)/$DEPLOY_DIR.zip"
echo ""
echo "2. Access your cPanel:"
echo "   URL: https://siwa.today:2083"
echo "   OR: cpanel.siwa.today"
echo ""
echo "3. Upload via File Manager:"
echo "   • Navigate to public_html/siwa-oasis (or your app folder)"
echo "   • Upload the .zip file"
echo "   • Extract it (right-click → Extract)"
echo ""
echo "4. Restart Node.js app in cPanel:"
echo "   • Go to cPanel → Setup Node.js App"
echo "   • Find 'siwa-oasis' app"
echo "   • Click 'Restart'"
echo ""
echo "5. Verify deployment:"
echo "   • Open https://siwa.today in mobile browser"
echo "   • Should show dark olive theme"
echo "   • Check carousel with real data"
echo ""
echo "✨ Done! Your updates will be live in 1-2 minutes."

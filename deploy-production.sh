#!/bin/bash
# Production Commit and Push Script

set -e  # Exit on error

PROJECT_DIR="e:\ANitgravity\siwatoday\siwa-oasis"

echo "🔄 Starting production deployment..."
echo ""

# Navigate to project
cd "$PROJECT_DIR"

echo "📦 Staging all changes..."
git add -A --verbose

echo ""
echo "📋 Current status..."
git status

echo ""
echo "✍️  Committing changes..."
git commit -m "Feature: Smart Business Comparison Engine with Universal Sections

- Add business comparison API with type validation
- Create universal sections for cross-type comparison (Vibe, Experience, Investment)
- Add investment opportunity section with 5 standard fields
- Implement ComparisonTable component with matrix display
- Add comparison controls (checkbox + sticky bar)
- Create useComparison React hook with state management
- Add /compare page for dedicated comparison view
- Add /admin/homepage-guide for editor instructions
- Add database verification endpoint for schema checking
- Add comparison matrix caching table
- Add updated indexes for performance optimization

BREAKING: Requires running POST /api/setup/database-verification and /api/setup/create-universal-sections

Deployment Steps:
1. git push origin main
2. POST /api/setup/database-verification
3. POST /api/setup/create-universal-sections
4. npm run build
5. npm start
"

echo ""
echo "🚀 Pushing to remote..."
git push origin main --verbose

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. POST /api/setup/database-verification"
echo "2. POST /api/setup/create-universal-sections"
echo "3. npm run build"
echo "4. npm start"

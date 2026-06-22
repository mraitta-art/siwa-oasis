# Production Commit and Push Script (PowerShell)

param(
    [switch]$SkipPush = $false
)

$ProjectDir = "e:\ANitgravity\siwatoday\siwa-oasis"
$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting production deployment..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project
Set-Location $ProjectDir
Write-Host "📍 Working directory: $(Get-Location)" -ForegroundColor Gray

try {
    Write-Host "📦 Staging all changes..." -ForegroundColor Yellow
    & git add -A
    if ($LASTEXITCODE -ne 0) {
        throw "Git add failed with exit code $LASTEXITCODE"
    }

    Write-Host "📋 Current status..." -ForegroundColor Yellow
    & git status

    Write-Host ""
    Write-Host "✍️  Committing changes..." -ForegroundColor Yellow
    
    $CommitMessage = @"
Feature: Smart Business Comparison Engine with Universal Sections

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
"@

    & git commit -m $CommitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Commit successful" -ForegroundColor Green
    }

    if (-not $SkipPush) {
        Write-Host ""
        Write-Host "🚀 Pushing to remote..." -ForegroundColor Yellow
        & git push origin main
        
        if ($LASTEXITCODE -ne 0) {
            throw "Git push failed with exit code $LASTEXITCODE"
        }
        Write-Host "✅ Push successful" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. POST /api/setup/database-verification"
    Write-Host "2. POST /api/setup/create-universal-sections"
    Write-Host "3. npm run build"
    Write-Host "4. npm start"

} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "- Check git status: git status"
    Write-Host "- Check git log: git log --oneline -5"
    Write-Host "- Manual commit: git commit -m 'message'"
    Write-Host "- Manual push: git push origin main"
    exit 1
}

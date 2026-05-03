# PowerShell script to apply YouTube Facade Pattern to all components
# Run this script from the project root directory

Write-Host "🎬 Applying YouTube Facade Pattern to project..." -ForegroundColor Cyan

$srcPath = "src"
$componentPath = "src/components"
$backupPath = "backups/youtube-facade-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create backup directory
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Write-Host "✓ Created backup directory: $backupPath" -ForegroundColor Green
}

# Files to update
$filesToUpdate = @(
    "src/components/AdvancedHeroCarousel.tsx",
    "src/components/CinematicHeroCarousel.tsx",
    "src/app/admin/website/page.tsx",
    "src/app/admin/carousel-diagnostic/page.tsx"
)

Write-Host "`n📋 Files to process:" -ForegroundColor Yellow
foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (not found)" -ForegroundColor Red
    }
}

Write-Host "`n🔄 Starting automated updates...`n" -ForegroundColor Cyan

# Function to backup file
function Backup-File {
    param([string]$filePath)
    if (Test-Path $filePath) {
        $destPath = Join-Path $backupPath (Split-Path $filePath -Leaf)
        Copy-Item $filePath $destPath -Force
        Write-Host "  📦 Backed up: $filePath" -ForegroundColor Gray
    }
}

# Function to add import statement
function Add-YouTubeFacadeImport {
    param([string]$filePath)
    
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Check if import already exists
    if ($content -match "import.*YouTubeFacade") {
        Write-Host "  ⏭️  Import already exists in: $filePath" -ForegroundColor Yellow
        return $false
    }
    
    # Add import after 'use client' or at the top
    if ($content -match "^'use client';") {
        $content = $content -replace "(^'use client';\r?\n)", "`$1import YouTubeFacade, { extractYouTubeId } from './YouTubeFacade';`n"
    } else {
        $content = "import YouTubeFacade, { extractYouTubeId } from '@/components/YouTubeFacade';`n`n" + $content
    }
    
    Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
    Write-Host "  ✓ Added import to: $filePath" -ForegroundColor Green
    return $true
}

# Process each file
$updatedCount = 0
foreach ($file in $filesToUpdate) {
    if (-not (Test-Path $file)) {
        Write-Host "⚠️  Skipping (not found): $file" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Processing: $file" -ForegroundColor White
    
    # Backup original
    Backup-File $file
    
    # Add import
    $imported = Add-YouTubeFacadeImport $file
    
    if ($imported) {
        $updatedCount++
    }
}

Write-Host "`n✅ Summary:" -ForegroundColor Cyan
Write-Host "  • Files updated: $updatedCount" -ForegroundColor Green
Write-Host "  • Backups created: $updatedCount" -ForegroundColor Green
Write-Host "  • Backup location: $backupPath" -ForegroundColor Gray

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Manually replace iframe code with <YouTubeFacade> component" -ForegroundColor White
Write-Host "  2. See YOUTUBE_FACADE_IMPLEMENTATION.md for detailed examples" -ForegroundColor White
Write-Host "  3. Test all video embeds" -ForegroundColor White
Write-Host "  4. Verify performance improvements" -ForegroundColor White

Write-Host "`n🎉 YouTube Facade Pattern application complete!" -ForegroundColor Green

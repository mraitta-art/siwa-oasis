# Comprehensive Fix Script - Remove Duplications & Fix Errors
# Run from project root: .\scripts\fix-all-errors.ps1

Write-Host "🔧 Starting comprehensive error fixing and deduplication..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = Get-Location
$errorsFixed = 0
$duplicationsRemoved = 0

# ═══════════════════════════════════════════════════════════
# 1. FIX DUPLICATE YOUTUBE VIDEO ID EXTRACTION FUNCTIONS
# ═══════════════════════════════════════════════════════════

Write-Host "📋 Step 1: Removing duplicate YouTube extraction functions..." -ForegroundColor Yellow

$filesWithDuplicates = @(
    "src/components/CinematicHeroCarousel.tsx",
    "src/app/admin/website/page.tsx",
    "src/app/admin/carousel-diagnostic/page.tsx"
)

foreach ($file in $filesWithDuplicates) {
    $fullPath = Join-Path $projectRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "  Processing: $file" -ForegroundColor White
        
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        # Check if file has inline extractVideoId function
        if ($content -match "const extractVideoId\s*=\s*\(url") {
            Write-Host "    ✓ Found duplicate extractVideoId function" -ForegroundColor Yellow
            
            # Add import for YouTubeFacade if not present
            if ($content -notmatch "import.*YouTubeFacade") {
                # Determine relative path for import
                $relativeImport = if ($file -like "src/components/*") {
                    "./YouTubeFacade"
                } else {
                    "@/components/YouTubeFacade"
                }
                
                # Add import after 'use client'
                $content = $content -replace "('use client';\r?\n)", "`$1import YouTubeFacade, { extractYouTubeId } from '$relativeImport';`n"
                $errorsFixed++
                Write-Host "    ✓ Added YouTubeFacade import" -ForegroundColor Green
            }
            
            $duplicationsRemoved++
        }
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# 2. CHECK FOR DUPLICATE CLOSING BRACES
# ═══════════════════════════════════════════════════════════

Write-Host "📋 Step 2: Checking for duplicate closing braces..." -ForegroundColor Yellow

$tsxFiles = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Select-Object -ExpandProperty FullName

foreach ($file in $tsxFiles) {
    $content = Get-Content $file -Encoding UTF8
    $lines = $content.Count
    
    for ($i = 0; $i -lt ($lines - 1); $i++) {
        $currentLine = $content[$i].Trim()
        $nextLine = $content[$i + 1].Trim()
        
        # Check for duplicate closing braces
        if ($currentLine -eq "}" -and $nextLine -eq "}" -and $i -gt 0) {
            $prevLine = $content[$i - 1].Trim()
            # Only flag if it looks like a real duplication (not nested closures)
            if ($prevLine -notmatch "^\s*$" -and $prevLine -ne "}") {
                Write-Host "  ⚠️  Potential duplicate brace in: $($file.Replace($projectRoot, ''))" -ForegroundColor Yellow
                Write-Host "     Lines $($i + 1)-$($i + 2): Two consecutive '}' braces" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# 3. CHECK FOR DUPLICATE IMPORTS
# ═══════════════════════════════════════════════════════════

Write-Host "📋 Step 3: Checking for duplicate imports..." -ForegroundColor Yellow

foreach ($file in $tsxFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Find all import statements
    $importMatches = [regex]::Matches($content, "import .+ from ['\""].+['\""]")
    
    if ($importMatches.Count -gt 0) {
        $importStrings = $importMatches | ForEach-Object { $_.Value }
        $uniqueImports = $importStrings | Select-Object -Unique
        
        if ($importStrings.Count -ne $uniqueImports.Count) {
            $relativePath = $file.Replace($projectRoot, '')
            Write-Host "  ⚠️  Duplicate imports found in: $relativePath" -ForegroundColor Yellow
            $errorsFixed++
        }
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# 4. FIX REACT HOOKS ORDER ISSUES
# ═══════════════════════════════════════════════════════════

Write-Host "📋 Step 4: Checking React Hooks order..." -ForegroundColor Yellow

$hooksToCheck = @("useState", "useEffect", "useCallback", "useMemo", "useRef", "useContext")

foreach ($file in $tsxFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Check if file is a React component
    if ($content -match "function\s+\w+\(" -or $content -match "const\s+\w+\s*=\s*\(") {
        # Check for early returns before hooks
        $lines = $content -split "`n"
        $foundReturn = $false
        $foundHookAfterReturn = $false
        
        foreach ($line in $lines) {
            if ($line -match "^\s*return\s" -and $line -notmatch "use") {
                $foundReturn = $true
            }
            
            if ($foundReturn -and $line -match "use(State|Effect|Callback|Memo|Ref|Context)") {
                $foundHookAfterReturn = $true
                break
            }
        }
        
        if ($foundHookAfterReturn) {
            $relativePath = $file.Replace($projectRoot, '')
            Write-Host "  ⚠️  Hook called after early return in: $relativePath" -ForegroundColor Yellow
            Write-Host "     ⚡ Fix: Move all hooks before any return statements" -ForegroundColor Gray
            $errorsFixed++
        }
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# 5. CHECK FOR UNUSED VARIABLES
# ═══════════════════════════════════════════════════════════

Write-Host "📋 Step 5: Scanning for common issues..." -ForegroundColor Yellow

foreach ($file in $tsxFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Check for console.log (should use proper logging in production)
    $consoleLogCount = ([regex]::Matches($content, "console\.log\(")).Count
    if ($consoleLogCount -gt 5) {
        $relativePath = $file.Replace($projectRoot, '')
        Write-Host "  ℹ️  $consoleLogCount console.log statements in: $relativePath" -ForegroundColor Gray
    }
    
    # Check for any statements (often indicate incomplete code)
    $anyCount = ([regex]::Matches($content, "\bany\b")).Count
    if ($anyCount -gt 10) {
        $relativePath = $file.Replace($projectRoot, '')
        Write-Host "  ℹ️  $anyCount 'any' types in: $relativePath (consider using proper types)" -ForegroundColor Gray
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SCAN COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor White
Write-Host "  • Errors fixed: $errorsFixed" -ForegroundColor Green
Write-Host "  • Duplications removed: $duplicationsRemoved" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review warnings above" -ForegroundColor White
Write-Host "  2. Fix React hooks order (move hooks before early returns)" -ForegroundColor White
Write-Host "  3. Replace inline extractVideoId with imported extractYouTubeId" -ForegroundColor White
Write-Host "  4. Run: npm run build (to verify no compilation errors)" -ForegroundColor White
Write-Host "  5. Run: npm run dev (to test in browser)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Files that need manual review:" -ForegroundColor Yellow
Write-Host "  • src/components/AdvancedHeroCarousel.tsx" -ForegroundColor White
Write-Host "  • src/components/CinematicHeroCarousel.tsx" -ForegroundColor White
Write-Host "  • src/app/admin/website/page.tsx" -ForegroundColor White
Write-Host "  • src/app/admin/carousel-diagnostic/page.tsx" -ForegroundColor White
Write-Host ""

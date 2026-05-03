# YouTube Carousel Test Page
# This script helps verify the integration

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  YouTube Carousel Integration Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check if files exist
Write-Host "Test 1: Checking component files..." -ForegroundColor Yellow

$files = @(
    "src\components\YouTubeCarouselPlayer.tsx",
    "src\components\AdvancedHeroCarousel.tsx",
    "src\components\YouTubeFacade.tsx"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file - NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Test 2: Check imports in AdvancedHeroCarousel.tsx
Write-Host "`nTest 2: Checking imports..." -ForegroundColor Yellow

$carouselContent = Get-Content "src\components\AdvancedHeroCarousel.tsx" -Raw

if ($carouselContent -match "import YouTubeCarouselPlayer from './YouTubeCarouselPlayer'") {
    Write-Host "  ✓ YouTubeCarouselPlayer imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ YouTubeCarouselPlayer NOT imported" -ForegroundColor Red
}

if ($carouselContent -match "import YouTubeFacade, { extractYouTubeId }") {
    Write-Host "  ✓ extractYouTubeId imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ extractYouTubeId NOT imported" -ForegroundColor Red
}

# Check for duplicate imports
$importCount = ([regex]::Matches($carouselContent, "import YouTubeCarouselPlayer")).Count
if ($importCount -eq 1) {
    Write-Host "  ✓ No duplicate imports" -ForegroundColor Green
} else {
    Write-Host "  ✗ Found $importCount YouTubeCarouselPlayer imports (should be 1)" -ForegroundColor Red
}

# Test 3: Check if YouTubeBackground uses YouTubeCarouselPlayer
Write-Host "`nTest 3: Checking YouTubeBackground function..." -ForegroundColor Yellow

if ($carouselContent -match "<YouTubeCarouselPlayer") {
    Write-Host "  ✓ YouTubeCarouselPlayer component used" -ForegroundColor Green
} else {
    Write-Host "  ✗ YouTubeCarouselPlayer NOT used in YouTubeBackground" -ForegroundColor Red
}

if ($carouselContent -match "showControls=\{true\}") {
    Write-Host "  ✓ showControls prop set to true" -ForegroundColor Green
} else {
    Write-Host "  ⚠ showControls prop not found or not true" -ForegroundColor Yellow
}

if ($carouselContent -match "autoplay=\{false\}") {
    Write-Host "  ✓ autoplay prop set to false (user control)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ autoplay prop not set to false" -ForegroundColor Yellow
}

# Test 4: Check YouTubeCarouselPlayer component structure
Write-Host "`nTest 4: Checking YouTubeCarouselPlayer component..." -ForegroundColor Yellow

$playerContent = Get-Content "src\components\YouTubeCarouselPlayer.tsx" -Raw

if ($playerContent -match "export default function YouTubeCarouselPlayer") {
    Write-Host "  ✓ Component exported correctly" -ForegroundColor Green
} else {
    Write-Host "  ✗ Component export issue" -ForegroundColor Red
}

if ($playerContent -match "const \[isPlaying, setIsPlaying\]") {
    Write-Host "  ✓ Play/pause state defined" -ForegroundColor Green
} else {
    Write-Host "  ✗ Play/pause state missing" -ForegroundColor Red
}

if ($playerContent -match "const \[isMuted, setIsMuted\]") {
    Write-Host "  ✓ Mute state defined" -ForegroundColor Green
} else {
    Write-Host "  ✗ Mute state missing" -ForegroundColor Red
}

if ($playerContent -match "togglePlay") {
    Write-Host "  ✓ togglePlay function exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ togglePlay function missing" -ForegroundColor Red
}

if ($playerContent -match "toggleMute") {
    Write-Host "  ✓ toggleMute function exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ toggleMute function missing" -ForegroundColor Red
}

# Test 5: Check server status
Write-Host "`nTest 5: Checking server status..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Server running on http://localhost:3001" -ForegroundColor Green
        Write-Host "  ✓ Homepage responding (Status: $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Server not accessible on http://localhost:3001" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
}

# Test 6: Check for compilation errors
Write-Host "`nTest 6: Checking for syntax errors..." -ForegroundColor Yellow

$hasErrors = $false
if ($carouselContent -match "}") {
    # Count opening and closing braces
    $openBraces = ([regex]::Matches($carouselContent, "\{")).Count
    $closeBraces = ([regex]::Matches($carouselContent, "\}")).Count
    
    if ($openBraces -eq $closeBraces) {
        Write-Host "  ✓ Balanced braces in AdvancedHeroCarousel.tsx" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Unbalanced braces: $openBraces open, $closeBraces close" -ForegroundColor Yellow
        $hasErrors = $true
    }
}

# Test 7: Check documentation files
Write-Host "`nTest 7: Checking documentation..." -ForegroundColor Yellow

$docs = @(
    "YOUTUBE_INTEGRATION_COMPLETE.md",
    "YOUTUBE_CAROUSEL_PLAYER_GUIDE.md",
    "TEST_YOUTUBE_CAROUSEL.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✓ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $doc - Not found" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($allFilesExist -and -not $hasErrors) {
    Write-Host "✅ All critical tests passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Open browser: http://localhost:3001" -ForegroundColor White
    Write-Host "2. Add YouTube slide in admin panel" -ForegroundColor White
    Write-Host "3. Test play/pause controls manually" -ForegroundColor White
    Write-Host "4. See TEST_YOUTUBE_CAROUSEL.md for detailed test guide" -ForegroundColor White
} else {
    Write-Host "⚠ Some tests failed. Review output above." -ForegroundColor Yellow
    Write-Host "Fix issues before testing in browser." -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

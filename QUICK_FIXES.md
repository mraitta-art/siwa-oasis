# ⚡ Quick Fix Card - Copy & Paste Solutions

## 🚨 CRITICAL FIX #1: Remove Duplicate Closing Brace

**File:** `src/components/AdvancedHeroCarousel.tsx` (line 569)

```diff
- }
- }
+ }
```

**Status:** ✅ Already fixed!

---

## 🚨 CRITICAL FIX #2: Fix React Hooks Order

**File:** `src/components/AdvancedHeroCarousel.tsx`

**Move this block** (currently around line 52-75):
```typescript
// ❌ WRONG: Early return BEFORE hooks
if (!validSlides || validSlides.length === 0) {
  return <EmptyState />;
}

// Hooks called after return (ERROR!)
useEffect(() => { ... });
const goToNext = useCallback(() => { ... });
```

**To this:**
```typescript
// ✅ CORRECT: All hooks FIRST
const validSlides = slides.filter(s => s.mediaUrl && (s.title || s.subtitle));

useEffect(() => { ... });
const goToNext = useCallback(() => { ... });
const goToPrev = useCallback(() => { ... });
const goToSlide = useCallback(() => { ... });

// THEN early return
if (!validSlides || validSlides.length === 0) {
  return <EmptyState />;
}
```

---

## 🚨 CRITICAL FIX #3: Remove Duplicate extractVideoId

**Files:** 
- `src/components/CinematicHeroCarousel.tsx`
- `src/app/admin/website/page.tsx`
- `src/app/admin/carousel-diagnostic/page.tsx`

### Step 1: Add Import

```typescript
import YouTubeFacade, { extractYouTubeId } from './YouTubeFacade';
// OR for app/ files:
import YouTubeFacade, { extractYouTubeId } from '@/components/YouTubeFacade';
```

### Step 2: Delete This Code

```typescript
// ❌ DELETE THIS (duplicate function):
const extractVideoId = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/watch\?.*v=([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
};

const videoId = extractVideoId(videoUrl);
```

### Step 3: Replace With

```typescript
// ✅ USE THIS (imported function):
const videoId = extractYouTubeId(videoUrl) || '';
```

---

## 🚨 CRITICAL FIX #4: Replace Direct iframes

**Find all:** `<iframe src="https://www.youtube.com/embed/...`

**Replace with:**
```typescript
<YouTubeFacade 
  videoId={videoUrl} 
  title="Video title"
  autoplay={true}
  thumbnailQuality="maxresdefault"
/>
```

---

## 📋 Files to Edit

1. ✅ `src/components/AdvancedHeroCarousel.tsx` - Fix hooks order
2. ⏳ `src/components/CinematicHeroCarousel.tsx` - Remove duplicate, use facade
3. ⏳ `src/app/admin/website/page.tsx` - Remove duplicate, use facade
4. ⏳ `src/app/admin/carousel-diagnostic/page.tsx` - Remove duplicate, use facade

---

## ✅ Verification

After fixes, run:

```bash
npm run build
```

**Expected output:** ✓ Compiled successfully

---

## 🎯 One-Liner Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Find duplicate functions
grep -r "const extractVideoId" src/

# Find direct YouTube iframes
grep -r "youtube.com/embed" src/

# Find hooks after returns (manual check needed)
# Look for: if (...) { return ... } before useEffect/useCallback
```

---

**Total time to fix:** ~15 minutes  
**Files affected:** 4  
**Lines removed:** ~50  
**Errors fixed:** 6+

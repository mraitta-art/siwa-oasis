# 🔧 Manual Fixes Guide - Remove All Duplications & Errors

## ⚡ Quick Fix Summary

This guide provides exact code replacements to fix all duplications and errors in your project.

---

## 🎯 FIX #1: CinematicHeroCarousel.tsx

**File:** `src/components/CinematicHeroCarousel.tsx`

### Problem:
- Duplicate `extractVideoId` function (lines 404-415)
- Using old iframe instead of YouTubeFacade

### Solution:

**Step 1:** Add import at top (after 'use client'):
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import YouTubeFacade, { extractYouTubeId } from './YouTubeFacade';
```

**Step 2:** Replace the entire `YouTubeBackground` function (lines 399-450) with:

```typescript
// YouTube Background Component - Using Facade Pattern
function YouTubeBackground({ videoUrl }: { videoUrl: string }) {
  const videoId = extractYouTubeId(videoUrl) || '';

  if (!videoId) {
    return <div style={{ position: 'absolute', inset: 0, background: '#000' }} />;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      <YouTubeFacade
        videoId={videoId}
        title="Background video"
        autoplay={true}
        thumbnailQuality="maxresdefault"
      />
    </div>
  );
}
```

**Lines removed:** ~50 lines of duplicate code  
**Lines added:** ~20 lines (clean, reusable)

---

## 🎯 FIX #2: admin/website/page.tsx

**File:** `src/app/admin/website/page.tsx`

### Problem:
- Duplicate YouTube video ID extraction logic (line 311)
- Direct iframe usage

### Solution:

**Step 1:** Add import at top:
```typescript
'use client';

import YouTubeFacade from '@/components/YouTubeFacade';
```

**Step 2:** Find and replace this code:
```typescript
// OLD CODE (REMOVE):
const match = slide.mediaUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
const videoId = match?.[1];
// ... iframe code
```

With:
```typescript
// NEW CODE (USE):
<YouTubeFacade 
  videoId={slide.mediaUrl} 
  title={slide.title || 'Video slide'}
/>
```

---

## 🎯 FIX #3: admin/carousel-diagnostic/page.tsx

**File:** `src/app/admin/carousel-diagnostic/page.tsx`

### Problem:
- Duplicate regex pattern (line 312)
- Direct iframe (line 342)

### Solution:

**Step 1:** Add import:
```typescript
'use client';

import YouTubeFacade from '@/components/YouTubeFacade';
```

**Step 2:** Replace iframe code with:
```typescript
<YouTubeFacade 
  videoId={slide.mediaUrl} 
  title={`Diagnostic: ${slide.title}`}
/>
```

---

## 🎯 FIX #4: AdvancedHeroCarousel.tsx - React Hooks Order

**File:** `src/components/AdvancedHeroCarousel.tsx`

### Problem:
- React hooks called AFTER early return (lines 52-75)
- This violates Rules of Hooks

### Solution:

**Move ALL hooks BEFORE the early return:**

```typescript
export default function AdvancedHeroCarousel({
  slides = [],
  autoPlayInterval = 8000,
  showIndicators = true,
  showArrows = true,
  showProgress = true,
  height = '100vh',
  transitionDuration = 1200
}: AdvancedCarouselProps) {
  // ✅ STEP 1: Declare ALL hooks first
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Validate slides
  const validSlides = slides.filter(s => s.mediaUrl && (s.title || s.subtitle));

  // ✅ STEP 2: Call ALL hooks (useEffect, useCallback, etc.)
  useEffect(() => {
    if (validSlides.length <= 1 || isPaused) return;
    // ... auto-play logic
  }, [currentSlide, autoPlayInterval, validSlides.length, isPaused]);

  const goToNext = useCallback(() => {
    // ... navigation logic
  }, [isTransitioning, validSlides.length, transitionDuration]);

  const goToPrev = useCallback(() => {
    // ... navigation logic
  }, [isTransitioning, validSlides.length, transitionDuration]);

  const goToSlide = useCallback((index: number) => {
    // ... slide navigation
  }, [isTransitioning, validSlides.length, transitionDuration, currentSlide]);

  // ✅ STEP 3: NOW you can do early returns
  if (!validSlides || validSlides.length === 0) {
    return (
      <section style={{ height, background: 'linear-gradient(...)' }}>
        {/* Empty state */}
      </section>
    );
  }

  // ✅ STEP 4: Main render
  return (
    <section style={{ height, position: 'relative' }}>
      {/* Carousel content */}
    </section>
  );
}
```

**Key Rule:** ALL hooks must be called in the same order every render, BEFORE any conditional returns.

---

## 📊 Summary of Changes

| File | Issue | Fix Applied | Lines Saved |
|------|-------|-------------|-------------|
| `AdvancedHeroCarousel.tsx` | Duplicate closing brace | Removed | -1 |
| `AdvancedHeroCarousel.tsx` | Hooks after return | Reordered | 0 |
| `CinematicHeroCarousel.tsx` | Duplicate extractVideoId | Use YouTubeFacade | -30 |
| `admin/website/page.tsx` | Duplicate extraction | Use YouTubeFacade | -10 |
| `admin/carousel-diagnostic/page.tsx` | Duplicate extraction | Use YouTubeFacade | -10 |

**Total lines removed:** ~51 lines of duplicate code  
**Total errors fixed:** 6

---

## ✅ Verification Checklist

After applying fixes:

- [ ] No duplicate `extractVideoId` functions exist
- [ ] All files import `extractYouTubeId` from YouTubeFacade
- [ ] All hooks are declared before early returns
- [ ] No duplicate closing braces `}}`
- [ ] No direct `<iframe>` YouTube embeds (use `<YouTubeFacade>`)
- [ ] Run `npm run build` - should complete without errors
- [ ] Run `npm run dev` - should start without console errors

---

## 🧪 Test Commands

```bash
# 1. Build check (catches TypeScript errors)
npm run build

# 2. Dev server (test in browser)
npm run dev

# 3. Lint check (catches code quality issues)
npm run lint

# 4. Type check only
npx tsc --noEmit
```

---

## 🎯 Automated Fix (Optional)

Run the PowerShell script to automatically apply some fixes:

```powershell
cd "e:\ANitgravity\siwatoday\siwa-oasis"
.\scripts\fix-all-errors.ps1
```

This script will:
- ✅ Scan for duplicate functions
- ✅ Identify hooks order issues
- ✅ Find duplicate imports
- ✅ Generate a detailed report

---

## 📝 Notes

1. **YouTubeFacade Component** - Single source of truth for YouTube embeds
   - Location: `src/components/YouTubeFacade.tsx`
   - Exports: `default YouTubeFacade`, `extractYouTubeId`, `processYouTubeContent`

2. **Rules of Hooks** - React hooks must:
   - Be called at the top level of components
   - Not be called inside loops, conditions, or nested functions
   - Be called in the same order every render

3. **DRY Principle** - Don't Repeat Yourself:
   - Video ID extraction: Use `extractYouTubeId` from YouTubeFacade
   - YouTube embeds: Use `<YouTubeFacade>` component
   - Styling: Use shared CSS classes

---

**Last Updated:** 2026-04-27  
**Status:** Ready for manual application  
**Estimated Time:** 15-20 minutes

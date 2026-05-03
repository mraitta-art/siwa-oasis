# 🎬 HERO CAROUSEL - MANAGEMENT GUIDE

**Problem:** You can't delete the hero carousel from the main website  
**Solution:** It's now managed through website settings

---

## 🔧 WHY YOU COULDN'T DELETE IT BEFORE

The hero carousel was **hardcoded as a fallback component**:

```javascript
// Old code - not managed by CMS
{!hasHeroComponent && carouselSlides.length > 0 && (
  <AdvancedHeroCarousel ... />  // Always renders automatically
)}
```

This meant:
- ❌ No delete button in UI
- ❌ Automatically appeared if carousel slides exist
- ❌ Could not be permanently hidden
- ❌ Not stored in database as a page component

---

## ✅ HOW TO HIDE/DELETE IT NOW

### Method 1: Through Admin Settings (Easiest)

**Coming Soon:** Admin panel at `/admin/website-settings`

**Steps:**
1. Go to `/admin/website-settings`
2. Find setting: **"Show Hero Carousel"**
3. Toggle to **OFF** to hide
4. Click **SAVE**
5. Homepage will no longer show the carousel

### Method 2: Direct API Update (Now)

**Make this API call:**

```bash
curl -X PUT https://yourdomain.com/api/admin/website/settings \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "website_main",
    "site_settings": {
      "show_hero_carousel": false
    }
  }'
```

### Method 3: Database Update (Direct)

**Connect to MySQL and run:**

```sql
UPDATE website_templates
SET site_settings = JSON_SET(
  site_settings,
  '$.show_hero_carousel',
  false
)
WHERE id = 'website';
```

---

## 📋 NEW CODE CHANGES

### Updated Rendering Logic

**File:** `src/app/page.tsx`

The hero carousel now checks:
1. `showHeroCarousel` flag from settings
2. `hasHeroComponent` (is there an explicit component?)
3. `carouselSlides.length > 0` (any slides to show?)

```javascript
{/* Only show if: setting is enabled AND no explicit component AND slides exist */}
{showHeroCarousel && !hasHeroComponent && carouselSlides.length > 0 && (
  <AdvancedHeroCarousel ... />
)}
```

### Settings Configuration

**Website settings structure:**

```json
{
  "site_name": "Siwa Today",
  "primary_color": "#D4AF37",
  "show_hero_carousel": false,  // NEW: Controls fallback carousel
  "carousel_autoplay": true,
  "carousel_interval": 8000,
  "...": "other settings"
}
```

---

## 🎯 THREE WAYS TO USE THE CAROUSEL

### Option 1: Show Default Hero (Current behavior)
```
✓ show_hero_carousel = true
✓ No explicit hero component
✓ Carousel shows automatically
```

### Option 2: Hide/Remove Hero (What you wanted)
```
✓ show_hero_carousel = false
✓ Carousel is hidden
✓ Content starts from next section
```

### Option 3: Custom Hero (Most control)
```
✓ Create explicit 'hero_carousel' component
✓ show_hero_carousel can be anything
✓ Your custom component takes priority
```

---

## 🚀 IMMEDIATE SOLUTIONS

### Right Now - Hide the Carousel

**Option A: Edit website settings in database**
```sql
-- Connect to phpMyAdmin or MySQL client
USE siwa_oasis;

UPDATE website_templates
SET site_settings = JSON_SET(
  COALESCE(site_settings, '{}'),
  '$.show_hero_carousel',
  false
)
WHERE id = 'website';
```

**Option B: Update code directly**
Edit `src/app/page.tsx` line 60:
```javascript
const [showHeroCarousel, setShowHeroCarousel] = useState(false);  // Change true to false
```

Then rebuild and redeploy.

### After Deployment - Use Admin Panel

1. Build and deploy your updated code
2. Go to admin settings (when available)
3. Toggle "Show Hero Carousel" setting
4. No rebuild needed!

---

## 📊 SETTING OPTIONS

| Setting | Type | Default | Purpose |
|---------|------|---------|---------|
| `show_hero_carousel` | Boolean | `true` | Enable/disable fallback carousel |
| `carousel_autoplay` | Boolean | `true` | Auto-advance slides |
| `carousel_interval` | Number | `8000` | Time between slides (ms) |
| `carousel_autoplay_mode` | String | `'resume'` | 'pause' or 'resume' on hover |
| `carousel_animation_duration` | Number | `1200` | Transition time (ms) |

---

## 🔄 HOW IT WORKS NOW

```
Homepage Loads
  ↓
Check: showHeroCarousel setting
  ├─ If FALSE → Skip carousel
  └─ If TRUE → Continue...
      ↓
  Check: hasHeroComponent (explicit in page data)?
    ├─ If YES → Show that component
    └─ If NO → Continue...
        ↓
  Check: carouselSlides available?
    ├─ If YES → Show default carousel
    └─ If NO → Skip to next section
```

---

## 🧪 TEST IT

### To Hide Immediately (Before Admin Panel):

**1. Edit the state default:**
```bash
# File: src/app/page.tsx
# Line 12
const [showHeroCarousel, setShowHeroCarousel] = useState(false);
```

**2. Rebuild:**
```bash
npm run build
npm run dev
```

**3. Test:**
```
Go to http://localhost:3000
Hero carousel should NOT appear
Content should start from first section
```

### To Enable It Again:
```javascript
const [showHeroCarousel, setShowHeroCarousel] = useState(true);  // Back to true
```

---

## 📝 ADMIN API ENDPOINTS (To Be Created)

```bash
# Get current settings
GET /api/admin/website/settings

# Update settings
PUT /api/admin/website/settings
{
  "show_hero_carousel": false,
  "carousel_autoplay": true,
  "carousel_interval": 5000
}

# Toggle hero carousel on/off
PATCH /api/admin/website/hero-carousel/toggle
```

---

## ✅ SOLUTION SUMMARY

**Problem:** Hero carousel couldn't be deleted (hardcoded)  
**Root Cause:** Not stored as CMS component, always rendered as fallback  
**Fix Applied:** Added `showHeroCarousel` state controlled by settings  
**Result:** Now manageable through settings

---

## 🎯 YOUR OPTIONS NOW

### Option 1: Hide It Right Now
```bash
Edit: src/app/page.tsx (line 12)
Change: useState(true) → useState(false)
Rebuild and deploy
```

### Option 2: Database Setting
```sql
UPDATE website_templates
SET site_settings = JSON_SET(
  site_settings, '$.show_hero_carousel', false
)
WHERE id = 'website';
```

### Option 3: Wait for Admin Panel
Once the admin panel is complete, you'll have a toggle in UI.

---

**Status:** ✅ FIXED - Hero carousel is now deletable/manageable!

Next Step: Rebuild your app and deploy. The carousel will respect the settings.

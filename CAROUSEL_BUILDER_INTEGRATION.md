# 🎬 CAROUSEL IN WEBSITE BUILDER - COMPLETE GUIDE

## ✅ CAROUSEL IS NOW A BUILDER COMPONENT!

The Cinematic Hero Carousel is now available as a **drag-and-drop component** in the Website Builder that can be placed:

- ✅ **Top of page** (Hero section)
- ✅ **Middle of page** (Between content)
- ✅ **Bottom of page** (Before footer)
- ✅ **Any position** you want!

---

## 🎯 HOW TO USE IN WEBSITE BUILDER

### **Step 1: Open Website Builder**

```
Visit: http://localhost:3000/admin/website
```

### **Step 2: Select Context**

```
Choose from dropdown:
- website_main (Main website)
- website_[business_type] (Minisite templates)
- Specific business pages
```

### **Step 3: Add Carousel Component**

```
1. Go to "Body" tab
2. Scroll through available components
3. Find: "🎬 Cinematic Hero Carousel"
4. Click to add to page
```

**Where it appears in component list:**
```
BODY COMPONENTS:
├── 📸 Photo Gallery
├── 💬 Testimonials Area
├── 💼 Services Grid
├── 📰 Recent Blog Posts
├── 🗺️ Interactive Map
├── 🎬 Cinematic Hero Carousel ← NEW!
├── 🎥 Universal Video Embed
├── ⭐ Feature Highlights
├── 📢 Call to Action Banner
└── ✉️ Newsletter Signup
```

---

## 📍 PLACEMENT EXAMPLES

### **Example 1: Carousel at TOP (Hero)**

```
Page Structure:
┌─────────────────────────────────┐
│ 🎬 Cinematic Hero Carousel      │ ← Position 1 (TOP)
├─────────────────────────────────┤
│ 📸 Photo Gallery                │ ← Position 2
├─────────────────────────────────┤
│ 💬 Testimonials                 │ ← Position 3
├─────────────────────────────────┤
│ 📢 Call to Action               │ ← Position 4
└─────────────────────────────────┘
```

**How to arrange:**
1. Add carousel first
2. Add other components after
3. Use ↑ ↓ arrows to reorder if needed

**Result:**
```
Visitor sees:
1. Full-screen carousel (100vh)
2. Then scrolls down to gallery
3. Then testimonials
4. Then CTA
```

---

### **Example 2: Carousel in MIDDLE**

```
Page Structure:
┌─────────────────────────────────┐
│ 🏠 Hero Section (Static)        │ ← Position 1
├─────────────────────────────────┤
│ 📝 About Section                │ ← Position 2
├─────────────────────────────────┤
│ 🎬 Cinematic Hero Carousel      │ ← Position 3 (MIDDLE)
├─────────────────────────────────┤
│ 💼 Services Grid                │ ← Position 4
├─────────────────────────────────┤
│ 📢 CTA Banner                   │ ← Position 5
└─────────────────────────────────┘
```

**How to arrange:**
1. Add hero section
2. Add about section
3. Add carousel
4. Add services
5. Add CTA
6. Reorder with ↑ ↓ arrows

**Result:**
```
Visitor sees:
1. Static hero
2. About text
3. THEN carousel (surprise element!)
4. Services
5. CTA
```

---

### **Example 3: Multiple Carousels**

```
Page Structure:
┌─────────────────────────────────┐
│ 🎬 Hero Carousel (Main)         │ ← Position 1 (TOP)
├─────────────────────────────────┤
│ 📝 Introduction                 │ ← Position 2
├─────────────────────────────────┤
│ 🎬 Product Carousel             │ ← Position 3 (MIDDLE)
├─────────────────────────────────┤
│ 💬 Testimonials                 │ ← Position 4
├─────────────────────────────────┤
│ 🎬 Gallery Carousel             │ ← Position 5 (BOTTOM)
└─────────────────────────────────┘
```

**Note:** Each carousel uses the same slides from database. For different slides per carousel, you'll need to configure props individually.

---

### **Example 4: Minisite Template**

```
Hotel Minisite Template:
┌─────────────────────────────────┐
│ 🎬 Cinematic Hero Carousel      │ ← Hotel showcase
├─────────────────────────────────┤
│ 🏨 Room Types                   │ ← Services grid
├─────────────────────────────────┤
│ ⭐ Amenities                    │ ← Features
├─────────────────────────────────┤
│ 📸 Photo Gallery                │ ← Images
├─────────────────────────────────┤
│ 💬 Guest Reviews                │ ← Testimonials
├─────────────────────────────────┤
│ 🗺️ Location Map                 │ ← Map
├─────────────────────────────────┤
│ 📢 Book Now CTA                 │ ← CTA Banner
└─────────────────────────────────┘
```

**How to create:**
1. Select hotel template
2. Add components in order
3. Save template
4. All hotels using this template get the carousel!

---

## 🔧 CONFIGURING CAROUSEL IN BUILDER

### **When you add carousel, you can configure:**

**1. Slides (from database)**
```
By default, loads from /api/admin/hero-carousel
All slides you added in admin will appear
```

**2. Auto-Play Interval**
```
Default: 8000ms (8 seconds)
Custom: Enter any value (e.g., 10000 for 10s)
```

**3. Height**
```
Default: 100vh (full screen)
Options:
- 100vh (full viewport)
- 80vh (80% viewport)
- 600px (fixed pixels)
- 50% (half viewport)
```

**4. Show Indicators**
```
Checkbox: Show/hide dots at bottom
Default: ✓ Checked (show)
```

**5. Show Arrows**
```
Checkbox: Show/hide prev/next buttons
Default: ✓ Checked (show)
```

**6. Show Progress Bar**
```
Checkbox: Show/hide timing progress
Default: ✓ Checked (show)
```

**7. Transition Duration**
```
Default: 1200ms (1.2 seconds)
Custom: Enter any value (e.g., 1500 for 1.5s)
```

---

## 📊 BUILDER INTERFACE

### **Left Panel - Component Library:**

```
┌──────────────────────────────┐
│  COMPONENT LIBRARY           │
├──────────────────────────────┤
│  📁 Header                   │
│    ├─ Navigation Bar         │
│    ├─ Logo Area              │
│    └─ Search Bar             │
│                              │
│  📁 Body                     │
│    ├─ Photo Gallery          │
│    ├─ Testimonials           │
│    ├─ Services Grid          │
│    ├─ 🎬 Cinematic Hero      │
│    │   Carousel              │
│    ├─ Video Embed            │
│    └─ ... more ...           │
│                              │
│  📁 Footer                   │
│    ├─ Contact Info           │
│    └─ Social Links           │
└──────────────────────────────┘
```

### **Center - Visual Canvas:**

```
┌────────────────────────────────────┐
│  PAGE PREVIEW                      │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐ │
│  │ 🎬 Cinematic Hero Carousel   │ │
│  │ [🎥 YouTube Playing]         │ │
│  │                              │ │
│  │ [LUXURY COLLECTION]          │ │
│  │ Title & Subtitle             │ │
│  │ [CTA Button]                 │ │
│  │                              │ │
│  │ Controls: ↑ ↓ ×              │ ← Reorder/Delete
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 📸 Photo Gallery             │ │
│  └──────────────────────────────┘ │
│                                    │
│  [Drop components here]            │
└────────────────────────────────────┘
```

### **Right Panel - Properties Inspector:**

```
┌──────────────────────────────┐
│  COMPONENT PROPERTIES        │
├──────────────────────────────┤
│  🎬 Cinematic Hero Carousel  │
├──────────────────────────────┤
│                              │
│  Auto-Play Interval (ms)     │
│  [8000              ]        │
│                              │
│  Height                      │
│  [100vh             ]        │
│                              │
│  Transition Duration (ms)    │
│  [1200              ]        │
│                              │
│  ☑ Show Indicators           │
│  ☑ Show Arrows               │
│  ☑ Show Progress Bar         │
│                              │
│  Slides: 5 configured        │
│  [Edit in Admin →]           │
│                              │
└──────────────────────────────┘
```

---

## 🎨 VISUAL REORDERING

### **Using Arrow Buttons:**

```
Each component has controls:

┌──────────────────────────────┐
│ 🎬 Cinematic Hero Carousel   │
│                              │
│ [↑] Move Up                  │
│ [↓] Move Down                │
│ [×] Delete                   │
└──────────────────────────────┘
```

**Example: Move carousel from position 3 to 1**

```
Before:
1. Hero Section
2. About
3. 🎬 Carousel
4. Services

Click [↑] on carousel:
1. Hero Section
2. 🎬 Carousel
3. About
4. Services

Click [↑] again:
1. 🎬 Carousel
2. Hero Section
3. About
4. Services

Done! Carousel is now at top.
```

---

## 💾 SAVE & PUBLISH

### **Save Template:**

```
1. Arrange components as desired
2. Click "💾 Save Template" button
3. Template saved to database
4. All pages using this template update
```

### **Save Individual Page:**

```
1. Select specific page
2. Add/rearrange components
3. Click "💾 Save Page"
4. Page updates immediately
```

---

## 🔗 INTEGRATION WITH SLIDES

### **How Slides Work:**

```
1. Admin adds slides via:
   /admin/hero-carousel
   
2. Slides save to database:
   website_configs table
   
3. Builder loads slides automatically:
   When you add carousel component
   
4. All carousels use same slides:
   Unless you configure custom slides
```

### **Custom Slides Per Carousel (Advanced):**

```
In component props, you can override:

{
  "type": "hero_carousel",
  "props": {
    "slides": [
      // Custom slides for this specific carousel
      {
        "id": "custom_slide_1",
        "type": "youtube",
        "mediaUrl": "...",
        "title": "Custom Title"
      }
    ],
    "autoPlayInterval": 10000,
    "height": "80vh"
  }
}
```

---

## 📱 RESPONSIVE BEHAVIOR

### **Desktop (>1024px):**
```
- Full 100vh height (or custom)
- All controls visible
- YouTube plays
- Progress bar shows
```

### **Tablet (768-1024px):**
```
- Scaled height (70vh)
- Touch-optimized controls
- YouTube plays
- Simplified UI
```

### **Mobile (<768px):**
```
- Compact height (60vh)
- Touch gestures enabled
- YouTube plays (muted)
- Essential controls only
```

---

## 🎯 USE CASES BY PAGE TYPE

### **Homepage:**
```
Position: TOP
Height: 100vh
Purpose: First impression, showcase
```

### **About Page:**
```
Position: MIDDLE
Height: 60vh
Purpose: Break up text, visual interest
```

### **Services Page:**
```
Position: TOP
Height: 80vh
Purpose: Showcase services visually
```

### **Gallery Page:**
```
Position: TOP
Height: 100vh
Purpose: Highlight best photos
```

### **Contact Page:**
```
Position: TOP
Height: 50vh
Purpose: Location showcase
```

### **Minisite (Hotel):**
```
Position: TOP
Height: 100vh
Purpose: Property showcase
```

### **Minisite (Restaurant):**
```
Position: MIDDLE
Height: 70vh
Purpose: Food presentation
```

---

## ✅ COMPLETE WORKFLOW

### **For Main Website:**

```
Step 1: Add Slides
→ /admin/hero-carousel
→ Add 3-5 slides
→ Save

Step 2: Open Builder
→ /admin/website
→ Select: website_main

Step 3: Add Carousel
→ Body tab
→ Click "Cinematic Hero Carousel"
→ Component appears on canvas

Step 4: Position
→ Drag to desired position
→ Or use ↑ ↓ arrows
→ Configure height, settings

Step 5: Save
→ Click "💾 Save Template"
→ Changes apply to homepage

Step 6: Verify
→ Visit: /
→ See carousel in position!
```

---

### **For Minisite Template:**

```
Step 1: Add Slides
→ /admin/hero-carousel
→ Add property slides
→ Save

Step 2: Open Builder
→ /admin/website
→ Select: website_hotel (or other type)

Step 3: Build Template
→ Add: 🎬 Cinematic Hero Carousel (top)
→ Add: 🏨 Room Types
→ Add: 📸 Gallery
→ Add: 💬 Reviews
→ Add: 📢 Book Now CTA

Step 4: Save Template
→ Click "💾 Save Template"
→ All hotels get this layout

Step 5: Create Business
→ /admin/orchestrator
→ Create new hotel
→ Select template
→ Hotel page has carousel!
```

---

### **For Individual Page:**

```
Step 1: Create Page
→ /admin/website → Pages tab
→ Click "Add Page"
→ Name: "Summer Special"
→ Slug: "summer-special"

Step 2: Add Components
→ Add: 🎬 Hero Carousel
→ Add: 📝 Offer Details
→ Add: 📢 Book Now

Step 3: Save Page
→ Click "💾 Save Page"

Step 4: View
→ Visit: /pages/summer-special
→ See custom page with carousel!
```

---

## 🐛 TROUBLESHOOTING

### **Carousel not showing in builder:**

**Solution:**
```
1. Refresh page (F5)
2. Check Body components list
3. Look for "🎬 Cinematic Hero Carousel"
4. If not there, hard refresh (Ctrl+Shift+R)
```

### **Carousel shows but no slides:**

**Solution:**
```
1. Check if slides exist:
   /api/admin/hero-carousel
   
2. If empty, add slides:
   /admin/hero-carousel
   
3. Refresh builder page
```

### **Carousel in wrong position:**

**Solution:**
```
1. Select carousel component
2. Click ↑ or ↓ arrows
3. Move to desired position
4. Save template
```

### **Height too big/small:**

**Solution:**
```
1. Select carousel
2. Right panel → Height
3. Change value:
   - 100vh (full)
   - 80vh (medium)
   - 60vh (small)
   - 600px (fixed)
4. Save
```

---

## 📊 COMPARISON: 3 USAGE METHODS

| Feature | Dedicated Page | Website Builder | iFrame Embed |
|---------|----------------|-----------------|--------------|
| **URL** | `/carousel` | Any page | Anywhere |
| **Position** | Full page only | Any position | Any position |
| **Configuration** | Fixed | Full control | Fixed |
| **Other Components** | No | Yes | No |
| **Use Case** | Standalone showcase | Custom pages | External sites |
| **Flexibility** | Low | ✅ High | Low |

---

## 🎉 SUMMARY

### **What You Can Do Now:**

✅ Add carousel to ANY page
✅ Place it at TOP, MIDDLE, or BOTTOM
✅ Reorder with drag & drop
✅ Configure height, timing, controls
✅ Use in main website
✅ Use in minisite templates
✅ Use in individual pages
✅ Multiple carousels per page
✅ All slides from database
✅ Custom slides per carousel (advanced)

### **Quick Access:**

| What | URL |
|------|-----|
| **Website Builder** | http://localhost:3000/admin/website |
| **Add Slides** | http://localhost:3000/admin/hero-carousel |
| **Dedicated Page** | http://localhost:3000/carousel |
| **Homepage** | http://localhost:3000/ |

---

**The carousel is now fully integrated into the Website Builder and can be placed anywhere!** 🎬✨

**Just drag, drop, and position it where you want!**

**Created:** 2026-04-25  
**Status:** ✅ FULLY INTEGRATED IN BUILDER  
**Ready to Use:** ✅ YES

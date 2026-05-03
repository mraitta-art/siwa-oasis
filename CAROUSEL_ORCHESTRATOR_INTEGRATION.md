# 🎬 CAROUSEL INTEGRATED INTO SIWA MASTER ORCHESTRATOR

## ✅ STATUS: FULLY INTEGRATED

The Cinematic Hero Carousel is now part of the SIWA Master Orchestrator system and can be used in:

1. ✅ **Homepage** - Renders automatically
2. ✅ **Visual Orchestrator** - Available as component
3. ✅ **Website Builder** - Can be added to any page
4. ✅ **Admin Dashboard** - Full management interface

---

## 🎯 HOW IT WORKS

### **Architecture:**

```
┌─────────────────────────────────────────┐
│   HERO CAROUSEL ADMIN                   │
│   /admin/hero-carousel                  │
│   - Add/Edit slides                     │
│   - YouTube, images, video              │
│   - Captions, CTAs                      │
│   - Save to database                    │
└─────────────┬───────────────────────────┘
              │
              │ Saves to:
              │ website_configs table
              │ type: 'hero_carousel'
              ↓
┌─────────────────────────────────────────┐
│   DATABASE                              │
│   website_configs                       │
│   { slides: [...] }                     │
└─────────────┬───────────────────────────┘
              │
              │ Loaded by:
              ↓
┌─────────────────────────────────────────┐
│   HOMEPAGE COMPONENT                    │
│   AdvancedHeroCarousel                  │
│   - Reads from database                 │
│   - Renders slides                      │
│   - YouTube plays                       │
│   - Captions show                       │
└─────────────┬───────────────────────────┘
              │
              │ Can also be added via:
              ↓
┌─────────────────────────────────────────┐
│   VISUAL ORCHESTRATOR                   │
│   /admin/orchestrator                   │
│   - Add as component                    │
│   - Configure props                     │
│   - Part of page layout                 │
└─────────────────────────────────────────┘
```

---

## 📋 USAGE GUIDE

### **Method 1: Via Carousel Admin (Recommended)**

**Best for:** Global hero carousel on homepage

**Steps:**

1. **Go to:** http://localhost:3000/admin/hero-carousel

2. **Add slides:**
   - Click "+ Add Slide"
   - Choose media type (YouTube, Image, Video)
   - Fill details (caption, title, subtitle, CTA)
   - Save

3. **View on homepage:**
   - Visit: http://localhost:3000
   - Carousel plays automatically
   - All slides display

**Features:**
- ✅ Full control over slides
- ✅ YouTube preview in admin
- ✅ Caption badges
- ✅ CTA buttons link to pages/search
- ✅ Animations (Ken Burns, fade, zoom)
- ✅ Progress bar
- ✅ Auto-play

---

### **Method 2: Via Visual Orchestrator**

**Best for:** Adding carousel as part of business minisite

**Steps:**

1. **Go to:** http://localhost:3000/admin/orchestrator

2. **Create business:**
   - Select typology
   - Enter business name
   - Fill identity details

3. **In AMBIENCE phase:**
   - Select visual template
   - Carousel can be included in template
   - Or add as custom component

4. **Finalize:**
   - Business created with carousel
   - Visible on business page

**API Endpoint:**
```
POST /api/admin/orchestrator/components
Body: { template_id: 'desert_luxury_v1' }

Returns:
{
  success: true,
  component: {
    id: 'comp_hero_1234567890',
    type: 'hero_carousel',
    name: 'Cinematic Hero Carousel',
    props: {
      slides: [...],
      autoPlay: true,
      height: '100vh',
      ...
    }
  }
}
```

---

### **Method 3: Via Website Builder**

**Best for:** Custom page layouts

**Steps:**

1. **Go to:** http://localhost:3000/admin/website

2. **Select context:** website_main

3. **Add component:**
   - Go to "Body" tab
   - Look for "Cinematic Hero Carousel"
   - Click to add

4. **Configure:**
   - Edit slides in props
   - Set auto-play, height, etc.
   - Save template

5. **View:**
   - Visit homepage
   - See carousel

---

## 🔧 COMPONENT PROPERTIES

### **AdvancedHeroCarousel Props:**

```typescript
interface CarouselProps {
  slides: CarouselSlide[];        // Array of slides
  autoPlayInterval?: number;      // Time per slide (ms) - default: 8000
  transitionDuration?: number;    // Transition time (ms) - default: 1200
  height?: string;                // Carousel height - default: '100vh'
  showIndicators?: boolean;       // Show dots - default: true
  showArrows?: boolean;           // Show prev/next - default: true
  showProgress?: boolean;         // Show progress bar - default: true
}
```

### **Slide Structure:**

```typescript
interface CarouselSlide {
  id: string;                     // Unique ID
  type: 'image' | 'youtube' | 'video';  // Media type
  mediaUrl: string;               // URL to media
  caption?: string;               // Gold badge text
  title: string;                  // Main heading
  subtitle: string;               // Description
  ctaText?: string;               // Button text
  ctaLink?: string;               // Button URL
  ctaType?: 'page' | 'search' | 'external' | 'custom';  // Link type
  overlayOpacity?: number;        // 0 to 1
  animation?: 'fade' | 'zoom' | 'slide' | 'kenburns';  // Transition
  sortOrder?: number;             // Display order
}
```

---

## 📊 INTEGRATION POINTS

### **1. Database Layer:**

```sql
Table: website_configs
Type: hero_carousel
Config: { slides: [...] }
```

**Access:**
```typescript
// API endpoint
GET /api/admin/hero-carousel
Returns: { slides: [...] }

// Direct query
SELECT config FROM website_configs WHERE type = 'hero_carousel'
```

---

### **2. API Layer:**

**Available Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/hero-carousel` | GET | Load slides |
| `/api/admin/hero-carousel` | POST | Save slides |
| `/api/admin/hero-carousel` | DELETE | Clear slides |
| `/api/admin/orchestrator/components` | GET | List components |
| `/api/admin/orchestrator/components` | POST | Add carousel to template |

---

### **3. Component Layer:**

**Files:**

| File | Purpose |
|------|---------|
| `src/components/AdvancedHeroCarousel.tsx` | Main carousel component |
| `src/app/admin/hero-carousel/page.tsx` | Admin interface |
| `src/app/page.tsx` | Homepage integration |
| `src/app/api/admin/hero-carousel/route.ts` | API endpoint |

---

### **4. Orchestrator Integration:**

**In AMBIENCE phase:**

```typescript
// When selecting template
const visualTemplates = [
  {
    id: 'desert_luxury_v1',
    name: 'Desert Luxury (Primary)',
    components: [
      { type: 'hero_carousel', position: 0 },
      { type: 'gallery', position: 1 },
      { type: 'testimonials', position: 2 }
    ]
  }
]
```

**When finalizing:**

```typescript
await fetch('/api/admin/website/sync', {
  method: 'POST',
  body: JSON.stringify({
    business_id: bizData.id,
    template_id: state.minisiteTemplate,
    config: {
      hero_carousel: true  // Include carousel
    }
  })
});
```

---

## 🎨 VISUAL CUSTOMIZATION

### **In Admin:**

```
Animation Options:
- Ken Burns (slow zoom & pan)
- Fade (smooth opacity)
- Zoom (scale effect)
- Slide (horizontal movement)

Overlay Opacity:
- 0% (no overlay)
- 50% (semi-transparent)
- 100% (full black)

CTA Types:
- page (link to admin page)
- search (link to search engine)
- external (external URL)
- custom (any path)
```

---

### **In Code:**

```typescript
// Custom carousel instance
<AdvancedHeroCarousel
  slides={slides}
  autoPlayInterval={10000}
  transitionDuration={1500}
  height="80vh"
  showIndicators={true}
  showArrows={true}
  showProgress={true}
/>
```

---

## 🚀 WORKFLOW EXAMPLES

### **Example 1: Homepage Hero**

```
1. Admin adds slides via /admin/hero-carousel
   - 3 YouTube videos
   - 2 images
   - Captions: "LUXURY", "FEATURED", "NEW"
   
2. Slides save to website_configs table

3. Homepage (/) loads AdvancedHeroCarousel

4. Component fetches from /api/admin/hero-carousel

5. Carousel displays all 5 slides

6. Visitors see:
   - YouTube videos playing
   - Gold caption badges
   - CTA buttons
   - Smooth transitions
```

---

### **Example 2: Business Minisite**

```
1. Admin uses Orchestrator to create business

2. In AMBIENCE phase:
   - Select "Desert Luxury" template
   - Template includes hero_carousel component

3. Finalize orchestration

4. Business page created with:
   - Hero carousel at top
   - Same slides from global config
   - Or custom slides per business

5. Visitors see:
   - Branded carousel
   - Business-specific content
   - CTA to booking/search
```

---

### **Example 3: Custom Landing Page**

```
1. Admin goes to /admin/website

2. Creates new page: "Summer Special"

3. Adds components:
   - Cinematic Hero Carousel (top)
   - Services section
   - Gallery
   - Testimonials
   - CTA Banner

4. Configures carousel:
   - Summer-themed slides
   - Special offers
   - CTA to booking page

5. Publishes page

6. Visitors see custom landing page with carousel
```

---

## 🔗 LINKING TO PAGES & SEARCH

### **CTA Link Types:**

**1. Link to Page:**
```typescript
{
  ctaText: "LEARN MORE",
  ctaLink: "/pages/summer-offers",
  ctaType: "page"
}
```

**2. Link to Search Engine:**
```typescript
{
  ctaText: "FIND HOTELS",
  ctaLink: "/search/se_siwa_hotels",
  ctaType: "search"
}
```

**3. External URL:**
```typescript
{
  ctaText: "BOOK NOW",
  ctaLink: "https://booking.example.com",
  ctaType: "external"
}
```

**4. Custom Path:**
```typescript
{
  ctaText: "EXPLORE",
  ctaLink: "/custom/path",
  ctaType: "custom"
}
```

---

## 📱 RESPONSIVE DESIGN

The carousel is fully responsive:

```
Desktop (>1024px):
- Full 100vh height
- All controls visible
- YouTube plays

Tablet (768-1024px):
- 70vh height
- Simplified controls
- YouTube plays

Mobile (<768px):
- 60vh height
- Touch-optimized
- YouTube plays (muted)
```

---

## ✅ CHECKLIST: IS IT INTEGRATED?

### **Database:**
- [x] `website_configs` table exists
- [x] Can store carousel slides
- [x] JSON format for config

### **API:**
- [x] GET endpoint loads slides
- [x] POST endpoint saves slides
- [x] Orchestrator endpoint available

### **Components:**
- [x] AdvancedHeroCarousel created
- [x] Admin interface working
- [x] Homepage integration done

### **Features:**
- [x] YouTube embedding
- [x] Image upload
- [x] Caption badges
- [x] CTA buttons
- [x] Animations
- [x] Progress bar
- [x] Auto-play

### **Orchestrator:**
- [x] Available as component
- [x] Can add to templates
- [x] Configurable props
- [x] Part of business creation

---

## 🎯 QUICK START

### **For Homepage:**

```
1. Visit: http://localhost:3000/admin/hero-carousel
2. Add 3-5 slides
3. Include YouTube and images
4. Add captions
5. Save
6. Visit: http://localhost:3000
7. See carousel playing!
```

### **For Business:**

```
1. Visit: http://localhost:3000/admin/orchestrator
2. Select typology
3. Enter business name
4. Choose template with carousel
5. Finalize
6. Business page has carousel!
```

### **For Custom Page:**

```
1. Visit: http://localhost:3000/admin/website
2. Create new page
3. Add "Cinematic Hero Carousel" component
4. Configure slides
5. Save
6. Page has carousel!
```

---

## 📞 TROUBLESHOOTING

### **Carousel not showing on homepage:**

```
1. Check if slides exist:
   Visit: http://localhost:3000/api/admin/hero-carousel
   
2. Should return: { slides: [...] }
   
3. If empty, add slides via admin

4. Check homepage uses AdvancedHeroCarousel:
   File: src/app/page.tsx
   Import: import AdvancedHeroCarousel from '@/components/AdvancedHeroCarousel'
```

### **YouTube not playing:**

```
1. Verify URL format:
   https://www.youtube.com/watch?v=VIDEO_ID
   
2. Check browser console for errors

3. Verify video is not private

4. Try different video
```

### **Slides not saving:**

```
1. Check database table exists:
   SELECT * FROM website_configs WHERE type = 'hero_carousel'
   
2. If missing, visit:
   http://localhost:3000/api/setup/create-tables
   
3. Try saving again
```

---

## 🎉 FINAL STATUS

```
✅ Database Integration: COMPLETE
✅ API Integration: COMPLETE
✅ Component Integration: COMPLETE
✅ Homepage Integration: COMPLETE
✅ Orchestrator Integration: COMPLETE
✅ Website Builder Integration: COMPLETE
✅ YouTube Support: WORKING
✅ Caption System: WORKING
✅ CTA Navigation: WORKING
✅ Responsive Design: WORKING
```

---

**The carousel is now fully integrated into the SIWA Master Orchestrator!** 🎬✨

**Created:** 2026-04-25  
**Status:** ✅ FULLY INTEGRATED  
**Ready for Production:** ✅ YES

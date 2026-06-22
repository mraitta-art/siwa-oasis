# ⚡ Quick Reference: Builder, Sections & Components

## 🎯 The 3-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Website Page Builder (/jana/website)             │
│  ➜ Edit LAYOUT - which sections appear where               │
│  ➜ Reorder sections - move up/down                         │
│  ➜ Add/Remove sections - choose what to display            │
│  ➜ Site Settings - colors, logo, carousel timing           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Sections Manager (/jana/sections)                │
│  ➜ Create CONTENT CATEGORIES (Location, Hours, Team, etc)  │
│  ➜ Assign sections to business types                       │
│  ➜ Control vendor requirements                             │
│  ➜ Configure what shows where (public/minisite/card)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Component Templates (/admin/sections/create)     │
│  ➜ Create DATA ENTRY FIELDS within sections                │
│  ➜ Configure: text, images, maps, repeatable items         │
│  ➜ Mark required/optional                                  │
│  ➜ Decide if repeatable (multiple entries)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Go Here To...

| Goal | URL | Time |
|------|-----|------|
| 🎨 **Change homepage layout** | `/jana/website` | 2 min |
| 📦 **Create a new section** | `/jana/sections` | 3 min |
| 🧩 **Add fields to section** | `/admin/sections/create` | 5 min |
| 📸 **Upload carousel photos** | `/jana/hero-carousel` | 2 min |
| 🏢 **Manage businesses** | `/jana/businesses` | 5 min |
| 🔍 **Configure search** | `/jana/search-engines` | 5 min |

---

## 🎬 Homepage Default Layout

```
Current 9-Section Homepage:

┌──────────────────────────────────────┐
│  1️⃣  HERO CAROUSEL (🎬)              │ Fullscreen slideshow
│     (Manages at: /jana/hero-carousel)│
├──────────────────────────────────────┤
│  2️⃣  SERVICES HUB (🏛️)               │ All business categories
├──────────────────────────────────────┤
│  3️⃣  EXPERIENCE CATEGORIES (🎭)      │ Wellness, Food, Crafts, Safari
├──────────────────────────────────────┤
│  4️⃣  SEARCH ENGINE (🔍)              │ Vibe search + filters
├──────────────────────────────────────┤
│  5️⃣  JOURNEY PLANNER (🗓️)            │ Trip planning tool
├──────────────────────────────────────┤
│  6️⃣  INTERACTIVE MAP (🗺️)            │ Ecosystem visualization
├──────────────────────────────────────┤
│  7️⃣  LOCAL PRODUCTS (🫒)             │ Artisan goods showcase
├──────────────────────────────────────┤
│  8️⃣  STORYTELLING (📖)               │ Heritage narratives
├──────────────────────────────────────┤
│  9️⃣  PARTNER CTA (🤝)                │ Vendor signup button
└──────────────────────────────────────┘
```

---

## 🚀 Quickest Edits (Under 5 Minutes)

### ✏️ Edit 1: Reorder Sections
```
At /jana/website:

Find "Services Hub" section
Click ↑ UP arrow (moves it up 1 spot)
Click 🚀 PUBLISH
✅ Services Hub now appears before Experience Categories
```

### ✏️ Edit 2: Remove a Section
```
At /jana/website:

Find "Storytelling" section
Click 🗑️ DELETE
Click 🚀 PUBLISH
✅ Storytelling gone from homepage
```

### ✏️ Edit 3: Add a New Section
```
At /jana/website:

Scroll to "COMPONENT PALETTE" (Body zone)
Find "Blog / Articles" (or any component)
Click "+ ADD"
Click 🚀 PUBLISH
✅ Blog section now on homepage
```

### ✏️ Edit 4: Change Brand Color
```
At /jana/website:

Scroll to "SITE SETTINGS"
Find "primary_color": #D4AF37
Change to: #FF6600 (or any hex color)
Click 🚀 PUBLISH
Refresh page (Ctrl+F5)
✅ All gold accents now orange
```

### ✏️ Edit 5: Toggle Carousel Autoplay
```
At /jana/website:

Scroll to "SITE SETTINGS"
Find "carousel_autoplay": true
Change to: false (or true to turn back on)
Click 🚀 PUBLISH
✅ Carousel now manual (or auto)
```

---

## 🎨 Components Available to Add

| Component | Icon | What It Shows | Managed At |
|-----------|------|---------------|-----------|
| **Hero Carousel** | 🎬 | Fullscreen slides | `/jana/hero-carousel` |
| **Services Hub** | 🏛️ | All businesses | `/jana/businesses` |
| **Experience Categories** | 🎭 | Wellness/Food/Crafts/Safari | (hardcoded) |
| **Search Engine** | 🔍 | Full-width search | `/jana/search-engines` |
| **Journey Planner** | 🗓️ | Trip planning tool | (hardcoded) |
| **Interactive Map** | 🗺️ | Location ecosystem | (hardcoded) |
| **Local Products** | 🫒 | Artisan goods | (hardcoded) |
| **Storytelling** | 📖 | Heritage stories | (hardcoded) |
| **Partner CTA** | 🤝 | Vendor signup | (hardcoded) |
| **Blog** | 📰 | Latest articles | `/jana/blog` |
| **Featured Vibe** | 🪄 | Single featured story | (hardcoded) |
| **Investment** | 💎 | Investment opportunities | (hardcoded) |

---

## 📚 Section Management Matrix

```
STEP 1: Create Section
┌──────────────────────────────────────┐
│ Name:    "Location & Hours"          │
│ Icon:    fa-map-marker               │
│ Desc:    "Business address & hours"  │
│ Vendor Editable:  ☑️                │
│ Show Public:      ☑️                │
│ Show Minisite:    ☑️                │
│ Filterable:       ☑️                │
└──────────────────────────────────────┘

STEP 2: Add Components to Section
┌──────────────────────────────────────┐
│ ☑️ Component 1: Address (text)       │
│    Required: ☑️ Repeatable: ☐        │
│                                      │
│ ☑️ Component 2: Hours (time range)   │
│    Required: ☑️ Repeatable: ☐        │
│                                      │
│ ☑️ Component 3: Phone (tel)          │
│    Required: ☐ Repeatable: ☐         │
└──────────────────────────────────────┘

STEP 3: Result
➜ Vendors see 3 fields to fill
➜ Address & Hours required
➜ Phone optional
➜ Data displays on business card
```

---

## 🎯 The User Journey

```
┌─────────────────────────────────────────────────────────┐
│  YOU (Admin)                                            │
├─────────────────────────────────────────────────────────┤
│  Go to /jana/website                                   │
│  ↓ Add/Remove/Reorder sections                         │
│  ✅ PUBLISH                                             │
│  ↓ Homepage instantly changes                          │
└──────────────┬──────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────┐
│  VENDORS see: "Fill in your Location section"           │
├──────────────────────────────────────────────────────────┤
│  They navigate to their dashboard                       │
│  See components from /jana/sections                     │
│  Fill in: Address, Hours, Phone, etc.                   │
│  ✅ SAVE                                                 │
│  ↓ Data auto-displays on homepage                       │
└──────────────┬───────────────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────────────┐
│  CUSTOMERS see: Business card with vendor data          │
├──────────────────────────────────────────────────────────┤
│  Homepage displays:                                     │
│  ├─ Hero carousel (your images)                        │
│  ├─ Services Hub (vendor businesses)                   │
│  ├─ Experience Categories (filtered by section data)   │
│  └─ All structured beautifully!                        │
└──────────────────────────────────────────────────────────┘
```

---

## 💾 Common Configurations

### 🏨 Hotel Configuration
```
Sections Assigned to "Hotel" Type:
✓ Location (map, address)
✓ Rooms (repeatable - room types)
✓ Amenities (checklist)
✓ Pricing (repeatable - rates)
✓ Photos (gallery)
✓ Reviews (repeatable)
✗ Kitchen (not needed for hotels)
✗ Team (optional)
```

### 🍽️ Restaurant Configuration
```
Sections Assigned to "Restaurant" Type:
✓ Location (map, address)
✓ Hours (opening times)
✓ Menu (repeatable - dishes)
✓ Pricing (cost ranges)
✓ Photos (food gallery)
✓ Ambiance (atmosphere description)
✓ Reviews (repeatable)
✗ Rooms (not needed)
```

### 🏊 Activity/Adventure Configuration
```
Sections Assigned to "Tour Operator" Type:
✓ Location (meeting point)
✓ Duration (how long)
✓ Pricing (cost)
✓ Includes (what's provided)
✓ Photos (activity pics)
✓ Requirements (fitness level, age)
✓ Reviews (repeatable)
✓ Schedule (dates available)
```

---

## ⚙️ Site Settings Reference

```
PRIMARY COLORS:
┌─────────────────────────────────┐
│ site_name:          "Siwa Today" │
│ primary_color:      "#D4AF37"    │ ← Gold/yellow accent
│ nav_bg_color:       "#556B2F"    │ ← Dark olive
│ bg_color:           "#0f172a"    │ ← Very dark blue
│ logo_url:           "/logo.png"  │
│ logo_height:        40           │ pixels
│ show_watermark:     true         │ ☑️ visible
└─────────────────────────────────┘

CAROUSEL SETTINGS:
┌─────────────────────────────────┐
│ carousel_autoplay:  true         │ ☑️ auto slides
│ carousel_interval:  8000         │ milliseconds (8 sec)
│ show_indicators:    true         │ ☑️ dots visible
│ show_arrows:        true         │ ☑️ arrows visible
│ show_progress:      true         │ ☑️ progress bar
└─────────────────────────────────┘

FEATURE FLAGS:
┌─────────────────────────────────┐
│ show_logo_in_hero:  false        │ Logo on carousel
│ show_testimonials:  true         │ Show reviews
│ enable_blog:        true         │ Show blog section
└─────────────────────────────────┘
```

---

## 🔍 Finding What You Need

### "I want to change the hero carousel images"
```
Homepage Builder (/jana/website)
  ↓ Shows: Hero Carousel (props: carousel_id="discovery")
  ↓ Go to: /jana/hero-carousel?siteId=discovery
  ↓ Action: Upload new images there
  ✅ Homepage carousel updates instantly
```

### "I want to add testimonials section to homepage"
```
1. Go to: /jana/website
2. Find: "COMPONENT PALETTE" → Body zone
3. Look for: Testimonials OR Featured Vibe
4. Click: "+ ADD"
5. Click: 🚀 PUBLISH
✅ Testimonials now on homepage
```

### "I want vendors to fill in 'Team' information"
```
1. Go to: /jana/sections
2. Create: New section "Team & Staff"
3. Go to: /admin/sections/create
4. Add: Component "Team" (repeatable)
5. Assign: Section to business types
✅ Vendors see "Team" in their dashboard
```

### "I want to remove 'Storytelling' from homepage"
```
1. Go to: /jana/website
2. Find: "Storytelling" section in Body zone
3. Click: 🗑️ DELETE button
4. Click: 🚀 PUBLISH
✅ Storytelling gone from homepage
```

---

## 📊 Section Status Checklist

```
WHEN YOU CREATE A SECTION, ASK:

☐ Does it have a clear name?
☐ Is it assigned to correct business types?
☐ Are components defined?
☐ Are required fields marked?
☐ Do repeatable components have max items?
☐ Is vendor_editable checked (if needed)?
☐ Is show_on_public checked (if needed)?
☐ Is show_on_minisite checked (if needed)?
☐ Is is_filterable checked (if needed)?

WHEN YOU EDIT HOMEPAGE, ASK:

☐ Did I click 🚀 PUBLISH?
☐ Did I hard refresh (Ctrl+F5)?
☐ Does it look right on mobile?
☐ Do all sections display correctly?
☐ Are colors/branding consistent?
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Changes not showing | Didn't click PUBLISH | Click 🚀 PUBLISH button |
| Old layout still showing | Browser cache | Hard refresh: Ctrl+F5 |
| Section appears empty | Component not configured | Go to component manager |
| Can't add section | Already added | Scroll down to add again |
| Vendor can't see field | vendor_editable ☐ | Go to sections, check it |
| Field showing on card but shouldn't | show_on_card ☑️ | Uncheck in section settings |
| Too many sections on homepage | 9+ sections | Remove some with DELETE |

---

## ⏱️ Time Estimates for Common Tasks

```
Task                          │ Time  │ Difficulty
──────────────────────────────┼───────┼────────────
Reorder sections              │ 1 min │ ⭐ Easy
Remove a section              │ 2 min │ ⭐ Easy
Add a component               │ 2 min │ ⭐ Easy
Change brand color            │ 2 min │ ⭐ Easy
Create new section            │ 5 min │ ⭐⭐ Medium
Add components to section     │ 10 min│ ⭐⭐ Medium
Assign sections to type       │ 5 min │ ⭐⭐ Medium
Full homepage redesign        │ 30 min│ ⭐⭐⭐ Complex
Create new business type      │ 15 min│ ⭐⭐⭐ Complex
```

---

## 🎓 Learning Path

### Day 1: Basics (30 minutes)
- [ ] Go to `/jana/website`
- [ ] Reorder 2 sections
- [ ] Remove 1 section
- [ ] Change 1 color
- [ ] Click PUBLISH
- [ ] Visit homepage to see changes

### Day 2: Sections (30 minutes)
- [ ] Go to `/jana/sections`
- [ ] Understand section concept
- [ ] Create 1 new section
- [ ] Assign it to a business type
- [ ] Visit homepage to test

### Day 3: Components (30 minutes)
- [ ] Go to `/admin/sections/create`
- [ ] Create section with components
- [ ] Add 3+ components
- [ ] Mark some required
- [ ] Mark some repeatable

### Day 4: Advanced (30 minutes)
- [ ] Redesign entire homepage
- [ ] Create multiple sections
- [ ] Configure all business types
- [ ] Test vendor experience
- [ ] Deploy to production

---

## 🎉 You're Ready!

You now understand:
✅ **Layer 1:** Website Builder - Edit layout
✅ **Layer 2:** Sections - Create content categories
✅ **Layer 3:** Components - Define data fields

**Next action:** Open `/jana/website` and try reordering a section!

**Questions?** Check the full guide: `HOMEPAGE_BUILDER_COMPLETE_GUIDE.md`

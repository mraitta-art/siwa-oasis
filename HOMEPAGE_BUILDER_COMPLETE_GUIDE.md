# 🏗️ Complete Guide: Edit Homepage Using Page Builder & Sections System

## Quick Access
- **Website Builder:** http://localhost:3004/jana/website
- **Sections Manager:** http://localhost:3004/jana/sections
- **Component Templates:** http://localhost:3004/admin/sections/create
- **Current Homepage:** http://localhost:3004/ (displays the built layout)

---

## 🎯 What You Have

Your Siwa system has **3 interconnected tools**:

1. **Website Page Builder** - Visual layout editor
2. **Sections System** - Content organization framework
3. **Component Templates** - Reusable content building blocks

---

## 📋 Part 1: Website Page Builder

### Where It Lives
**URL:** `/jana/website`

### What It Does
- Drag-and-drop add/remove page sections
- Reorder sections (hero carousel, search, etc.)
- Edit site-wide settings (colors, fonts, carousel timing)
- Publish pages instantly
- Multiple page management

### Current Homepage Structure

Your main homepage (`/`) currently has **9 default sections** in this order:

```
1. Hero Carousel (🎬)
   ├─ Full-screen sliding images/videos
   ├─ Managed at: /jana/hero-carousel
   └─ Config: carousel_id="discovery"

2. Services Hub (🏛️)
   ├─ Show all business categories
   └─ Managed at: /jana/businesses

3. Experience Categories (🎭)
   ├─ Wellness, Slow Food, Crafts, Safaris
   └─ Interactive discovery cards

4. Search Engine (🔍)
   ├─ Full-width search/filter bar
   ├─ Managed at: /jana/search-engines
   └─ Advanced vibe & filter searches

5. Journey Planner (🗓️)
   ├─ AI-powered trip planning tool
   └─ Multi-day customization

6. Interactive Map (🗺️)
   ├─ Ecosystem visualization
   └─ Show all locations/resources

7. Local Products (🫒)
   ├─ Artisan goods showcase
   └─ Siwa specialties showcase

8. Storytelling (📖)
   ├─ Heritage & cultural narratives
   └─ Rich text stories

9. Partner CTA (🤝)
   ├─ Call-to-action for vendors
   └─ "Become a Partner" button
```

---

## 🎬 Step-by-Step: Edit Homepage Layout

### Step 1: Access the Website Builder
1. Go to http://localhost:3004/jana/website (when logged in as admin)
2. You see **PAGES tab** at the top (with "TEMPLATES" option next to it)
3. "main" page is selected by default

### Step 2: See Current Sections
The builder shows your homepage in three zones:

**Header Zone** (🟡 Yellow) - Top of page
- Usually empty or has compact search

**Body Zone** (🟢 Green) - Main content area
- Your 9 sections display here in order

**Footer Zone** (🔘 Gray) - Bottom of page
- Usually empty or has partner CTA

### Step 3: Reorder Sections (Move Up/Down)
1. Find a section you want to move (e.g., "Services Hub")
2. Click the **↑ UP** or **↓ DOWN** arrow next to it
3. Section moves immediately within its zone
4. Click **🚀 PUBLISH** to save

**Example:** Move Services Hub to be first instead of Hero Carousel:
1. Click ↑ on "Services Hub" (move up twice)
2. Click 🚀 PUBLISH
3. Visit homepage - Services Hub now appears first!

### Step 4: Remove a Section
1. Find the section you want to remove (e.g., "Storytelling")
2. Click the **🗑️ DELETE** button
3. Confirm deletion
4. Click **🚀 PUBLISH** to save
5. Section is gone from homepage

### Step 5: Add a New Section
1. Scroll down to **"COMPONENT PALETTE"** section
2. See list of available components by zone:
   - Header components (search, carousel)
   - Body components (all the main sections)
   - Footer components
3. Click **"+ ADD"** button next to the component you want
4. Component appears in that zone
5. Click **🚀 PUBLISH** to save

**Available Components to Add:**
| Component | Icon | Purpose |
|-----------|------|---------|
| Hero Carousel | 🎬 | Full-screen slideshow |
| Services Hub | 🏛️ | Business categories |
| Experience Categories | 🎭 | Discovery cards |
| Search Engine (Full) | 🔍 | Advanced search |
| Journey Planner | 🗓️ | Trip planner |
| Interactive Map | 🗺️ | Ecosystem map |
| Local Products | 🫒 | Artisan goods |
| Storytelling | 📖 | Heritage stories |
| Partner CTA | 🤝 | Vendor signup |
| Blog / Articles | 📰 | Latest blog posts |
| Featured Vibe Story | 🪄 | Highlighted experience |
| Investment Marketplace | 💎 | Investment opportunities |

### Step 6: Configure Section Properties
Some sections have settings:

1. Click the section you want to edit
2. Look for **"PROPS"** or **"Settings"** area
3. Common settings:
   - **carousel_id** - Which carousel to display
   - **engine_id** - Which search engine config
   - **height** - Component height
   - **show_filters** - Toggle filters on/off
4. Change values
5. Click **🚀 PUBLISH** to save

---

## ⚙️ Site-Wide Settings

In the Website Builder, scroll to **"SITE SETTINGS"** section:

### Colors & Branding
- **Site Name:** "Siwa Today"
- **Primary Color:** #D4AF37 (golden)
- **Background Color:** #0f172a (dark)
- **Nav Background:** #556B2F (olive)

### Logo & Watermark
- **Logo URL:** Upload your logo
- **Logo Height:** 40px
- **Show Watermark:** Toggle watermark visibility

### Carousel Settings
- **Auto-play:** true/false (autoplay slides)
- **Carousel Interval:** 8000ms (time between slides)

### How to Update Settings
1. Find the setting you want to change
2. Edit the value (e.g., change primary color to #FF6600)
3. Click **🚀 PUBLISH**
4. Refresh homepage to see changes

---

## 📚 Part 2: Sections System

### Where It Lives
**URL:** `/jana/sections`

### What Is a Section?
A **Section** is a **content category** within a business. Examples:
- "Location & Hours"
- "Team Members"
- "Testimonials"
- "Gallery"
- "Pricing & Packages"
- "FAQ"

### Why Sections Matter
- **Organizes content** on vendor mini-sites
- **Standardizes data** across all businesses
- **Affects what vendors fill in** when creating their pages
- **Controls what shows** on public business cards

### How Sections Affect Homepage
When you add sections to a business type, vendors **must fill in that section** for their businesses:

```
Example:
Admin creates a business type: "Accommodation"
Admin assigns sections: Location, Gallery, Testimonials, Pricing

Result:
Every hotel owner must fill in those 4 sections
Homepage uses that structured data to display business cards
```

---

## 🔧 Step-by-Step: Create & Use Sections

### Step 1: Access Sections Manager
1. Go to http://localhost:3004/jana/sections
2. See current sections organized by business type

### Step 2: See Business Types
1. In the left panel, see all business types:
   - Accommodation
   - Restaurant
   - Tour Guide
   - etc.
2. Click a business type to select it
3. Right panel shows "sections assigned to this type"

### Step 3: Assign Sections to a Business Type

**Goal:** Make sure vendors fill in specific sections

1. Click a **Business Type** (e.g., "Hotel")
2. See **Available Sections** (left side)
3. Check the sections you want required:
   - ☑️ Location & Hours
   - ☑️ Team
   - ☑️ Gallery
   - ☑️ Testimonials
4. Uncheck sections you don't want:
   - ☐ Pricing
   - ☐ FAQ
5. Click **"SAVE SECTIONS"**
6. ✅ Done! Hotel owners must now fill those sections

### Step 4: Create a New Section (Optional)

**Goal:** Add a new category for vendors to fill in

1. Scroll to **"CREATE NEW SECTION"** button
2. Enter section details:
   - **Name:** "Member Reviews"
   - **Icon:** fa-star (or pick from FontAwesome)
   - **Description:** "What past guests said"
3. Choose settings:
   - **Vendor Editable:** ☑️ (vendors can edit)
   - **Show on Public:** ☑️ (visible on business card)
   - **Show on Mini-site:** ☑️ (visible on their page)
   - **Filterable:** ☑️ (can filter by this)
4. Click **"CREATE SECTION"**
5. ✅ New section available!

---

## 🧩 Part 3: Component Templates

### Where It Lives
**URL:** `/admin/sections/create`

### What Are Components?
**Components** are **data entry fields** within a Section.

```
Example Section: "Location & Hours"
Contains Components:
├─ Address (text field)
├─ Phone Number (tel field)
├─ Hours Open (time range)
├─ Map Embed (textarea)
└─ Parking Available (checkbox)
```

### Available Component Types

| Component | Type | Purpose |
|-----------|------|---------|
| Location | map input | Address & coordinates |
| Hours | time range | Business hours |
| Team | repeatable | List of staff |
| Testimonials | repeatable | Customer reviews |
| FAQ | repeatable | Q&A pairs |
| Features | checklist | Amenities/features |
| Pricing | repeatable | Price tiers |
| Gallery | image gallery | Photo collection |

---

## 🎨 Step-by-Step: Configure Section Components

### Step 1: Create or Edit a Section
1. Go to `/admin/sections/create`
2. Enter section name (e.g., "Dining Options")
3. Click **"Create Section"**

### Step 2: Add Components to Section
After creating, you're taken to: `/admin/sections/[id]/add-components`

1. See **Available Component Templates** (8+ templates)
2. For each component, choose:
   - ☑️ **Include in Section** (checkbox)
   - **Display Label:** Name vendors see
   - **Required:** ☑️ Must vendors fill this?
   - **Repeatable:** Can they add multiple? (e.g., multiple menu items)
   - **Max Items:** Limit how many repeats

### Step 3: Example - "Dining" Section
Create a section for restaurants with:

**Component 1: Menu Items** (Repeatable)
- Label: "Menu Items"
- Required: ☑️
- Repeatable: ☑️
- Max Items: 20
- What vendors see: Text field for each menu item

**Component 2: Pricing** (Repeatable)
- Label: "Price Tiers"
- Required: ☑️
- Repeatable: ☑️
- Max Items: 5
- What vendors see: Price fields (appetizer, main, dessert)

**Component 3: Hours** (Single)
- Label: "Open Hours"
- Required: ☑️
- Repeatable: ☐
- What vendors see: Opening/closing times

### Step 4: Save Components
1. Configure all components
2. Click **"CONTINUE"** button
3. Components saved to section
4. Vendors now see these fields in their dashboard

---

## 🔗 How It All Works Together

### The Flow:

```
1. YOU (Admin) Use Website Builder (/jana/website)
   ↓
2. Add/Remove/Reorder sections on homepage
   ↓
3. Homepage displays: Hero → Services → Search → etc.
   ↓
4. Vendors visit their Dashboard
   ↓
5. See sections assigned to their business type (via Sections Manager)
   ↓
6. Within each section, see components (via Component Templates)
   ↓
7. Vendors fill in: Location, Hours, Team, Photos, etc.
   ↓
8. Data auto-displays on their mini-site AND homepage business cards
   ↓
9. Customers see structured, curated business information
```

---

## 📊 Practical Example: "Best Restaurants" Section on Homepage

### Goal: Create a homepage section showcasing top restaurants

### Step 1: Create Section (Sections Manager)
1. Go to `/jana/sections`
2. Click **"CREATE NEW SECTION"**
3. Name: "Dining Excellence"
4. Icon: fa-utensils
5. Description: "Top-rated dining experiences"
6. Save

### Step 2: Add Components (Component Templates)
1. Go to `/admin/sections/create`
2. Enter "Dining Excellence"
3. Add components:
   - ✓ Location (map)
   - ✓ Hours (time)
   - ✓ Team (repeatable - list chefs)
   - ✓ Testimonials (repeatable - reviews)
   - ✓ Gallery (images of dishes)
   - ✓ Pricing (repeatable - menu prices)
4. Save

### Step 3: Add to Homepage Layout
1. Go to `/jana/website`
2. Scroll to Component Palette
3. Find new component (if you created a data source)
4. Click **"+ ADD"**
5. Click **🚀 PUBLISH**

### Step 4: Vendors Fill In Data
- Restaurant owners see the 6 components
- They upload photos, write descriptions, list menu items
- Homepage auto-displays their data in the "Dining Excellence" section

---

## 🎛️ Advanced: Configure What Shows Where

### Show/Hide on Different Platforms

In Sections Manager, choose where each section displays:

| Setting | Means | Impact |
|---------|-------|--------|
| show_on_public | ☑️ | Appears on business cards |
| show_on_minisite | ☑️ | Appears on vendor's full page |
| show_on_card | ☑️ | Appears on homepage card preview |
| is_filterable | ☑️ | Can filter by this (e.g., "Vegan Options") |

### Example: Hidden "Admin Notes" Section
1. Create section: "Internal Notes"
2. Set:
   - show_on_public: ☐ (hidden)
   - show_on_minisite: ☐ (hidden)
   - vendor_editable: ☑️ (vendors can edit)
3. Only admins see it on the dashboard
4. Customers never see it

---

## 🚀 Workflow: Complete Homepage Redesign

### Scenario: You want to redesign the homepage

### Step 1: Plan Your Layout (5 min)
```
New Homepage Structure:
1. Hero Carousel - brand story
2. Quick Search - main discovery
3. Top Destinations - featured locations
4. Vendor Testimonials - social proof
5. Investment Opportunities - monetization
6. Blog - content/SEO
7. Partner CTA - vendor signup
```

### Step 2: Update Website Builder (10 min)
1. Go to `/jana/website`
2. Remove sections not in your plan
3. Add new sections
4. Reorder to match plan
5. Update colors/branding in Site Settings
6. Click **🚀 PUBLISH**
7. ✅ Homepage instantly updated!

### Step 3: Configure Each Section Manager (20 min)
1. Go to `/jana/sections`
2. For "Top Destinations":
   - Create section
   - Assign to location types
   - Configure components (name, description, photo)
3. Repeat for other new sections
4. ✅ Vendors can now fill in data

### Step 4: Test on Production
1. Visit http://localhost:3004
2. See new layout
3. Verify all sections display correctly
4. Check mobile responsiveness
5. ✅ Done!

---

## 📱 Mobile Responsiveness

All sections automatically responsive:
- ✅ Carousel adapts to screen size
- ✅ Search bar reformats for mobile
- ✅ Cards stack vertically on small screens
- ✅ Text sizes adjust automatically

Test on mobile:
1. Use browser DevTools (F12 → Device Mode)
2. Or visit on actual phone
3. All sections should look good

---

## 🎨 Customization Options

### For Each Section:

1. **Visibility:** Hide/show conditionally
2. **Reordering:** Move up/down
3. **Duplication:** Add same section twice
4. **Properties:** Configure carousel ID, search engine, etc.
5. **Styling:** (Can be added) Colors, fonts, spacing

### For Site Settings:

1. **Brand Colors:** Primary, background, nav
2. **Logo:** Upload custom logo
3. **Typography:** (Can be enhanced) Font family, sizes
4. **Carousel:** Autoplay, interval, indicators
5. **Watermark:** Show/hide

---

## 🔄 Common Edits & How to Do Them

### "Remove Storytelling from homepage"
1. Open `/jana/website`
2. Find "Storytelling" section
3. Click 🗑️ DELETE
4. Click 🚀 PUBLISH
5. ✅ Done (2 min)

### "Swap order of Services Hub and Search Bar"
1. Open `/jana/website`
2. Click ↓ DOWN on "Services Hub" (moves down 1 spot)
3. Now Search Bar is first
4. Click 🚀 PUBLISH
5. ✅ Done (1 min)

### "Change carousel to different images"
1. Open `/jana/website`
2. Click on Hero Carousel section
3. Note the carousel_id (usually "discovery")
4. Go to `/jana/hero-carousel?siteId=discovery`
5. Edit slides there
6. ✅ Homepage carousel updated (5 min)

### "Add new section to middle of homepage"
1. Open `/jana/website`
2. Find where you want it
3. Scroll to Palette, click "+ ADD" for component
4. Component appears at bottom
5. Move it up with ↑ arrow to correct position
6. Click 🚀 PUBLISH
7. ✅ Done (3 min)

### "Change brand color from gold to blue"
1. Open `/jana/website`
2. Scroll to "SITE SETTINGS"
3. Change "primary_color" from #D4AF37 to #0066FF
4. Click 🚀 PUBLISH
5. Refresh homepage
6. ✅ All gold accents now blue (2 min)

---

## 🆘 Troubleshooting

### Section not showing on homepage after adding
- Solution: Make sure you clicked **🚀 PUBLISH** button
- Refresh page with Ctrl+F5 (hard refresh)

### Sections show but vendors can't edit
- Go to `/jana/sections`
- Find the section
- Check: vendor_editable ☑️
- If unchecked, check it
- Save

### Component data not saving
- Check browser console (F12) for errors
- Try different component type
- Contact support if issue persists

### Homepage sections look different on mobile
- This is expected! Components are responsive
- Test on DevTools (F12 → Device Mode)
- Should look good on all sizes

### Changes not showing live
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Or just wait 30 seconds

---

## 📚 Quick Reference

| Task | URL | Time |
|------|-----|------|
| Edit homepage layout | `/jana/website` | 2-5 min |
| Manage sections | `/jana/sections` | 5-10 min |
| Create components | `/admin/sections/create` | 10-15 min |
| Upload carousel photos | `/jana/hero-carousel` | 2-3 min |
| Configure search | `/jana/search-engines` | 5 min |
| View live homepage | `/` | - |
| Manage businesses | `/jana/businesses` | 5-10 min |
| Manage blog | `/jana/blog` | 5-10 min |

---

## 🎓 Next Steps

1. **Start Small:** Edit homepage in `/jana/website` by removing 1 section
2. **Then Add:** Add a new component from the palette
3. **Then Organize:** Reorder sections using up/down arrows
4. **Then Enhance:** Go to `/jana/sections` and create a new section
5. **Then Configure:** Use `/admin/sections/create` to add components

Once you're comfortable, you can:
- Create custom sections for your business needs
- Build vendor onboarding workflows
- Design different pages with different layouts
- A/B test different homepage arrangements

---

## 💡 Pro Tips

✅ **Always click PUBLISH** after making changes
✅ **Backup before major changes** (screenshot current layout)
✅ **Test on mobile** after publishing
✅ **Use meaningful section names** (vendors see these)
✅ **Keep sections under 8** (homepage not too long)
✅ **Mark required fields** in components
✅ **Use repeatable components** for lists (team, testimonials)
✅ **Set max items** on repeatable components

---

## Summary

You now have a **powerful website building system** with three layers:

1. **Website Builder** - Visual layout design
2. **Sections Manager** - Content organization
3. **Component Templates** - Data structure

This allows you to:
- ✅ Edit homepage instantly
- ✅ Standardize vendor data entry
- ✅ Create reusable content patterns
- ✅ Scale to 100s of vendors
- ✅ Maintain consistent branding

**Ready to start? Go to `/jana/website` now!**

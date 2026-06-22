# 📋 Step-by-Step Checklists: Website Builder Tasks

## ✅ Task 1: Reorder Sections on Homepage (2 minutes)

**Goal:** Move Services Hub to appear BEFORE Hero Carousel

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website in browser
- [ ] Step 2: Make sure you're logged in as admin
- [ ] Step 3: Verify "PAGES" tab is selected (top left)
- [ ] Step 4: Verify "main" page is selected in the dropdown
- [ ] Step 5: Scroll down to see sections in Body zone (green area)
- [ ] Step 6: Find "Hero Carousel" section (should be at top)
- [ ] Step 7: Find "Services Hub" section (should be 2nd)
- [ ] Step 8: Click the **↑ UP** arrow next to "Services Hub" TWICE
- [ ] Step 9: Services Hub should now be above Hero Carousel
- [ ] Step 10: Scroll down and click **🚀 PUBLISH** button (big green)
- [ ] Step 11: Wait for "✅ MAIN published!" notification
- [ ] Step 12: Open http://localhost:3004 in new tab
- [ ] Step 13: Refresh the page (F5)
- [ ] Step 14: Verify Services Hub is now first section!

✅ **Done!** Homepage layout changed.

---

## ✅ Task 2: Remove a Section from Homepage (2 minutes)

**Goal:** Remove "Storytelling" section from homepage

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Make sure "main" page selected
- [ ] Step 4: Scroll to Body zone (green area)
- [ ] Step 5: Find "Storytelling" section (📖 icon)
- [ ] Step 6: Click **🗑️ DELETE** button next to it
- [ ] Step 7: Confirmation dialog appears - click **"Yes, remove"**
- [ ] Step 8: Section disappears from list
- [ ] Step 9: Scroll down and click **🚀 PUBLISH** button
- [ ] Step 10: Wait for success message
- [ ] Step 11: Go to homepage (http://localhost:3004)
- [ ] Step 12: Refresh page (F5)
- [ ] Step 13: Scroll down - Storytelling section is gone!

✅ **Done!** Section removed.

---

## ✅ Task 3: Add a New Section to Homepage (3 minutes)

**Goal:** Add "Blog / Articles" section to homepage

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Make sure "main" page selected
- [ ] Step 4: Scroll down past all current sections
- [ ] Step 5: Look for **"COMPONENT PALETTE"** section header
- [ ] Step 6: See "Body zone" subsection (green colored)
- [ ] Step 7: Find **"Blog / Articles"** component (📰 icon)
- [ ] Step 8: Click **"+ ADD"** button next to it
- [ ] Step 9: Notification: "✅ Blog / Articles added"
- [ ] Step 10: Blog component now appears in Body zone (at bottom)
- [ ] Step 11: Want to move it? Click **↑ UP** arrow multiple times
- [ ] Step 12: Position it where you want (e.g., before Partner CTA)
- [ ] Step 13: Scroll down and click **🚀 PUBLISH** button
- [ ] Step 14: Wait for success notification
- [ ] Step 15: Go to homepage and refresh (F5)
- [ ] Step 16: Scroll down - Blog section now appears!

✅ **Done!** New section added.

---

## ✅ Task 4: Change Homepage Brand Color (2 minutes)

**Goal:** Change primary gold color (#D4AF37) to bright blue (#0066FF)

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Make sure "main" page selected
- [ ] Step 4: Scroll ALL the way down to bottom
- [ ] Step 5: Find **"SITE SETTINGS"** section (gray background)
- [ ] Step 6: Look for field **"primary_color"** with value **"#D4AF37"**
- [ ] Step 7: Click in the field
- [ ] Step 8: Select all text (Ctrl+A)
- [ ] Step 9: Type new color: `#0066FF` (bright blue)
- [ ] Step 10: Press Tab or click elsewhere
- [ ] Step 11: Scroll down and click **🚀 PUBLISH** button
- [ ] Step 12: Wait for "✅ MAIN published!" notification
- [ ] Step 13: Go to homepage
- [ ] Step 14: Hard refresh page (Ctrl+F5 or Cmd+Shift+R on Mac)
- [ ] Step 15: Look at accent colors - should now be blue instead of gold!
- [ ] Step 16: Check: Hero carousel borders, buttons, highlights

✅ **Done!** Colors changed site-wide.

---

## ✅ Task 5: Toggle Carousel Auto-Play (1 minute)

**Goal:** Turn OFF carousel auto-play (so slides don't advance automatically)

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Make sure "main" page selected
- [ ] Step 4: Scroll to bottom to **"SITE SETTINGS"** section
- [ ] Step 5: Find field **"carousel_autoplay"** (should show: `true`)
- [ ] Step 6: Click in the field
- [ ] Step 7: Change `true` to `false`
- [ ] Step 8: Scroll down and click **🚀 PUBLISH** button
- [ ] Step 9: Go to homepage
- [ ] Step 10: Look at Hero Carousel at top
- [ ] Step 11: Verify carousel slides DO NOT auto-advance
- [ ] Step 12: Manually click arrows to change slides

✅ **Done!** Carousel auto-play disabled.

**To turn auto-play back on:** Change `false` to `true` and publish again.

---

## ✅ Task 6: Adjust Carousel Speed (2 minutes)

**Goal:** Change carousel interval from 8 seconds to 5 seconds (faster)

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Scroll to bottom to **"SITE SETTINGS"** section
- [ ] Step 4: Find field **"carousel_interval"** (shows: `8000`)
- [ ] Step 5: Click in field
- [ ] Step 6: Select all (Ctrl+A)
- [ ] Step 7: Type `5000` (5000 milliseconds = 5 seconds)
- [ ] Step 8: Click **🚀 PUBLISH** button
- [ ] Step 9: Go to homepage
- [ ] Step 10: Hard refresh (Ctrl+F5)
- [ ] Step 11: Watch carousel - slides advance every 5 seconds now (faster!)

✅ **Done!** Carousel speed adjusted.

**Timing reference:**
- 3000 = 3 seconds (very fast)
- 5000 = 5 seconds (fast)
- 8000 = 8 seconds (default/comfortable)
- 10000 = 10 seconds (slow)
- 15000 = 15 seconds (very slow)

---

## ✅ Task 7: Create a New Section (5 minutes)

**Goal:** Create a new content section called "Wellness Tips"

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/sections
- [ ] Step 2: Login as admin
- [ ] Step 3: Look at left panel - see list of sections
- [ ] Step 4: Scroll down to find **"CREATE NEW SECTION"** button
- [ ] Step 5: Click the button
- [ ] Step 6: A form appears with fields to fill
- [ ] Step 7: **Field 1 - Section Name:** Type `Wellness Tips`
- [ ] Step 8: **Field 2 - Icon:** Type `fa-leaf` (FontAwesome icon name)
- [ ] Step 9: **Field 3 - Description:** Type `Health and wellness guidance`
- [ ] Step 10: **Field 4 - Vendor Editable:** Check the ☑️ box (vendors can edit)
- [ ] Step 11: **Field 5 - Show on Public:** Check the ☑️ box (visible on business card)
- [ ] Step 12: **Field 6 - Show on Mini-site:** Check the ☑️ box (visible on vendor page)
- [ ] Step 13: Look for other options you may want:
  - [ ] **is_filterable:** Check ☑️ if customers should filter by this
  - [ ] **show_on_card:** Check ☑️ to show preview on homepage card
- [ ] Step 14: Find **"CREATE SECTION"** button (green)
- [ ] Step 15: Click it
- [ ] Step 16: Page refreshes - new section created!
- [ ] Step 17: Verify "Wellness Tips" now appears in section list on left

✅ **Done!** New section created.

---

## ✅ Task 8: Assign Sections to Business Type (5 minutes)

**Goal:** Make sure all Spas must fill in "Wellness Tips" section

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/sections
- [ ] Step 2: Login as admin
- [ ] Step 3: Look at left panel with business types
- [ ] Step 4: Find and click on **"Spa"** (or similar wellness business type)
- [ ] Step 5: Right side shows "Assigned Sections" for Spas
- [ ] Step 6: Look for **"Available Sections"** section
- [ ] Step 7: Find **"Wellness Tips"** (the one we just created)
- [ ] Step 8: Click the **"ADD"** button next to it
- [ ] Step 9: Section appears in "Assigned Sections" area
- [ ] Step 10: Look for **"SAVE SECTIONS"** button
- [ ] Step 11: Click it
- [ ] Step 12: Success message appears
- [ ] Step 13: Now all Spas will see "Wellness Tips" in their dashboard

✅ **Done!** Section assigned to business type.

---

## ✅ Task 9: Add Components to a Section (10 minutes)

**Goal:** Add data entry fields to "Wellness Tips" section

**Steps:**
- [ ] Step 1: Open http://localhost:3004/admin/sections/create
- [ ] Step 2: Login as admin
- [ ] Step 3: Look for section name field at top
- [ ] Step 4: Type: `Wellness Tips` (the section you created)
- [ ] Step 5: Click **"Load Section"** or press Enter
- [ ] Step 6: Page loads showing available component templates
- [ ] Step 7: You see 8+ component types available:
  - [ ] Location (map with address)
  - [ ] Hours (time ranges)
  - [ ] Team (list of staff)
  - [ ] Testimonials (customer reviews)
  - [ ] FAQ (questions & answers)
  - [ ] Features (checklist of amenities)
  - [ ] Pricing (price tiers)
  - [ ] Gallery (photo collection)
- [ ] Step 8: For each component, decide: Include? Required? Repeatable?
- [ ] Step 9: Example - Add "Hours" component:
  - [ ] ☑️ Check the "Include" box
  - [ ] Label: "Wellness Retreat Hours"
  - [ ] Required: ☑️ Check (vendors must fill it)
  - [ ] Repeatable: ☐ Uncheck (only one hours entry)
- [ ] Step 10: Example - Add "Team" component:
  - [ ] ☑️ Check the "Include" box
  - [ ] Label: "Wellness Therapists"
  - [ ] Required: ☑️ Check
  - [ ] Repeatable: ☑️ Check (can add multiple therapists)
  - [ ] Max Items: `10` (limit to 10 therapists)
- [ ] Step 11: Example - Add "Gallery" component:
  - [ ] ☑️ Check the "Include" box
  - [ ] Label: "Facility Photos"
  - [ ] Required: ☐ Uncheck (optional)
  - [ ] Repeatable: ☑️ Check
  - [ ] Max Items: `20` (up to 20 photos)
- [ ] Step 12: Scroll down and find **"SAVE COMPONENTS"** or **"CONTINUE"** button
- [ ] Step 13: Click it
- [ ] Step 14: Confirmation page appears
- [ ] Step 15: Success! Components saved to section

✅ **Done!** Components added to section.

---

## ✅ Task 10: Full Homepage Redesign (20 minutes)

**Goal:** Redesign homepage with new layout: Hero → Search → Blog → Services → CTA

**Current Layout:**
```
1. Hero Carousel
2. Services Hub
3. Experience Categories
4. Search Engine
5. Journey Planner
6. Interactive Map
7. Local Products
8. Storytelling
9. Partner CTA
```

**Desired Layout:**
```
1. Hero Carousel
2. Search Engine (Full)
3. Blog / Articles
4. Services Hub
5. Partner CTA
```

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Make sure "main" page selected
- [ ] Step 4: **REMOVE:** Find "Experience Categories" → Click 🗑️ → Confirm
- [ ] Step 5: **REMOVE:** Find "Journey Planner" → Click 🗑️ → Confirm
- [ ] Step 6: **REMOVE:** Find "Interactive Map" → Click 🗑️ → Confirm
- [ ] Step 7: **REMOVE:** Find "Local Products" → Click 🗑️ → Confirm
- [ ] Step 8: **REMOVE:** Find "Storytelling" → Click 🗑️ → Confirm
- [ ] Step 9: Now you have:
  - [ ] Hero Carousel
  - [ ] Services Hub
  - [ ] Search Engine (Full)
  - [ ] Partner CTA
- [ ] Step 10: **REORDER:** Search Engine should be 2nd
  - [ ] Click ↑ on "Search Engine" → Move up twice
- [ ] Step 11: Now you have:
  - [ ] Hero Carousel
  - [ ] Search Engine (Full) ✓
  - [ ] Services Hub
  - [ ] Partner CTA
- [ ] Step 12: **ADD:** Blog component
  - [ ] Scroll to COMPONENT PALETTE (Body zone)
  - [ ] Find "Blog / Articles" (📰)
  - [ ] Click "+ ADD"
- [ ] Step 13: **REORDER:** Blog should be 3rd
  - [ ] Click ↑ on "Blog / Articles"
  - [ ] Move it up two positions
- [ ] Step 14: Final layout verification:
  - [ ] 1st: Hero Carousel ✓
  - [ ] 2nd: Search Engine (Full) ✓
  - [ ] 3rd: Blog / Articles ✓
  - [ ] 4th: Services Hub ✓
  - [ ] 5th: Partner CTA ✓
- [ ] Step 15: Scroll down to **SITE SETTINGS** (optional: update colors)
- [ ] Step 16: Scroll down and click **🚀 PUBLISH** button
- [ ] Step 17: Wait for "✅ MAIN published!" notification
- [ ] Step 18: Open http://localhost:3004 in new tab
- [ ] Step 19: Hard refresh (Ctrl+F5)
- [ ] Step 20: Scroll through homepage - verify new layout!

✅ **Done!** Complete homepage redesign published.

---

## ✅ Task 11: Upload Hero Carousel Images (5 minutes)

**Goal:** Upload new photos to the hero carousel

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/hero-carousel
- [ ] Step 2: Login as admin
- [ ] Step 3: See the carousel manager interface
- [ ] Step 4: Find **"UPLOAD SLIDES"** or **"ADD NEW SLIDE"** button
- [ ] Step 5: Click it
- [ ] Step 6: File picker opens
- [ ] Step 7: Select image from your computer (JPG, PNG, WebP)
- [ ] Step 8: Image appears as new slide
- [ ] Step 9: Fill in slide details:
  - [ ] **Title:** "Discover Siwa's Magic"
  - [ ] **Subtitle:** "An oasis adventure"
  - [ ] **Caption:** "Experience ancient heritage"
  - [ ] **CTA Text:** "Explore Now"
  - [ ] **CTA Link:** "/search" (or any link)
- [ ] Step 10: Adjust display settings (optional):
  - [ ] Image Fit: "cover" (fills screen)
  - [ ] Image Position: "center"
  - [ ] Overlay Opacity: "0.3" (30% dark overlay)
  - [ ] Animation: "fade" (sliding effect)
- [ ] Step 11: Click **"SAVE SLIDE"** button
- [ ] Step 12: Slide added to carousel
- [ ] Step 13: Repeat for more images (up to 10 slides recommended)
- [ ] Step 14: Click **"PUBLISH CAROUSEL"** button
- [ ] Step 15: Go to homepage
- [ ] Step 16: See new carousel slides!

✅ **Done!** Carousel images updated.

---

## ✅ Task 12: Create New Business Page (5 minutes)

**Goal:** Create a new page (not main) for a specific market/category

**Steps:**
- [ ] Step 1: Open http://localhost:3004/jana/website
- [ ] Step 2: Login as admin
- [ ] Step 3: Look at top - see "main" page selected
- [ ] Step 4: Find **"+ NEW PAGE"** button (next to page dropdown)
- [ ] Step 5: Click it
- [ ] Step 6: Dialog appears asking for page name
- [ ] Step 7: Type page name: `womens-wellness`
- [ ] Step 8: Click **"CREATE PAGE"** button
- [ ] Step 9: New page created with blank layout
- [ ] Step 10: Add sections you want on this page:
  - [ ] Click "+ ADD" for components in palette
  - [ ] Example: Hero Carousel, Blog, Services Hub, CTA
- [ ] Step 11: Reorder sections as desired (use ↑↓ arrows)
- [ ] Step 12: Click **🚀 PUBLISH** button
- [ ] Step 13: New page is live!
- [ ] Step 14: Access it at: http://localhost:3004/p/womens-wellness

✅ **Done!** New page created.

---

## 📋 Troubleshooting Checklist

**Changes not showing on homepage?**
- [ ] Did I click 🚀 PUBLISH? (required!)
- [ ] Did I hard refresh the page? (Ctrl+F5)
- [ ] Wait 10 seconds, then refresh again

**Component not appearing?**
- [ ] Is the component actually in a zone?
- [ ] Is the component configured properly?
- [ ] Try removing and re-adding it
- [ ] Check browser console for errors (F12)

**Colors look different?**
- [ ] Hard refresh page (Ctrl+F5)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Check your color code is valid hex (#XXXXXX)

**Section moved to wrong place?**
- [ ] Use ↑↓ arrows to move it back up/down
- [ ] Publish again
- [ ] Hard refresh

**Can't click PUBLISH button?**
- [ ] Check all required fields are filled
- [ ] Try scrolling to ensure button is visible
- [ ] Try refreshing page and starting again

---

## ⏰ Time Tracking

| Task | Est. Time | Actual Time |
|------|-----------|-------------|
| Task 1: Reorder sections | 2 min | ___ |
| Task 2: Remove section | 2 min | ___ |
| Task 3: Add section | 3 min | ___ |
| Task 4: Change color | 2 min | ___ |
| Task 5: Toggle autoplay | 1 min | ___ |
| Task 6: Adjust speed | 2 min | ___ |
| Task 7: Create section | 5 min | ___ |
| Task 8: Assign sections | 5 min | ___ |
| Task 9: Add components | 10 min | ___ |
| Task 10: Full redesign | 20 min | ___ |
| Task 11: Upload images | 5 min | ___ |
| Task 12: New page | 5 min | ___ |

---

## 🎯 Practice Sequence

**If you're new to the builder, do tasks in this order:**

1. ✅ Task 1: Reorder sections (easiest, instant gratification)
2. ✅ Task 2: Remove a section (builds confidence)
3. ✅ Task 4: Change a color (visual feedback)
4. ✅ Task 5: Toggle autoplay (quick win)
5. ✅ Task 3: Add a new section (reverse of remove)
6. ✅ Task 11: Upload carousel images (practical)
7. ✅ Task 7: Create new section (intermediate)
8. ✅ Task 8: Assign sections (builds model understanding)
9. ✅ Task 9: Add components (advanced)
10. ✅ Task 12: Create new page (advanced)
11. ✅ Task 10: Full homepage redesign (capstone project)

---

## 🎓 Certification Checklist

**After completing all 12 tasks, you can:**

- [ ] Edit homepage layout confidently
- [ ] Understand 3-layer system (Builder → Sections → Components)
- [ ] Create custom sections
- [ ] Assign sections to business types
- [ ] Configure component data fields
- [ ] Publish changes without errors
- [ ] Troubleshoot common issues
- [ ] Train vendors on their dashboards

✅ **You're ready to manage your entire platform!**

---

## 📞 Get Help

**For detailed explanations:** Read `HOMEPAGE_BUILDER_COMPLETE_GUIDE.md`
**For quick reference:** Read `BUILDER_QUICK_REFERENCE.md`
**For more tasks:** Check repository documentation
**For custom features:** Contact development team

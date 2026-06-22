# 🔧 Technical Reference: Data Flow & Database Schema

## Overview: How Data Flows Through the System

```
YOU (Admin)
    ↓
Website Builder (/jana/website)
    ↓ Saves to ↓
website_configs table (JSON)
    ↓ Renders as ↓
DynamicHomepageRenderer
    ↓ Displays as ↓
Customer Homepage (/）
    ↓
VENDORS (Content creators)
    ↓
Vendor Dashboard
    ↓ Fill in ↓
sections_component_data table
    ↓ Gets rendered on ↓
Business Card / Mini-site
    ↓
CUSTOMERS see final result
```

---

## 📊 Database Schema

### Table 1: website_configs
**Purpose:** Store homepage and page layouts

```sql
CREATE TABLE website_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(255),           -- "website_main" or "website_search_products", etc
  config JSON,                 -- Contains page layout
  created_at TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Example Record:**
```json
{
  "type": "website_main",
  "config": {
    "header_components": [
      {
        "id": "h1",
        "type": "search_bar",
        "name": "Search (Compact)",
        "zone": "header",
        "props": { "title": "Search (Compact)" }
      }
    ],
    "body_components": [
      {
        "id": "h1",
        "type": "hero_carousel",
        "name": "Hero Carousel",
        "zone": "body",
        "props": { 
          "carousel_id": "discovery",
          "title": "Hero Carousel"
        }
      },
      {
        "id": "h2",
        "type": "services_hub",
        "name": "Services Hub",
        "zone": "body",
        "props": { "title": "Services Hub" }
      }
    ],
    "footer_components": [],
    "site_settings": {
      "site_name": "Siwa Today",
      "primary_color": "#D4AF37",
      "carousel_autoplay": true,
      "carousel_interval": 8000,
      "nav_bg_color": "#556B2F",
      "bg_color": "#0f172a"
    }
  }
}
```

### Table 2: sections
**Purpose:** Store section definitions for business types

```sql
CREATE TABLE sections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),                    -- "Location & Hours"
  icon VARCHAR(50),                     -- "fa-map-marker"
  description TEXT,
  required BOOLEAN,
  vendor_editable BOOLEAN,              -- Can vendors edit?
  show_on_public BOOLEAN,               -- Show on business card?
  show_on_minisite BOOLEAN,             -- Show on vendor page?
  is_filterable BOOLEAN,                -- Can customers filter by?
  show_on_card BOOLEAN,                 -- Show in card preview?
  is_universal BOOLEAN,                 -- Available to all types?
  section_type VARCHAR(100),            -- Type identifier
  sort_order INT,
  active BOOLEAN,
  propagation_hero BOOLEAN,             -- Show in carousel?
  propagation_blog BOOLEAN,             -- Show in blog?
  propagation_card BOOLEAN,             -- Show on card?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Record:**
```sql
INSERT INTO sections VALUES (
  NULL,
  'Location & Hours',           -- name
  'fa-map-marker',              -- icon
  'Business address and hours', -- description
  TRUE,                         -- required
  TRUE,                         -- vendor_editable
  TRUE,                         -- show_on_public
  TRUE,                         -- show_on_minisite
  TRUE,                         -- is_filterable
  TRUE,                         -- show_on_card
  FALSE,                        -- is_universal
  'location',                   -- section_type
  1,                            -- sort_order
  TRUE,                         -- active
  FALSE,                        -- propagation_hero
  FALSE,                        -- propagation_blog
  FALSE,                        -- propagation_card
  NOW(),
  NOW()
);
```

### Table 3: section_components
**Purpose:** Define components available to sections

```sql
CREATE TABLE section_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  section_id INT,
  component_type VARCHAR(100),          -- "text", "image", "map", "repeatable"
  label VARCHAR(255),                   -- "Address"
  is_required BOOLEAN,
  is_repeatable BOOLEAN,                -- Can vendors add multiple?
  max_items INT,                        -- Max if repeatable
  config JSON,                          -- Additional options
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id)
);
```

**Example Record:**
```sql
INSERT INTO section_components VALUES (
  NULL,
  1,                            -- section_id (Location section)
  'text',                       -- component_type
  'Address',                    -- label
  TRUE,                         -- is_required
  FALSE,                        -- is_repeatable
  NULL,                         -- max_items (not applicable)
  '{"placeholder": "Street address"}',
  NOW(),
  NOW()
);
```

### Table 4: section_component_data
**Purpose:** Store vendor-submitted data

```sql
CREATE TABLE section_component_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT,
  section_component_id INT,
  data JSON,                    -- Actual vendor data
  status VARCHAR(50),           -- "draft", "submitted", "approved"
  display_order INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (section_component_id) REFERENCES section_components(id)
);
```

**Example Record:**
```sql
INSERT INTO section_component_data VALUES (
  NULL,
  42,                           -- business_id (vendor's business)
  5,                            -- section_component_id (Address field)
  '{"value": "123 Nile Street, Siwa Oasis"}',
  'approved',
  1,
  NOW(),
  NOW()
);
```

### Table 5: business_types
**Purpose:** Define business categories and assign sections

```sql
CREATE TABLE business_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),            -- "Hotel", "Restaurant"
  icon VARCHAR(50),
  sections JSON,                -- Array of section IDs
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Record:**
```sql
INSERT INTO business_types VALUES (
  NULL,
  'Hotel',
  'fa-building',
  '[1, 3, 4, 7, 9]',           -- section IDs
  NOW(),
  NOW()
);
```

---

## 🔄 Data Flow Example

### Scenario: Display a hotel's info on homepage

**Step 1: Admin edits homepage**
```
Admin opens /jana/website
Adds "Services Hub" section
Publishes changes
↓ SAVES TO:
website_configs table
  type: "website_main"
  config.body_components[1]: {
    type: "services_hub",
    props: {}
  }
```

**Step 2: System queries business_types**
```
Query: SELECT * FROM business_types WHERE name = 'Hotel'
Result:
{
  id: 1,
  name: "Hotel",
  sections: [1, 3, 4, 7, 9]
}
```

**Step 3: System queries sections for Hotel**
```
Query: SELECT * FROM sections WHERE id IN (1, 3, 4, 7, 9)
Result:
[
  { id: 1, name: "Location & Hours", ... },
  { id: 3, name: "Rooms & Pricing", ... },
  { id: 4, name: "Amenities", ... },
  { id: 7, name: "Photos", ... },
  { id: 9, name: "Reviews", ... }
]
```

**Step 4: Vendor fills in data**
```
Hotel owner logs in
Sees 5 sections to fill
Fills in:
- Location: "123 Nile St"
- Rooms: 20 rooms, $50-150/night
- Amenities: Pool, WiFi, Restaurant
- Photos: Uploads 15 images
- Reviews: Shows 8 guest reviews
↓ SAVES TO:
section_component_data table
  Multiple rows, one per field
```

**Step 5: Homepage renders**
```
GET /
↓ Executes:
DynamicHomepageRenderer.tsx
↓ Loads page config:
website_configs WHERE type='website_main'
↓ For Services Hub component:
1. Query all Hotels (from businesses table)
2. For each Hotel, query section_component_data
3. Map to card display component
4. Render beautifully on homepage
↓ OUTPUT:
Customer sees:
┌────────────────────┐
│   Hotel Card       │
│ ┌────────────────┐ │
│ │ Pool image     │ │
│ ├────────────────┤ │
│ │ Name: My Hotel │ │
│ │ ⭐⭐⭐⭐⭐ (5 stars) │
│ │ $50-150/night  │ │
│ │ 20 rooms       │ │
│ │ WiFi • Pool    │ │
│ └────────────────┘ │
│ [Learn More →]     │
└────────────────────┘
```

---

## 📝 API Endpoints & Their Purpose

### Page Builder APIs

**GET /api/jana/website/list**
- Returns: List of all pages
- Used by: Page dropdown in builder
- Response: `[{slug: "main", saved: true, type: "page"}, ...]`

**GET /api/jana/website?id=website_main**
- Returns: Layout for a specific page
- Used by: Initial page load in builder
- Response: Page config JSON with components

**PUT /api/jana/website**
- Saves: Page layout changes
- Used by: PUBLISH button
- Body: `{id, header_components, body_components, footer_components, site_settings}`

### Sections APIs

**GET /api/jana/sections?typeId=1**
- Returns: Sections for a business type
- Used by: Vendor dashboard
- Response: Array of sections vendor must fill

**POST /api/jana/sections**
- Creates: New section
- Used by: Create section button
- Body: `{name, icon, description, ...}`

**GET /api/vendor/sections/[sectionId]/components**
- Returns: Components in a section
- Used by: Vendor form builder
- Response: Array of component definitions

**POST /api/vendor/sections/[sectionId]/component-data**
- Saves: Vendor-submitted component data
- Used by: Vendor save button
- Body: Array of component data instances

### Homepage Rendering APIs

**GET /api/jana/hero-carousel-dynamic?isDynamic=true**
- Returns: Dynamic carousel slides
- Used by: Hero carousel on homepage
- Can pull from multiple data sources

**GET /api/jana/businesses**
- Returns: All businesses for Services Hub
- Used by: Services Hub component
- Response: Business list with section data included

---

## 🎨 Component Rendering Path

```
Page Builder (/jana/website)
    ↓ SAVES
website_configs (JSON)
    ↓ QUERIED BY
DynamicHomepageRenderer.tsx
    ↓ SWITCH STATEMENT ON component.type
    ├─ hero_carousel → AdvancedHeroCarousel.tsx
    ├─ services_hub → ServiceHub.tsx
    ├─ search_bar → SearchEngine.tsx
    ├─ blog → BlogFeed.tsx
    └─ ...14 more component types...
    ↓ EACH COMPONENT
    ├─ Queries: section_component_data
    ├─ Queries: businesses table
    ├─ Queries: sections table
    └─ Renders: Beautiful React JSX
    ↓ OUTPUT
Customer sees: Full homepage
```

---

## 🔐 Security & Permissions

### Who Can Access What?

```
ADMIN (/jana/website):
✅ Edit all pages
✅ Reorder sections
✅ Add/remove components
✅ Change site settings
✅ Publish instantly

ADMIN (/jana/sections):
✅ Create sections
✅ Assign to business types
✅ Configure required fields
✅ View vendor data

VENDOR (Dashboard):
✅ See sections assigned to their type
✅ Fill in required fields
✅ Upload media
✅ Save drafts
❌ Edit other vendors' data
❌ Change site layout
❌ See other vendor data

CUSTOMER (Homepage):
✅ View published layout
✅ Search / browse
✅ Read business info
✅ Book / engage
❌ Edit anything
❌ See private/draft data
```

---

## 📈 Data Volume Expectations

```
Scale Scenario 1: Small (10 vendors, 5 business types)
├─ website_configs rows: 2 (main + search pages)
├─ sections rows: 10
├─ section_components rows: 50
├─ section_component_data rows: 500
├─ businesses rows: 10
└─ Query time: <10ms

Scale Scenario 2: Medium (100 vendors, 20 business types)
├─ website_configs rows: 5
├─ sections rows: 50
├─ section_components rows: 300
├─ section_component_data rows: 5,000
├─ businesses rows: 100
└─ Query time: 20-50ms (with indexes)

Scale Scenario 3: Large (1000+ vendors, 50+ business types)
├─ Requires: Proper database indexing
├─ Recommended: Caching layer (Redis)
├─ Query time: 50-200ms
└─ Homepage: Fully functional
```

---

## 🏗️ Architecture Layers

### Layer 1: UI Layer (React)
```
Website Builder Page
├─ State: slots[], activeZone, siteSettings
├─ Components: Palette, Zone View, Property Editor
├─ Actions: Add, Remove, Reorder, Save
└─ Calls: PUT /api/jana/website
```

### Layer 2: API Layer (Next.js)
```
Route Handlers
├─ GET /api/jana/website → Query + return JSON
├─ PUT /api/jana/website → Validate + save + return JSON
├─ GET /api/jana/sections → Query business type
└─ POST /api/vendor/sections/[id]/component-data → Save vendor data
```

### Layer 3: Data Layer (MySQL)
```
Database Tables
├─ website_configs (page layouts)
├─ sections (content categories)
├─ section_components (data fields)
├─ section_component_data (vendor data)
└─ business_types (category assignments)
```

### Layer 4: Rendering Layer (React)
```
DynamicHomepageRenderer
├─ Query: website_configs
├─ For each component type:
│  ├─ Query: relevant data
│  ├─ Transform: to display format
│  └─ Render: specific component
└─ Output: Full homepage HTML
```

---

## 🔍 Debugging Guide

### Issue: Section not showing on homepage

**Debug Steps:**
1. Check website_configs table
   ```sql
   SELECT config FROM website_configs 
   WHERE type = 'website_main'
   ```
   - Look for your section in body_components array

2. Check browser console (F12)
   - Any JS errors?
   - Check Network tab for API calls

3. Verify component type matches renderer
   - In DynamicHomepageRenderer.tsx
   - Must have matching case statement

### Issue: Vendor can't see section

**Debug Steps:**
1. Check business_types table
   ```sql
   SELECT sections FROM business_types 
   WHERE name = 'Hotel'
   ```
   - Section ID must be in JSON array

2. Check sections table
   ```sql
   SELECT * FROM sections WHERE id = 1
   ```
   - vendor_editable must be TRUE
   - active must be TRUE

3. Check vendor dashboard query
   - Passing correct business_type_id?

### Issue: Component data not saving

**Debug Steps:**
1. Check API logs for errors
2. Verify section_component_data insert
   ```sql
   SELECT * FROM section_component_data 
   WHERE business_id = ? 
   ORDER BY created_at DESC
   LIMIT 5
   ```

3. Check browser Network tab
   - POST request succeeding?
   - Response: success or error?

---

## 📊 Query Performance Tips

### Indexes to Add
```sql
CREATE INDEX idx_website_type ON website_configs(type);
CREATE INDEX idx_section_type ON sections(section_type);
CREATE INDEX idx_business_type ON businesses(type_id);
CREATE INDEX idx_component_data ON section_component_data(business_id);
```

### Query Optimization
```javascript
// ❌ Slow: N+1 queries
for (let business of businesses) {
  let data = await queryComponentData(business.id);
}

// ✅ Fast: Single query with join
let data = await queryAllComponentData(businessIds);
```

### Caching Strategy
```javascript
// Cache homepage config (rarely changes)
const config = await cache(
  () => getPageConfig('website_main'),
  { ttl: 300 } // 5 minutes
);

// Cache section structure (medium frequency)
const sections = await cache(
  () => getSections(businessType),
  { ttl: 60 } // 1 minute
);

// Don't cache vendor data (real-time)
const vendorData = await getComponentData(businessId);
// No caching - always fresh
```

---

## 🎯 Common Modifications

### Add a New Component Type

1. Add to PALETTE in website builder
2. Add case in DynamicHomepageRenderer
3. Create component file
4. Test rendering

### Add a New Section

1. Create in /jana/sections
2. Add components in /admin/sections/create
3. Assign to business types
4. Test in vendor dashboard

### Change Component Properties

1. Update section_components config JSON
2. Update component rendering logic
3. Update vendor form
4. Test end-to-end

---

## 🚀 Performance Checklist

- [ ] Database indexes created
- [ ] API response times < 200ms
- [ ] Homepage loads < 2 seconds
- [ ] Caching strategy implemented
- [ ] Browser DevTools shows no 404s
- [ ] Database growth monitored
- [ ] Query plans reviewed
- [ ] Heavy components lazy-loaded

---

## 📚 Related Files

- `src/app/jana/website/page.tsx` - Page builder UI
- `src/app/api/jana/website/route.ts` - Page builder API
- `src/components/DynamicHomepageRenderer.tsx` - Rendering engine
- `src/app/jana/sections/page.tsx` - Sections manager UI
- `src/app/api/jana/sections/route.ts` - Sections API
- `src/lib/jana/page-builder-types.ts` - TypeScript types

---

## Summary

The system is built in **4 interconnected layers**:

1. **UI Layer** - Website builder where admins make changes
2. **API Layer** - Next.js endpoints that handle requests
3. **Data Layer** - MySQL tables storing everything
4. **Rendering Layer** - React components displaying to customers

Understanding this flow helps you:
- ✅ Debug issues
- ✅ Add new features
- ✅ Optimize performance
- ✅ Train your team
- ✅ Scale the platform

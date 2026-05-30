# SIWA OASIS Codebase Analysis - Comprehensive Summary

## Executive Overview

The SIWA OASIS platform is a sophisticated Next.js-based marketplace with an advanced CMS and page management system. It features multiple admin interfaces for controlling homepage content, components, carousels, search configurations, and business data.

---

## 1. EXISTING ADMIN TOOLS & INTERFACES

### Primary Admin Dashboard
**Location:** `/jana` (Admin Hub)
**Files:** 
- [src/app/jana/page.tsx](src/app/jana/page.tsx) - Main dashboard
- [src/app/jana/layout.tsx](src/app/jana/layout.tsx) - Admin layout wrapper

**Features:**
- Role-based access control (super_admin, content_admin, sales_manager, support_agent)
- Navigation to all admin tools
- Context-based admin notifications
- Mobile-responsive dashboard

### 1.1 Website Builder / Multi-Page Site Designer
**Location:** `/jana/website`
**File:** [src/app/jana/website/page.tsx](src/app/jana/website/page.tsx)
**Type:** Advanced drag-and-drop page builder

**Capabilities:**
- Create/edit multiple pages (pages mode) or templates (templates mode)
- Drag-and-drop component management
- Three zones: header, body, footer
- Real-time configuration UI
- Site-wide settings (logo, tagline, colors, carousel autoplay)
- Save/publish functionality

**Components Manageable:**
- Hero Carousel
- Services Hub
- Experience Categories
- Search Bar
- Journey Planner
- Ecosystem Map
- Local Products
- Storytelling Section
- Partner CTA
- Blog Components
- Custom Components

**Default Homepage Layout:**
```
Header:
  - hero_carousel (discovery)
  - experience_categories
  - search_bar

Body:
  - services_hub
  - smart_journey_planner
  - ecosystem_map
  - local_products
  - storytelling_section
  - partner_cta

Footer:
  - custom_footer_components
```

### 1.2 Hero Carousel Manager
**Location:** `/jana/hero-carousel`
**Files:**
- [src/app/jana/hero-carousel/page.tsx](src/app/jana/hero-carousel/page.tsx) - Admin interface
- [src/app/api/jana/hero-carousel/route.ts](src/app/api/jana/hero-carousel/route.ts) - API

**Capabilities:**
- View all carousel slides with thumbnails
- Create new slides
- Edit existing slides
- Delete slides with confirmation
- Reorder slides (drag-and-drop)
- Live image preview
- Support multiple media types:
  - Image uploads
  - YouTube URLs
  - Video embeds
- Animation picker
- Overlay opacity control
- Auto-save to database

**Slide Properties:**
- ID, Type, Media URL, Title, Subtitle
- CTA Text, CTA Link, Overlay Opacity
- Animation type, Display Order

### 1.3 Search Engines Manager
**Location:** `/jana/search-engines`
**File:** [src/app/jana/search-engines/page.tsx](src/app/jana/search-engines/page.tsx)

**Capabilities:**
- Create custom search algorithms
- Configure searchable fields per section
- Define search filters
- Assign card templates to search results
- Enable/disable module searchability
- Validation reporting
- Active/inactive toggling

**Search Engine Configuration:**
```
{
  id: "search_engine_id",
  name: "Display Name",
  allowed_fields: ["field1", "field2"],
  filters: [],
  active: true,
  card_theme: "standard|hero|compact|data_rich"
}
```

### 1.4 Business Management & Orchestrator
**Location:** `/jana/orchestrator` (Main Business Onboarding Wizard)
**Files:**
- [src/app/jana/orchestrator/page.tsx](src/app/jana/orchestrator/page.tsx) - Master orchestrator
- [src/app/jana/businesses/[id]/orchestrate/page.tsx](src/app/jana/businesses/[id]/orchestrate/page.tsx) - Per-business editor

**Wizard Phases:**
1. **ARCHITECTURE** - Select business type
2. **AESTHETICS** - Choose minisite template
3. **DNA_CONFIG** - Fill in business-specific data
4. **AUTHORITY** - Assign vendor ownership
5. **DEPLOYMENT** - Publish the business

**Per-Business Orchestrator Tabs:**
- **IDENTITY** - Basic info (name, type, location)
- **ARCHITECTURE** - Select sections to include
- **CONTENT** - Fill section-specific data
- **BRANDING** - Customize appearance
- **MEDIA** - Upload images and media

### 1.5 Sections Management
**Location:** `/jana/sections`
**File:** [src/app/jana/sections/page.tsx](src/app/jana/sections/page.tsx)

**Capabilities:**
- Manage data sections (Identity, Amenities, Cuisine, etc.)
- Define required and optional fields
- Create section-specific blueprints
- Control field visibility and editability
- Manage inheritance rules
- Field library integration

### 1.6 Business Types (Typology) Manager
**Location:** `/jana/types`
**File:** [src/app/jana/types/page.tsx](src/app/jana/types/page.tsx)

**Capabilities:**
- Create parent/child business types
- Assign sections to types
- Configure DNA sequences
- Type-specific field definitions
- Organize type hierarchy

### 1.7 Component Library Manager
**Location:** `/admin/component-library`
**Files:**
- [src/app/api/admin/component-library/route.ts](src/app/api/admin/component-library/route.ts)
- [src/app/api/admin/component-library/[id]/route.ts](src/app/api/admin/component-library/[id]/route.ts)

**Capabilities:**
- List all components
- Filter by type (carousels, sidebars, galleries)
- Create new components
- Edit existing components
- Enable/disable components
- Delete components
- View usage count
- Manage component metadata

**Component Types Supported:**
- carousel
- blog_sidebar
- gallery
- testimonials
- cta_section
- features
- custom

### 1.8 Blog Management
**Location:** `/admin/blog`
**Associated Pages:**
- `/admin/blog/editor` - Blog post editor
- `/admin/blog-templates` - Blog templates
- `/admin/blog-integration` - Integration tool
- `/admin/blog-layout-builder` - Custom layout designer

**Capabilities:**
- Create/edit blog posts
- Manage blog templates
- Design blog layouts
- Integrate blog into pages
- Configure blog sidebars

### 1.9 Form Builder / Governance Wizard
**Locations:**
- `/jana/governance` - Advanced governance dashboard
- `/jana/form-builder` - Simple form builder

**Capabilities:**
- Define business types and sections
- Create field definitions
- Build data collection forms
- Configure inheritance rules
- Manage field validation

### 1.10 Journey Configuration
**Location:** `/admin/journey-config`
**File:** [src/app/admin/journey-config/page.tsx](src/app/admin/journey-config/page.tsx)

**Capabilities:**
- Manage journey workflows
- Configure customer journeys
- Track journey states
- Analytics and reporting

### 1.11 Data Management Tools
**Endpoints:**
- `/api/jana/data-manager/import` - Bulk import data
- `/api/jana/data-manager/export` - Export data
- `/api/jana/data-manager/csv` - CSV operations

---

## 2. HOMEPAGE STRUCTURE & COMPONENTS

### Current Homepage
**File:** [src/app/page.tsx](src/app/page.tsx)

**Loading Sequence:**
1. Fetch homepage configuration from `/api/jana/website?id=website_main`
2. Load hero carousel slides from `/api/jana/hero-carousel`
3. Render components using `DynamicHomepageRenderer`
4. Fallback to default layout if no config exists

**Default Homepage Components:**
```typescript
[
  { id: 'h1', type: 'hero_carousel', props: { siteId: 'discovery' } },
  { id: 'h2', type: 'services_hub', props: {} },
  { id: 'h3', type: 'experience_categories', props: {} },
  { id: 'h4', type: 'search_bar', props: {} },
  { id: 'h5', type: 'smart_journey_planner', props: {} },
  { id: 'h6', type: 'ecosystem_map', props: {} },
  { id: 'h7', type: 'local_products', props: {} },
  { id: 'h8', type: 'storytelling_section', props: {} },
  { id: 'h9', type: 'partner_cta', props: {} }
]
```

### Main Sections
1. **Navigation Bar** - Global navigation with links
2. **Hero Carousel** - Cinematic full-screen carousel with slides
3. **Services Hub** - Business service categories
4. **Experience Categories** - Curated experience types
5. **Search Engine Integration** - Dynamic search interface
6. **Journey Planner** - Smart journey recommendations
7. **Ecosystem Map** - Interactive location map
8. **Local Products** - Featured local products
9. **Storytelling Section** - Featured stories/content
10. **Partner CTA** - Call-to-action sections
11. **Blog Integration** - Recent blog posts (optional)
12. **Footer** - Global footer with links

### Component Renderer
**File:** [src/components/DynamicHomepageRenderer.tsx](src/components/DynamicHomepageRenderer.tsx)

**Features:**
- Dynamic component type dispatch
- Props-based configuration
- Site settings injection
- Error boundary handling
- Responsive rendering

### Custom Pages
**File:** [src/app/p/[slug]/page.tsx](src/app/p/[slug]/page.tsx)

**Capabilities:**
- Render admin-created custom pages
- Load from website configuration
- Support dynamic layout components
- Navigation header with breadcrumbs

---

## 3. DATABASE TABLES & SCHEMAS

### Core Page Management Tables

#### 3.1 website_templates
```sql
CREATE TABLE website_templates (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'website',
  header_components JSON,       -- Array of header components
  body_components JSON,         -- Array of body components
  footer_components JSON,       -- Array of footer components
  site_settings JSON,           -- Global site config
  updated_at TIMESTAMP
);

Structure of component:
{
  id: string,
  type: string,                 -- "hero_carousel", "blog", etc.
  name: string,
  zone: "header|body|footer",
  props: {
    engine_id?: string,
    carousel_id?: string,
    [key]: any
  }
}
```

#### 3.2 website_configs
```sql
CREATE TABLE website_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) UNIQUE,     -- "hero_carousel", "site_settings", etc.
  config JSON,                  -- Type-specific configuration
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

Examples:
- type: "hero_carousel"
  config: { slides: [...] }
```

**Stored Carousel Data:**
```json
{
  "type": "hero_carousel",
  "config": {
    "slides": [
      {
        "id": "slide_123",
        "type": "image|youtube|video",
        "mediaUrl": "URL or path",
        "title": "Slide Title",
        "subtitle": "Subtitle",
        "ctaText": "Button Text",
        "ctaLink": "URL or path",
        "overlayOpacity": 0-1,
        "animation": "kenburns|fade|slide",
        "displayOrder": 0-N
      }
    ]
  }
}
```

#### 3.3 search_engines
```sql
CREATE TABLE search_engines (
  id VARCHAR(100) PRIMARY KEY,  -- "se_luxury_hotels"
  name VARCHAR(255),             -- "Premium Hotels Search"
  allowed_fields JSON,           -- ["location", "price_range"]
  filters JSON,                  -- Pre-defined filters
  active BOOLEAN,
  created_at TIMESTAMP
);
```

#### 3.4 orchestrator_pages
```sql
-- Manages pages created via page builder
CREATE TABLE orchestrator_pages (
  id VARCHAR(36) PRIMARY KEY,
  site_id VARCHAR(50),           -- Which site this page belongs to
  slug VARCHAR(255) UNIQUE,      -- URL slug
  title VARCHAR(255),            -- Display title
  components JSON,               -- Array of page components
  settings JSON,                 -- Page-specific settings
  search_engine_id VARCHAR(100), -- Linked search engine
  card_policy_id VARCHAR(100),   -- Card display policy
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3.5 component_library
```sql
CREATE TABLE component_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),             -- "Hotel Showcase Carousel"
  type ENUM(...),                -- "carousel", "blog_sidebar", etc.
  category VARCHAR(50),          -- "hero", "sidebar", etc.
  config JSON,                   -- Full component configuration
  thumbnail VARCHAR(500),        -- Preview image URL
  description TEXT,              -- What it does
  is_global BOOLEAN,             -- Available everywhere?
  is_active BOOLEAN,
  usage_count INT,               -- Pages using it
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3.6 page_components
```sql
CREATE TABLE page_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(100),          -- Which page
  page_type VARCHAR(50),         -- "website", "blog"
  component_library_id INT,      -- Reference to component_library
  position INT,                  -- Order on page
  section ENUM('header','body','footer','sidebar'),
  custom_overrides JSON,         -- Page-specific config overrides
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3.7 search_pages
```sql
CREATE TABLE search_pages (
  id VARCHAR(36),
  title VARCHAR(255),            -- Page title
  slug VARCHAR(255),             -- URL slug
  target_type VARCHAR(50),       -- Category being searched
  target_id VARCHAR(100),        -- Category ID
  created_at TIMESTAMP
);
```

### Business Data Tables

#### 3.8 businesses
```sql
CREATE TABLE businesses (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  type_id VARCHAR(100),          -- Reference to business_types
  location_id VARCHAR(100),
  vendor_id VARCHAR(36),
  custom_data JSON,              -- All vendor-entered data
  draft_data JSON,               -- Unpublished changes
  template_id VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3.9 sections
```sql
CREATE TABLE sections (
  id VARCHAR(100) PRIMARY KEY,   -- "basic", "facilities", "media"
  name VARCHAR(255),
  icon VARCHAR(100),
  required BOOLEAN,
  vendor_editable BOOLEAN,
  show_on_public BOOLEAN,
  is_filterable BOOLEAN,         -- Can search by this?
  show_on_card BOOLEAN,          -- Display on card?
  created_at TIMESTAMP
);
```

#### 3.10 form_fields
```sql
CREATE TABLE form_fields (
  id VARCHAR(36),
  business_type_id VARCHAR(100),
  section_id VARCHAR(100),
  name VARCHAR(100),             -- Field variable name
  label VARCHAR(255),            -- Display label
  field_type VARCHAR(50),        -- text, textarea, select, etc.
  required BOOLEAN,
  vendor_editable BOOLEAN,
  searchable BOOLEAN,            -- Can filter by this?
  search_step VARCHAR(50),       -- Which search module uses it?
  options JSON,                  -- For select/checkbox fields
  created_at TIMESTAMP
);
```

---

## 4. API ENDPOINTS FOR PAGE MANAGEMENT

### 4.1 Website Management

**GET /api/jana/website**
- Query params: `?id=website_main` or `?id=website_custom_page`
- Returns: Page configuration with header/body/footer components

**PUT /api/jana/website**
- Save page layout changes
- Body: `{ id, header_components, body_components, footer_components, site_settings }`
- Returns: Updated configuration

**DELETE /api/jana/website**
- Query params: `?id=website_slug`
- Returns: Success status

**GET /api/jana/website/list**
- Returns: All website configurations

### 4.2 Hero Carousel Management

**GET /api/jana/hero-carousel**
- Query params: `?siteId=discovery`
- Returns: `{ slides: [...] }`

**POST /api/jana/hero-carousel**
- Save carousel configuration
- Body: `{ siteId, slides: [...] }`
- Returns: Saved configuration

**DELETE /api/jana/hero-carousel**
- Clear carousel slides

### 4.3 Search Engines

**GET /api/jana/search-engines**
- Returns: Array of all search engines

**POST /api/jana/search-engines**
- Create new search engine
- Body: `{ id, name, allowed_fields, filters, active }`

**PUT /api/jana/search-engines**
- Update search engine
- Body: Updated search engine object

**DELETE /api/jana/search-engines**
- Query params: `?id=search_engine_id`

### 4.4 Page Components

**GET /api/jana/pages/[pageId]/components**
- Returns: Components assigned to specific page

**POST /api/jana/pages/[pageId]/components**
- Assign component to page
- Body: `{ component_library_id, position, section, custom_overrides }`

**PUT /api/jana/pages/[pageId]/components**
- Update component assignment
- Body: Updated component data

**DELETE /api/jana/pages/[pageId]/components**
- Remove component from page

### 4.5 Orchestrator Pages

**GET /api/jana/website/pages**
- Returns: All orchestrator pages

**POST /api/jana/website/pages**
- Create new page
- Body: `{ site_id, slug, title, components, settings, search_engine_id }`

**PUT /api/jana/website/pages**
- Update page

**DELETE /api/jana/website/pages**
- Query params: `?id=page_id`

### 4.6 Component Library

**GET /api/admin/component-library**
- Returns: All library components

**POST /api/admin/component-library**
- Create new component
- Body: `{ name, type, category, config, thumbnail, description }`

**GET /api/admin/component-library/[id]**
- Get single component

**PUT /api/admin/component-library/[id]**
- Update component

**DELETE /api/admin/component-library/[id]**
- Delete component

### 4.7 Admin Dashboard API

**GET /api/jana/page-builder/admin**
- Query params: `?action=status|notifications|unread|activity`
- Returns: Status summary, notifications, or activity log

**PUT /api/jana/page-builder/admin**
- Toggle component visibility or change status
- Body: `{ action, pageId, blockId, newStatus }`

### 4.8 Business Data

**GET /api/jana/businesses**
- Returns: All businesses

**POST /api/jana/businesses**
- Create new business

**PUT /api/jana/businesses**
- Update business data

**GET /api/jana/types**
- Returns: All business types

**GET /api/jana/sections**
- Returns: All sections

**GET /api/jana/forms**
- Returns: All form fields

---

## 5. COMPONENT CONFIGURATION & CUSTOMIZATION SYSTEMS

### 5.1 Slot Configuration (Website Builder)

**Component Slot Structure:**
```typescript
interface Slot {
  id: string;
  key: string;                   -- Component type
  zone: "header"|"body"|"footer";
  label: string;                 -- Display name
  engine_id?: string;            -- For search components
  carousel_id?: string;          -- For carousel components
  props?: Record<string, any>;   -- Custom properties
}
```

### 5.2 Dynamic Component Props

**Hero Carousel Props:**
```typescript
{
  carousel_id: "discovery",
  autoPlay: true,
  autoPlayInterval: 8000,
  height: "100vh",
  showIndicators: true,
  showArrows: true,
  showProgress: true,
  transitionDuration: 1200
}
```

**Search Bar Props:**
```typescript
{
  engine_id: "search_engine_id",
  showFilters: true,
  resultsPerPage: 12,
  title: "Search",
  subtitle: "Find what you need"
}
```

**Blog Component Props:**
```typescript
{
  postCount: 6,
  preset: "landingFeatured",
  layout: "grid",
  columns: 3,
  showSearch: true
}
```

### 5.3 Site-Wide Settings

**Configuration Object:**
```typescript
interface SiteSettings {
  tagline: string;
  show_logo_in_hero: boolean;
  carousel_autoplay: boolean;
  carousel_interval: number;
  logo_url: string;
  show_watermark: boolean;
  logo_height: number;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
}
```

### 5.4 Component Library Configuration

**Each Component Stores:**
```typescript
{
  id: number,
  name: string,
  type: "carousel"|"blog_sidebar"|"gallery"|etc,
  category: string,
  config: {
    // Full component-specific configuration
    // Carousel example:
    slides: [],
    autoPlayInterval: 8000,
    height: "100vh",
    // Blog sidebar example:
    components: [
      { type: "search", title: "Search" },
      { type: "recent_posts", title: "Recent Posts", count: 5 },
      { type: "categories", title: "Categories" }
    ]
  },
  thumbnail: "image_url",
  description: "What this component does",
  is_global: true,
  is_active: true,
  usage_count: 15
}
```

### 5.5 Page-Component Assignments with Overrides

**Override Pattern:**
```typescript
{
  component_library_id: 5,
  position: 2,
  section: "body",
  custom_overrides: {
    // Override any properties from the base component config
    "carousel_interval": 5000,
    "title": "Custom Title",
    "showArrows": false
  }
}
```

---

## 6. HERO CAROUSEL MANAGEMENT

### 6.1 Data Storage

**Storage Location:** `website_configs` table
```sql
SELECT config FROM website_configs WHERE type = 'hero_carousel'
```

**Carousel Slide Structure:**
```typescript
interface CarouselSlide {
  id: string;                    -- Unique slide ID
  type: "image"|"youtube"|"video";
  mediaUrl: string;              -- URL or upload path
  title: string;
  subtitle: string;
  ctaText: string;               -- Call-to-action button text
  ctaLink: string;               -- URL, page slug, or search engine ID
  overlayOpacity: number;        -- 0-1 opacity
  animation: string;             -- "kenburns", "fade", "slide"
  displayOrder: number;          -- Sort order
}
```

### 6.2 Admin Interface Features

**File:** [src/app/jana/hero-carousel/page.tsx](src/app/jana/hero-carousel/page.tsx)

**UI Capabilities:**
- Slide list with thumbnails and titles
- Create new slide form
- Edit existing slide
- Delete with confirmation
- Drag-to-reorder slides
- Image preview
- Media upload from device
- YouTube URL input
- Animation picker dropdown
- Overlay opacity slider
- Auto-save on changes

### 6.3 Carousel Component Rendering

**File:** [src/components/AdvancedHeroCarousel.tsx](src/components/AdvancedHeroCarousel.tsx)

**Features:**
- Full-screen cinematic display
- YouTube video embedding
- Image optimization
- Auto-play with interval control
- Manual navigation arrows
- Progress indicators
- Keyboard shortcuts
- Mobile responsive
- Touch gesture support

### 6.4 Integration Points

**Homepage Fallback:**
```typescript
// If no orchestrator components, display carousel
const hasComponents = layout.length > 0;
if (!hasComponents && carouselSlides.length > 0) {
  return <AdvancedHeroCarousel slides={carouselSlides} />;
}
```

**Orchestrator Component:**
```typescript
// Can be added as a component in page builder
{
  id: "comp_hero_12345",
  type: "hero_carousel",
  name: "Cinematic Hero Carousel",
  props: {
    slides: [],
    autoPlay: true,
    autoPlayInterval: 8000,
    showIndicators: true,
    showArrows: true,
    showProgress: true
  }
}
```

---

## 7. SEARCH ENGINES & SEARCH PAGE CONFIGURATION

### 7.1 Search Engine Management

**Admin Interface:** [src/app/jana/search-engines/page.tsx](src/app/jana/search-engines/page.tsx)

**Configuration Features:**
1. **Engine Identity**
   - Unique ID (e.g., `se_luxury_hotels`)
   - Display name
   - Active/inactive toggle

2. **Searchable Fields**
   - Select from available field definitions
   - Enable/disable per section
   - Module-level toggles

3. **Filters**
   - Define pre-built filter options
   - Filter types (price range, rating, etc.)
   - Default filter values

4. **Card Template**
   - Assign which card layout to use
   - Per-business-type card designs
   - Custom field visibility

### 7.2 Search Query Service

**File:** [src/lib/search-compare/search-query.ts](src/lib/search-compare/search-query.ts)

**Functions:**
- `buildSearchQuery()` - Create MySQL WHERE conditions
- `executeSearch()` - Run search against database
- `inferOperator()` - Determine query operator
- `mapFieldPathToColumn()` - Translate field names to DB columns

**Search Execution:**
```typescript
// 1. Load search engine config
const engine = await fetch(`/api/jana/search-engines?id=${engineId}`);

// 2. Build query from user filters
const conditions = buildSearchQuery(engine, userFilters);

// 3. Execute against businesses table
const results = await executeSearch(engineId, userFilters, page, pageSize);

// 4. Render with card template
results.forEach(biz => {
  renderCard(biz, cardTemplate);
});
```

### 7.3 Search Results Pages

**File:** [src/app/search/[searchEngineId]/page.tsx](src/app/search/[searchEngineId]/page.tsx)

**Dynamic Features:**
- Load search engine configuration
- Generate filter UI from allowed fields
- Execute search on user input
- Display results with dynamic cards
- Pagination support
- Real-time filtering

**URL Structure:**
- `/search/se_luxury_hotels` - Search by engine ID
- `/search/desert_tours` - Custom search page

### 7.4 Search Pages (URL Routing)

**Table:** `search_pages`

**Use Case:**
- Map clean URLs to search configurations
- Example: `/search/best-hotels` → `{ target_type: "accommodation", target_id: "hotel" }`
- SEO-friendly slug management

### 7.5 Component Integration

**Search Component in Page Builder:**
- Add search component to any page
- Select search engine to use
- Configure display options
- Render inline search filters and results

---

## 8. CMS-LIKE FUNCTIONALITY

### 8.1 Content Management Features

**Existing CMS Capabilities:**

1. **Page Management**
   - Create/edit/delete pages
   - Drag-and-drop component layout
   - Three-zone architecture (header/body/footer)
   - Real-time preview
   - Publish/draft system

2. **Component Library**
   - Reusable component storage
   - Component configuration
   - Usage tracking
   - Enable/disable management
   - Per-page overrides

3. **Content Sections**
   - Manage data sections (sections table)
   - Field definitions per section
   - Visibility controls
   - Vendor editability rules
   - Search integration

4. **Business Data Management**
   - Orchestrator system for data input
   - Multi-tab editing interface
   - Section-based data organization
   - Draft/publish workflow
   - Media management

5. **Blog System**
   - Blog post creation/editing
   - Blog templates
   - Layout builder
   - Integration into pages
   - Sidebar widget system

6. **Search Engine Configuration**
   - Create search algorithms
   - Configure searchable fields
   - Filter management
   - Results styling with card templates

7. **Carousel Management**
   - Slide CRUD operations
   - Media uploads
   - Reordering
   - Animation controls
   - Live preview

### 8.2 Orchestrator System

**Files:**
- [src/app/jana/orchestrator/page.tsx](src/app/jana/orchestrator/page.tsx) - Main wizard
- [src/app/api/jana/orchestrator/register/route.ts](src/app/api/jana/orchestrator/register/route.ts) - Registration API

**CMS-Like Features:**
- **Multi-step wizard** for structured data entry
- **Type selection** - Choose business category
- **Template assignment** - Select minisite template
- **Data collection** - Fill in DNA (business data)
- **Vendor assignment** - Map to vendor ownership
- **Publication** - Deploy to marketplace

**Workflow:**
```
1. Admin selects business type
2. System suggests minisite template
3. Admin fills in business data
4. Admin assigns vendor (or none for internal)
5. System creates pages with selected sections
6. Business goes live on marketplace
```

### 8.3 Data Governance

**Features:**
- Section templates (reusable data structure)
- Field definitions (element library)
- Inheritance rules (parent-child relationships)
- ACL controls (who can edit what)
- Validation rules (data quality)
- Search mapping (which fields are searchable)

### 8.4 Admin Notifications & Auditing

**Files:**
- [src/app/api/jana/page-builder/admin/route.ts](src/app/api/jana/page-builder/admin/route.ts)
- `activity_log` table - Audit trail

**Capabilities:**
- Track component status changes
- Log admin actions
- Notification queue
- Unread count tracking
- Activity reports

---

## 9. KEY MISSING FEATURES & GAPS

### Current Limitations

1. **Template-Based Page Creation**
   - ❌ No WYSIWYG visual editor
   - ❌ Limited drag-and-drop customization
   - ✅ Existing: Code-based configuration (JSON)

2. **Media Management**
   - ⚠️ Limited central media library
   - ✅ Existing: Carousel uploads work
   - ❌ Missing: Global media browser/organization

3. **Custom Styling**
   - ❌ No theme/color picker UI
   - ❌ No responsive preview per device
   - ✅ Existing: Site-wide color config

4. **Role-Based Access Control (RBAC)**
   - ✅ Partial: Role enum exists
   - ❌ Missing: Granular permission per page/component
   - ❌ Missing: Field-level access control

5. **Preview & Publishing**
   - ⚠️ Basic preview exists
   - ❌ Missing: Scheduled publishing
   - ❌ Missing: Version history/rollback

6. **SEO Tools**
   - ❌ Missing: Meta tags editor
   - ❌ Missing: URL slug management UI
   - ❌ Missing: Sitemap/robots.txt control

7. **Localization**
   - ❌ No multi-language support
   - ❌ No translation management

8. **Performance Monitoring**
   - ❌ Missing: Page load analytics
   - ❌ Missing: SEO scoring
   - ❌ Missing: Performance recommendations

9. **Email/Notification System**
   - ❌ No email notifications
   - ⚠️ Partial: In-app notifications only

10. **A/B Testing**
    - ❌ Not implemented

---

## 10. DATABASE RELATIONSHIPS DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│                  WEBSITE TEMPLATES                   │
│  (website_templates - Single row 'website')          │
│  header_components, body_components,                │
│  footer_components, site_settings                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Contains references to
                   ↓
┌─────────────────────────────────────────────────────┐
│               COMPONENT LIBRARY                      │
│  (component_library - Reusable components)          │
│  ID, name, type, config, is_active                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1 → Many
                   ↓
┌─────────────────────────────────────────────────────┐
│             PAGE COMPONENTS                          │
│  (page_components - Assignments)                    │
│  page_id, component_library_id, position, section   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            WEBSITE CONFIGS                           │
│  (website_configs - JSON configs)                   │
│  type='hero_carousel', config=JSON slides           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         ORCHESTRATOR PAGES                           │
│  (orchestrator_pages - Custom pages)                │
│  site_id, slug, components, search_engine_id       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          SEARCH ENGINES                              │
│  (search_engines - Search configs)                  │
│  id, name, allowed_fields, filters, active         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            BUSINESSES                                │
│  (businesses - Content entities)                    │
│  type_id, custom_data, template_id                 │
└─────────────────────────────────────────────────────┘
```

---

## 11. DATA FLOW EXAMPLES

### Example 1: Homepage Loading

```
1. GET /api/jana/website?id=website_main
   ↓
2. Database: SELECT * FROM website_templates WHERE id = 'website'
   ↓
3. Returns: {
     header_components: [
       { id: 'h1', type: 'hero_carousel', props: { carousel_id: 'discovery' } }
     ],
     body_components: [...],
     footer_components: [...]
   }
   ↓
4. Frontend: Load hero carousel slides
   GET /api/jana/hero-carousel?siteId=discovery
   ↓
5. Database: SELECT config FROM website_configs WHERE type = 'hero_carousel'
   ↓
6. Render: <DynamicHomepageRenderer layout={components} />
```

### Example 2: Search Results

```
1. User visits: /search/se_luxury_hotels
   ↓
2. Load engine config: GET /api/jana/search-engines?id=se_luxury_hotels
   ↓
3. Database: SELECT * FROM search_engines WHERE id = 'se_luxury_hotels'
   Returns: { allowed_fields: ['price', 'rating'], ... }
   ↓
4. Render filter UI based on allowed_fields
   ↓
5. User filters: { price: [100-300], rating: 4+ }
   ↓
6. Execute search: POST /api/search
   buildSearchQuery() → MySQL WHERE clause
   ↓
7. Database: SELECT * FROM businesses 
   WHERE type_id = 'accommodation' 
   AND custom_data->$.price BETWEEN 100 AND 300
   AND custom_data->$.rating >= 4
   ↓
8. Render results with card template
```

### Example 3: Adding Component to Page

```
1. Admin clicks: "Add Component" in /jana/website
   ↓
2. Choose from palette: "hero_carousel"
   ↓
3. Create slot in state:
   { id: 'h1_new', key: 'hero_carousel', zone: 'body', ... }
   ↓
4. Click Save
   ↓
5. PUT /api/jana/website
   { 
     id: 'website_main',
     body_components: [
       { id: 'h1_new', type: 'hero_carousel', props: {} }
     ]
   }
   ↓
6. Database: UPDATE website_templates 
   SET body_components = JSON_ARRAY(...) WHERE id = 'website'
   ↓
7. Homepage refreshes with new component
```

---

## 12. SUMMARY TABLE

| Aspect | Status | Location | Notes |
|--------|--------|----------|-------|
| **Page Builder** | ✅ Working | `/jana/website` | Drag-and-drop, component slots |
| **Hero Carousel** | ✅ Working | `/jana/hero-carousel` | Full CRUD, media upload |
| **Search Engines** | ✅ Working | `/jana/search-engines` | Config + results display |
| **Business Orchestrator** | ✅ Working | `/jana/orchestrator` | Multi-step wizard |
| **Component Library** | ✅ Working | `/admin/component-library` | Reusable components |
| **Blog System** | ✅ Working | `/admin/blog` | Posts, templates, layouts |
| **Homepage Config** | ✅ Working | `/api/jana/website` | JSON-based layout |
| **Media Library** | ⚠️ Partial | `/jana/hero-carousel` | Carousel uploads only |
| **WYSIWYG Editor** | ❌ Missing | — | Component-based instead |
| **Theme Manager** | ⚠️ Partial | `SiteSettings` | Basic color config |
| **Publishing Workflow** | ✅ Basic | `/jana/website` | Publish/draft system |
| **SEO Tools** | ❌ Missing | — | No meta tags UI |
| **Analytics** | ❌ Missing | — | Views/stats only |
| **Multi-language** | ❌ Missing | — | Not implemented |
| **Role-based Access** | ⚠️ Partial | `profiles.role` | Role enum, not granular |

---

## 13. RECOMMENDATIONS FOR FULL PAGE MANAGEMENT

### To Enable Complete Page Management Control:

1. **Enhance Visual Editor**
   - Add WYSIWYG drag-drop for text/images
   - Real-time responsive preview
   - CSS/styling UI

2. **Expand Media Management**
   - Central media library with organization
   - Drag-drop upload to components
   - Image optimization/cropping

3. **Advanced Publishing**
   - Scheduled publish dates
   - Version history/rollback
   - Content approval workflow

4. **SEO & Performance**
   - Meta tags editor
   - URL slug management UI
   - Page speed analytics
   - SEO scoring

5. **Access Control**
   - Granular permissions (per page/component)
   - Content approval hierarchy
   - Vendor-specific page restrictions

6. **Multi-language Support**
   - Translation management
   - Language-specific URLs
   - RTL support for Arabic

7. **Engagement Features**
   - Email notifications
   - A/B testing
   - Analytics dashboard

8. **Content Calendar**
   - Publication schedule view
   - Bulk actions
   - Workflow automation

---

## Files Summary

**Key Admin Files:**
- `/src/app/jana/` - Main admin hub
- `/src/app/jana/website/` - Page builder
- `/src/app/jana/hero-carousel/` - Carousel manager
- `/src/app/jana/search-engines/` - Search config
- `/src/app/admin/component-library/` - Component manager

**Key API Files:**
- `/src/app/api/jana/website/` - Page management APIs
- `/src/app/api/jana/hero-carousel/` - Carousel APIs
- `/src/app/api/jana/search-engines/` - Search APIs
- `/src/app/api/admin/component-library/` - Component APIs

**Database Files:**
- `/siwa-oasis/master-schema.sql` - Complete schema
- `/siwa-oasis/scripts/component-library-schema.sql` - Components table
- `/siwa-oasis/scripts/create-website-configs-table.sql` - Configs table

**Component Files:**
- `/src/components/DynamicHomepageRenderer.tsx` - Homepage renderer
- `/src/components/AdvancedHeroCarousel.tsx` - Carousel component
- `/src/lib/search-compare/search-query.ts` - Search execution


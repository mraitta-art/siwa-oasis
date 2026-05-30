# 🔍 Dynamic Search Pages System - Complete Implementation Guide

## Overview
The Dynamic Search Pages System is a fully customizable search interface builder that allows admins to create, configure, and manage unlimited search pages without touching code.

## ✅ What's Implemented

### 1. Admin Management Interface (`/jana/search-pages`)
**Location**: `src/app/jana/search-pages/page.tsx`

**Features**:
- ✅ Create new search pages with custom slugs
- ✅ Edit existing search pages
- ✅ Delete search pages (with confirmation)
- ✅ Live preview links
- ✅ Publish/draft toggle
- ✅ Search engine selection
- ✅ Hero carousel configuration
- ✅ Grid view showing all pages with metadata

**Form Fields**:
```
- Page Slug (URL path, e.g., "vibe-search" → /search/vibe-search)
- Title
- Description
- Search Engine (dropdown from available search engines)
- Enable Hero Carousel (checkbox)
  - Carousel ID (if enabled)
  - Hero Height in VH (if enabled, 40-100)
  - Auto-play toggle (if enabled)
- Publish Page (checkbox)
```

### 2. Dynamic Search Page (`/search/[slug]`)
**Location**: `src/app/search/[slug]/page.tsx`

**Features**:
- ✅ Dynamically renders any search page by slug
- ✅ Fetches configuration from API
- ✅ Hero carousel display (with customizable height)
- ✅ Search form and submission
- ✅ Results grid with business cards
- ✅ Browse-all mode (shows all businesses if no search)
- ✅ Published/draft status checking
- ✅ Responsive design
- ✅ Hover effects and smooth transitions
- ✅ Empty states and error handling

**Page Structure**:
```
[Hero Carousel] (if enabled)
    ↓
[Search Form]
    ↓
[Results Grid]
    ↓
[Footer]
```

### 3. API Endpoints (`/api/jana/search-pages`)
**Location**: `src/app/api/jana/search-pages/`

#### GET /api/jana/search-pages
Lists all search pages with optional filtering
```
Query Parameters:
- published=true|false (optional)

Response:
[
  {
    id: string,
    slug: string,
    title: string,
    description: string,
    search_engine_id: string | null,
    hero_enabled: boolean,
    hero_carousel_id: string,
    hero_height_vh: number,
    hero_autoplay: boolean,
    is_published: boolean,
    components: object[],
    layout_settings: object,
    created_at: string,
    updated_at: string
  }
]
```

#### POST /api/jana/search-pages
Creates a new search page
```
Body:
{
  slug: string (required),
  title: string (required),
  description: string,
  search_engine_id: string | null,
  hero_enabled: boolean,
  hero_carousel_id: string,
  hero_height_vh: number,
  hero_autoplay: boolean,
  is_published: boolean,
  components: object[],
  layout_settings: object,
  custom_seo_title: string,
  custom_seo_description: string
}

Response:
{
  success: true,
  id: string,
  message: string
}
```

#### PUT /api/jana/search-pages
Updates an existing search page
```
Body:
{
  id: string (required),
  ...other fields to update
}
```

#### DELETE /api/jana/search-pages
Deletes a search page
```
Query Parameters:
- id (required)
```

#### GET /api/jana/search-pages/[id]
Gets a search page by ID or slug
```
Response: Single search page object
```

### 4. Database Table
**Location**: Schema in `schema.sql` and `master-schema.sql`

**Table**: `search_pages`
```sql
CREATE TABLE search_pages (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  search_engine_id VARCHAR(100),
  
  -- Hero Carousel
  hero_enabled BOOLEAN DEFAULT 1,
  hero_carousel_id VARCHAR(100),
  hero_height_vh INT DEFAULT 85,
  hero_autoplay BOOLEAN DEFAULT 1,
  
  -- Components & Layout
  components JSON DEFAULT '[]',
  layout_settings JSON DEFAULT '{}',
  
  -- Control & Visibility
  is_published BOOLEAN DEFAULT 1,
  is_visible BOOLEAN DEFAULT 1,
  show_breadcrumb BOOLEAN DEFAULT 1,
  custom_seo_title VARCHAR(255),
  custom_seo_description TEXT,
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## 🚀 Quick Start

### 1. Setup Database Table
```bash
# Call this endpoint to create/migrate the table
POST /api/setup/search-pages-table

# Required: Admin authentication
```

**Response**:
```json
{
  "success": true,
  "message": "search_pages table created successfully"
}
```

### 2. Create Your First Search Page

Navigate to `/jana/search-pages` (Admin only)

1. Click **+ New Search Page**
2. Fill in the form:
   - **Slug**: `luxury-hotels` (URL will be `/search/luxury-hotels`)
   - **Title**: `Luxury Hotels of Siwa`
   - **Description**: `Discover the finest accommodations in the oasis`
   - **Search Engine**: Select a search engine or leave blank for default
   - **Enable Hero Carousel**: ✓ (checked)
   - **Carousel ID**: `discovery`
   - **Hero Height**: `85` (vh)
   - **Auto-play**: ✓ (checked)
   - **Publish Page**: ✓ (checked)
3. Click **Create Page**

### 3. View Your Search Page

The page is now live at `/search/luxury-hotels`

Users can:
- See the hero carousel
- Search for businesses
- Browse all businesses
- Click to view business details

## 📋 Admin Workflow

### Creating a Search Page
1. Go to `/jana/search-pages`
2. Click **+ New Search Page**
3. Fill all required fields (slug, title)
4. Configure optional features (hero, search engine)
5. Click **Create Page**
6. Click **Preview** to test the live page

### Editing a Search Page
1. Find the page in the grid
2. Click **✏️ Edit**
3. Modify any fields
4. Click **Save Changes**
5. Refresh the public page to see updates

### Deleting a Search Page
1. Find the page in the grid
2. Click **🗑️ Delete**
3. Confirm the deletion

### Publishing/Draft Mode
- Check **Publish Page** to make it visible to public
- Uncheck to create a draft (only admins see it)
- Edit anytime to toggle between states

## 🎨 Customization Options

### Hero Carousel
- **Enable/Disable**: Toggle `hero_enabled`
- **Height**: Set `hero_height_vh` (40-100 vh)
- **Carousel ID**: Select which carousel to display
- **Auto-play**: Toggle `hero_autoplay`

### Search Engine
- Leave blank to use default Vibe Search
- Select a custom search engine from dropdown
- Each page can use a different search module

### SEO
- **Custom SEO Title**: Override page title for search engines
- **Custom SEO Description**: Override page description for search engines

### Layout
- Hero carousel appears at top (if enabled)
- Search form in center
- Results grid below
- Footer at bottom

## 🔗 URL Routing

| Route | Purpose | Access |
|-------|---------|--------|
| `/jana/search-pages` | Admin manager | Admin only |
| `/search/[slug]` | Public search page | Public |
| `/api/jana/search-pages` | CRUD API | Admin API |
| `/api/setup/search-pages-table` | Database setup | Admin only |

## 📊 Example Search Pages

### Default Page
```
Slug: vibe-search
Title: Discover Siwa Experiences
Description: Explore the heritage, cuisine, and adventures of the Oasis
Engine: Default (Vibe Search)
Hero: Enabled, discovery carousel, 85vh
```

### Luxury Hotels Page
```
Slug: luxury-hotels
Title: Premium Accommodations
Description: Experience luxury stays in Siwa
Engine: Hotels Search Engine
Hero: Enabled, hotels carousel, 75vh
```

### Budget Travel Page
```
Slug: budget-travel
Title: Travel on a Budget
Description: Affordable experiences in Siwa
Engine: Budget Search Engine
Hero: Disabled
Publish: Drafted (work in progress)
```

## ✨ Features Coming Soon

- Custom components (CTA blocks, testimonials, FAQ)
- Multi-column layouts
- Featured businesses
- Related pages sections
- Analytics integration
- A/B testing tools

## 🔐 Security

- Admin authentication required for all management endpoints
- Published status prevents accidental public display of drafts
- Soft delete capability through is_published flag
- User tracking via created_by field

## 🐛 Troubleshooting

### Page Not Found
- Check slug spelling (case-sensitive, use hyphens)
- Verify page is published
- Confirm slug exists in admin manager

### Hero Not Showing
- Check "Enable Hero Carousel" is toggled on
- Verify carousel ID is valid
- Check hero_height_vh is between 40-100

### Search Not Working
- Verify search API endpoint is accessible
- Check search engine is configured
- Confirm business data exists in database

### 404 on Admin Page
- Ensure user has admin role
- Check authentication status
- Verify `/api/jana/search-pages` endpoint is responding

## 📈 Performance Notes

- Search pages are cached at the browser level
- Database queries use indexes on slug, published, and created_at
- Hero carousel lazy-loads carousel assets
- Results grid uses CSS Grid for optimal rendering

## 📚 Related Documentation

- Search Engines: See `DYNAMIC_SEARCH_FILTERS.md`
- Carousel System: See `CAROUSEL_INTEGRATION_GUIDE.md`
- Hero Implementation: See `HERO_CAROUSEL_MANAGEMENT.md`
- API Auth: See authentication middleware docs

---

**Last Updated**: May 29, 2026
**Status**: ✅ Complete & Production Ready

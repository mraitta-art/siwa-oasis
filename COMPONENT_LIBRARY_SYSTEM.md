# 📦 REUSABLE COMPONENT LIBRARY SYSTEM

## 🎯 WHAT YOU WANT

A **Component Library** where you can:

### **For Carousels:**
```
1. Create carousel in admin
2. Give it a name: "Hotel Showcase Carousel"
3. Save to library
4. In site builder sidebar → See "Hotel Showcase Carousel"
5. Drag to any page (homepage, hotel page, etc.)
6. Same carousel appears on that page
```

### **For Blog Widgets:**
```
1. Configure blog sidebar widgets
2. Save as: "Standard Blog Sidebar"
3. In site builder sidebar → See "Standard Blog Sidebar"
4. Assign to any blog page
5. Same sidebar appears
```

---

## 🏗️ ARCHITECTURE

### **Component Library Database:**

```sql
Table: component_library
├── id (INT, PK)
├── name (VARCHAR 100)        -- "Hotel Showcase Carousel"
├── type (ENUM)               -- carousel, blog_sidebar, section, etc.
├── category (VARCHAR 50)     -- hero, gallery, sidebar, etc.
├── config (JSON)             -- Full component configuration
├── thumbnail (VARCHAR 500)   -- Preview image
├── description (TEXT)        -- What this component does
├── is_global (BOOLEAN)       -- Available to all pages?
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
```

### **Page-Component Mapping:**

```sql
Table: page_components
├── id (INT, PK)
├── page_id (VARCHAR 100)     -- Which page
├── component_library_id (INT) -- Which saved component
├── position (INT)            -- Order on page
├── section (ENUM)            -- header, body, footer, sidebar
├── custom_overrides (JSON)   -- Page-specific customizations
```

---

## 📋 WORKFLOW

### **Step 1: Create Carousel Component**

```
Visit: /admin/hero-carousel
1. Create slides
2. Style everything
3. Click "Save as Component"
4. Name: "Luxury Hotel Carousel"
5. Category: Hero Carousels
6. Description: "Premium hotel showcase with YouTube"
7. Save to Library
```

### **Step 2: Create Blog Sidebar**

```
Visit: /admin/blog/sidebar-builder
1. Add widgets (Search, Recent Posts, Categories, etc.)
2. Arrange order
3. Click "Save as Component"
4. Name: "Standard Blog Sidebar"
5. Category: Blog Sidebars
6. Save to Library
```

### **Step 3: Use in Site Builder**

```
Visit: /admin/website
1. Open page template
2. Right sidebar shows:
   
   ┌─────────────────────────────┐
   │ COMPONENT LIBRARY           │
   ├─────────────────────────────┤
   │ Hero Carousels              │
   │ ├─ 🎬 Luxury Hotel Carousel │
   │ ├─ 🎬 Desert Safari         │
   │ └─ 🎬 Restaurant Showcase   │
   │                             │
   │ Blog Sidebars               │
   │ ├─ 📰 Standard Sidebar      │
   │ ├─ 📰 Minimal Sidebar       │
   │ └─ 📰 Full Featured         │
   │                             │
   │ Sections                    │
   │ ├─ 📸 Gallery Grid          │
   │ └─ 💬 Testimonials          │
   └─────────────────────────────┘

3. Drag "Luxury Hotel Carousel" to page
4. It appears with all slides
5. Save page
```

---

## 🎨 UI DESIGN

### **Component Library Admin:**

```
┌──────────────────────────────────────────┐
│  Component Library Management             │
├──────────────────────────────────────────┤
│  [+ Create New Component]                 │
├──────────────────────────────────────────┤
│  Filter: [All Types ▼] [All Cats ▼]      │
├──────────────────────────────────────────┤
│                                          │
│  🎬 Luxury Hotel Carousel                │
│  Type: Carousel | Category: Hero         │
│  Slides: 5 | Created: 2026-04-25        │
│  [Edit] [Duplicate] [Delete] [Use]       │
│                                          │
│  ──────────────────────────────────      │
│                                          │
│  🎬 Desert Safari Showcase               │
│  Type: Carousel | Category: Hero         │
│  Slides: 3 | Created: 2026-04-24        │
│  [Edit] [Duplicate] [Delete] [Use]       │
│                                          │
│  ──────────────────────────────────      │
│                                          │
│  📰 Standard Blog Sidebar                │
│  Type: Blog Sidebar | Category: Sidebar  │
│  Widgets: 5 | Created: 2026-04-25       │
│  [Edit] [Duplicate] [Delete] [Use]       │
│                                          │
└──────────────────────────────────────────┘
```

### **Site Builder Sidebar (Enhanced):**

```
┌──────────────────────────────┐
│  COMPONENT LIBRARY           │
├──────────────────────────────┤
│  🔍 Search components...     │
│                              │
│  📁 Hero Carousels (3)       │
│  ├─ 🎬 Luxury Hotel Carousel │
│  │   [Drag to page]          │
│  ├─ 🎬 Desert Safari         │
│  │   [Drag to page]          │
│  └─ 🎬 Restaurant Showcase   │
│      [Drag to page]          │
│                              │
│  📁 Blog Sidebars (2)        │
│  ├─ 📰 Standard Sidebar      │
│  │   [Assign to blog]        │
│  └─ 📰 Minimal Sidebar       │
│      [Assign to blog]        │
│                              │
│  📁 Gallery Sections (4)     │
│  ├─ 📸 Grid Layout           │
│  ├─ 📸 Masonry Layout        │
│  └─ 📸 Slider Layout         │
│                              │
│  📁 Testimonials (2)         │
│  └─ 💬 Customer Reviews      │
└──────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Database Schema**

```sql
-- Component Library Table
CREATE TABLE component_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('carousel', 'blog_sidebar', 'gallery', 'testimonials', 'custom') NOT NULL,
  category VARCHAR(50),
  config JSON NOT NULL,
  thumbnail VARCHAR(500),
  description TEXT,
  is_global BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_category (category)
);

-- Page-Component Assignments
CREATE TABLE page_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(100) NOT NULL,
  component_library_id INT NOT NULL,
  position INT DEFAULT 0,
  section ENUM('header', 'body', 'footer', 'sidebar') DEFAULT 'body',
  custom_overrides JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_page_component (page_id, component_library_id, section),
  FOREIGN KEY (component_library_id) REFERENCES component_library(id) ON DELETE CASCADE
);
```

---

### **Phase 2: API Endpoints**

```
/api/admin/component-library
  GET    - List all components
  POST   - Create new component
  PUT    - Update component
  DELETE - Delete component

/api/admin/component-library/[id]
  GET    - Get single component
  PUT    - Update
  DELETE - Delete

/api/admin/component-library/types
  GET    - List available types

/api/admin/pages/[pageId]/components
  GET    - Get components assigned to page
  POST   - Assign component to page
  PUT    - Update component position/overrides
  DELETE - Remove component from page
```

---

### **Phase 3: Admin Pages**

```
/admin/component-library
  - List all saved components
  - Filter by type/category
  - Create new from scratch
  - Edit existing
  - Delete

/admin/component-library/new
  - Choose type (carousel, blog sidebar, etc.)
  - Configure component
  - Preview
  - Save to library

/admin/component-library/edit/[id]
  - Edit existing component
  - Update config
  - Save changes
```

---

### **Phase 4: Site Builder Integration**

```typescript
// Enhanced sidebar in /admin/website

interface ComponentLibraryItem {
  id: number;
  name: string;
  type: string;
  category: string;
  config: any;
  thumbnail?: string;
  description?: string;
}

// Load library components
const [libraryComponents, setLibraryComponents] = useState<ComponentLibraryItem[]>([]);

useEffect(() => {
  fetch('/api/admin/component-library')
    .then(res => res.json())
    .then(data => setLibraryComponents(data));
}, []);

// Group by category
const groupedByCategory = libraryComponents.reduce((groups, comp) => {
  const cat = comp.category || 'Other';
  if (!groups[cat]) groups[cat] = [];
  groups[cat].push(comp);
  return groups;
}, {});

// Render in sidebar
{Object.entries(groupedByCategory).map(([category, components]) => (
  <div key={category}>
    <h3>{category}</h3>
    {components.map(comp => (
      <div
        key={comp.id}
        draggable
        onDragStart={() => startDragFromLibrary(comp)}
      >
        {comp.type === 'carousel' && '🎬'}
        {comp.type === 'blog_sidebar' && '📰'}
        {comp.name}
      </div>
    ))}
  </div>
))}
```

---

## 🎯 USE CASE EXAMPLES

### **Example 1: Multiple Hotels, Same Carousel**

```
1. Create "Luxury Hotel Carousel" in admin
2. Add 5 YouTube slides showcasing luxury hotels
3. Save to library

4. Apply to pages:
   - Homepage → Uses carousel
   - /hotels page → Uses same carousel
   - /about page → Uses same carousel
   
5. Update carousel once → Updates everywhere!
```

---

### **Example 2: Different Carousels for Different Pages**

```
1. Create "Desert Safari Carousel" → Save to library
2. Create "Cultural Tours Carousel" → Save to library
3. Create "Food & Dining Carousel" → Save to library

4. Assign:
   - Homepage → Desert Safari Carousel
   - /tours/safari → Desert Safari Carousel
   - /tours/cultural → Cultural Tours Carousel
   - /restaurants → Food & Dining Carousel
```

---

### **Example 3: Blog Sidebars**

```
1. Create "Standard Blog Sidebar"
   - Search widget
   - Recent Posts (5)
   - Categories
   - Tags Cloud
   - Newsletter

2. Create "Minimal Blog Sidebar"
   - Search widget
   - Recent Posts (3)
   - Categories only

3. Assign:
   - Main blog → Standard Sidebar
   - Individual posts → Standard Sidebar
   - Category pages → Minimal Sidebar
```

---

## 📊 BENEFITS

### **1. Reusability:**
```
Create once, use everywhere
No need to recreate for each page
```

### **2. Consistency:**
```
Same carousel across multiple pages
Update once, changes everywhere
```

### **3. Time Saving:**
```
Pre-built components ready to use
Drag and drop in seconds
```

### **4. Organization:**
```
Categorized component library
Easy to find and use
```

### **5. Flexibility:**
```
Can override settings per page if needed
Custom tweaks without breaking original
```

---

## 🔄 COMPONENT VS INSTANCE

### **Component (Library Item):**
```
Name: "Luxury Hotel Carousel"
Config: { slides: [...], settings: {...} }
Saved in: component_library table
Edited in: /admin/component-library/edit/[id]
```

### **Instance (Page Assignment):**
```
Page: Homepage
Component: Luxury Hotel Carousel (ID: 1)
Position: 1
Section: body
Overrides: { height: '80vh' }  // Optional customizations
Saved in: page_components table
```

---

## 🎨 CUSTOM OVERRIDES

When assigning a component to a page, you can override specific settings:

```json
{
  "page_id": "homepage",
  "component_library_id": 1,
  "position": 1,
  "section": "body",
  "custom_overrides": {
    "height": "80vh",          // Override height
    "autoPlayInterval": 10000, // Slower autoplay
    "showProgress": false      // Hide progress bar
  }
}
```

This way:
- **Original component** stays unchanged
- **Page instance** has custom tweaks
- Can revert to original anytime

---

## 🚀 IMPLEMENTATION STEPS

### **Step 1: Database**
```sql
✅ Create component_library table
✅ Create page_components table
✅ Add indexes
```

### **Step 2: API**
```typescript
✅ /api/admin/component-library (CRUD)
✅ /api/admin/pages/[id]/components (assign/remove)
```

### **Step 3: Admin UI**
```
✅ /admin/component-library (list)
✅ /admin/component-library/new (create)
✅ /admin/component-library/edit/[id] (edit)
✅ "Save to Library" button in carousel admin
✅ "Save to Library" button in blog sidebar builder
```

### **Step 4: Builder Integration**
```
✅ Enhanced sidebar with library components
✅ Drag from library to page
✅ Preview before adding
✅ Configure overrides
```

---

## ✅ SUMMARY

**What You Get:**

| Feature | Benefit |
|---------|---------|
| **Component Library** | Save carousels, sidebars, sections |
| **Categorized** | Easy to find components |
| **Reusable** | Use on multiple pages |
| **Drag & Drop** | Add to pages in builder |
| **Overrides** | Customize per page |
| **Global Updates** | Edit once, update everywhere |

**Workflow:**

```
1. Create component (carousel/sidebar/section)
2. Save to library with name & category
3. Open site builder
4. See component in sidebar library
5. Drag to page
6. Configure overrides (optional)
7. Save page
8. Component appears on page!
```

---

**This is exactly what you're asking for! Should I build this complete system now?** 🚀

**Created:** 2026-04-25  
**Status:** 📋 Architecture Ready | Awaiting Approval to Build

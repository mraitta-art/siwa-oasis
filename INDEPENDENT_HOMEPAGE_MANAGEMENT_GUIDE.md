# 📖 Independent Homepage Management System Guide

## Overview

The Independent Homepage Management System allows admins to create and manage multiple homepages independently. Each homepage can have its own layout, sections, styling, and content—perfect for category pages, service pages, and custom landing pages.

---

## 🎯 Key Features

### 1. **Multiple Independent Homepages**
- Create unlimited homepages (main, category, service, custom)
- Each homepage has its own URL slug
- Independent publishing workflow (draft → published → archived)
- Version control with revision history

### 2. **Section-Based Architecture**
- Drag-and-drop sections
- Pre-built templates (Hero, Features, Gallery, Testimonials, CTA, etc.)
- Reorder sections easily
- Enable/disable sections without deleting

### 3. **Easy Management**
- Admin dashboard at `/admin/homepages-manager`
- Visual editor at `/admin/homepage-editor/[id]`
- Section manager at `/admin/homepage-sections/[id]`
- Live preview before publishing

### 4. **Analytics & Tracking**
- View count per page
- Click tracking on CTAs
- Conversion tracking
- Performance metrics

---

## 📁 Pages Created

### For Visitors
1. **`/services`** - Browse service categories
2. **`/categories`** - Browse business categories

### For Admins
1. **`/admin/homepages-manager`** - Manage all homepages
2. **`/admin/homepage-editor/[id]`** - Edit individual homepage layout
3. **`/admin/homepage-sections/[id]`** - Manage sections within a page
4. **`/admin/homepage-preview/[id]`** - Preview before publishing

---

## 🔧 Database Tables

### `homepages`
Stores homepage metadata
```
id, name, slug, type, status, theme, layout, title, description, 
meta_keywords, meta_description, published_at, created_at, updated_at, 
created_by, updated_by
```

### `homepage_sections`
Stores sections within each homepage
```
id, homepage_id, section_type, title, description, content, position, 
enabled, style_config, created_at, updated_at
```

### `homepage_section_items`
Stores individual items within sections (e.g., hotel cards in gallery)
```
id, section_id, title, description, content, image_url, link_url, 
position, metadata, created_at, updated_at
```

### `homepage_versions`
Version history for rollback capability
```
id, homepage_id, version_number, data, change_summary, created_by, created_at
```

### `homepage_analytics`
Performance tracking
```
id, homepage_id, views, clicks, conversions, bounce_rate, 
avg_session_duration, date
```

---

## 🚀 Quick Start

### Step 1: Setup Database
Run the migration SQL:
```sql
-- See: database-migrations/homepage-management.sql
```

### Step 2: Access Admin Dashboard
Visit: `http://localhost:3004/admin/homepages-manager`

### Step 3: Create a New Homepage
1. Click **"+ Create New Homepage"**
2. Enter page name (e.g., "Hotels & Resorts")
3. Select page type (Main, Category, Service, Custom)
4. Click **Create**

### Step 4: Edit the Homepage
1. Click **✏️ Edit** on the homepage card
2. Configure page settings (title, description, theme)
3. Add or remove sections
4. Reorder sections by dragging
5. Save settings

### Step 5: Manage Sections
1. Click **📋 Sections** on the homepage card
2. Edit individual section content
3. Customize styles
4. Add items to sections
5. Preview and publish

### Step 6: Preview & Publish
1. Click **👁️ Preview** to see how it looks
2. If satisfied, click **✓ Publish**
3. Page is now live at the slug URL

---

## 📋 Section Types Available

| Type | Icon | Description |
|------|------|-------------|
| **Hero** | 🎬 | Large banner with headline and CTA |
| **Features** | ✨ | Highlight key features |
| **Gallery** | 🖼️ | Showcase images or cards |
| **Testimonials** | 💬 | Customer reviews and ratings |
| **Team** | 👥 | Team member profiles |
| **FAQ** | ❓ | Frequently asked questions |
| **Pricing** | 💰 | Pricing plans or packages |
| **CTA** | 🎯 | Call-to-action buttons or forms |

---

## 🎨 Customization

### Theme Options
- **Dark** - Dark background with golden accents (default)
- **Light** - Light background with dark text
- **Golden** - Rich golden color scheme

### Layout Options
- **Standard** - Full width with sidebars
- **Minimal** - Simplified layout
- **Showcase** - Emphasis on visuals

### Section Styling
Each section can have custom:
- Background color/gradient
- Text color
- Padding and spacing
- Border styles
- Custom CSS

---

## 🔄 Workflow

```
Create Homepage
    ↓
Add Sections
    ↓
Configure Sections
    ↓
Add Section Items
    ↓
Preview
    ↓
Save Draft
    ↓
Publish
    ↓
Monitor Analytics
    ↓
Edit / Update
    ↓
New Version Created
```

---

## 📊 Analytics

Each homepage tracks:
- **Views** - Total page visits
- **Clicks** - Interactions with CTAs
- **Conversions** - Completed actions
- **Bounce Rate** - Percentage who leave without interaction
- **Session Duration** - Average time on page

View analytics at: `/admin/homepages-manager` (each homepage shows this week's stats)

---

## 🔐 Permissions

Currently, requires admin role:
- `super_admin`
- `content_admin`
- `sales_manager`

Modify in `/src/lib/auth.ts` as needed.

---

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile** - Optimized for phones
- **Tablet** - Optimized for tablets
- **Desktop** - Full-featured layout

Preview responsive at: `/admin/homepage-preview/[id]`

---

## 🔗 Related Pages

### Services Page
- **URL**: `/services`
- **Features**: 8 service categories with emojis and descriptions
- **Links**: Each service links to search results

### Categories Page
- **URL**: `/categories`
- **Features**: 12 business categories with stats
- **Links**: Each category links to filtered search

### Homepage Guide
- **URL**: `/admin/homepage-guide`
- **For**: New admins learning the system

---

## 🛠️ API Endpoints (Future)

Future API endpoints for programmatic access:

```typescript
// Get all homepages
GET /api/homepages

// Get specific homepage
GET /api/homepages/:id

// Create homepage
POST /api/homepages
Body: { name, slug, type, theme, layout }

// Update homepage
PUT /api/homepages/:id
Body: { name, description, theme, layout, ... }

// Publish homepage
POST /api/homepages/:id/publish

// Get sections
GET /api/homepages/:id/sections

// Get analytics
GET /api/homepages/:id/analytics?date=2024-01-15
```

---

## 🐛 Troubleshooting

### Page Not Showing
1. Check status is "published"
2. Check slug is correct
3. Verify sections have content
4. Check admin permissions

### Sections Not Saving
1. Refresh page after saving
2. Check browser console for errors
3. Verify database connection
4. Check user permissions

### Preview Not Loading
1. Ensure page has at least one section
2. Check theme and layout are valid
3. Verify no JavaScript errors in console

---

## 📈 Best Practices

### 1. **Use Descriptive Names**
✅ "Hotels & Resorts - 5-Star Luxury"
❌ "Page 1"

### 2. **Organize Sections Logically**
1. Hero (headline)
2. Features (why choose us)
3. Featured Items (gallery)
4. Testimonials (social proof)
5. CTA (action)

### 3. **Keep Content Concise**
- Short headlines
- Bullet points
- 50-100 words per section

### 4. **Use High-Quality Images**
- 1200x600 for hero
- 400x400 for gallery
- 150x150 for team

### 5. **Test on Mobile**
- Check preview on phone
- Ensure text is readable
- Test all buttons/links

### 6. **Create Versions**
- Save version before major changes
- Document changes
- Easy rollback if needed

---

## 🎓 Examples

### Hotel Homepage
```
1. Hero: "Luxury Desert Hotels"
2. Features: Comfort, Service, Location
3. Gallery: Featured Properties
4. Testimonials: Guest Reviews
5. CTA: Book Now
```

### Restaurant Homepage
```
1. Hero: Restaurant Name & Cuisine
2. Features: Menu, Ambiance, Service
3. Gallery: Dish Photos
4. Testimonials: Diner Reviews
5. CTA: Reserve Table
```

### Tour Company Homepage
```
1. Hero: "Desert Safaris"
2. Features: Expert Guides, Equipment, Safety
3. Gallery: Tour Photos
4. Testimonials: Tourist Reviews
5. CTA: Book Tour
```

---

## 📞 Support

### Common Tasks
- **Add new page**: Go to `/admin/homepages-manager` → Create New
- **Edit existing**: Click ✏️ Edit
- **Add section**: Click 📋 Sections → Add New
- **Publish**: Click ✓ Publish
- **Preview**: Click 👁️ Preview

### Need Help?
- Check this guide
- Visit `/admin/homepage-guide`
- Contact admin team

---

## ✅ Checklist for New Homepages

- [ ] Created homepage with descriptive name
- [ ] Set slug URL
- [ ] Selected theme (dark/light/golden)
- [ ] Added hero section with headline
- [ ] Added 2-3 feature sections
- [ ] Added testimonials or gallery
- [ ] Added CTA section
- [ ] Filled all text fields
- [ ] Added images (if applicable)
- [ ] Previewed on mobile
- [ ] Published to live
- [ ] Shared link with team

---

## 🚀 Next Steps

1. **Create first homepage** at `/admin/homepages-manager`
2. **Add sections** at `/admin/homepage-sections/[id]`
3. **Customize styles** via section settings
4. **Preview** before publishing
5. **Publish** when ready
6. **Monitor analytics** to track performance

---

**System Ready to Use!** 🎉

Visit `/admin/homepages-manager` to get started.

# 🏗️ Section-Based Core Architecture: Complete Implementation Guide

## 🎯 Vision

**Every business is a collection of sections that:**
- ✅ Inherit from parent business forms
- ✅ Include specialized sections (Opportunities, Pricing, Packages, Offers, Auction, Basic Data)
- ✅ Enable comparison across businesses
- ✅ Enable advanced search/filtering by component data
- ✅ Serve as the core foundation for all services

---

## 🔄 Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                 │
│  ├─ Business Cards (show all sections)             │
│  ├─ Comparison View (compare section data)         │
│  ├─ Search Results (filtered by sections)          │
│  └─ Vendor Dashboard (edit sections)               │
├─────────────────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER                               │
│  ├─ Form Inheritance (child inherits parent)       │
│  ├─ Section Resolver (resolve inherited sections)  │
│  ├─ Comparison Engine (compare section data)       │
│  └─ Search Engine (filter by components)           │
├─────────────────────────────────────────────────────┤
│  DATA LAYER                                         │
│  ├─ businesses (with parent_id for hierarchy)      │
│  ├─ sections (templates)                           │
│  ├─ section_components (fields in sections)        │
│  ├─ section_component_data (vendor data)           │
│  ├─ business_section_inheritance (inheritance)     │
│  └─ business_comparisons (comparison cache)        │
├─────────────────────────────────────────────────────┤
│  FOUNDATION: SECTIONS                               │
│  "Sections are the new database schema"             │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Enhanced Database Schema

### 1. Businesses Table (Enhanced)
```sql
CREATE TABLE businesses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  type_id INT,                    -- Business type (Hotel, Restaurant, etc)
  parent_id INT,                  -- Parent business (for inheritance)
  basic_data JSON,                -- Direct basic info (name, phone, email)
  inherit_sections BOOLEAN,       -- Inherit sections from parent?
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES businesses(id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_type_id (type_id)
);
```

**Example:**
```json
{
  "id": 1,
  "name": "Siwa Oasis Resort (Main)",
  "type_id": 1,
  "parent_id": null,
  "inherit_sections": false,
  "basic_data": {
    "phone": "+20-123-456-7890",
    "email": "info@siwaoasis.com",
    "address": "123 Nile, Siwa"
  }
}
```

```json
{
  "id": 2,
  "name": "Siwa Oasis Resort - Luxury Wing",
  "type_id": 1,
  "parent_id": 1,
  "inherit_sections": true,
  "basic_data": {
    "phone": "+20-987-654-3210",
    "email": "luxury@siwaoasis.com"
  }
}
```

### 2. Business Section Inheritance Table (New)
```sql
CREATE TABLE business_section_inheritance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT,
  parent_business_id INT,
  section_id INT,
  override_level INT,             -- 0=use parent, 1=override, 2=custom
  inherited_at TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (parent_business_id) REFERENCES businesses(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  INDEX idx_business (business_id),
  INDEX idx_parent (parent_business_id)
);
```

**Example:**
```json
{
  "business_id": 2,
  "parent_business_id": 1,
  "section_id": 5,               -- Rooms & Pricing section
  "override_level": 1,           -- Override parent data
  "inherited_at": "2026-06-11T10:00:00Z"
}
```

### 3. Sections Table (Enhanced)
```sql
CREATE TABLE sections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  icon VARCHAR(50),
  section_category VARCHAR(100),  -- 'basic_data', 'pricing', 'opportunities', 'offers', 'auction', 'packages'
  description TEXT,
  required BOOLEAN,
  vendor_editable BOOLEAN,
  show_on_public BOOLEAN,
  show_on_minisite BOOLEAN,
  is_filterable BOOLEAN,
  show_on_card BOOLEAN,
  is_searchable BOOLEAN,          -- Can filter by this?
  is_comparable BOOLEAN,          -- Can compare this?
  sort_order INT,
  active BOOLEAN,
  created_at TIMESTAMP,
  INDEX idx_category (section_category),
  INDEX idx_searchable (is_searchable)
);
```

### 4. Section Components Table (Enhanced)
```sql
CREATE TABLE section_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  section_id INT,
  component_type VARCHAR(100),    -- text, number, image, date, select, etc
  label VARCHAR(255),
  description TEXT,
  is_required BOOLEAN,
  is_repeatable BOOLEAN,
  max_items INT,
  is_searchable BOOLEAN,          -- Can search/filter by this field?
  is_comparable BOOLEAN,          -- Can compare this field?
  data_type VARCHAR(50),          -- string, number, boolean, date
  config JSON,                    -- Validation rules, options, etc
  created_at TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id),
  INDEX idx_searchable (is_searchable)
);
```

### 5. Section Component Data Table (Existing)
```sql
CREATE TABLE section_component_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT,
  section_component_id INT,
  data JSON,
  status VARCHAR(50),
  display_order INT,
  inherited_from_parent BOOLEAN,  -- Did we inherit this from parent?
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (section_component_id) REFERENCES section_components(id),
  INDEX idx_business (business_id),
  INDEX idx_searchable (section_component_id) -- for search queries
);
```

---

## 🔀 Section Inheritance System

### How Inheritance Works

**Scenario:** Siwa Oasis Resort has 5 locations, all should share Rooms & Pricing

```
Parent Business (id=1): Siwa Oasis Resort
├─ Section: Basic Data
│  ├─ Component: Main Phone
│  ├─ Component: Main Email
│  └─ Component: Main Address
├─ Section: Rooms & Pricing
│  ├─ Component: Room Type
│  ├─ Component: Price
│  ├─ Component: Capacity
│  └─ Component: Amenities
└─ Section: Business Opportunities
   ├─ Component: Partnership Type
   └─ Component: Terms

Child Business (id=2): Siwa Oasis Resort - Luxury Wing
├─ Inherit: Basic Data (from parent)
├─ Override: Rooms & Pricing (own prices, different amenities)
└─ Custom: Location-specific data
```

### API: Get Inherited Sections for Business

```typescript
// Get all sections a business has (inherited + own)
async function getBusinessSections(businessId: number) {
  const business = await db.query(
    'SELECT * FROM businesses WHERE id = ?',
    [businessId]
  );

  if (!business.parent_id || !business.inherit_sections) {
    // No inheritance - get only this business's sections
    return await db.query(
      `SELECT s.* FROM sections s
       WHERE s.id IN (
         SELECT section_id FROM business_section_inheritance
         WHERE business_id = ? AND override_level IN (1, 2)
       )`
      [businessId]
    );
  }

  // Has parent - get inherited sections
  const parentSections = await db.query(
    `SELECT s.* FROM sections s
     WHERE s.id IN (
       SELECT section_id FROM business_section_inheritance
       WHERE business_id = ?
     )
     AND override_level = 0`,
    [businessId]
  );

  const ownSections = await db.query(
    `SELECT s.* FROM sections s
     WHERE s.id IN (
       SELECT section_id FROM business_section_inheritance
       WHERE business_id = ? AND override_level IN (1, 2)
     )`,
    [businessId]
  );

  return [...parentSections, ...ownSections];
}
```

### API: Get Component Data (With Inheritance)

```typescript
// Get component data, checking parent first if inherited
async function getComponentData(businessId: number, componentId: number) {
  const data = await db.query(
    `SELECT * FROM section_component_data
     WHERE business_id = ? AND section_component_id = ?`,
    [businessId, componentId]
  );

  if (!data) {
    // Not set at this level - check parent
    const business = await db.query(
      'SELECT parent_id FROM businesses WHERE id = ?',
      [businessId]
    );

    if (business.parent_id) {
      return await getComponentData(business.parent_id, componentId);
    }
  }

  return data;
}
```

---

## 📊 Specialized Section Types

### 1. Basic Data Section
```json
{
  "name": "Basic Data",
  "section_category": "basic_data",
  "description": "Core business information",
  "is_searchable": true,
  "is_comparable": true,
  "components": [
    {
      "label": "Business Name",
      "component_type": "text",
      "is_searchable": true,
      "is_comparable": true
    },
    {
      "label": "Phone",
      "component_type": "tel",
      "is_searchable": true,
      "is_comparable": false
    },
    {
      "label": "Email",
      "component_type": "email",
      "is_searchable": true,
      "is_comparable": false
    },
    {
      "label": "Address",
      "component_type": "map",
      "is_searchable": true,
      "is_comparable": false
    },
    {
      "label": "Business Hours",
      "component_type": "time_range",
      "is_searchable": false,
      "is_comparable": true
    },
    {
      "label": "Star Rating",
      "component_type": "number",
      "is_searchable": true,
      "is_comparable": true,
      "min": 0,
      "max": 5
    }
  ]
}
```

### 2. Pricing Section
```json
{
  "name": "Pricing & Packages",
  "section_category": "pricing",
  "description": "Prices and package options",
  "is_searchable": true,
  "is_comparable": true,
  "components": [
    {
      "label": "Price Range (Low)",
      "component_type": "number",
      "is_searchable": true,
      "is_comparable": true,
      "data_type": "number"
    },
    {
      "label": "Price Range (High)",
      "component_type": "number",
      "is_searchable": true,
      "is_comparable": true,
      "data_type": "number"
    },
    {
      "label": "Currency",
      "component_type": "select",
      "is_searchable": true,
      "is_comparable": false,
      "options": ["EGP", "USD", "EUR"]
    },
    {
      "label": "Package",
      "component_type": "repeatable",
      "is_repeatable": true,
      "max_items": 10,
      "is_searchable": false,
      "is_comparable": true,
      "sub_components": [
        { "label": "Package Name", "type": "text" },
        { "label": "Price", "type": "number" },
        { "label": "Includes", "type": "textarea" }
      ]
    }
  ]
}
```

### 3. Opportunities Section
```json
{
  "name": "Business Opportunities",
  "section_category": "opportunities",
  "description": "Partnership and investment opportunities",
  "is_searchable": true,
  "is_comparable": true,
  "components": [
    {
      "label": "Opportunity Type",
      "component_type": "multi_select",
      "is_searchable": true,
      "is_comparable": true,
      "options": ["Franchise", "Partnership", "Investment", "Supplier", "Affiliate"]
    },
    {
      "label": "Minimum Investment",
      "component_type": "number",
      "is_searchable": true,
      "is_comparable": true,
      "data_type": "number"
    },
    {
      "label": "ROI Projection",
      "component_type": "number",
      "is_searchable": false,
      "is_comparable": true,
      "suffix": "%"
    },
    {
      "label": "Available Territories",
      "component_type": "repeatable",
      "is_repeatable": true,
      "is_searchable": true,
      "is_comparable": false
    }
  ]
}
```

### 4. Offers & Promotions Section
```json
{
  "name": "Current Offers",
  "section_category": "offers",
  "description": "Promotions and special offers",
  "is_searchable": true,
  "is_comparable": false,
  "components": [
    {
      "label": "Offer",
      "component_type": "repeatable",
      "is_repeatable": true,
      "max_items": 20,
      "is_searchable": true,
      "is_comparable": false,
      "sub_components": [
        { "label": "Title", "type": "text" },
        { "label": "Description", "type": "textarea" },
        { "label": "Discount %", "type": "number" },
        { "label": "Valid Until", "type": "date" }
      ]
    }
  ]
}
```

### 5. Auction Section
```json
{
  "name": "Auction Listings",
  "section_category": "auction",
  "description": "Items and services available for auction",
  "is_searchable": true,
  "is_comparable": false,
  "components": [
    {
      "label": "Current Auctions",
      "component_type": "repeatable",
      "is_repeatable": true,
      "is_searchable": true,
      "sub_components": [
        { "label": "Item Name", "type": "text" },
        { "label": "Starting Price", "type": "number" },
        { "label": "Current Bid", "type": "number" },
        { "label": "Bid Count", "type": "number" },
        { "label": "Ends At", "type": "datetime" },
        { "label": "Images", "type": "image", "is_repeatable": true }
      ]
    }
  ]
}
```

---

## 🔍 Advanced Search by Section Components

### Search Filter Structure

```typescript
interface SearchFilter {
  section_id: number;
  component_id: number;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
}

// User searches for: "Hotels with price < 100 EGP"
const filters: SearchFilter[] = [
  {
    section_id: 3,           // Pricing section
    component_id: 15,        // Price Range (High) component
    operator: 'less',
    value: 100
  }
];
```

### API: Search by Section Components

```typescript
async function searchBySection(filters: SearchFilter[]) {
  let query = `
    SELECT DISTINCT b.* FROM businesses b
  `;

  filters.forEach((filter, idx) => {
    query += `
      LEFT JOIN section_component_data scd${idx}
        ON b.id = scd${idx}.business_id
        AND scd${idx}.section_component_id = ${filter.component_id}
    `;
  });

  query += ` WHERE 1=1 `;

  filters.forEach((filter, idx) => {
    switch(filter.operator) {
      case 'equals':
        query += ` AND JSON_EXTRACT(scd${idx}.data, '$.value') = '${filter.value}'`;
        break;
      case 'greater':
        query += ` AND CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) > ${filter.value}`;
        break;
      case 'less':
        query += ` AND CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) < ${filter.value}`;
        break;
      case 'contains':
        query += ` AND JSON_EXTRACT(scd${idx}.data, '$.value') LIKE '%${filter.value}%'`;
        break;
      case 'between':
        query += ` AND CAST(JSON_EXTRACT(scd${idx}.data, '$.value') AS DECIMAL) BETWEEN ${filter.value.min} AND ${filter.value.max}`;
        break;
      case 'in':
        const values = filter.value.map(v => `'${v}'`).join(',');
        query += ` AND JSON_EXTRACT(scd${idx}.data, '$.value') IN (${values})`;
        break;
    }
  });

  return await db.query(query);
}
```

### UI: Search Filters

```jsx
// Dynamic search interface built from section metadata
function AdvancedSearch() {
  const [filters, setFilters] = useState([]);
  
  // Get all searchable sections
  const sections = await fetch('/api/sections?is_searchable=true').then(r => r.json());
  
  return (
    <div>
      {sections.map(section => (
        <div key={section.id} className="search-section">
          <h3>{section.name}</h3>
          {section.components
            .filter(c => c.is_searchable)
            .map(component => (
              <SearchField 
                key={component.id}
                component={component}
                onFilter={(value) => addFilter(section.id, component.id, value)}
              />
            ))
          }
        </div>
      ))}
    </div>
  );
}
```

---

## ⚖️ Business Comparison Engine

### How Comparison Works

**Customer compares:** Hotel A vs Hotel B vs Hotel C

```
Filters applied:
┌────────────────────────────┐
│ Compare by: Basic Data     │
│            Pricing         │
│            Amenities       │
└────────────────────────────┘

Result:
┌──────────────────────────────────────────────────┐
│            │ Hotel A  │ Hotel B  │ Hotel C       │
├──────────────────────────────────────────────────┤
│ Price      │ $50-150  │ $100-200 │ $75-180       │
│ Rooms      │ 50       │ 100      │ 75            │
│ WiFi       │ ✅       │ ✅       │ ❌            │
│ Pool       │ ✅       │ ✅       │ ✅            │
│ Restaurant │ ✅       │ ❌       │ ✅            │
│ Rating     │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐       │
└──────────────────────────────────────────────────┘
```

### API: Get Comparison Data

```typescript
async function compareBusinesses(businessIds: number[], sectionIds: number[]) {
  const comparison = {};

  for (const businessId of businessIds) {
    comparison[businessId] = {};

    for (const sectionId of sectionIds) {
      const section = await db.query(
        'SELECT * FROM sections WHERE id = ? AND is_comparable = true',
        [sectionId]
      );

      if (!section) continue;

      const components = await db.query(
        'SELECT * FROM section_components WHERE section_id = ? AND is_comparable = true',
        [sectionId]
      );

      comparison[businessId][section.name] = {};

      for (const component of components) {
        const data = await getComponentData(businessId, component.id);
        comparison[businessId][section.name][component.label] = data?.data?.value;
      }
    }
  }

  return comparison;
}
```

### UI: Comparison View

```jsx
function ComparisonView({ businessIds, sectionIds }) {
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetch('/api/compare', {
      method: 'POST',
      body: JSON.stringify({ businessIds, sectionIds })
    })
      .then(r => r.json())
      .then(setComparison);
  }, [businessIds, sectionIds]);

  if (!comparison) return <div>Loading...</div>;

  const comparableSections = Object.values(comparison)[0];

  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Field</th>
          {businessIds.map(id => (
            <th key={id}>{comparison[id]?.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(comparableSections).map(([sectionName, fields]) => (
          <tr key={sectionName} className="section-header">
            <td colSpan={businessIds.length + 1}><strong>{sectionName}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 🏪 Vendor Dashboard: Edit Inherited Sections

### Workflow

```
Vendor logs in (Business ID: 2, Parent ID: 1)
  ↓
System queries:
  1. Parent sections (Business 1)
  2. Child sections (Business 2)
  3. Inherited overrides
  ↓
Dashboard shows:
  ├─ Inherited sections (with override option)
  ├─ Custom sections
  └─ Add new sections button
  ↓
Vendor edits:
  ├─ "Use parent data" (linked, auto-updates)
  ├─ "Override parent" (own data, different from parent)
  └─ Save changes
```

### UI: Section Management in Vendor Dashboard

```jsx
function VendorSectionManager({ businessId }) {
  const [sections, setSections] = useState([]);
  const [inheritance, setInheritance] = useState({});

  useEffect(() => {
    // Get business with parent info
    fetch(`/api/businesses/${businessId}`)
      .then(r => r.json())
      .then(business => {
        // Get sections for this business
        fetch(`/api/businesses/${businessId}/sections`)
          .then(r => r.json())
          .then(setSections);

        // Get inheritance info
        if (business.parent_id) {
          fetch(`/api/business-inheritance/${businessId}`)
            .then(r => r.json())
            .then(setInheritance);
        }
      });
  }, [businessId]);

  return (
    <div className="vendor-sections">
      {sections.map(section => (
        <SectionCard 
          key={section.id}
          section={section}
          isInherited={inheritance[section.id]?.override_level === 0}
          onOverride={() => handleOverride(section.id)}
          onUseParent={() => handleUseParent(section.id)}
          onEdit={() => handleEdit(section.id)}
        />
      ))}
    </div>
  );
}

function SectionCard({ section, isInherited, onOverride, onUseParent, onEdit }) {
  return (
    <div className="section-card">
      <h3>{section.name}</h3>
      {isInherited ? (
        <>
          <p>📎 Inheriting from parent business</p>
          <button onClick={onOverride}>Override with own data</button>
          <button onClick={onEdit}>View parent data</button>
        </>
      ) : (
        <>
          <p>✏️ You have custom data</p>
          <button onClick={onEdit}>Edit</button>
          <button onClick={onUseParent}>Use parent data</button>
        </>
      )}
    </div>
  );
}
```

---

## 📈 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create business_section_inheritance table
- [ ] Add parent_id to businesses table
- [ ] Add is_searchable, is_comparable flags to components
- [ ] Build inheritance resolver functions

### Phase 2: Search (Week 2-3)
- [ ] Build dynamic search filter UI
- [ ] Implement searchBySection() API
- [ ] Create search results page with filters
- [ ] Add filter persistence (URL state)

### Phase 3: Comparison (Week 3-4)
- [ ] Build comparison view UI
- [ ] Implement compareBusinesses() API
- [ ] Create multi-select interface for choosing businesses
- [ ] Add comparison sharing/embedding

### Phase 4: Vendor Experience (Week 4-5)
- [ ] Build inheritance UI in vendor dashboard
- [ ] Implement override/use-parent functionality
- [ ] Create section inheritance management
- [ ] Add change logs for inherited data

### Phase 5: Specialization (Week 5-6)
- [ ] Create Opportunities section template
- [ ] Create Pricing section template
- [ ] Create Offers section template
- [ ] Create Auction section template

### Phase 6: Polish (Week 6-7)
- [ ] Performance optimization (caching)
- [ ] Testing (inheritance scenarios)
- [ ] Documentation & training
- [ ] Deploy to production

---

## 🎯 Business Use Cases

### Use Case 1: Hotel Chain
```
Parent: "Siwa Grand Hotel"
├─ Child: "Siwa Grand - Downtown"
│  ├─ Inherits: Basic Hotel Info, Amenities
│  ├─ Overrides: Pricing (location-specific)
│  └─ Custom: Hours (maybe 24/7 downtown location)
├─ Child: "Siwa Grand - Airport"
│  ├─ Inherits: Basic Hotel Info, Amenities
│  ├─ Overrides: Pricing (different zone)
│  └─ Custom: Hours (matches airport schedule)
└─ Child: "Siwa Grand - Resort"
   ├─ Inherits: Basic Hotel Info
   ├─ Overrides: Amenities (resort-specific)
   └─ Custom: Pricing (premium pricing)
```

### Use Case 2: Restaurant Group
```
Parent: "Siwa Cuisine Restaurant Group"
├─ Child: "Siwa Cuisine - Downtown Branch"
│  ├─ Inherits: Menu, Pricing
│  ├─ Overrides: Hours (downtown schedule)
│  └─ Custom: Phone (branch-specific)
├─ Child: "Siwa Cuisine - Mall Branch"
│  ├─ Inherits: Menu
│  ├─ Overrides: Pricing (mall rates)
│  └─ Custom: Parking Info
└─ Child: "Siwa Cuisine - Desert Branch"
   ├─ Inherits: Menu
   ├─ Custom: Hours (limited desert schedule)
   └─ Custom: Offers (special desert experience)
```

### Use Case 3: Tour Operator
```
Parent: "Siwa Adventures"
├─ Child: "Siwa Adventures - Day Tours"
│  ├─ Inherits: Company Info, Insurance Info
│  ├─ Custom: Tours (day tour packages)
│  └─ Custom: Pricing (per-day rates)
├─ Child: "Siwa Adventures - Expeditions"
│  ├─ Inherits: Company Info
│  ├─ Custom: Tours (multi-day expeditions)
│  └─ Custom: Pricing (expedition rates)
└─ Child: "Siwa Adventures - Private Guides"
   ├─ Inherits: Company Info
   └─ Custom: Services (private guide offerings)
```

---

## 🔐 Permissions & Access Control

```
PARENT BUSINESS OWNER:
✅ Edit sections for entire chain
✅ Set defaults for all locations
✅ View comparison across locations
✅ Manage inheritance settings

CHILD BUSINESS OWNER:
✅ Override parent sections (with approval?)
✅ Add location-specific sections
✅ Edit own component data
❌ Edit parent sections
❌ Remove inherited sections

CUSTOMER:
✅ View all sections (inherited + custom)
✅ Compare sections across businesses
✅ Search by section components
❌ Edit anything
❌ See private/draft sections
```

---

## 💾 Data Migration from Old Schema

### Migration Script

```sql
-- 1. Add new columns to businesses
ALTER TABLE businesses ADD COLUMN parent_id INT;
ALTER TABLE businesses ADD COLUMN inherit_sections BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD FOREIGN KEY (parent_id) REFERENCES businesses(id);

-- 2. Create inheritance table
CREATE TABLE business_section_inheritance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT,
  parent_business_id INT,
  section_id INT,
  override_level INT DEFAULT 0,
  inherited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (parent_business_id) REFERENCES businesses(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  INDEX idx_business (business_id)
);

-- 3. Add flags to section_components
ALTER TABLE section_components ADD COLUMN is_searchable BOOLEAN DEFAULT FALSE;
ALTER TABLE section_components ADD COLUMN is_comparable BOOLEAN DEFAULT FALSE;

-- 4. Add flags to sections
ALTER TABLE sections ADD COLUMN section_category VARCHAR(100);
ALTER TABLE sections ADD COLUMN is_searchable BOOLEAN DEFAULT FALSE;
ALTER TABLE sections ADD COLUMN is_comparable BOOLEAN DEFAULT FALSE;
ALTER TABLE sections ADD INDEX idx_category (section_category);

-- 5. Add inheritance flag to section_component_data
ALTER TABLE section_component_data ADD COLUMN inherited_from_parent BOOLEAN DEFAULT FALSE;
```

---

## 🚀 Performance Optimization

### Caching Strategy

```typescript
// Cache inherited sections (rarely change)
const inheritedSectionsCache = new Map();

async function getBusinessSections(businessId) {
  const cacheKey = `sections:${businessId}`;
  
  if (inheritedSectionsCache.has(cacheKey)) {
    return inheritedSectionsCache.get(cacheKey);
  }

  const sections = await resolveInheritedSections(businessId);
  inheritedSectionsCache.set(cacheKey, sections);
  
  // Cache for 1 hour
  setTimeout(() => inheritedSectionsCache.delete(cacheKey), 3600000);
  
  return sections;
}

// Invalidate cache when inheritance changes
async function updateInheritance(businessId, changes) {
  await db.query('UPDATE business_section_inheritance SET ? WHERE business_id = ?', [changes, businessId]);
  inheritedSectionsCache.delete(`sections:${businessId}`);
}
```

### Database Indexes

```sql
-- Critical for search performance
CREATE INDEX idx_component_data_business ON section_component_data(business_id);
CREATE INDEX idx_component_data_component ON section_component_data(section_component_id);
CREATE INDEX idx_component_data_searchable ON section_component_data(section_component_id, business_id);

-- Critical for inheritance
CREATE INDEX idx_inheritance_business ON business_section_inheritance(business_id);
CREATE INDEX idx_inheritance_parent ON business_section_inheritance(parent_business_id);

-- For UI performance
CREATE INDEX idx_sections_searchable ON sections(is_searchable);
CREATE INDEX idx_sections_comparable ON sections(is_comparable);
```

---

## 📚 API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/businesses/:id/sections` | GET | Get all sections (inherited + own) |
| `/api/business-inheritance/:id` | GET | Get inheritance settings |
| `/api/business-inheritance/:id` | POST | Update inheritance |
| `/api/search/by-sections` | POST | Search using section filters |
| `/api/compare/businesses` | POST | Compare multiple businesses |
| `/api/sections?is_searchable=true` | GET | Get searchable sections |
| `/api/sections?is_comparable=true` | GET | Get comparable sections |

---

## 🎓 Training Materials

### For Site Admins:
1. How to create inherited business chains
2. How to set up searchable components
3. How to configure comparable sections
4. How to manage inheritance overrides

### For Vendors:
1. How to use inherited sections
2. How to override parent data
3. How to add custom sections
4. How to manage multiple locations

### For Customers:
1. How to search by section components
2. How to compare businesses
3. How to filter by specific criteria
4. How to see inherited vs. custom data

---

## 🎯 Success Metrics

Track these to measure implementation success:

- ✅ **Search effectiveness:** % of searches that return results
- ✅ **Comparison usage:** # of comparisons created/viewed
- ✅ **Inheritance efficiency:** % of data inherited vs. duplicated
- ✅ **Query performance:** Average response time for search < 200ms
- ✅ **Vendor satisfaction:** % of vendors using inheritance
- ✅ **Customer satisfaction:** # of return comparisons

---

## Summary

**This architecture:**
- ✅ Eliminates data duplication (inheritance)
- ✅ Enables powerful search (by components)
- ✅ Enables comparison (section-based)
- ✅ Scales to 1000+ businesses
- ✅ Makes sections the core foundation

**Sections become:**
- The data model
- The search interface
- The comparison engine
- The vendor workflow
- The customer experience

**All built on a single, unified concept: SECTIONS**

Ready to implement? Start with Phase 1! 🚀

# 🎯 Section-Based Features: What Needs to Be Added

## Current State ✅

You already have:
- ✅ Business types with parent/child relationships
- ✅ Sections system
- ✅ Component templates with `is_searchable` flag
- ✅ Section component data
- ✅ Dynamic rendering
- ✅ Page builder

---

## What's Missing ❌

### 1. **Business-Level Inheritance** (Not Type-Level)
**Current:** Business types inherit sections
**Needed:** Individual businesses inherit from parent business

```
Example:
Parent Business: "Siwa Oasis Resort" (id=1)
  └─ Child Business: "Siwa Oasis - Downtown" (id=2)
     Should inherit: Pricing, Amenities from parent
     Can override: Hours, Phone (location-specific)
```

**To add:** Just 2 database columns:
```sql
ALTER TABLE businesses ADD COLUMN parent_id INT;
ALTER TABLE businesses ADD COLUMN inherit_sections BOOLEAN;
```

### 2. **Search by Section Components**
**Current:** Search exists but uses keyword/vibe matching
**Needed:** Search/filter by actual component values

```
Example:
"Find all hotels where price < $100"
"Find all restaurants with vegetarian options"
"Find all tours with 5-star ratings"
```

**To add:** Query logic that filters `section_component_data` by values

### 3. **Business Comparison**
**Current:** No comparison feature
**Needed:** Compare multiple businesses side-by-side

```
Example:
Compare: Hotel A vs Hotel B vs Hotel C
By sections: Pricing, Rooms, Amenities, Ratings
Result: Side-by-side table
```

---

## The 3 Simple Additions

### Addition 1: Business Inheritance (DB + 2 APIs)

**Database:** 2 columns + 1 function

```sql
ALTER TABLE businesses 
ADD COLUMN parent_id INT REFERENCES businesses(id),
ADD COLUMN inherit_sections BOOLEAN DEFAULT FALSE;
```

**API 1: Setup Inheritance**
```typescript
// POST /api/businesses/:id/inherit
export async function POST(req: Request, { params }: any) {
  const { parentId } = await req.json();
  
  await execute(
    'UPDATE businesses SET parent_id = ?, inherit_sections = TRUE WHERE id = ?',
    [parentId, params.id]
  );
  
  return { success: true };
}
```

**API 2: Get Inherited Sections**
```typescript
// GET /api/businesses/:id/inherited-sections
export async function GET(req: Request, { params }: any) {
  const biz = await execute('SELECT parent_id FROM businesses WHERE id = ?', [params.id]);
  
  if (!biz.parent_id) return { sections: [] };
  
  // Get parent's sections
  const sections = await execute(
    `SELECT s.* FROM sections s
     INNER JOIN section_components sc ON s.id = sc.section_id
     WHERE ? IN (SELECT business_id FROM section_component_data 
                 WHERE section_component_id = sc.id)`,
    [biz.parent_id]
  );
  
  return { sections };
}
```

---

### Addition 2: Search by Component Values (1 API)

**API: Advanced Search**
```typescript
// POST /api/search/by-components
export async function POST(req: Request) {
  const { filters } = await req.json();
  // filters = [
  //   { componentId: 5, operator: 'less', value: 100 },
  //   { componentId: 12, operator: 'contains', value: 'vegan' }
  // ]
  
  let query = `
    SELECT DISTINCT b.* FROM businesses b
    WHERE 1=1
  `;
  
  for (const filter of filters) {
    query += ` AND b.id IN (
      SELECT business_id FROM section_component_data
      WHERE section_component_id = ${filter.componentId}
      AND JSON_EXTRACT(data, '$.value') ${
        filter.operator === 'less' ? '<' :
        filter.operator === 'greater' ? '>' :
        filter.operator === 'equals' ? '=' :
        'LIKE'
      } '${filter.value}'
    )`;
  }
  
  const results = await execute(query);
  return { results };
}
```

---

### Addition 3: Business Comparison (1 API)

**API: Compare Businesses**
```typescript
// POST /api/compare/businesses
export async function POST(req: Request) {
  const { businessIds, sectionIds } = await req.json();
  
  const comparison = {};
  
  for (const bizId of businessIds) {
    comparison[bizId] = { sections: {} };
    
    // Get business name
    const biz = await execute('SELECT name FROM businesses WHERE id = ?', [bizId]);
    comparison[bizId].name = biz.name;
    
    // For each section
    for (const secId of sectionIds) {
      const section = await execute('SELECT name FROM sections WHERE id = ?', [secId]);
      comparison[bizId].sections[section.name] = {};
      
      // Get comparable components
      const components = await execute(
        `SELECT id, label FROM section_components 
         WHERE section_id = ? AND is_comparable = TRUE`,
        [secId]
      );
      
      // Get values
      for (const comp of components) {
        const data = await execute(
          `SELECT data FROM section_component_data
           WHERE business_id = ? AND section_component_id = ?`,
          [bizId, comp.id]
        );
        comparison[bizId].sections[section.name][comp.label] = data?.data?.value;
      }
    }
  }
  
  return { comparison };
}
```

---

## Implementation Checklist (2-3 Hours)

### Step 1: Database (10 min)
- [ ] Run 2 ALTER TABLE commands
- [ ] Verify columns added with `DESC businesses`

### Step 2: Inheritance API (20 min)
- [ ] Create `src/app/api/businesses/[id]/inherit/route.ts`
- [ ] Test with Postman/curl

### Step 3: Search API (20 min)
- [ ] Create `src/app/api/search/by-components/route.ts`
- [ ] Test with filters

### Step 4: Comparison API (20 min)
- [ ] Create `src/app/api/compare/businesses/route.ts`
- [ ] Test with 3 businesses

### Step 5: Frontend Component (30 min)
- [ ] Create search UI
- [ ] Create comparison table UI

### Step 6: Integration (30 min)
- [ ] Connect UI to APIs
- [ ] Test end-to-end

---

## Use Right Now

With your existing system:

**1. For Business Inheritance:**
You have parent/child in business_types - just replicate for businesses table

**2. For Search by Components:**
You have component data - just add query logic to filter by values

**3. For Comparison:**
You have sections/components - just add comparison view logic

---

## Map to Your Existing Code

**Leverage these files you already have:**

```
src/lib/cache.ts                           → Already has parent_id logic
src/app/jana/types/page.tsx                → Copy inheritance pattern from here
src/app/api/businesses/[id]/route.ts      → Add inherit endpoint here
src/app/api/discovery/search/route.ts     → Model search after this
src/app/search/[id]/page.tsx              → Add comparison UI here
```

---

## The Real Gain

With these 3 additions, you transform sections from:

❌ **Static data structure**
✅ **Dynamic search & comparison engine**

Example enabled queries:
- "Find hotels where price < 100 AND rooms > 50 AND WiFi = yes"
- "Compare these 3 restaurants by pricing and menu items"
- "Show me all businesses inheriting from Main Location"

---

## Minimal Code Required

**Total: ~300 lines of code**

- 50 lines: Inheritance API
- 100 lines: Search API
- 100 lines: Comparison API
- 50 lines: Frontend UI

---

## Next Action

Choose one to implement first:

1. **Inheritance** - Enables location chains
2. **Search** - Enables advanced filtering
3. **Comparison** - Enables customer decisions

OR implement all 3 in parallel (they're independent)

Ready to code? I can provide exact implementations with your database schema.

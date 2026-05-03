# Dynamic Search Filters - Complete Implementation Guide

## Overview

**Problem:** How do we make search filters that automatically match what the admin selected in the search engine configuration?

**Solution:** Dynamic filters that:
1. ✅ Fetch search engine's `allowed_fields`
2. ✅ Generate appropriate input components (text, phone, select, range)
3. ✅ Validate filters respect `allowed_fields` before querying
4. ✅ Apply filters only to allowed fields to prevent unauthorized access

---

## Complete Flow: Admin → Filters → Search → Results

### Phase 1️⃣: Admin Creates Search Engine

**Admin goes to /admin/search-compare**

1. Creates Search Engine "Hotel Quick Search"
2. Selects allowed fields:
   - ✅ `basic_info.phone`
   - ✅ `location.city`
   - ❌ `basic_info.email` (NOT checked)
   - ❌ `basic_info.name` (NOT checked)

3. System auto-creates card layout (minimal template)
4. Saved to database:

```sql
INSERT INTO search_engines VALUES (
  id: 'se_hotel_basic',
  name: 'Hotel Quick Search',
  allowed_fields: ['basic_info.phone', 'location.city'],
  card_layout_id: 'card_se_1234'
);
```

---

### Phase 2️⃣: Landing Page Loads

**User visits `/search/hotels`**

```typescript
<SearchResultsPage params={{ searchEngineId: 'se_hotel_basic' }} />
```

**What happens:**
1. Page fetches search engine config: `se_hotel_basic`
2. Extracts `allowed_fields`: `['basic_info.phone', 'location.city']`
3. Passes to `DynamicSearchFilter` component

---

### Phase 3️⃣: Dynamic Filters Generate

**Component: `DynamicSearchFilter`**

```typescript
function DynamicSearchFilter({ searchEngineId }) {
  // 1. Fetch search engine
  const engine = await getSearchEngineFields(searchEngineId)
  
  // 2. Convert field paths to UI definitions
  const fieldDefs = [
    {
      fieldId: 'basic_info.phone',
      label: '📞 Phone Number',
      type: 'phone',
      placeholder: '+1 (555) 000-0000'
    },
    {
      fieldId: 'location.city',
      label: '🏙️ City',
      type: 'select',
      options: [{value: 'cairo', label: 'Cairo'}, ...]
    }
  ]
  
  // 3. Render these fields
  return <form>
    <PhoneFilterInput field={fieldDefs[0]} />
    <SelectFilterInput field={fieldDefs[1]} />
  </form>
}
```

**Result: Only 2 filters shown to user**
```
┌─────────────────────────────┐
│  🔍 Search & Filter         │
├─────────────────────────────┤
│                             │
│  📞 Phone Number            │
│  [________________]         │
│                             │
│  🏙️ City                    │
│  [Select City ▼]            │
│                             │
│  [✕ Clear All]              │
└─────────────────────────────┘
```

---

### Phase 4️⃣: User Enters Filters

**User input:**
```
Fill Phone: "+20100"
Select City: "cairo"
```

**Component triggers:**
```typescript
onFiltersChange({
  'basic_info.phone': '+20100',
  'location.city': 'cairo'
})
```

---

### Phase 5️⃣: Query Validation & Execution

**Component: `search-query.ts`**

```typescript
function buildSearchQuery(searchEngine, userFilters) {
  const conditions = []
  
  // Validate each filter
  Object.entries(userFilters).forEach(([fieldPath, value]) => {
    
    // ✅ SECURITY: Check field is allowed
    if (!searchEngine.allowed_fields.includes(fieldPath)) {
      console.warn(`Field ${fieldPath} NOT allowed - SKIPPING`)
      return  // ← Skip unauthorized fields
    }
    
    // ✅ Infer correct operator
    const op = inferOperator(fieldPath, value)
    // phone → 'ilike'
    // city → 'eq'
    
    // ✅ Map to database column
    const dbCol = mapFieldPathToColumn(fieldPath)
    // 'basic_info.phone' → 'contact->phone'
    // 'location.city' → 'location_id'
    
    conditions.push({
      field: dbCol,
      operator: op,
      value: value
    })
  })
  
  return conditions
}
```

**Result:**
```typescript
conditions = [
  { field: 'contact->phone', operator: 'ilike', value: '+20100' },
  { field: 'location_id', operator: 'eq', value: 'cairo' }
]
```

---

### Phase 6️⃣: Execute Search

**Component: `search-query.ts`**

```typescript
async function executeSearch(engineId, filters, page, pageSize) {
  // 1. Get engine config
  const engine = await supabase
    .from('search_engines')
    .select('*')
    .eq('id', engineId)
    .single()
  
  // 2. Build conditions (with validation)
  const conditions = buildSearchQuery(engine, filters)
  
  // 3. Build query
  let query = supabase.from('businesses').select('*', { count: 'exact' })
  
  // 4. Apply conditions
  conditions.forEach(cond => {
    if (cond.operator === 'ilike') {
      query = query.ilike(cond.field, `%${cond.value}%`)
    } else if (cond.operator === 'eq') {
      query = query.eq(cond.field, cond.value)
    }
  })
  
  // 5. Add pagination
  query = query.range(offset, offset + pageSize - 1)
  
  // 6. Execute
  const { data: results, count } = await query
  
  return { results, total: count, page, pageSize }
}
```

**Generated SQL:**
```sql
SELECT * FROM businesses 
WHERE contact->phone ILIKE '%+20100%'
  AND location_id = 'cairo'
LIMIT 12 OFFSET 0;
```

---

### Phase 7️⃣: Display Results

**Results rendered using card layout from search engine:**

```typescript
// Get card layout
const cardLayout = engine.card_layout_id // 'card_se_1234'

// Render results
results.map(result => (
  <ResultCard 
    key={result.id} 
    result={result}
    cardLayout={cardLayout}  // ← Use search engine's card
  />
))
```

**Display:**
```
┌─────────────────────────┐
│  Hotel A                │
│  📞 +20100123456        │  ← Phone (from phone field)
│  🏙️ Cairo               │  ← City (from city field)
│  [View Details →]       │
└─────────────────────────┘

┌─────────────────────────┐
│  Hotel B                │
│  📞 +20100654321        │
│  🏙️ Cairo               │
│  [View Details →]       │
└─────────────────────────┘
```

---

## Security: Why Validation Matters

### Scenario: Unauthorized Field Access

**Admin created search engine with:**
```typescript
allowed_fields: ['basic_info.phone', 'location.city']
```

**But user somehow tries to filter by email:**
```javascript
// User's browser sends:
filters = {
  'basic_info.phone': '+20100',
  'basic_info.email': 'hacker@example.com'  // ← Not allowed!
}
```

**System validation:**
```typescript
if (!searchEngine.allowed_fields.includes('basic_info.email')) {
  // ✅ Rejects this field - only searches phone + city
  console.warn('Email field not allowed in search engine')
  return  // ← SKIP
}
```

**Result: Email filter ignored, only phone+city searched**

---

## File Mapping

| File | Purpose |
|------|---------|
| `DynamicSearchFilter.tsx` | Component that fetches search engine config and renders filter inputs |
| `search-query.ts` | Service that validates filters and builds/executes queries |
| `page.tsx` (search results) | Landing page that uses both above components |

---

## Code Examples

### Example 1: Basic Setup

```typescript
// In landing page component
import { DynamicSearchFilter } from '@/components/DynamicSearchFilter'

export function HotelSearchPage() {
  return (
    <div>
      <DynamicSearchFilter
        searchEngineId="se_hotel_basic"
        onFiltersChange={(filters) => {
          // Filters already validated!
          performSearch(filters)
        }}
        layout="vertical"
        sticky={true}
      />
    </div>
  )
}
```

### Example 2: Get Field Definitions

```typescript
import { getSearchEngineFields } from '@/components/DynamicSearchFilter'

// Get filter definitions for a search engine
const fields = await getSearchEngineFields('se_hotel_basic')

// Result:
// [
//   { fieldId: 'basic_info.phone', label: '📞 Phone', type: 'phone' },
//   { fieldId: 'location.city', label: '🏙️ City', type: 'select' }
// ]
```

### Example 3: Build Query

```typescript
import { buildSearchQuery } from '@/lib/search-compare/search-query'

const engine = {
  allowed_fields: ['basic_info.phone', 'location.city'],
  criteria: []
}

const conditions = buildSearchQuery(engine, {
  'basic_info.phone': '+20100',
  'location.city': 'cairo',
  'basic_info.email': 'ignored@example.com'  // ← Ignored
})

// Result:
// [
//   { field: 'contact->phone', operator: 'ilike', value: '+20100' },
//   { field: 'location_id', operator: 'eq', value: 'cairo' }
// ]
```

### Example 4: Execute Search

```typescript
import { executeSearch } from '@/lib/search-compare/search-query'

const result = await executeSearch(
  'se_hotel_basic',                    // Search engine ID
  {
    'basic_info.phone': '+20100',
    'location.city': 'cairo'
  },                                    // Filters
  1,                                    // Page
  12                                    // Page size
)

// Result:
// {
//   results: [...],
//   total: 42,
//   page: 1,
//   pageSize: 12
// }
```

---

## Field Type Support

| Field Path | Input Type | Example |
|------------|-----------|---------|
| `basic_info.phone` | `phone` | Phone input with formatting |
| `basic_info.email` | `email` | Email validation input |
| `basic_info.name` | `text` | Text input with search |
| `basic_info.rating` | `range` | Slider 0-5 stars |
| `location.city` | `select` | Dropdown options |
| `location.country` | `select` | Dropdown options |
| `location.address` | `text` | Address text search |

---

## How to Add New Field Types

### Step 1: Add to field mappings

```typescript
// In DynamicSearchFilter.tsx
const fieldMappings: Record<string, Partial<FilterFieldDef>> = {
  'amenities.wifi': {
    type: 'select',
    label: '📶 WiFi',
    options: [
      { value: 'yes', label: 'Has WiFi' },
      { value: 'no', label: 'No WiFi' }
    ]
  }
}
```

### Step 2: Create input component

```typescript
function WiFiFilterInput({ field, value, onChange }) {
  return (
    <div className="filter-input-group">
      <label>{field.label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {field.options?.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Step 3: Add to render logic

```typescript
{field.type === 'select' && field.fieldId.includes('wifi') && (
  <WiFiFilterInput field={field} value={filters[field.fieldId]} onChange={...} />
)}
```

---

## Debugging

### Check what filters are allowed

```typescript
// In browser console
const engine = await fetch('/api/search-engines/se_hotel_basic').then(r => r.json())
console.log('Allowed fields:', engine.allowed_fields)
```

### See generated query

```typescript
// Enable logging in search-query.ts line ~60
console.log('✅ Search executed with conditions:', conditions)

// Check browser console for:
// ✅ Search executed with conditions: [
//   { field: 'contact->phone', operator: 'ilike', value: '+20100' },
//   { field: 'location_id', operator: 'eq', value: 'cairo' }
// ]
```

### Verify field skipping

```typescript
// Try filtering by unauthorized field
const result = await executeSearch('se_hotel_basic', {
  'basic_info.phone': '+20100',
  'basic_info.email': 'test@example.com'  // Not in allowed_fields
})

// Check logs:
// ⚠️ Field basic_info.email not allowed in search engine
// Query only includes phone, not email
```

---

## Architecture Summary

```
┌─────────────────────────────────────────┐
│  Admin Creates Search Engine            │
│  allowed_fields: [phone, city]          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  User Visits Landing Page               │
│  /search/hotels?engine=se_hotel_basic   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  DynamicSearchFilter fetches allowed    │
│  fields from search engine config       │
│  Renders 2 inputs: phone + city         │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  User inputs: phone='+20100', city=cai  │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  buildSearchQuery validates against      │
│  allowed_fields, builds conditions      │
│  [phone condition, city condition]      │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  executeSearch builds Supabase query    │
│  Executes with conditions               │
│  Returns filtered results (12 hotels)   │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Results rendered in grid/list          │
│  Using search engine's card layout      │
│  Shows phone + city (allowed fields)    │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist

- [x] Backend: Add field validation to query builder
- [x] Backend: Map field paths to database columns
- [x] Frontend: Create DynamicSearchFilter component
- [x] Frontend: Create input components (text, phone, email, select, range)
- [x] Frontend: Fetch search engine config on load
- [x] Frontend: Build search query service
- [x] Integration: Landing page with filters + results
- [x] Security: Validate filters against allowed_fields
- [ ] Testing: Test with unauthorized fields
- [ ] Testing: Test different field types
- [ ] Testing: Test validation logic
- [ ] Documentation: Add new field type examples
- [ ] UI: Build admin form for custom card styling
- [ ] Performance: Add caching for search engine config


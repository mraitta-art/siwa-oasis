# Orchestrator Integration with Type Hierarchy

## Executive Summary

**YES** - The Orchestrator system has a **direct and critical relationship** with the business type parent/child hierarchy. Both the **response** and **update** aspects are important:

1. **In Response**: The API returns `parent_id` and `is_parent` fields for all types - these are **essential** for the orchestrator to render the correct hierarchical UI
2. **In Update**: When types are consolidated, the orchestrator must be **automatically synchronized** to prevent broken references

---

## How Orchestrator Uses Type Hierarchy

### The Orchestrator Wizard Flow

The governance orchestrator (`/jana/orchestrator`) implements a **two-stage type selection**:

```
Stage 1: ARCHITECTURE (Parent Selection)
  ├─ Display all parent types (where is_parent=1 OR parent_id IS NULL)
  ├─ User selects a parent category
  └─ If parent has no children, user can proceed with parent

Stage 2: Select Child Typology  
  ├─ Display all children of selected parent (where parent_id = selectedParentId)
  ├─ User selects a specific child type
  └─ Forms and fields load based on selected type (child or parent if no children)
```

### Code Reference: Parent/Child Filtering

**File**: `src/app/jana/orchestrator/page.tsx` Lines 131-132

```typescript
// Filter parent types
const parentTypologies = typologies.filter(t => t.is_parent || !t.parent_id);

// Filter child types based on selected parent
const childTypologies = state.selectedParent 
  ? typologies.filter(t => t.parent_id === state.selectedParent) 
  : [];
```

This filtering **requires** that the API response includes:
- `is_parent` - Boolean flag indicating parent status
- `parent_id` - Reference to parent type ID
- `name` - Display name
- `icon` - Icon class
- `sections` - Form sections for this type

### API Response Structure

**Endpoint**: `GET /api/jana/types`

**Response Example**:
```json
[
  {
    "id": "hotel",
    "name": "Hotel",
    "icon": "fas fa-hotel",
    "icon_color": "#8b5cf6",
    "is_parent": 1,
    "parent_id": null,
    "sections": ["basic", "location", "amenities"],
    "own_sections": []
  },
  {
    "id": "luxury_resort",
    "name": "Luxury Resort",
    "icon": "fas fa-gem",
    "icon_color": "#f59e0b",
    "is_parent": 0,
    "parent_id": "hotel",
    "sections": ["basic", "location", "amenities"],
    "own_sections": ["vip_services", "golf_course", "spa"]
  }
]
```

**Required Fields for Orchestrator**:
- ✅ `parent_id` - Used to filter children
- ✅ `is_parent` - Used to identify parents
- ✅ `name` - Displayed in UI
- ✅ `icon` - Visual indicator
- ✅ `sections` - Used in DNA_CONFIG step

---

## Integration Impact: What Happens on Consolidation

### Scenario: Type Consolidation Impact

**Before**: Three separate "Resort" types exist
```
resort_5star        (is_parent=0, parent_id=null)
resort_luxury       (is_parent=0, parent_id=null)
resort_premium      (is_parent=0, parent_id=null)
```

**Consolidation Request**:
```json
{
  "parentTypeId": "resort_5star",
  "childTypeIds": ["resort_luxury", "resort_premium"],
  "action": "merge"
}
```

**After Consolidation**:
```
resort_5star        (is_parent=1, parent_id=null)      ← PROMOTED TO PARENT
resort_luxury       (is_parent=0, parent_id="resort_5star")
resort_premium      (is_parent=0, parent_id="resort_5star")
```

### Automated Updates Triggered

The `POST /api/jana/types/consolidate` endpoint automatically updates:

| Table | Update | Impact |
|-------|--------|--------|
| `business_types` | Set parent_id, promote to parent | Hierarchy restored ✓ |
| `businesses` | type_id → parent_id | Onboarded entities preserved |
| `form_fields` | business_type_id → parent_id | Form field mappings maintained |
| `card_templates` | business_type_id → parent_id | Card displays work correctly |
| `orchestrator_pages` | component_config → replace old IDs | Dynamic pages updated |
| `activity_log` | Record consolidation event | Audit trail maintained |

### Cache Invalidation

```typescript
invalidateCache.businessTypes()
```

This ensures the orchestrator wizard immediately sees the updated hierarchy.

---

## Without Proper Orchestrator Integration (Risks)

### Risk 1: Broken UI State
- Orchestrator loads cached types without parent/child info
- Can't differentiate parents from children
- Shows flat list instead of hierarchical tree
- User confusion during onboarding

### Risk 2: Type Reconciliation After Consolidation
**Scenario**: User consolidates "Hotel" duplicates while another browser tab has orchestrator open
- Wizard still references old type IDs
- New business created with old orphaned type reference
- Data inconsistency across system

### Risk 3: Orchestrator Page Component References
- If orchestrator_pages have component configs with type filters
- Old type IDs become obsolete after consolidation
- Pages fail to display expected business categories
- Search/filtering breaks

---

## Implementation Details

### Consolidation Endpoint: Step-by-Step

**File**: `src/app/api/jana/types/consolidate/route.ts`

```typescript
// Step 1: Update type hierarchy
UPDATE business_types 
SET parent_id = ?, is_parent = 0 
WHERE id = ?  // Sets children's parent

// Step 2: Reassign businesses
UPDATE businesses 
SET type_id = ? 
WHERE type_id IN (oldTypeIds)  // Points to parent

// Step 3: Update form fields
UPDATE form_fields 
SET business_type_id = ? 
WHERE business_type_id IN (oldTypeIds)

// Step 4: Update card templates
UPDATE card_templates 
SET business_type_id = ? 
WHERE business_type_id IN (oldTypeIds)

// Step 5: Update orchestrator pages
SELECT id, components FROM orchestrator_pages
// For each page, replace old type IDs with parent ID in JSON

// Step 6: Invalidate cache
invalidateCache.businessTypes()
```

### Response Example

```json
{
  "success": true,
  "message": "Successfully consolidated 2 types under 'hotel'. Orchestrator synchronized.",
  "summary": {
    "action": "consolidate_types",
    "parentTypeId": "hotel",
    "mergedTypes": ["luxury_resort", "resort_5star"],
    "totalTypes": 3,
    "orchestratorPagesUpdated": 2,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "newParentId": "hotel"
}
```

---

## Validation & Prevention

### Duplicate Detection

**Endpoint**: `GET /api/jana/types/verify/duplicates`

Identifies duplicates by name (case-insensitive) **before** they become a problem:

```json
{
  "total": 2,
  "duplicates": [
    {
      "name": "Hotel",
      "ids": ["hotel", "Hotel"],
      "count": 2
    }
  ],
  "dependencies": [
    {
      "id": "hotel",
      "name": "Hotel",
      "isParent": true,
      "businesses": 5,
      "children": 3
    }
  ]
}
```

### Name Uniqueness Validation

**POST** and **PUT** endpoints check for duplicates:

```typescript
// Before INSERT/UPDATE:
const existingWithName = await execute(
  'SELECT id FROM business_types WHERE LOWER(name) = LOWER(?)',
  [name]
);

if (existingWithName.length > 0) {
  return error: "Type name already exists! Consolidate instead."
}
```

This prevents new duplicates from being created while existing ones are consolidated.

---

## Orchestrator-Type Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR WIZARD                        │
│                   (Governance Orchestrator)                  │
│                                                               │
│  Step 1: ARCHITECTURE - Select Parent Type                  │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Filter: WHERE is_parent=1 OR parent_id IS NULL          │
│  │ Display: [Hotel] [Restaurant] [Retail]                  │
│  └─────────────────────────────────────────────────────────┘
│                           ↓
│  Step 2: ARCHITECTURE - Select Child Type (if exists)       │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Filter: WHERE parent_id = 'hotel'                       │
│  │ Display: [Luxury Resort] [Budget Hotel] [Boutique]      │
│  └─────────────────────────────────────────────────────────┘
│                           ↓
│  Step 3: DNA_CONFIG - Load Form Fields                      │
│  ┌─────────────────────────────────────────────────────────┐
│  │ Query: SELECT form_fields WHERE business_type_id = ?    │
│  │ Load sections: [basic, location, amenities, ...]        │
│  └─────────────────────────────────────────────────────────┘
│                           ↓
│  Final: Create Business with type_id = selected_type        │
│         INSERT businesses (name, type_id, vendor_id, ...)   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

            ↕ Dependency on Type Hierarchy ↕

┌─────────────────────────────────────────────────────────────┐
│                     TYPES SYSTEM                             │
│                                                               │
│  Parent Types (is_parent=1):                                │
│  ├─ hotel          (icon: fas fa-hotel)                      │
│  ├─ restaurant     (icon: fas fa-utensils)                   │
│  └─ retail         (icon: fas fa-shopping-cart)              │
│                                                               │
│  Child Types (parent_id != null):                           │
│  ├─ luxury_resort  (parent: hotel)                           │
│  ├─ casual_dining  (parent: restaurant)                      │
│  └─ electronics    (parent: retail)                          │
│                                                               │
│  Consolidation Events:                                       │
│  └─ Triggers cache invalidation                              │
│     → Orchestrator reloads hierarchy                         │
│     → UI updates immediately                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing the Integration

### Test Case 1: Verify Orchestrator Loads Hierarchy

```bash
# 1. Open orchestrator
GET /jana/orchestrator

# 2. Check parent types appear
expect: Hotel, Restaurant, Retail in first grid

# 3. Select Hotel
select: Hotel card

# 4. Check children appear
expect: Luxury Resort, Budget Hotel appear in second grid

# 5. Select child
select: Luxury Resort

# 6. Verify form fields load
expect: Form appears with hotel-related sections
```

### Test Case 2: Consolidation Synchronizes Orchestrator

```bash
# 1. Create duplicate types
POST /api/jana/types {id: "hotel_1", name: "Hotel", ...}
POST /api/jana/types {id: "hotel_2", name: "Hotel", ...}

# 2. Detect duplicates
GET /api/jana/types/verify/duplicates
expect: {duplicates: [{name: "Hotel", ids: ["hotel_1", "hotel_2"], count: 2}]}

# 3. Consolidate
POST /api/jana/types/consolidate {
  parentTypeId: "hotel_1",
  childTypeIds: ["hotel_2"],
  action: "merge"
}
expect: success, orchestrator_pages_updated: count

# 4. Verify in orchestrator
GET /jana/orchestrator
expect: Only hotel_1 appears (hotel_2 is now child)
expect: "Hotel" appears as parent with child indicator
```

### Test Case 3: Orchestrator Page Component Sync

```bash
# 1. Assume orchestrator page has:
orchestrator_page.components = {
  filters: {
    type_id: ["resort_luxury", "resort_premium"]
  }
}

# 2. Consolidate those types
POST /api/jana/types/consolidate {
  parentTypeId: "resort_5star",
  childTypeIds: ["resort_luxury", "resort_premium"]
}

# 3. Verify components updated
GET /api/jana/website/pages/[page_id]
expect: components.filters.type_id = ["resort_5star"]
```

---

## Summary: What You Need to Know

| Question | Answer | Details |
|----------|--------|---------|
| Does orchestrator use parent/child types? | ✅ **YES** | Two-step selection UI |
| Are parent/child fields in response? | ✅ **YES** | `parent_id` and `is_parent` returned |
| Does consolidation update orchestrator? | ✅ **YES** | Automatic sync via endpoint |
| Is orchestrator in activity log? | ✅ **YES** | Tracked in `activity_log` table |
| Can I ignore orchestrator on consolidation? | ❌ **NO** | Will cause broken references |
| What if types consolidate while orchestra is open? | ✅ Safe | Cache invalidation triggers reload |

---

## Related Documentation

- [TYPES_UNIQUENESS_CONSOLIDATION.md](./TYPES_UNIQUENESS_CONSOLIDATION.md) - Technical details
- [TYPES_CONSOLIDATION_SUMMARY.md](./TYPES_CONSOLIDATION_SUMMARY.md) - Implementation overview
- [TYPES_CONSOLIDATION_VISUAL_GUIDE.md](./TYPES_CONSOLIDATION_VISUAL_GUIDE.md) - Diagrams and flows

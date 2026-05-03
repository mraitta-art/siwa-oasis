# General + Additional Sections Architecture

## 📋 Overview

This document explains the **hierarchical form building** system that allows you to create forms with:
- **General Sections**: Inherited from parent to children (the main template)
- **Additional Sections**: Child-specific sections for specialized data

---

## 🏗️ Architecture

### Database Schema

The system uses three key tables:

#### 1. `business_types` - Blueprint Registry
```sql
- id: Unique identifier (e.g., 'accommodation', 'hotel')
- is_parent: TRUE for parent types, FALSE for children
- parent_id: Links child to parent (NULL for parents)
- sections: JSON array of GENERAL section IDs (inherited by children)
- own_sections: JSON array of ADDITIONAL section IDs (child-specific)
```

#### 2. `sections` - Module Definitions
```sql
- id: Unique identifier (e.g., 'basic', 'facilities')
- name: Display name
- section_type: ENUM('general', 'additional', 'universal')
  - 'general': Inherited from parent to children
  - 'additional': Child-specific sections
  - 'universal': Global sections available to all types
- description: Human-readable explanation
- display_order: Sorting order in UI
- inheritance_rules: JSON rules for selective inheritance
```

#### 3. `form_fields` - Field Definitions
```sql
- business_type_id: Which blueprint owns this field
- section_id: Which section this field belongs to
- section_origin: ENUM('inherited', 'own', 'template')
  - 'inherited': Came from parent blueprint
  - 'own': Defined specifically for this blueprint
  - 'template': From SECTION_TEMPLATE (global baseline)
```

---

## 🎯 How It Works

### Example Hierarchy

```
SECTION_TEMPLATE (Universal Baseline)
  ├─ basic (Universal)
  ├─ contact (Universal)
  └─ location (Universal)

└─ accommodation (Parent - General Sections)
     ├─ sections: ["basic", "location", "contact", "facilities"]
     └─ Children inherit these automatically
          ├─ hotel (Child - Additional Sections)
          │    └─ own_sections: ["star_rating", "room_types"]
          │
          ├─ siwa_lodge (Child - Additional Sections)
          │    └─ own_sections: ["construction_material", "vibe"]
          │
          └─ desert_camp (Child - Additional Sections)
               └─ own_sections: ["tent_types", "campfire"]
```

### Inheritance Flow

1. **Universal Sections** (SECTION_TEMPLATE)
   - Available to ALL business types
   - Lowest priority (overridden by parent/child)

2. **General Sections** (Parent)
   - Defined in parent's `sections` array
   - Automatically inherited by all children
   - Medium priority

3. **Additional Sections** (Child)
   - Defined in child's `own_sections` array
   - Specific to that child type only
   - Highest priority

---

## 🛠️ Usage Guide

### Step 1: Run Migration

```bash
cd siwa-oasis
mysql -u your_user -p siwa_oasis < scratch/migration_section_types.sql
```

This adds:
- `section_type` column to `sections` table
- `section_origin` column to `form_fields` table
- `description`, `inheritance_rules`, `display_order` columns

### Step 2: Create Parent Blueprint

In Governance Studio → Blueprints:

1. Click **NEW BLUEPRINT**
2. Set as **Parent Type** (is_parent = TRUE)
3. Go to **MODULES** step
4. Select **GENERAL SECTIONS** (gold badge):
   - Basic Information
   - Location
   - Contact Details
   - Facilities
5. Save

### Step 3: Create Child Blueprint

1. Click **+ ADD CHILD** on parent
2. Set as **Child Type** (is_parent = FALSE, parent_id set)
3. Go to **MODULES** step
4. You'll see:
   - **GENERAL SECTIONS** (gold) - Already inherited from parent
   - **ADDITIONAL SECTIONS** (green) - Select child-specific ones
5. Select additional sections like:
   - Star Rating (for hotels)
   - Room Types (for hotels)
   - Construction Material (for lodges)

### Step 4: Define Fields

In **FIELDS** step:
- Fields in GENERAL sections are auto-inherited
- Add custom fields to ADDITIONAL sections
- Override parent fields if needed (child takes priority)

---

## 🎨 UI Indicators

### Section Type Badges

- 🟡 **GENERAL** (Gold `#D4AF37`)
  - Inherited from parent
  - Main template structure

- 🟢 **ADDITIONAL** (Green `#10b981`)
  - Child-specific
  - Custom extensions

- 🟣 **UNIVERSAL** (Purple `#8b5cf6`)
  - Global baseline
  - Available to all types

### Visual Cues

- Left border color matches section type
- Badges in top-right corner of section cards
- Grouped separately in module selection UI

---

## 📡 API Endpoints

### Get Form Fields with Inheritance

```typescript
GET /api/admin/forms?type=hotel&include_inherited=true
```

Returns:
```json
[
  {
    "id": "uuid",
    "name": "business_name",
    "section_id": "basic",
    "business_type_id": "SECTION_TEMPLATE",
    "section_origin": "template",
    "is_inherited": true,
    "is_universal": true
  },
  {
    "id": "uuid",
    "name": "star_rating",
    "section_id": "star_rating",
    "business_type_id": "hotel",
    "section_origin": "own",
    "is_inherited": false,
    "is_universal": false
  }
]
```

### Update Section Type

```typescript
PUT /api/admin/sections
{
  "id": "facilities",
  "section_type": "general",
  "description": "Amenities and facilities offered",
  "display_order": 4
}
```

---

## 🔧 Advanced Features

### Selective Inheritance

Use `inheritance_rules` to control which children inherit a section:

```json
{
  "inheritable_by": ["hotel", "eco_lodge"],
  "exclude": ["desert_camp"]
}
```

### Field Override Priority

When the same field exists at multiple levels:

1. **Child** field wins (highest priority)
2. **Parent** field (medium priority)
3. **SECTION_TEMPLATE** field (lowest priority)

Deduplication key: `${section_id}:${field_name}`

---

## 📊 Querying Section Structure

### View All Sections by Type

```sql
SELECT id, name, section_type, description, display_order
FROM sections
ORDER BY 
  CASE section_type
    WHEN 'universal' THEN 1
    WHEN 'general' THEN 2
    WHEN 'additional' THEN 3
  END,
  display_order ASC;
```

### Check Inheritance Chain

```sql
SELECT 
  bt.id,
  bt.name,
  bt.is_parent,
  bt.parent_id,
  bt.sections AS general_sections,
  bt.own_sections AS additional_sections,
  s.section_type
FROM business_types bt
LEFT JOIN sections s ON JSON_CONTAINS(bt.sections, JSON_QUOTE(s.id))
ORDER BY bt.is_parent DESC, bt.sort_order;
```

---

## ✅ Benefits

1. **DRY Principle**: Define common fields once in parent
2. **Flexibility**: Children add specialized sections
3. **Maintainability**: Update parent → all children inherit
4. **Clear Organization**: Visual distinction between section types
5. **Priority System**: Child overrides prevent conflicts

---

## 🚀 Next Steps

1. Run the migration script
2. Create a parent blueprint with general sections
3. Add children with additional sections
4. Test form rendering with inherited fields
5. Verify field override behavior

---

## 📝 Migration Checklist

- [ ] Backup database
- [ ] Run `migration_section_types.sql`
- [ ] Verify section_type column exists
- [ ] Update existing sections with proper types
- [ ] Test form builder UI
- [ ] Verify inheritance in API responses
- [ ] Check field priority system

---

## 🆘 Troubleshooting

### Issue: Sections not showing correct type badge

**Solution**: Run migration and verify `section_type` column:
```sql
SELECT id, name, section_type FROM sections;
```

### Issue: Child not inheriting parent sections

**Solution**: Check `parent_id` and `sections` array:
```sql
SELECT id, parent_id, sections FROM business_types WHERE id = 'hotel';
```

### Issue: Fields duplicated in form

**Solution**: API deduplicates by `${section_id}:${name}`. Ensure unique field names per section.

---

## 📚 Related Files

- Migration: `scratch/migration_section_types.sql`
- API: `src/app/api/admin/forms/route.ts`
- Sections API: `src/app/api/admin/sections/route.ts`
- UI: `src/app/admin/governance/page.tsx`
- Schema: `schema.sql`

---

*Last updated: 2026-04-25*

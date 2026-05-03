# 🏗️ Form Builder Architecture

## 📊 Parallel Builder System

```
┌─────────────────────────────────────────────────────────────┐
│                    SIWA OASIS PLATFORM                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                            │
│                   /admin                                     │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  🎯 GOVERNANCE       │  │  🛠️ SIMPLE FORM             │ │
│  │     WIZARD           │  │     BUILDER                  │ │
│  │                      │  │                              │ │
│  │  /admin/governance   │  │  /admin/form-builder         │ │
│  │                      │  │                              │ │
│  │  • Multi-step        │  │  • Visual & quick            │ │
│  │  • Advanced ACL      │  │  • Easy to use               │ │
│  │  • Factory pattern   │  │  • Beginner friendly         │ │
│  │  • Inheritance       │  │  • Direct editing            │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    Both write to same ↓
┌─────────────────────────────────────────────────────────────┐
│                     MYSQL DATABASE                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ business_types   │  │   sections   │  │  form_fields  │ │
│  │                  │  │              │  │               │ │
│  │ • id             │  │ • id         │  │ • id          │ │
│  │ • name           │  │ • name       │  │ • label       │ │
│  │ • parent_id      │  │ • icon       │  │ • field_type  │ │
│  │ • is_parent      │  │ • required   │  │ • section_id  │ │
│  │ • sections       │  │ • ...        │  │ • required    │ │
│  │ • ...            │  │              │  │ • ...         │ │
│  └──────────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### **Creating a Field:**

```
Simple Form Builder                    Governance Wizard
      │                                      │
      │  POST /api/admin/forms               │  POST /api/admin/forms
      │                                      │
      └──────────────┬───────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   API Route Handler   │
         │   forms/route.ts      │
         └───────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   Database Insert     │
         │   form_fields table   │
         └───────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   Cache Invalidation  │
         │   (auto-refresh)      │
         └───────────────────────┘
```

---

## 📁 File Structure

```
src/app/admin/
│
├── page.tsx                          ← Dashboard
│   ├── Link to Governance Wizard
│   └── Link to Simple Form Builder (NEW!)
│
├── governance/
│   └── page.tsx                      ← Advanced Wizard (1860 lines)
│       ├── REGISTRY tab (Business Types)
│       ├── FACTORY tab (Master Components)
│       ├── IDENTITY step (Type config)
│       ├── MODULES step (Sections)
│       ├── FIELDS step (Field management)
│       ├── GOVERNANCE step (ACL)
│       ├── VISUALS step (UI config)
│       └── REVIEW step (Summary)
│
└── form-builder/                     ← ✨ NEW!
    └── page.tsx                      ← Simple Builder (601 lines)
        ├── Left Sidebar
        │   ├── Business Type Selector
        │   └── Section List
        ├── Center Area
        │   ├── Field List (Cards)
        │   └── Add Field Button
        └── Right Modal
            └── Field Editor Form
```

---

## 🎯 Feature Comparison Matrix

```
Feature                     │ Simple Builder │ Governance Wizard
────────────────────────────────────────────────────────────────
Quick field creation        │    ✅✅✅      │    ✅
Visual interface            │    ✅✅✅      │    ✅
Easy to learn               │    ✅✅✅      │    ✅
Field editing               │    ✅✅✅      │    ✅✅
Field deletion              │    ✅✅✅      │    ✅✅
Section management          │    ✅✅        │    ✅✅✅
Business type creation      │    ❌          │    ✅✅✅
ACL permissions             │    ❌          │    ✅✅✅
Factory components          │    ❌          │    ✅✅✅
Inheritance setup           │    ❌          │    ✅✅✅
Validation rules            │    ❌          │    ✅✅
Search configuration        │    ❌          │    ✅✅
Field ordering              │    ✅          │    ✅✅
Bulk operations             │    ❌          │    ✅
Export/Import               │    ❌          │    ❌
```

---

## 🚀 Use Case Decision Tree

```
Start: Need to modify forms
         │
         ├─ Quick task? (add/edit 1-3 fields)
         │   └─ YES → Use Simple Form Builder ✅
         │
         ├─ Complex setup? (new type, ACL, factory)
         │   └─ YES → Use Governance Wizard ✅
         │
         ├─ Non-technical user?
         │   └─ YES → Use Simple Form Builder ✅
         │
         ├─ Need factory components?
         │   └─ YES → Use Governance Wizard ✅
         │
         ├─ Setting up inheritance?
         │   └─ YES → Use Governance Wizard ✅
         │
         └─ Just editing labels?
             └─ YES → Use Simple Form Builder ✅
```

---

## 💡 Best Practices

### **When to Use Simple Builder:**
1. ✅ Adding fields to existing forms
2. ✅ Quick label changes
3. ✅ Modifying field types
4. ✅ Non-technical team members
5. ✅ Rapid prototyping
6. ✅ Small updates

### **When to Use Governance Wizard:**
1. ✅ Creating new business types
2. ✅ Setting up ACL permissions
3. ✅ Managing factory components
4. ✅ Configuring inheritance
5. ✅ Advanced validation rules
6. ✅ Full form architecture

### **Recommended Workflow:**
```
Step 1: Use Governance Wizard to:
  - Create business types
  - Set up sections
  - Configure factory
  - Define ACL rules

Step 2: Use Simple Builder to:
  - Add fields quickly
  - Make small edits
  - Update labels
  - Daily maintenance
```

---

## 🔧 API Architecture

```
Both Builders Share These APIs:

GET  /api/admin/types              → List business types
GET  /api/admin/types?id=X         → Get specific type
POST /api/admin/types              → Create type
PUT  /api/admin/types              → Update type
DELETE /api/admin/types?id=X       → Delete type

GET  /api/admin/sections           → List sections
POST /api/admin/sections           → Create section
PUT  /api/admin/sections           → Update section
DELETE /api/admin/sections?id=X    → Delete section

GET  /api/admin/forms?type=X       → Get fields for type
GET  /api/admin/forms?type=X&section=Y → Get fields for section
POST /api/admin/forms              → Create field
PUT  /api/admin/forms              → Update field
DELETE /api/admin/forms?id=X       → Delete field

GET  /api/admin/forms?type=FACTORY → Get factory components
```

---

## 📊 Database Schema

### **form_fields Table:**

```sql
CREATE TABLE form_fields (
  id VARCHAR(100) PRIMARY KEY,
  business_type_id VARCHAR(100),      -- Which type owns this field
  section_id VARCHAR(100),            -- Which section it belongs to
  name VARCHAR(100),                  -- Machine name
  label VARCHAR(200),                 -- Display name
  field_type VARCHAR(50),             -- text, number, select, etc.
  required BOOLEAN,                   -- Is it required?
  vendor_editable BOOLEAN,            -- Can vendors edit?
  options JSON,                       -- For select/multiselect
  help_text TEXT,                     -- Hint text
  placeholder VARCHAR(200),           -- Placeholder text
  validation JSON,                    -- Validation rules
  acl JSON,                           -- Access control list
  sort_order INT,                     -- Display order
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (business_type_id) REFERENCES business_types(id),
  FOREIGN KEY (section_id) REFERENCES sections(id)
);
```

---

## 🎨 UI/UX Comparison

### **Simple Builder Layout:**
```
┌─────────────────────────────────────────────────────┐
│  🛠️ Simple Form Builder                    [Switch]│
├──────────┬──────────────────────────┬───────────────┤
│ Type:    │  📋 Basic Info           │               │
│ [Hotel▼] │                          │   Field       │
│          │  + Add Field             │   Editor      │
│ Sections:│                          │   (Modal)     │
│ • Basic  │  ┌──────────────────┐   │               │
│ • Location│ │ 📝 Hotel Name    │   │               │
│ • Contact │ │   [Edit] [Delete] │   │               │
│ + Add     │ └──────────────────┘   │               │
│          │                          │               │
│          │  ┌──────────────────┐   │               │
│          │ │ 🔢 Room Count    │   │               │
│          │ │   [Edit] [Delete] │   │               │
│          │ └──────────────────┘   │               │
└──────────┴──────────────────────────┴───────────────┘
```

### **Governance Wizard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  REGISTRY │ FACTORY                                 │
├──────────┬──────────────────────────┬───────────────┤
│ Types:   │  IDENTITY → MODULES →   │  INSPECTOR    │
│ • Accom  │  FIELDS → GOVERNANCE    │               │
│   ├Hotel │  → VISUALS → REVIEW     │  Field Props  │
│   └Lodge │                          │               │
│ • Factory│  ┌──────────────────┐   │  ACL Config   │
│ • Global │  │ Section Canvas   │   │               │
│          │  │ ┌──────────────┐ │   │  Validation   │
│          │  │ │ Field 1      │ │   │               │
│          │  │ │ Field 2      │ │   │  Inheritance  │
│          │  │ └──────────────┘ │   │               │
│          │  └──────────────────┘   │  Preview      │
└──────────┴──────────────────────────┴───────────────┘
```

---

## 🔐 Security

Both builders:
- ✅ Require admin authentication
- ✅ Use same `requireAdmin()` middleware
- ✅ Validate all inputs
- ✅ Sanitize data before DB insert
- ✅ Handle errors gracefully

---

## 📈 Performance

### **Caching:**
Both builders benefit from the caching layer:
- Business types cached (5 min TTL)
- Sections cached (5 min TTL)
- Form fields cached (5 min TTL)
- Auto-invalidation on mutations

### **Load Time:**
- Simple Builder: ~500ms (lighter)
- Governance Wizard: ~800ms (more data)

---

## 🎯 Summary

**Two builders, one database, unlimited flexibility!**

- **Simple Builder** → Speed & simplicity
- **Governance Wizard** → Power & control

**Choose the right tool for each task!** 🚀

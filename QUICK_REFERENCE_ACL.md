# 🎯 Quick Reference: Factory & ACL Permissions

## 📍 Where to Go

| Task | URL | What You Do |
|------|-----|-------------|
| **Build Forms** | http://localhost:3000/admin/governance | Create fields, set permissions |
| **Edit Fields** | http://localhost:3000/admin/forms | Modify field properties |
| **Test as Vendor** | http://localhost:3000/login | Login: vendor@siwa.com / vendor123 |
| **Test as Admin** | http://localhost:3000/login | Login: super@siwa.com / super123 |

---

## 🏭 Factory Workflow (5 Steps)

```
1️⃣  LOGIN AS ADMIN
    ↓
2️⃣  GO TO: /admin/governance → FACTORY tab
    ↓
3️⃣  CREATE MASTER BLOCKS
    • Select field type (text, number, select, etc.)
    • Set label and name
    • Configure options (for dropdowns)
    ↓
4️⃣  SET ACL PERMISSIONS
    • Who can READ (see) this field?
    • Who can WRITE (edit) this field?
    ↓
5️⃣  ASSIGN TO BUSINESS TYPES
    • Go to REGISTRY tab
    • Select business type (Hotel, Restaurant, etc.)
    • Add fields from Factory
```

---

## 🔐 ACL Permission Matrix

### Quick Decision Guide

| Field Type | READ Access | WRITE Access | Example |
|------------|-------------|--------------|---------|
| **Public Info** | Everyone | Admin + Vendor | Business name, description, photos |
| **Internal Data** | Admin + Vendor | Admin + Vendor | Pricing, inventory, metrics |
| **Admin Only** | Admin only | Admin only | Verification status, notes, ratings |
| **Read-Only Public** | Everyone | Admin only | Official certifications, badges |

### Role Permissions

```
super_admin:     ✅ READ ALL  ✅ WRITE ALL
content_admin:   ✅ READ MOST ✅ WRITE MOST
sales_manager:   ✅ READ ALL  ✅ WRITE SOME
support_agent:   ✅ READ SOME ❌ WRITE LITTLE
salesman:        ⚙️ CONFIG   ⚙️ CONFIG
vendor:          ⚙️ CONFIG   ⚙️ CONFIG
public:          ⚙️ CONFIG   ❌ NEVER
```

---

## 📋 ACL Setup Examples

### Example 1: Business Name (Public Field)
```
✅ READ: super_admin, content_admin, vendor, public
✅ WRITE: super_admin, content_admin, vendor
❌ HIDDEN FROM: (nobody)
```

### Example 2: Internal Notes (Admin Only)
```
✅ READ: super_admin, content_admin
✅ WRITE: super_admin, content_admin
❌ HIDDEN FROM: vendor, public, salesman
```

### Example 3: Pricing (Vendor Internal)
```
✅ READ: super_admin, vendor
✅ WRITE: super_admin, vendor
❌ HIDDEN FROM: public, content_admin
```

---

## 🎨 UI Locations

### Governance Panel Tabs

```
/admin/governance
│
├── REGISTRY Tab
│   ├── Business Types (Hotel, Tour, Restaurant)
│   ├── Sections (Basic, Amenities, Pricing)
│   └── Field Assignments
│
└── FACTORY Tab
    ├── Master Components Library
    ├── Field Templates
    └── Global ACL Settings
```

### Inspector Panel (Right Side)

When you click a field, you'll see:
```
┌─────────────────────────────────┐
│ FIELD PROPERTIES                │
├─────────────────────────────────┤
│ Label: Business Name            │
│ Type: Text Input                │
│ Required: ✅                    │
│                                 │
│ AUTHORITY PRESETS               │
│ [Public Facing] [Admin Private] │
│ [Vendor Internal]               │
│                                 │
│ CUSTOM PERMISSIONS              │
│ ☑ Super Admin  (Read + Write)   │
│ ☑ Content Admin (Read + Write)  │
│ ☑ Vendor       (Read + Write)   │
│ ☑ Public       (Read only)      │
│ ☐ Salesman     (No access)      │
└─────────────────────────────────┘
```

---

## 🔧 Common Tasks

### Task 1: Create a New Field

```
1. Go to /admin/governance
2. Click FACTORY tab
3. Click "Create Master Block"
4. Select field type
5. Fill in:
   • Label: "Phone Number"
   • Name: "phone"
   • Type: "text"
6. Set ACL:
   • READ: super_admin, content_admin, vendor, public
   • WRITE: super_admin, vendor
7. Save
```

### Task 2: Assign Field to Business Type

```
1. Go to REGISTRY tab
2. Select business type (e.g., "Hotel")
3. Click section (e.g., "Basic Information")
4. Click "Add Field from Factory"
5. Select the field
6. Configure type-specific settings
7. Save
```

### Task 3: Change Field Permissions

```
1. Go to /admin/governance
2. Click on the field (in FACTORY or REGISTRY)
3. In Inspector panel, find "AUTHORITY PRESETS"
4. Click a preset OR customize:
   ☑/☐ Super Admin
   ☑/☐ Content Admin
   ☑/☐ Vendor
   ☑/☐ Public
5. Save changes
```

### Task 4: Hide Field from Public

```
1. Select the field
2. In ACL settings, uncheck "public" from READ
3. Result: Field hidden from public users
4. Save
```

---

## ⚡ Quick Tips

✅ **DO:**
- Use Factory for reusable components
- Start with restrictive permissions (Admin Only)
- Test with different user roles
- Use ACL presets for common patterns
- Group related fields in sections

❌ **DON'T:**
- Give public write access
- Skip testing with vendor account
- Create duplicate fields (use Factory)
- Forget to save after changing ACL
- Hide required fields from vendors

---

## 🧪 Testing Checklist

After setting up fields:

```
□ Login as super@siwa.com
  → Should see ALL fields
  → Should edit ALL fields

□ Login as vendor@siwa.com
  → Should see ONLY permitted fields
  → Should edit ONLY permitted fields

□ Login as public (not logged in)
  → Should see ONLY public fields
  → Should NOT edit ANY fields

□ Check sensitive data is hidden
  → Admin notes hidden from vendor
  → Internal pricing hidden from public
  → Verification status hidden from public
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Field not showing | Check ACL READ permissions |
| Can't edit field | Check ACL WRITE permissions |
| Public sees admin field | Remove "public" from READ |
| Vendor can't edit | Add "vendor" to WRITE |
| Factory not loading | Refresh page, check console |
| Changes not saving | Check browser network tab |

---

## 📊 Visual Flow

```
┌─────────────────────┐
│   CREATE IN FACTORY │
│   • Select type     │
│   • Set label       │
│   • Configure ACL   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ASSIGN TO TYPE     │
│   • Choose type     │
│   • Pick section    │
│   • Set ordering    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ACL ENFORCED       │
│   • Filter by role  │
│   • Hide/show       │
│   • Lock/unlock     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  RENDER FORM        │
│   • Vendor sees ✅  │
│   • Public sees ✅  │
│   • Hidden fields ❌│
└─────────────────────┘
```

---

## 🔗 Related Documentation

- **Full Guide**: [FACTORY_FORM_BUILDER_GUIDE.md](./FACTORY_FORM_BUILDER_GUIDE.md)
- **Caching System**: [CACHING_IMPLEMENTATION.md](./CACHING_IMPLEMENTATION.md)
- **Quick Start**: [CACHE_QUICK_START.md](./CACHE_QUICK_START.md)

---

**Need Help?**
1. Check this quick reference
2. Review the full guide
3. Test with demo accounts
4. Check browser console for errors

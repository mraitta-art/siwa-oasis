# 🏭 Factory Form Builder & ACL Permission System

## Overview

The SIWA OASIS platform uses a **Factory Pattern** with **ACL (Access Control List)** to build dynamic forms where admins can:
- ✅ Create master field components from the Factory
- ✅ Assign fields to business types and sections
- ✅ Control **who can see** (read) each field
- ✅ Control **who can edit** (write) each field
- ✅ Hide/show fields based on user role

---

## 🎯 How It Works

### Architecture Flow

```
┌─────────────────────────────────────────────────┐
│          FACTORY (Master Components)            │
│    Create reusable field templates here         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│       SECTION TEMPLATES (Universal Fields)      │
│    Fields shared across ALL business types      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      BUSINESS TYPES (Hotels, Tours, etc.)       │
│    Inherit from Factory + Section Templates     │
│    Add type-specific fields                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         ACL PERMISSIONS (Control Access)        │
│    Define who can READ and who can WRITE        │
└─────────────────────────────────────────────────┘
```

---

## 📍 Step-by-Step: Using the Factory

### Step 1: Access the Governance Panel

1. **Login as Admin** (super@siwa.com / super123)
2. Navigate to: **http://localhost:3000/admin/governance**
3. Click on the **"FACTORY"** tab

### Step 2: Create Master Components from Factory

The Factory is your **master component library**. Here you create field templates that can be reused across all business types.

**Available Field Types:**
- 📝 **Text Input** - Single line text
- 📄 **Long Text** - Multi-line textarea
- 🔢 **Numeric Value** - Number inputs
- 📋 **Dropdown** - Select from options
- ☑️ **Multiple Choice** - Select multiple options
- ⭕ **Single Choice** - Radio buttons
- 🔘 **Toggle Switch** - Yes/No checkbox
- 🔗 **External Link** - URL input
- 📁 **Document/File** - File upload
- 🖼️ **Photo Gallery** - Image collection
- 📅 **Date/Time** - Date picker

**Creating a Factory Component:**
```
1. Go to Admin → Governance → FACTORY tab
2. Click "Create Master Block"
3. Select field type (e.g., "Text Input")
4. Configure the field properties
5. Set ACL permissions (see below)
6. Save to Factory Pool
```

### Step 3: Set ACL Permissions

Every field has an **ACL (Access Control List)** that controls visibility and editability.

#### ACL Structure

```json
{
  "read": ["super_admin", "content_admin", "vendor", "public"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

#### Available Roles

| Role | Can Read? | Can Write? | Description |
|------|-----------|------------|-------------|
| **super_admin** | ✅ Always | ✅ Always | Full access to everything |
| **content_admin** | ✅ Yes | ✅ Yes | Manage content and forms |
| **sales_manager** | ✅ Yes | ✅ Yes | View and assign businesses |
| **support_agent** | ✅ Yes | ❌ Limited | View contact info only |
| **salesman** | ⚙️ Configurable | ⚙️ Configurable | Create free businesses |
| **vendor** | ⚙️ Configurable | ⚙️ Configurable | Manage own business |
| **public** | ⚙️ Configurable | ❌ Never | Browse only |

#### ACL Presets (Quick Setup)

The system provides 3 preset configurations:

1. **Public Facing**
   - Read: super_admin, content_admin, vendor, public
   - Write: super_admin, vendor
   - **Use for**: Business name, description, contact info, images

2. **Admin Private**
   - Read: super_admin, content_admin
   - Write: super_admin, content_admin
   - **Use for**: Internal notes, verification status, admin ratings

3. **Vendor Internal**
   - Read: super_admin, vendor
   - Write: super_admin, vendor
   - **Use for**: Business metrics, private pricing, internal documents

### Step 4: Assign Factory Components to Business Types

Once you create components in the Factory, you can assign them to specific business types:

```
1. Go to Admin → Governance → REGISTRY tab
2. Select a business type (e.g., "Hotel")
3. Click "Add Fields"
4. Choose from:
   - Factory Pool (master components)
   - Section Templates (universal fields)
   - Custom fields (type-specific)
5. Configure permissions for each field
6. Save
```

### Step 5: Control Field Visibility

Fields are automatically filtered based on the user's role:

**Example Scenario:**
```
Field: "Internal Verification Notes"
ACL: {
  read: ["super_admin", "content_admin"],
  write: ["super_admin"]
}

Result:
✅ Super Admin: Can SEE and EDIT
✅ Content Admin: Can SEE and EDIT
❌ Vendor: CANNOT SEE (hidden completely)
❌ Public: CANNOT SEE (hidden completely)
```

---

## 🔐 ACL Permission Examples

### Example 1: Public Business Name

```json
{
  "name": "business_name",
  "label": "Business Name",
  "acl": {
    "read": ["super_admin", "content_admin", "vendor", "salesman", "public"],
    "write": ["super_admin", "content_admin", "vendor", "salesman"]
  }
}
```
**Result**: Everyone can see it, vendors and salesmen can edit their own.

### Example 2: Admin-Only Verification Status

```json
{
  "name": "verification_status",
  "label": "Verification Status",
  "acl": {
    "read": ["super_admin", "content_admin"],
    "write": ["super_admin"]
  }
}
```
**Result**: Only admins can see and edit this field.

### Example 3: Vendor Internal Pricing

```json
{
  "name": "internal_pricing",
  "label": "Internal Pricing Notes",
  "acl": {
    "read": ["super_admin", "vendor"],
    "write": ["super_admin", "vendor"]
  }
}
```
**Result**: Vendors can see/edit their own pricing, public cannot see it.

### Example 4: Public Read-Only Description

```json
{
  "name": "description",
  "label": "Business Description",
  "acl": {
    "read": ["super_admin", "content_admin", "vendor", "public"],
    "write": ["super_admin", "content_admin", "vendor"]
  }
}
```
**Result**: Public can read, but cannot edit.

---

## 🎨 UI Locations

### 1. Governance Panel (Main Builder)
**URL**: `http://localhost:3000/admin/governance`

**Tabs:**
- **REGISTRY**: Manage business types and their sections
- **FACTORY**: Create and manage master field components

**Features:**
- Create field templates
- Set ACL permissions with checkboxes
- Preview field behavior
- Drag-and-drop field ordering

### 2. Forms Editor (Advanced)
**URL**: `http://localhost:3000/admin/forms`

**Features:**
- Edit fields for specific business types
- Configure field validation
- Set field ordering
- Manage inheritance

### 3. Dynamic Form Rendering (Frontend)
**Component**: `src/components/DynamicForm.tsx`

**How it enforces ACL:**
```typescript
// Fields are automatically filtered by role
fields.forEach(field => {
  // Check if user role has read permission
  if (field.acl && !field.acl.read.includes(userRole)) {
    return; // Hide field completely
  }
  
  // Check if user role has write permission
  const canEdit = field.acl?.write?.includes(userRole);
  if (!canEdit) {
    return readOnly; // Show but disable editing
  }
});
```

---

## 📋 Complete Workflow Example

### Scenario: Create a Hotel Booking Form

#### Step 1: Create Factory Components
```
Go to: Admin → Governance → FACTORY

Create these master blocks:
1. Text Input: "Hotel Name"
   ACL: Public Facing (everyone reads, vendors write)

2. Textarea: "Description"
   ACL: Public Facing

3. Number: "Room Count"
   ACL: Vendor Internal (vendors and admins only)

4. Checkbox: "Is Verified"
   ACL: Admin Private (admins only)

5. Gallery: "Hotel Photos"
   ACL: Public Facing
```

#### Step 2: Create Business Type
```
Go to: Admin → Governance → REGISTRY

Create: "Hotel"
Icon: fa-hotel
Color: #D4AF37
```

#### Step 3: Assign Sections
```
Add sections to Hotel type:
- basic (Basic Information)
- amenities (Amenities)
- pricing (Pricing)
- gallery (Photo Gallery)
```

#### Step 4: Add Fields to Hotel Type
```
For each section, add fields:

Section: basic
- Hotel Name (from Factory) - Public Facing
- Description (from Factory) - Public Facing
- Phone Number (from Factory) - Public Facing

Section: amenities
- WiFi Available (new field) - Public Facing
- Pool Available (new field) - Public Facing
- Pet Friendly (new field) - Public Facing

Section: pricing
- Room Count (from Factory) - Vendor Internal
- Average Rate (new field) - Vendor Internal

Section: gallery
- Hotel Photos (from Factory) - Public Facing

Admin-Only Fields:
- Verification Status (from Factory) - Admin Private
- Internal Notes (new field) - Admin Private
```

#### Step 5: Test Permissions
```
Login as different roles to verify:

1. Super Admin (super@siwa.com):
   ✅ Sees ALL fields
   ✅ Can edit ALL fields

2. Vendor (vendor@siwa.com):
   ✅ Sees: Hotel Name, Description, Phone, Amenities, Photos
   ✅ Can edit: Hotel Name, Description, Phone, Amenities, Photos
   ❌ Cannot see: Verification Status, Internal Notes

3. Public (not logged in):
   ✅ Sees: Hotel Name, Description, Phone, Amenities, Photos
   ❌ Cannot see: Room Count, Average Rate, Verification Status, Internal Notes
```

---

## 🔧 API Endpoints

### Get Factory Components
```bash
GET /api/admin/forms?type=FACTORY
```

### Create Factory Component
```bash
POST /api/admin/forms
{
  "business_type_id": "FACTORY",
  "section_id": "factory_pool",
  "name": "hotel_name",
  "label": "Hotel Name",
  "field_type": "text",
  "acl": {
    "read": ["super_admin", "content_admin", "vendor", "public"],
    "write": ["super_admin", "vendor"]
  }
}
```

### Update Field ACL
```bash
PUT /api/admin/forms
{
  "id": "field_uuid",
  "acl": {
    "read": ["super_admin", "content_admin"],
    "write": ["super_admin"]
  }
}
```

### Get Fields for Business Type (with ACL applied)
```bash
GET /api/admin/forms?type=hotel
```
**Returns**: Only fields the current user's role can read.

---

## 💡 Best Practices

### 1. Use Factory for Reusable Components
- Create master templates in Factory
- Reuse across multiple business types
- Update once, propagate everywhere

### 2. Principle of Least Privilege
- Start with restrictive ACL (Admin Only)
- Open up permissions as needed
- Never give public write access

### 3. Organize with Sections
- Group related fields together
- Use clear section names
- Set section-level permissions

### 4. Test All Roles
- Login as each role to verify visibility
- Check both read and write permissions
- Ensure sensitive data is hidden

### 5. Use ACL Presets
- Public Facing: For customer-facing data
- Vendor Internal: For business-sensitive data
- Admin Private: For internal operations

---

## 🎓 Advanced Features

### Field Inheritance

Business types inherit fields from:
1. **SECTION_TEMPLATE** (lowest priority - universal fields)
2. **Parent Type** (medium priority - e.g., "Accommodation")
3. **Current Type** (highest priority - e.g., "Hotel")

**Example:**
```
SECTION_TEMPLATE → "Business Name" (all types)
     ↓
Accommodation → "Check-in Time" (all accommodations)
     ↓
Hotel → "Star Rating" (hotels only)
```

### Dynamic Visibility

Fields can be shown/hidden based on:
- User role (via ACL)
- Subscription tier
- Verification status
- Custom conditions

### Validation Rules

Each field supports:
- Required/optional
- Min/max length
- Min/max value
- Custom regex patterns
- Email/URL validation

---

## 🚨 Common Issues & Solutions

### Issue: Field not showing for vendor
**Solution**: Check ACL read permissions include "vendor"

### Issue: Vendor can't edit field
**Solution**: Check ACL write permissions include "vendor"

### Issue: Public can see admin-only field
**Solution**: Remove "public" from ACL read array

### Issue: Factory component not appearing
**Solution**: 
1. Verify business_type_id = "FACTORY"
2. Check section_id = "factory_pool"
3. Refresh the governance page

---

## 📚 Code References

- **API Route**: `src/app/api/admin/forms/route.ts`
- **Governance UI**: `src/app/admin/governance/page.tsx`
- **Dynamic Form**: `src/components/DynamicForm.tsx`
- **Auth Helpers**: `src/lib/auth.ts`
- **Cache Layer**: `src/lib/cache.ts`

---

## ✅ Quick Checklist

When creating a new form:

- [ ] Create field components in Factory
- [ ] Set ACL permissions (read/write)
- [ ] Assign fields to business type
- [ ] Organize into sections
- [ ] Test with different user roles
- [ ] Verify public fields are visible
- [ ] Verify admin-only fields are hidden
- [ ] Check vendor can edit their fields
- [ ] Validate field ordering
- [ ] Test on mobile devices

---

**Need Help?**
- Check the Governance panel UI at `/admin/governance`
- Review field ACL settings in the Inspector panel
- Test with different user accounts
- Check browser console for permission errors

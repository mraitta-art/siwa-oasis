# 🏨 Example Forms: Complete Business Type Templates

This document shows **complete form examples** for different business types with Factory components and ACL permissions already configured.

---

## 📋 Table of Contents

1. [Hotel Form Example](#hotel-form-example)
2. [Restaurant Form Example](#restaurant-form-example)
3. [Tour Operator Form Example](#tour-operator-form-example)
4. [How to Implement](#how-to-implement)
5. [Testing Guide](#testing-guide)

---

## 🏨 Hotel Form Example

### **Form Structure**

```
HOTEL REGISTRATION FORM
├── 📋 Basic Information (Public)
├── 📞 Contact Details (Public)
├── 🖼️ Photos & Media (Public)
├── ✅ Amenities & Features (Public)
├── 📊 Business Metrics (Vendor Only)
└── 🛡️ Admin Verification (Admin Only)
```

### **Section 1: Basic Information** (Public Facing)

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **Hotel Name** | Text | Everyone | Admin, Vendor | ✅ Yes |
| **Star Rating** | Select (1-5) | Everyone | Admin, Vendor | ✅ Yes |
| **Description** | Textarea | Everyone | Admin, Vendor | ✅ Yes |
| **Year Established** | Number | Everyone | Admin, Vendor | ❌ No |

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin", "vendor", "public"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

**Visibility:**
- ✅ Super Admin: Can see & edit
- ✅ Content Admin: Can see & edit
- ✅ Vendor: Can see & edit
- ✅ Public: Can see (read-only)
- ❌ Salesman: Cannot see

---

### **Section 2: Contact Details** (Public Facing)

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **Phone Number** | Text | Everyone | Admin, Vendor | ✅ Yes |
| **Email Address** | Text | Everyone | Admin, Vendor | ✅ Yes |
| **Website URL** | Link | Everyone | Admin, Vendor | ❌ No |
| **Full Address** | Textarea | Everyone | Admin, Vendor | ✅ Yes |
| **Google Maps Link** | Link | Everyone | Admin, Vendor | ❌ No |

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin", "vendor", "public"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

---

### **Section 3: Photos & Media** (Public Facing)

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **Photo Gallery** | Gallery | Everyone | Admin, Vendor | ❌ No |
| **Logo** | Image | Everyone | Admin, Vendor | ❌ No |
| **Video Tour** | Link | Everyone | Admin, Vendor | ❌ No |

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin", "vendor", "public"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

---

### **Section 4: Amenities & Features** (Public Facing)

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **WiFi Available** | Checkbox | Everyone | Admin, Vendor | ❌ No |
| **Swimming Pool** | Checkbox | Everyone | Admin, Vendor | ❌ No |
| **Parking Available** | Checkbox | Everyone | Admin, Vendor | ❌ No |
| **Restaurant Count** | Number | Everyone | Admin, Vendor | ❌ No |
| **Total Rooms** | Number | Everyone | Admin, Vendor | ❌ No |
| **Room Types** | Multi-Select | Everyone | Admin, Vendor | ❌ No |

**Options for Room Types:**
```
- Single Room
- Double Room
- Suite
- Family Room
- Presidential Suite
```

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin", "vendor", "public"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

---

### **Section 5: Business Metrics** (Vendor Internal) 🔒

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **Avg Monthly Revenue** | Number | Admin, Vendor | Admin, Vendor | ❌ No |
| **Employee Count** | Number | Admin, Vendor | Admin, Vendor | ❌ No |
| **Occupancy Rate** | Number | Admin, Vendor | Admin, Vendor | ❌ No |
| **Internal Notes** | Textarea | Admin, Vendor | Admin, Vendor | ❌ No |

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin", "vendor"],
  "write": ["super_admin", "content_admin", "vendor"]
}
```

**Visibility:**
- ✅ Super Admin: Can see & edit
- ✅ Content Admin: Can see & edit
- ✅ Vendor: Can see & edit their own
- ❌ Public: **CANNOT SEE** (hidden)
- ❌ Salesman: **CANNOT SEE** (hidden)

---

### **Section 6: Admin Verification** (Admin Only) 🔒🔒

| Field | Type | ACL READ | ACL WRITE | Required |
|-------|------|----------|-----------|----------|
| **Verification Status** | Select | Admin Only | Super Admin | ✅ Yes |
| **Quality Rating (1-10)** | Number | Admin Only | Super Admin | ❌ No |
| **Priority Listing** | Checkbox | Admin Only | Super Admin | ❌ No |
| **Admin Notes** | Textarea | Super Admin | Super Admin | ❌ No |

**Options for Verification Status:**
```
- pending
- verified
- rejected
- suspended
```

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin"],
  "write": ["super_admin"]
}
```

**Visibility:**
- ✅ Super Admin: Can see & edit ALL fields
- ✅ Content Admin: Can see (read-only)
- ❌ Vendor: **CANNOT SEE** (hidden)
- ❌ Public: **CANNOT SEE** (hidden)

---

## 🍽️ Restaurant Form Example

### **Form Structure**

```
RESTAURANT REGISTRATION FORM
├── 📋 Basic Information (Public)
├── 📞 Contact Details (Public)
├── 🖼️ Photos & Menu (Public)
├── 🍴 Cuisine & Features (Public)
├── 💰 Pricing & Capacity (Vendor Only)
└── 🛡️ Health & Safety (Admin Only)
```

### **Restaurant-Specific Fields**

#### **Cuisine & Features Section**

| Field | Type | ACL | Required |
|-------|------|-----|----------|
| **Cuisine Type** | Multi-Select | Public Read, Vendor Write | ✅ Yes |
| **Price Range** | Select | Public Read, Vendor Write | ✅ Yes |
| **Seating Capacity** | Number | Public Read, Vendor Write | ❌ No |
| **Outdoor Seating** | Checkbox | Public Read, Vendor Write | ❌ No |
| **Delivery Available** | Checkbox | Public Read, Vendor Write | ❌ No |
| **Halal Certified** | Checkbox | Public Read, Vendor Write | ❌ No |

**Cuisine Type Options:**
```
- Egyptian
- Mediterranean
- Italian
- Chinese
- Fast Food
- Seafood
- Vegetarian
- Desserts & Cafes
```

**Price Range Options:**
```
- $ (Budget)
- $$ (Moderate)
- $$$ (Upscale)
- $$$$ (Fine Dining)
```

#### **Health & Safety Section** (Admin Only)

| Field | Type | ACL READ | ACL WRITE |
|-------|------|----------|-----------|
| **Health Inspection Date** | Date | Admin Only | Admin Only |
| **Hygiene Rating** | Number (1-5) | Admin Only | Admin Only |
| **License Number** | Text | Admin Only | Admin Only |
| **Violation Notes** | Textarea | Admin Only | Admin Only |

**ACL Configuration:**
```json
{
  "read": ["super_admin", "content_admin"],
  "write": ["super_admin"]
}
```

---

## 🏖️ Tour Operator Form Example

### **Form Structure**

```
TOUR OPERATOR REGISTRATION FORM
├── 📋 Company Information (Public)
├── 📞 Contact Details (Public)
├── 🖼️ Tour Photos & Videos (Public)
├── 🗺️ Tour Packages (Public)
├── 👥 Guide Information (Vendor Only)
└── 🛡️ Licenses & Permits (Admin Only)
```

### **Tour-Specific Fields**

#### **Tour Packages Section**

| Field | Type | ACL | Required |
|-------|------|-----|----------|
| **Tour Names** | Multi-Select | Public Read, Vendor Write | ✅ Yes |
| **Duration (Days)** | Number | Public Read, Vendor Write | ✅ Yes |
| **Group Size** | Number | Public Read, Vendor Write | ❌ No |
| **Difficulty Level** | Select | Public Read, Vendor Write | ❌ No |
| **Languages Offered** | Multi-Select | Public Read, Vendor Write | ❌ No |
| **Includes Transport** | Checkbox | Public Read, Vendor Write | ❌ No |

**Tour Names Options:**
```
- Desert Safari
- Oasis Tour
- Historical Sites
- Camel Trekking
- Camping Experience
- Bird Watching
- Photography Tour
```

**Difficulty Level Options:**
```
- Easy (Family-friendly)
- Moderate (Some walking)
- Challenging (Fitness required)
- Extreme (Expert only)
```

#### **Guide Information Section** (Vendor Internal)

| Field | Type | ACL READ | ACL WRITE |
|-------|------|----------|-----------|
| **Number of Guides** | Number | Admin, Vendor | Admin, Vendor |
| **Guide Certifications** | Textarea | Admin, Vendor | Admin, Vendor |
| **Guide Languages** | Multi-Select | Admin, Vendor | Admin, Vendor |
| **Internal Notes** | Textarea | Admin, Vendor | Admin, Vendor |

#### **Licenses & Permits Section** (Admin Only)

| Field | Type | ACL READ | ACL WRITE |
|-------|------|----------|-----------|
| **Tourism License** | Text | Admin Only | Admin Only |
| **Insurance Status** | Select | Admin Only | Admin Only |
| **Safety Inspection** | Date | Admin Only | Admin Only |
| **Compliance Notes** | Textarea | Admin Only | Admin Only |

---

## 🎯 How to Implement

### **Method 1: Using the Governance UI (Recommended)**

1. **Login as Admin**
   ```
   URL: http://localhost:3000/admin/governance
   Email: super@siwa.com
   Password: super123
   ```

2. **Create Factory Components**
   - Go to FACTORY tab
   - Click "Create Master Block"
   - For each field in the examples above:
     - Select field type
     - Enter label and name
     - Set ACL permissions
     - Save

3. **Create Business Types**
   - Go to REGISTRY tab
   - Click "Create New Type"
   - Enter: Hotel, Restaurant, or Tour
   - Assign sections
   - Save

4. **Add Fields to Business Type**
   - Select the business type
   - Click on a section
   - Click "Add Field from Factory"
   - Select fields
   - Arrange order
   - Save

### **Method 2: Using the API**

```bash
# Create Factory Component
curl -X POST http://localhost:3000/api/admin/forms \
  -H "Content-Type: application/json" \
  -H "Cookie: siwa_session=YOUR_TOKEN" \
  -d '{
    "business_type_id": "FACTORY",
    "section_id": "factory_pool",
    "name": "hotel_name",
    "label": "Hotel Name",
    "field_type": "text",
    "required": true,
    "acl": {
      "read": ["super_admin", "content_admin", "vendor", "public"],
      "write": ["super_admin", "content_admin", "vendor"]
    }
  }'

# Add Field to Hotel Type
curl -X POST http://localhost:3000/api/admin/forms \
  -H "Content-Type: application/json" \
  -H "Cookie: siwa_session=YOUR_TOKEN" \
  -d '{
    "business_type_id": "hotel",
    "section_id": "basic_info",
    "name": "hotel_name",
    "label": "Hotel Name",
    "field_type": "text",
    "required": true
  }'
```

### **Method 3: Run the Seed Script**

```bash
# The seed script will create everything automatically
node scripts/seed-example-forms.js
```

---

## 🧪 Testing Guide

### **Test 1: Super Admin View**

1. Login: `super@siwa.com` / `super123`
2. Go to: `/admin/governance`
3. Select: Hotel business type
4. **Expected**: See ALL sections including "Admin Verification"
5. **Expected**: Can edit ALL fields

### **Test 2: Vendor View**

1. Login: `vendor@siwa.com` / `vendor123`
2. Go to: `/vendor`
3. Edit your hotel
4. **Expected**: See sections:
   - ✅ Basic Information
   - ✅ Contact Details
   - ✅ Photos & Media
   - ✅ Amenities & Features
   - ✅ Business Metrics
   - ❌ Admin Verification (**HIDDEN**)
5. **Expected**: Can edit all visible fields

### **Test 3: Public View**

1. Don't login (or use public search)
2. Browse hotels
3. **Expected**: See only:
   - ✅ Basic Information
   - ✅ Contact Details
   - ✅ Photos & Media
   - ✅ Amenities & Features
   - ❌ Business Metrics (**HIDDEN**)
   - ❌ Admin Verification (**HIDDEN**)
4. **Expected**: Cannot edit anything

### **Test 4: ACL Enforcement**

1. Login as vendor
2. Try to access hotel edit form
3. Open browser console (F12)
4. Check network requests
5. **Expected**: API only returns fields with vendor READ permission
6. **Expected**: Fields without vendor WRITE permission are locked (disabled)

---

## 📊 ACL Permission Summary

### **Permission Levels**

| Level | Who Can See | Who Can Edit | Example Fields |
|-------|-------------|--------------|----------------|
| **Public** | Everyone | Admin, Vendor | Name, description, photos |
| **Vendor Internal** | Admin, Vendor | Admin, Vendor | Revenue, employee count |
| **Admin Only** | Admin Only | Admin Only | Verification, ratings |
| **Super Admin Only** | Super Admin | Super Admin | Admin notes |

### **Role Access Matrix**

```
Field Type              | Admin | Vendor | Public | Salesman
────────────────────────┼───────┼────────┼────────┼─────────
Public Info             | ✅R/W | ✅R/W   | ✅R     | ✅R/W
Vendor Internal         | ✅R/W | ✅R/W   | ❌      | ❌
Admin Verification      | ✅R/W | ❌      | ❌      | ❌
Super Admin Notes       | ✅R/W*| ❌      | ❌      | ❌

* R/W = Read/Write, R = Read only
```

---

## 🎨 Visual Examples

### **What Admin Sees:**
```
┌─────────────────────────────────────────┐
│ HOTEL EDIT FORM (Admin View)            │
├─────────────────────────────────────────┤
│ 📋 Basic Information                    │
│   • Hotel Name          [_____________] │
│   • Star Rating         [4 Stars    ▼] │
│   • Description         [_____________] │
│                         [_____________] │
│                                         │
│ 📞 Contact Details                      │
│   • Phone               [_____________] │
│   • Email               [_____________] │
│                                         │
│ ... (all public sections) ...           │
│                                         │
│ 📊 Business Metrics                     │
│   • Monthly Revenue     [_____________] │
│   • Employee Count      [_____________] │
│   • Internal Notes      [_____________] │
│                                         │
│ 🛡️ Admin Verification                   │
│   • Status              [Verified   ▼] │
│   • Quality Rating      [________8__] │
│   • Priority Listing    [☑]            │
│   • Admin Notes         [_____________] │
│                         [_____________] │
└─────────────────────────────────────────┘
```

### **What Vendor Sees:**
```
┌─────────────────────────────────────────┐
│ HOTEL EDIT FORM (Vendor View)           │
├─────────────────────────────────────────┤
│ 📋 Basic Information                    │
│   • Hotel Name          [_____________] │
│   • Star Rating         [4 Stars    ▼] │
│   • Description         [_____________] │
│                         [_____________] │
│                                         │
│ 📞 Contact Details                      │
│   • Phone               [_____________] │
│   • Email               [_____________] │
│                                         │
│ ... (all public sections) ...           │
│                                         │
│ 📊 Business Metrics                     │
│   • Monthly Revenue     [_____________] │
│   • Employee Count      [_____________] │
│   • Internal Notes      [_____________] │
│                                         │
│ ❌ Admin Verification (NOT VISIBLE)    │
└─────────────────────────────────────────┘
```

### **What Public Sees:**
```
┌─────────────────────────────────────────┐
│ HOTEL DETAILS (Public View)             │
├─────────────────────────────────────────┤
│ 📋 Basic Information                    │
│   • Hotel Name: Grand Siwa Hotel        │
│   • Star Rating: ⭐⭐⭐⭐                 │
│   • Description: Luxury hotel...        │
│                                         │
│ 📞 Contact Details                      │
│   • Phone: +20 123 456 7890             │
│   • Email: info@grandsiwa.com           │
│                                         │
│ 🖼️ Photos & Media                       │
│   [Photo] [Photo] [Photo] [Photo]       │
│                                         │
│ ✅ Amenities & Features                 │
│   • WiFi ✓  Pool ✓  Parking ✓           │
│   • Rooms: 50  Restaurants: 2           │
│                                         │
│ ❌ Business Metrics (NOT VISIBLE)      │
│ ❌ Admin Verification (NOT VISIBLE)    │
└─────────────────────────────────────────┘
```

---

## 📚 Additional Resources

- **Factory Guide**: [FACTORY_FORM_BUILDER_GUIDE.md](./FACTORY_FORM_BUILDER_GUIDE.md)
- **Quick Reference**: [QUICK_REFERENCE_ACL.md](./QUICK_REFERENCE_ACL.md)
- **Caching System**: [CACHING_IMPLEMENTATION.md](./CACHING_IMPLEMENTATION.md)

---

## ✅ Implementation Checklist

For each business type:

- [ ] Create Factory components for all fields
- [ ] Set ACL permissions (Public/Vendor/Admin)
- [ ] Create sections (Basic, Contact, Media, etc.)
- [ ] Create business type (Hotel, Restaurant, Tour)
- [ ] Assign sections to business type
- [ ] Add fields to each section
- [ ] Test with admin account
- [ ] Test with vendor account
- [ ] Test with public (no login)
- [ ] Verify hidden fields are not accessible via API
- [ ] Check mobile responsiveness
- [ ] Validate all form inputs

---

**Ready to implement?** Start with the Hotel form example, then customize for other business types!

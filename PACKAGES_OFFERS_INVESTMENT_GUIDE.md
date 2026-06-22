# 📦 Packages, Offers, Discounts & Investment Opportunities System
## Complete Implementation Guide

---

## 📋 System Overview

A **flexible, decentralized marketplace management system** where:
- **Vendors/Businesses** manage their own packages, offers, discounts, and investment opportunities on their **mini websites**
- **Admin controls visibility** - what appears on the **main public website**
- **Customers see** curated, approved offerings on the main site
- **Investors discover** opportunities that admins approve

---

## 🏗️ Architecture

### Database Tables

#### **Packages System**
- `packages` - Product bundles, service packages, combos, tiers
- Tracks: pricing, quantity, validity, approval status, visibility
- Relations: One business → many packages

#### **Offers System**
- `offers` - Promotions, discounts, special deals
- Types: Percentage, fixed amount, buy-x-get-y, loyalty points, seasonal
- Relations: One business → many offers

#### **Discounts System**
- `discounts` - System-wide or targeted discounts
- Types: Percentage, fixed, tiered, volume-based, seasonal, category-based
- Relations: Can apply to specific items, categories, or packages

#### **Investment Opportunities System**
- `investment_opportunities` - Business funding opportunities
- Types: Equity, partnership, franchise, joint venture, sponsorship
- Relations: One business → many opportunities
- Tracks: ROI, investor count, applications, milestones

#### **Supporting Tables**
- `vendor_feature_permissions` - Per-vendor feature toggles
- `poi_system_settings` - Global admin settings
- `discount_usage` - Track discount redemptions
- `investment_applications` - Investor interest tracking
- `investment_faqs` - Q&A for investors
- `investment_milestones` - Business progress tracking

---

## 👨‍💼 Vendor/Business Features

### Mini Website Dashboard

**URL:** `/vendor/packages`, `/vendor/offers`, `/vendor/discounts`, `/vendor/investment-opportunities`

Vendors can:
1. ✅ Create packages/offers/discounts/investment opportunities
2. ✅ Manage (edit, delete, archive)
3. ✅ Track performance (inquiries, applications, usage)
4. ✅ View approval status
5. ✅ See if visible on main site (controlled by admin)

**Features:**
- Draft → Publish workflow
- Admin approval required (configurable)
- Visibility toggle controlled by admin, not vendor
- Analytics dashboard (views, clicks, conversions)
- Feature request for homepage inclusion

---

## 🎛️ Admin Control Panel

### Admin Pages

#### **1. Packages Manager**
- **URL:** `/admin/packages`
- View all vendor packages
- Filter by: status (active/draft/inactive), approval status
- Actions:
  - ✏️ Edit package details
  - ✓ Approve/Reject packages
  - 👁️ Toggle visibility on main site
  - ⭐ Mark as featured
  - 🗑️ Delete

#### **2. Offers Manager**
- **URL:** `/admin/offers`
- View all offers
- Filter by: status, type, approval status
- Same actions as packages manager

#### **3. Discounts Manager**
- **URL:** `/admin/discounts`
- Manage system-wide and vendor discounts
- Types: percent, fixed, tiered, volume, seasonal
- Actions: Create, Edit, Toggle auto-apply, Approve

#### **4. Investment Opportunities Manager**
- **URL:** `/admin/investment-opportunities`
- Approve business investment listings
- Toggle visibility on main site
- View investor applications
- Track funding progress

#### **5. POI Settings & Permissions**
- **URL:** `/admin/poi-settings`
- Two tabs: Global Settings & Vendor Permissions

**Global Settings:**
- Allow vendors to create packages/offers/discounts ✓/✗
- Default limits per vendor (20 packages, 50 offers, 50 discounts)
- Require approval settings per type
- Display settings (show savings %, strikethrough price, featured deals)
- Email notifications

**Vendor Permissions:**
- Override defaults per vendor
- Toggle features on/off
- Set custom limits
- Suspend vendor if needed

---

## 👥 Public Website

### Customer Pages

#### **1. Main Packages Page**
- **URL:** `/packages`
- Shows packages with `visibility_on_main_site = true`
- Features:
  - Search by name
  - Filter by type, price range
  - Sort by savings, popularity, price
  - Card display with: icon, name, business, price, savings %, sold count
  - CTA: "View Details"

#### **2. Main Offers Page**
- **URL:** `/offers`
- Shows approved, visible offers
- Features:
  - Featured deals section (top 3)
  - Search & filter
  - Coupon code display
  - Deal countdown timer
  - CTA: "Learn More"

#### **3. Main Investment Opportunities Page**
- **URL:** `/investment-opportunities`
- Shows approved, visible investment opportunities
- Features:
  - Featured opportunities (2)
  - Filter by: type, business stage, ROI level
  - Sort by: ROI, min investment, progress
  - Card display with: icon, ROI %, investor progress bar
  - Business metrics: years in business, annual revenue

---

## 🔄 Workflows

### Package/Offer Creation Workflow (Vendor)

```
1. Vendor creates on mini website → Draft
2. Vendor fills details & submits
3. Auto-saved or requires approval (admin setting)
4. If approval required:
   - Admin reviews at `/admin/packages`
   - Admin approves/rejects
5. If approved:
   - Vendor can publish
   - Still NOT visible on main site yet
6. Admin manually toggles visibility:
   - Can show on main `/packages` page
   - Vendor doesn't control this
```

### Investment Application Workflow (Investor)

```
1. Investor sees opportunity on `/investment-opportunities`
2. Investor clicks "Learn More"
3. Investor submits application with:
   - Investment amount
   - Message
   - Contact info
4. Business receives notification
5. Business reviews at `/vendor/investment-opportunities`
6. Business responds/negotiates
7. If deal closes:
   - Status → "funded"
   - Admin may update `investors_current` count
```

---

## 📊 Visibility Control Logic

### What Shows on Main Site

**Packages appear if:**
- `status = 'active'`
- `visibility_on_main_site = TRUE` (admin toggle)
- `approval_status = 'approved'` (if required)
- `valid_from <= today <= valid_until` (if date fields set)
- `quantity_available > quantity_sold` (if limited qty)

**Offers appear if:**
- `status = 'active'`
- `visibility_on_main_site = TRUE`
- `approval_status = 'approved'`
- `valid_from <= now <= valid_until`
- `usage_count < usage_limit`

**Investment Opportunities appear if:**
- `status IN ('published', 'funded')`
- `visibility_on_main_site = TRUE`
- `approval_status = 'approved'`

---

## 🎯 Key Features

### For Vendors
✅ Complete management dashboard
✅ Track inquiries and interest
✅ Set own pricing and terms
✅ See approval status
✅ Analytics (views, clicks, applications)

### For Admins
✅ Approve/reject submissions
✅ Control what's visible publicly
✅ Set global policies & permissions
✅ Per-vendor override settings
✅ Feature on homepage
✅ Monitor investor applications
✅ Track investment progress

### For Customers
✅ Browse curated packages & offers
✅ Search and filter
✅ See real ROI and savings
✅ Apply for investments
✅ Coupon codes
✅ Featured deals
✅ Business metrics & credibility

---

## 🔐 Permission Model

### Vendor Permissions (per feature)

**Table: `vendor_feature_permissions`**

```
{
  business_id: "123",
  can_create_packages: true,
  can_create_offers: true,
  can_create_discounts: false,
  packages_limit: 20,
  offers_limit: 50,
  discounts_limit: 0,
  requires_approval: true,
  status: "active"
}
```

Overrides global settings if set.

### Global Permissions

**Table: `poi_system_settings`**

```
{
  vendors_can_create_packages: false,
  vendors_can_create_offers: true,
  vendors_can_create_discounts: false,
  default_packages_limit: 20,
  default_offers_limit: 50,
  packages_require_approval: true,
  offers_require_approval: false,
  show_savings_percentage: true,
  show_original_price: true,
  highlight_featured_deals: true,
  max_featured_count: 5
}
```

---

## 📱 Section Components (Homepage)

Can add to homepages via `/admin/homepage-editor/[id]`:

### Package Showcase
- Title & description
- Display: Featured packages carousel
- Filter: By business type, category
- CTA: Link to `/packages`

### Offer Banner
- Countdown timer
- Coupon code
- Featured offers grid
- CTA: Link to `/offers`

### Investment Opportunities
- Featured opportunities
- ROI highlights
- CTA: Link to `/investment-opportunities`

---

## 🗄️ Database Setup

Run migration:
```sql
-- Install tables
mysql -u root -p siwa_oasis < database-migrations/packages-offers-discounts.sql
mysql -u root -p siwa_oasis < database-migrations/investment-opportunities.sql
```

---

## 🚀 Deployment Checklist

- [ ] Run database migrations
- [ ] Update `/admin` navigation to include new pages
- [ ] Configure global settings at `/admin/poi-settings`
- [ ] Set vendor permissions for early adopters
- [ ] Test workflow: vendor create → admin approve → main site display
- [ ] Test investment application workflow
- [ ] Train admin team on approval process
- [ ] Create FAQ for vendors
- [ ] Set up email notifications
- [ ] Test with sample businesses
- [ ] Go live and monitor

---

## 📞 Support

### Vendor Questions
- How do I create a package? → Vendor Dashboard
- Why isn't my package showing? → Check approval & visibility status
- How do I get featured? → Admin must mark as featured
- Who sees my investment offer? → Admin controls visibility

### Admin Questions
- How to approve items? → Click ✓ at `/admin/[type]`
- How to control visibility? → 👁️ button next to each item
- How to set global rules? → `/admin/poi-settings`
- How to override per-vendor? → Per-vendor tab at settings

---

## 📈 Analytics & Reporting

**Available metrics:**
- Views per package/offer
- Click-through rate
- Inquiries count
- Applications count (for investments)
- ROI tracking
- Investor count
- Capital raised

**Views created:**
- `active_packages`
- `active_offers`
- `featured_deals` (combines packages & offers)
- `business_investment_stats`
- `investor_analytics`

---

## 🔄 Future Enhancements

1. **Approval Workflows**
   - Admin can request revisions
   - Vendor notification & auto-response

2. **Advanced Analytics**
   - Conversion funnel (view → inquiry → purchase)
   - Investor success rate
   - ROI achieved vs. promised

3. **Seasonal Campaigns**
   - Auto-create seasonal offers
   - Bulk approval for campaigns
   - Time-based visibility rules

4. **API for 3rd Parties**
   - Export packages/offers as XML/JSON
   - Partner integrations

5. **Mobile App**
   - Vendor app for approvals
   - Investor app for deal discovery

---

**Last Updated:** June 2026  
**Status:** Production Ready ✅

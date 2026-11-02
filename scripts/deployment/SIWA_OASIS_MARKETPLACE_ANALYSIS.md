# SIWA OASIS: Journey Marketplace & Request/Reply System Analysis

## Executive Summary

SIWA Oasis has a comprehensive **Journey Marketplace** system that enables:
- **Visitors/Guests** to submit customized requests for journeys, accommodations, dining, real estate, and shops
- **Vendors** to browse requests and submit competitive offers
- **Admins** to manage request distribution and tier-based access control
- **Tier-based** feature gates that limit marketplace access by subscription level

---

## 1. VISITOR/GUEST REQUEST SUBMISSION FEATURES

### 1.1 Smart Journey Planner Component
**File:** `src/components/SmartJourneyPlanner.tsx`

**Request Categories Available:**
- 🗺️ **Full Journey & Tour** - Complete organized trips, safaris, itineraries
- 🏨 **Accommodation** - Hotels, ecolodges, desert camps
- 🏠 **Real Estate & Land** - Investment, buying, long-term rental properties
- 🍽️ **Dining & Restaurants** - Table reservations, authentic meals
- 🛍️ **Local Shops & Crafts** - Handicrafts, salt lamps, olive oil

**Request Type Preferences (Vibes):**

| Category | Preferences |
|----------|-------------|
| **Journey** | Spiritual & Healing, Nomadic Adventure, Cultural Storytelling |
| **Accommodation** | Luxury Ecolodge, Budget & Cozy, Desert Camping |
| **Real Estate** | Buy Property, Investment/Land, Long Term Rent |
| **Restaurant** | Traditional Siwan, Romantic/Sunset, Casual & Cafe |
| **Shop** | Handicrafts & Salt, Dates & Olive Oil, Other |

**Form Fields Collected:**
```
STEP 1: Category selection (required)
STEP 2: Preference/Vibe (required)
STEP 3: Logistics Details:
  - Duration (days/nights) - for journeys & accommodation
  - Group size - for journeys & accommodation
  - Estimated budget (text)
  - Arrival/date - for journeys, accommodation, restaurants
  - Special requests/notes (textarea)
STEP 4: Visitor Contact Info:
  - Name (required)
  - Email (required)
```

**Customer Data Stored in `journey_requests` Table:**
```
✓ customer_name
✓ customer_email
✓ request_type (journey|accommodation|real_estate|restaurant|shop)
✓ vibe (spiritual|adventure|culture|luxury|budget|etc.)
✓ duration
✓ pace
✓ interests (JSON array)
✓ budget
✓ group_size
✓ arrival_date
✓ special_requests
✓ itinerary_name (system-generated)
✓ itinerary_summary (system-generated)
✓ status (open|in_review|closed)
✓ created_at / updated_at
```

**Admin-Controlled Fields (for distribution):**
```
✓ distribution_status (admin_review|dispatched)
✓ target_vendor_id (restrict to specific vendor)
✓ target_business_type_id (restrict to specific category)
✓ reveal_contact (show/hide customer name & email from vendors)
```

---

## 2. VENDOR REQUEST MANAGEMENT & REPLY SYSTEM

### 2.1 Vendor Dashboard: Marketplace Requests
**File:** `src/app/vendor/journey-requests/page.tsx`

**Features:**
- Browse open marketplace requests matching vendor's tier and category
- View request details: vibe, duration, budget, group size, arrival date, special requests
- Filter by request type (All, Journeys, Accommodation, Real Estate, Restaurants, Shops)
- Submit competitive offers with pricing
- Contact restrictions based on tier

### 2.2 Request Submission Form
The `OfferModal` component allows vendors to:
```
✓ Set offer title
✓ Provide offer description
✓ Set price and currency
✓ List inclusions (JSON array)
✓ List exclusions (JSON array)
✓ Set validity period (days)
✓ Provide contact phone
✓ Provide contact email
✓ Add notes
✓ Submit offer
```

### 2.3 Vendor Offers Dashboard: "My Submitted Offers"
**File:** `src/app/vendor/journey-requests/my-offers/page.tsx`

**Features:**
- View all submitted offers
- Track offer status: Pending Review, Accepted, Not Selected
- Filter by status (All, Pending, Accepted, Rejected)
- Stats dashboard showing offer counts by status
- Only accepted offers show customer contact details
- Displays journey details: vibe, duration, budget, group size, itinerary name

**Data Stored in `journey_offers` Table:**
```
✓ journey_id (FK to journey_requests)
✓ vendor_id
✓ business_id
✓ offer_title
✓ offer_description
✓ price
✓ currency
✓ inclusions (JSON)
✓ exclusions (JSON)
✓ validity_days
✓ contact_phone
✓ contact_email
✓ notes
✓ status (pending|accepted|rejected)
✓ created_at / updated_at
```

### 2.4 Vendor Layout Navigation
**File:** `src/app/vendor/layout.tsx`

**Marketplace Section (NEW):**
```
📋 Marketplace Requests    → /vendor/journey-requests
📄 My Submitted Offers     → /vendor/journey-requests/my-offers
```

---

## 3. TIER-BASED ACCESS CONTROL

### 3.1 Subscription Tier Features (from `journey-marketplace-migration.sql`)

| Tier | Access | View Requests | Submit Offers | Contact Email | Contact Phone | Contact WhatsApp |
|------|--------|---------------|---------------|---------------|---------------|-----------------|
| **FREE** | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **BASIC** | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| **PREMIUM** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ❌ NO |
| **GOLD** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **VIP/ENTERPRISE** | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES |

### 3.2 Tier Capabilities in UI

**Free/No Access:**
- Feature locked overlay with gold lock icon
- CTA to upgrade tier

**Basic Tier:**
- Can view all open requests
- Cannot submit formal offers
- Cannot see vendor contact info

**Premium+ Tiers:**
- Can view & submit offers
- Can contact customers (email, phone, WhatsApp based on tier)
- Offers appear on "My Submitted Offers" dashboard

---

## 4. API ENDPOINTS FOR REQUESTS & REPLIES

### 4.1 GET `/api/journeys`
**Purpose:** Fetch all open journey requests (for vendors to browse)

**Parameters:**
```
?status=open              - Filter by status (default: open)
?limit=50                 - Limit results (default: 50)
?vendor_id=current        - (for vendors) show only targeted requests
?business_category=X      - Filter by business type
?admin=true               - (admin-only) view all without distribution checks
?distribution_status=Y    - (admin) filter by dispatch status
```

**Response:**
```json
{
  "success": true,
  "journeys": [
    {
      "id": 1,
      "customer_name": "John Doe", // masked if reveal_contact = false
      "customer_email": "john@example.com", // masked if reveal_contact = false
      "request_type": "journey",
      "vibe": "spiritual",
      "duration": "5",
      "budget": "$1500-2000",
      "group_size": 4,
      "arrival_date": "2026-06-15",
      "special_requests": "Vegetarian meals",
      "status": "open",
      "offer_count": 3,
      "created_at": "2026-05-28T10:00:00Z"
    }
  ]
}
```

**Distribution Logic:**
- Vendors only see requests WHERE:
  - `distribution_status = 'dispatched'` AND
  - `target_vendor_id IS NULL` OR `target_vendor_id = vendor_id` AND
  - `target_business_type_id IS NULL` OR `target_business_type_id = business_type`

### 4.2 POST `/api/journeys`
**Purpose:** Customer submits a new custom journey request

**Request Body:**
```json
{
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "request_type": "journey",
  "vibe": "adventure",
  "duration": "7",
  "pace": "active",
  "interests": ["desert", "hiking", "culture"],
  "budget": "$2000-3000",
  "group_size": 2,
  "arrival_date": "2026-07-01",
  "special_requests": "Photography stops",
  "custom_details": {
    "selected_category_name": "Full Journey & Tour",
    "selected_preference_name": "Nomadic Adventure"
  }
}
```

**Response:**
```json
{
  "success": true,
  "journey": {
    "id": 42,
    "status": "open",
    "distribution_status": "admin_review"
  }
}
```

**Workflow:**
- Request created with `status = 'open'` and `distribution_status = 'admin_review'`
- Admin must dispatch (PATCH to `/api/journeys/[id]/dispatch`) to make visible to vendors

### 4.3 GET `/api/journeys/[id]`
**Purpose:** Get a single journey with its offers

**Response:**
```json
{
  "success": true,
  "journey": { /* journey object */ },
  "offers": [
    {
      "id": 1,
      "offer_title": "5-Day Spiritual Desert Retreat",
      "price": 1800,
      "currency": "USD",
      "inclusions": ["Accommodation", "Meals", "Guide"],
      "status": "pending",
      "business_name": "Desert Spirits",
      "validity_days": 7,
      "created_at": "2026-05-28T12:30:00Z"
    }
  ]
}
```

### 4.4 PATCH `/api/journeys/[id]`
**Purpose:** Update journey status

**Request Body:**
```json
{
  "status": "in_review" // or "closed"
}
```

### 4.5 PATCH `/api/journeys/[id]/dispatch`
**Purpose:** Admin distributes request to vendors (ADMIN-ONLY)

**Request Body:**
```json
{
  "distribution_status": "dispatched",        // or "admin_review"
  "target_business_type_id": "adventure",     // optional - restrict to category
  "target_vendor_id": "v123",                 // optional - restrict to vendor
  "reveal_contact": true                      // show/hide customer contact info
}
```

**Example Use Cases:**
```
// Dispatch to all adventure vendors
PATCH /api/journeys/42/dispatch
{ "distribution_status": "dispatched", "target_business_type_id": "adventure" }

// Dispatch only to specific vendor
PATCH /api/journeys/42/dispatch
{ "distribution_status": "dispatched", "target_vendor_id": "v123", "reveal_contact": true }

// Send back to admin review
PATCH /api/journeys/42/dispatch
{ "distribution_status": "admin_review" }
```

### 4.6 POST `/api/journeys/offers`
**Purpose:** Vendor submits an offer for a journey request

**Request Body:**
```json
{
  "journey_id": 42,
  "vendor_id": "v123",
  "business_id": "b456",
  "offer_title": "5-Day Spiritual Desert Retreat",
  "offer_description": "A transformative journey through Siwa's ancient temples...",
  "price": 1800,
  "currency": "USD",
  "inclusions": ["Accommodation", "Meals", "Guide", "Camel Trek"],
  "exclusions": ["Flights", "Travel Insurance"],
  "validity_days": 7,
  "contact_phone": "+20123456789",
  "contact_email": "info@spiritdesert.com",
  "notes": "Best for small groups. Can accommodate dietary restrictions."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer submitted successfully"
}
```

### 4.7 GET `/api/journeys/offers`
**Purpose:** Fetch vendor offers

**Parameters:**
```
?journey_id=42           - Get all offers for specific journey
?vendor_id=current       - Get all offers by current vendor
```

**Response:**
```json
{
  "success": true,
  "offers": [
    {
      "id": 1,
      "journey_id": 42,
      "offer_title": "5-Day Spiritual Desert Retreat",
      "price": 1800,
      "currency": "USD",
      "inclusions": ["Accommodation", "Meals", "Guide"],
      "exclusions": ["Flights"],
      "status": "pending",
      "business_name": "Desert Spirits",
      "business_tier": "premium",
      "vibe": "spiritual",
      "duration": "5",
      "budget": "$1500-2000",
      "group_size": 4,
      "validity_days": 7,
      "created_at": "2026-05-28T12:30:00Z",
      // Only shown if offer is accepted:
      "customer_name": "John Doe",
      "customer_email": "john@example.com"
    }
  ]
}
```

---

## 5. DATABASE SCHEMA

### 5.1 `journey_requests` Table
```sql
CREATE TABLE IF NOT EXISTS journey_requests (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  customer_name           VARCHAR(255) NOT NULL,
  customer_email          VARCHAR(255) NOT NULL,
  request_type            VARCHAR(50) NOT NULL,       -- journey|accommodation|real_estate|restaurant|shop
  vibe                    VARCHAR(100) NOT NULL,
  duration                VARCHAR(50) DEFAULT '',
  pace                    VARCHAR(50) DEFAULT '',
  interests               JSON DEFAULT NULL,
  budget                  VARCHAR(100) DEFAULT '',
  group_size              INT DEFAULT 1,
  arrival_date            DATE DEFAULT NULL,
  special_requests        TEXT DEFAULT '',
  itinerary_name          VARCHAR(255) DEFAULT '',
  itinerary_summary       TEXT DEFAULT '',
  custom_details          JSON DEFAULT NULL,
  status                  ENUM('open','in_review','closed') DEFAULT 'open',
  distribution_status     VARCHAR(50) DEFAULT 'admin_review',  -- admin_review|dispatched
  target_business_type_id VARCHAR(50) DEFAULT NULL,
  target_vendor_id        VARCHAR(36) DEFAULT NULL,
  reveal_contact          BOOLEAN DEFAULT 1,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_email (customer_email),
  INDEX idx_vibe (vibe),
  INDEX idx_created (created_at),
  INDEX idx_distribution (distribution_status)
);
```

### 5.2 `journey_offers` Table
```sql
CREATE TABLE IF NOT EXISTS journey_offers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  journey_id        INT NOT NULL,
  vendor_id         VARCHAR(36) DEFAULT NULL,
  business_id       VARCHAR(36) NOT NULL,
  offer_title       VARCHAR(255) NOT NULL,
  offer_description TEXT DEFAULT '',
  price             DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(10) DEFAULT 'USD',
  inclusions        JSON DEFAULT NULL,
  exclusions        JSON DEFAULT NULL,
  validity_days     INT DEFAULT 7,
  contact_phone     VARCHAR(100) DEFAULT '',
  contact_email     VARCHAR(255) DEFAULT '',
  notes             TEXT DEFAULT '',
  status            ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (journey_id) REFERENCES journey_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  
  INDEX idx_journey (journey_id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_business (business_id),
  INDEX idx_status (status)
);
```

### 5.3 Subscription Tier Features (in `subscription_tiers.features` JSON)
```json
{
  "journey_marketplace_access": true,   // Can see/access marketplace
  "journey_view_requests": true,        // Can view open requests
  "journey_submit_offer": true,         // Can submit offers
  "journey_contact_email": true,        // Can contact via email
  "journey_contact_phone": true,        // Can contact via phone
  "journey_contact_whatsapp": true      // Can contact via WhatsApp
}
```

---

## 6. SCENARIO-BASED WORKFLOWS

### 6.1 Complete Marketplace Workflow

**VISITOR PERSPECTIVE:**
```
1. Visit homepage with SmartJourneyPlanner
   ↓
2. Select request category (journey, accommodation, etc.)
   ↓
3. Choose preference/vibe (spiritual, budget, etc.)
   ↓
4. Fill in logistics (duration, budget, date, notes)
   ↓
5. Provide contact info (name, email)
   ↓
6. Submit request → stored with status='open', distribution_status='admin_review'
   ↓
7. Email confirmation sent
   ↓
8. Receive vendor offers via email
```

**ADMIN PERSPECTIVE:**
```
1. Review submitted journey requests (admin_review status)
   ↓
2. Decide distribution:
   Option A: Dispatch to all vendors in category
   Option B: Dispatch to specific vendor only
   Option C: Reveal or hide customer contact info
   ↓
3. Update request via PATCH /api/journeys/[id]/dispatch
   ↓
4. Request now visible to targeted vendors (distribution_status='dispatched')
```

**VENDOR PERSPECTIVE:**
```
1. Login to vendor hub
   ↓
2. Navigate to "Marketplace Requests" (if tier >= BASIC)
   ↓
3. Browse open requests matching vendor's tier & category
   ↓
4. Click request → view details
   ↓
5. If tier >= PREMIUM: Submit offer
   - Set price, inclusions, contact info
   - Offer stored with status='pending'
   ↓
6. Navigate to "My Submitted Offers"
   ↓
7. Track offer status (pending → accepted or rejected)
   ↓
8. If accepted: See customer contact details & proceed with negotiation
```

---

## 7. WHAT EXISTS vs. WHAT'S MISSING

### 7.1 ✅ CURRENTLY IMPLEMENTED

| Feature | Status | Location |
|---------|--------|----------|
| Visitor request submission form | ✅ | `SmartJourneyPlanner.tsx` |
| Request categories (5 types) | ✅ | Component code |
| Tier-based marketplace access | ✅ | Feature gates in pages |
| Vendor marketplace browse | ✅ | `/vendor/journey-requests` |
| Offer submission | ✅ | Modal in journey-requests page |
| Offer tracking dashboard | ✅ | `/vendor/journey-requests/my-offers` |
| Admin dispatch API | ✅ | `/api/journeys/[id]/dispatch` |
| Request/offer APIs | ✅ | `/api/journeys/**` |
| Subscription tier controls | ✅ | Database features JSON |
| Contact privacy masking | ✅ | reveal_contact flag |
| Targeted dispatch | ✅ | target_vendor_id, target_business_type_id |

### 7.2 ❓ PARTIALLY IMPLEMENTED / NEEDS WORK

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard for requests | ❌ | No UI found for admins to review/dispatch |
| Customer view of submitted requests | ❌ | Visitors can't track their own requests |
| Offer acceptance/rejection | ⚠️ | Status field exists but no UI to change it |
| Offer expiry enforcement | ⚠️ | validity_days stored but no cleanup job |
| Email notifications | ❌ | No email service integrated yet |
| WhatsApp integration | ⚠️ | Tier feature exists but no WhatsApp API |
| Negotiation/messaging | ❌ | No chat/message system between parties |
| Payment integration | ❌ | No payment processing |
| Multiple offers per vendor | ⚠️ | Table allows it but no grouping/management UI |

### 7.3 🛠️ RECOMMENDED IMPLEMENTATIONS

#### Priority 1: Customer Tracking
```
- Add customer dashboard page
- Show submitted requests & their status
- Display received offers & compare prices
- Accept/reject offers
```

#### Priority 2: Admin Management
```
- Create admin page to review pending requests
- One-click dispatch to categories or specific vendors
- Set reveal_contact toggle
- Monitor offers submitted
```

#### Priority 3: Communications
```
- Email notifications on:
  - Request submitted
  - Offer received
  - Offer accepted
- Optional: WhatsApp integration for Premium+
```

#### Priority 4: Payment & Negotiation
```
- Payment gateway integration (Stripe/PayPal)
- Offer acceptance flow with payment
- Optional: Chat/messaging between vendor and customer
```

---

## 8. FILE LOCATIONS REFERENCE

### Frontend Components
```
src/components/SmartJourneyPlanner.tsx          - Visitor request form
src/app/vendor/journey-requests/page.tsx        - Vendor marketplace browse & offer submit
src/app/vendor/journey-requests/my-offers/page.tsx - Vendor offers tracking
src/app/vendor/layout.tsx                       - Vendor navigation menu
```

### API Routes
```
src/app/api/journeys/route.ts                   - GET/POST journeys
src/app/api/journeys/[id]/route.ts              - GET/PATCH single journey
src/app/api/journeys/[id]/dispatch/route.ts     - PATCH dispatch (admin)
src/app/api/journeys/offers/route.ts            - GET/POST offers
```

### Database
```
journey-marketplace-migration.sql               - Tables & tier features
master-schema.sql                               - Complete schema (partial)
```

### Configuration
```
src/app/vendor/layout.tsx                       - Marketplace menu item
src/middleware.ts                               - Route protection (/vendor)
```

---

## 9. DEPLOYMENT NOTES

### Database Migration
```sql
-- Run this to create tables:
SOURCE journey-marketplace-migration.sql;
```

### Environment Variables
```
DATABASE_URL=mysql://user:pass@host/siwa_oasis
```

### Feature Flags
None currently - access controlled via subscription_tiers.features JSON

---

## 10. FUTURE ROADMAP

### Phase 1: Admin Portal (Recommended)
- Admin dashboard for journey requests
- Request review & dispatch interface
- Offer monitoring
- Tier management

### Phase 2: Customer Experience
- Customer login & request tracking
- Offer comparison & selection
- Email notifications

### Phase 3: Communication Layer
- Email integration
- Optional WhatsApp integration
- In-app messaging

### Phase 4: Monetization
- Payment processing
- Commission system
- Subscription enforcement

---

**Document Generated:** May 28, 2026
**System:** SIWA OASIS Marketplace
**Schema Version:** Complete as of journey-marketplace-migration.sql

# Admin Permission & Vendor Sales System (Option 3 Enhanced)

## Business Model: Convert Visitor Demand Into Revenue

### How It Works

```
VISITOR SUBMITS REQUEST
└─ "Ali's Restaurant"
   ├─ Captured in visitor_recommendations (HIDDEN from public)
   ├─ Status: pending
   └─ Admin notified
   
ADMIN REVIEWS
└─ Evaluates business
   ├─ Option 1: Approve for website (free listing)
   ├─ Option 2: Outreach to vendor (sales opportunity)
   ├─ Option 3: Reject (not suitable)
   └─ Each has different workflow
   
VENDOR OUTREACH (Sales)
└─ "Ali's Restaurant" has 5 visitor requests
   ├─ Admin sends: "Your business was requested by visitors"
   ├─ "Premium featured listing: $500/month"
   ├─ Vendor agrees → Premium listing
   ├─ Vendor declines → Regular listing option
   └─ Revenue generated: $500/month
   
WEBSITE UPDATE
└─ Approved business added to public view
   ├─ Show: "Featured (5 visitor requests)"
   ├─ Or: "Popular request (3 people asked)"
   └─ Or: "New addition to Siwa Oasis"
   
VISITOR SEES RESULT
└─ Their requested business now available
   ├─ Uses it in journey
   ├─ Positive experience
   └─ Increased satisfaction
```

---

## Admin Permission Levels

### Admin Permissions Framework

```
Admin Dashboard Access
├─ View Recommendations (REQUIRED)
├─ Approve/Reject (REQUIRED)
├─ Contact Vendors (OPTIONAL)
├─ Manage Pricing (OPTIONAL)
├─ View Revenue Reports (OPTIONAL)
└─ Edit Database (REQUIRED)
```

### Permission Types

#### 1. **View Recommendations**
- ✅ All admins can view
- Status: pending, under_review, approved
- Visitor details visible
- Urgency/votes visible

#### 2. **Approve/Reject**
- ✅ Senior admins only
- Decision: permit/reject
- Leave notes
- Notify vendors if approved

#### 3. **Contact Vendors**
- ✅ Sales team only
- Send outreach emails
- Track responses
- Manage vendor relationships

#### 4. **View Revenue**
- ✅ Finance/management only
- Sales pipeline tracking
- Revenue reports
- Vendor payments

#### 5. **Edit Website**
- ✅ Content team only
- Add to database
- Set pricing
- Manage descriptions

---

## Database Schema: Admin Permissions & Vendor Sales

### Table 1: Enhanced visitor_recommendations (Updated)

```sql
CREATE TABLE visitor_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Visitor Information
    business_name VARCHAR(255) NOT NULL,
    parent_type_id VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(255) NOT NULL,
    visitor_name VARCHAR(255),
    visitor_id VARCHAR(36),
    
    -- Recommendation Details
    description MEDIUMTEXT,
    why_recommended TEXT,
    location VARCHAR(255),
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Admin Status (Permission System)
    status ENUM(
        'pending',           -- Newly submitted
        'under_review',      -- Admin reviewing
        'approved_free',     -- Approved for free listing
        'approved_premium',  -- Approved for premium (vendor paid)
        'vendor_outreach',   -- Sent to vendor for sales
        'vendor_interested', -- Vendor expressed interest
        'vendor_negotiating',-- Pricing negotiation
        'vendor_agreed',     -- Vendor agreed to pay
        'converted',         -- Added to website
        'rejected'           -- Not approved
    ) DEFAULT 'pending',
    
    -- Admin Permission
    admin_permission_required BOOLEAN DEFAULT TRUE,
    admin_id_assigned VARCHAR(36),
    admin_permission_notes TEXT,
    admin_permission_date TIMESTAMP NULL,
    permit_decision ENUM('approved', 'rejected', 'pending') DEFAULT 'pending',
    
    -- Visibility Control
    visible_to_public BOOLEAN DEFAULT FALSE,
    visible_to_admin BOOLEAN DEFAULT TRUE,
    visible_reason VARCHAR(255),
    
    -- Vendor Information
    vendor_id VARCHAR(36) NULL,
    vendor_email VARCHAR(255) NULL,
    vendor_phone VARCHAR(20) NULL,
    vendor_name VARCHAR(255) NULL,
    
    -- Sales Tracking
    sales_status ENUM(
        'not_contacted',
        'outreach_sent',
        'no_response',
        'interested',
        'negotiating',
        'agreed',
        'rejected_by_vendor',
        'already_listed'
    ) DEFAULT 'not_contacted',
    
    sales_lead_assigned_to VARCHAR(36),
    sales_outreach_date TIMESTAMP NULL,
    sales_response_date TIMESTAMP NULL,
    sales_value_usd DECIMAL(10, 2),
    sales_term_months INT DEFAULT 0,
    sales_notes TEXT,
    
    -- Metrics
    votes INT DEFAULT 1,
    urgency_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    visitor_count INT DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    converted_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_status (status),
    INDEX idx_admin_permission (admin_permission_required, permit_decision),
    INDEX idx_visible (visible_to_public, visible_to_admin),
    INDEX idx_sales_status (sales_status),
    INDEX idx_admin_assigned (admin_id_assigned),
    INDEX idx_created_at (created_at),
    INDEX idx_votes (votes DESC)
);
```

### Table 2: Admin Permission Audit Trail

```sql
CREATE TABLE admin_permissions_audit (
    id VARCHAR(36) PRIMARY KEY,
    recommendation_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL,
    action ENUM(
        'viewed',
        'permitted_free',
        'permitted_premium',
        'rejected',
        'assigned_to_sales',
        'vendor_contacted',
        'vendor_response',
        'converted',
        'visibility_changed'
    ) NOT NULL,
    permission_granted BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id)
);
```

### Table 3: Vendor Sales Pipeline

```sql
CREATE TABLE vendor_sales_pipeline (
    id VARCHAR(36) PRIMARY KEY,
    recommendation_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36),
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255) NOT NULL,
    vendor_phone VARCHAR(20),
    
    -- Pipeline Stage
    stage ENUM(
        'prospect',      -- Initial prospect
        'outreach_sent', -- Contacted
        'responded',     -- Vendor replied
        'qualified',     -- Has budget/interest
        'proposal_sent', -- Pricing sent
        'negotiating',   -- Back and forth
        'won',           -- Agreement reached
        'lost'           -- Vendor declined
    ) DEFAULT 'prospect',
    
    -- Pricing
    offering_type ENUM('featured', 'premium', 'standard') DEFAULT 'standard',
    monthly_price_usd DECIMAL(10, 2),
    annual_price_usd DECIMAL(10, 2),
    contract_term_months INT DEFAULT 0,
    
    -- Engagement
    outreach_email_count INT DEFAULT 0,
    last_contact_date TIMESTAMP NULL,
    next_followup_date DATE NULL,
    response_count INT DEFAULT 0,
    
    -- Decision
    vendor_decision ENUM(
        'pending',
        'interested',
        'not_interested',
        'already_listed',
        'needs_more_info',
        'agreed'
    ) DEFAULT 'pending',
    
    vendor_decision_date TIMESTAMP NULL,
    vendor_notes TEXT,
    
    -- Sales Rep
    assigned_to_sales_id VARCHAR(36),
    assigned_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    won_date TIMESTAMP NULL,
    lost_date TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_stage (stage),
    INDEX idx_assigned_sales (assigned_to_sales_id),
    INDEX idx_followup (next_followup_date),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id)
);
```

### Table 4: Admin Permissions & Settings

```sql
CREATE TABLE admin_permission_settings (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    
    -- Permission Levels
    can_view_recommendations BOOLEAN DEFAULT TRUE,
    can_approve_recommendations BOOLEAN DEFAULT FALSE,
    can_reject_recommendations BOOLEAN DEFAULT FALSE,
    can_contact_vendors BOOLEAN DEFAULT FALSE,
    can_view_revenue BOOLEAN DEFAULT FALSE,
    can_edit_database BOOLEAN DEFAULT FALSE,
    can_manage_admin_permissions BOOLEAN DEFAULT FALSE,
    
    -- Department/Role
    department ENUM(
        'admin',
        'sales',
        'content',
        'finance',
        'management'
    ) DEFAULT 'admin',
    
    -- Access Level
    access_level ENUM(
        'viewer',        -- View only
        'reviewer',      -- View + recommend
        'approver',      -- View + approve/reject
        'salesperson',   -- View + vendor contact
        'manager',       -- Full access
        'superadmin'     -- Full access + manage admins
    ) DEFAULT 'viewer',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_admin (admin_id)
);
```

### Table 5: Revenue & Sales Tracking

```sql
CREATE TABLE revenue_tracking (
    id VARCHAR(36) PRIMARY KEY,
    recommendation_id VARCHAR(36),
    vendor_id VARCHAR(36),
    
    -- Revenue Details
    revenue_source ENUM(
        'vendor_featured_listing',
        'vendor_premium_package',
        'commission',
        'affiliate'
    ) DEFAULT 'vendor_featured_listing',
    
    amount_usd DECIMAL(10, 2),
    term_months INT,
    start_date DATE,
    end_date DATE,
    
    -- Payment Status
    payment_status ENUM(
        'pending',
        'paid',
        'partially_paid',
        'overdue',
        'cancelled'
    ) DEFAULT 'pending',
    
    payment_date TIMESTAMP NULL,
    invoice_number VARCHAR(100),
    
    -- Metrics
    expected_value_usd DECIMAL(10, 2),
    actual_value_usd DECIMAL(10, 2),
    commission_rate_percent DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_start_date (start_date)
);
```

---

## Admin Workflow: Permission & Sales System

### Step 1: Visitor Submits Recommendation

```
POST /api/visitor-recommendations
{
    "business_name": "Ali's Restaurant",
    "parent_type_id": "food_and_beverage",
    "visitor_email": "john@example.com",
    "why_recommended": "Best local food in Siwa"
}

Response:
{
    "recommendation_id": "rec_789",
    "message": "Thank you for your suggestion!",
    "status": "pending"  ← Hidden from public
}
```

### Step 2: Admin Notification

```
Email to: admin@siwatoday.com
Subject: New Recommendation - Ali's Restaurant

New business recommendation received:
├─ Business: Ali's Restaurant
├─ Type: Food & Beverage
├─ Visitor: John Smith (john@example.com)
├─ Reason: "Best local food in Siwa"
├─ Action: Needs admin permission
└─ Link: /admin/recommendations/rec_789
```

### Step 3: Admin Reviews (Permission Decision)

```
Admin Dashboard → Recommendations → rec_789

ADMIN DECISION OPTIONS:

Option A: APPROVE FOR FREE LISTING
├─ Status: approved_free
├─ Set: visible_to_public = true
├─ Message: "Added to website"
├─ Next: Automatically add to database
└─ Send notification to visitor: "Your suggestion was added!"

Option B: APPROVE FOR VENDOR OUTREACH (Sales)
├─ Status: vendor_outreach
├─ Set: visible_to_public = false (still hidden)
├─ Extract vendor contact details
├─ Assign to: sales team
├─ Next: Send vendor outreach email
└─ Tracking: "5 visitor requests for this business"

Option C: REJECT
├─ Status: rejected
├─ Notes: "Reason: Already in system" / "Too far away" / etc
├─ Set: visible_to_public = false
├─ Notify visitor: (optional)
└─ Archive for reference
```

### Step 4: Vendor Outreach (If Sales Route)

```
Sales Team Reviews Recommendation

Ali's Restaurant Details:
├─ 5 visitor requests (High demand!)
├─ Type: Food & Beverage
├─ Location: Old town Siwa
├─ Contact: ali@bistro.com
└─ Urgency: HIGH (5 votes)

OUTREACH EMAIL TEMPLATE:
```
Subject: Your Business Featured in Siwa Oasis - Premium Listing Opportunity

Dear Ali,

We are the premier marketplace for Siwa tourism experiences (siwatoday.com).

5 of our visitors recently requested your restaurant to be featured on our platform.

We have a Premium Featured Listing opportunity:
- $500/month for 12-month contract
- Featured highlight on our website
- Boost from 5 interested visitor requests
- Professional business showcase
- Direct booking integration

Would you be interested in discussing this opportunity?

Let me know your availability for a brief call.

Best regards,
Sales Team
siwatoday.com
```

### Step 5: Vendor Response Tracking

```
Vendor Response Scenarios:

Scenario A: VENDOR AGREES
├─ Status: vendor_agreed
├─ Payment: Contract signed
├─ Add to database: With "Featured" badge
├─ Website: Prominent listing
├─ Notify visitors: "Ali's Restaurant is here!"
└─ Revenue: $500/month recorded

Scenario B: VENDOR NEGOTIATES
├─ Status: vendor_negotiating
├─ Price discussion: $300/month offered
├─ Counter-offer: Accept or decline
├─ Continue negotiation
└─ Track in pipeline

Scenario C: VENDOR DECLINES
├─ Status: not_interested
├─ Save for future reference
├─ Note reason: "Too expensive" / "Not interested" / etc
├─ Can offer: "Standard listing - free" option
└─ Possible future opportunity

Scenario D: VENDOR ALREADY LISTED
├─ Status: already_listed
├─ Add to database: Regular listing
├─ Update: Mark as "Popular request"
└─ No sales opportunity
```

### Step 6: Public Visibility Control

```
Database → Approved Businesses

Show on Website:
├─ "New: Ali's Restaurant" 
│  └─ Featured (5 visitor requests)
├─ "Ali's Bistro"
│  └─ Popular request (3 people asked)
└─ "Desert Rose Camp"
   └─ New addition to Siwa Oasis

Hidden from Public (Admin Only):
├─ "Pending Review: New vendor suggestions"
├─ "Ali's Cafe (under vendor negotiation)"
├─ "Rejected: Too far from Siwa"
└─ "Duplicate: Already exists as Hassan's Hotel"
```

---

## API Endpoints: Admin Permission System

### 1. Submit Recommendation (Visitor)

```http
POST /api/visitor-recommendations

{
    "business_name": "Ali's Restaurant",
    "parent_type_id": "food_and_beverage",
    "visitor_email": "john@example.com",
    "visitor_name": "John Smith",
    "why_recommended": "Best local food",
    "contact_email": "ali@bistro.com",
    "contact_phone": "+20123456789"
}

Response (201):
{
    "success": true,
    "recommendation_id": "rec_789",
    "message": "Thank you! Your suggestion is pending admin review.",
    "public_message": "Your recommendation will be reviewed within 24 hours"
}
```

### 2. Get Recommendations (Admin Only)

```http
GET /api/admin/recommendations
Authorization: Bearer admin_token
?status=pending&sort=votes&limit=20

Response (200):
{
    "success": true,
    "recommendations": [
        {
            "id": "rec_789",
            "business_name": "Ali's Restaurant",
            "visitor_name": "John Smith",
            "votes": 5,
            "urgency": "high",
            "status": "pending",
            "visible_to_public": false,
            "permission_required": true,
            "contact_email": "ali@bistro.com",
            "actions": [
                "approve_free",
                "approve_vendor_outreach",
                "reject"
            ]
        }
    ],
    "stats": {
        "pending": 5,
        "vendor_outreach": 2,
        "approved": 8,
        "rejected": 1,
        "potential_revenue": 5000
    }
}
```

### 3. Admin Permission Decision

```http
POST /api/admin/permission-decision
Authorization: Bearer admin_token

{
    "recommendation_id": "rec_789",
    "decision": "approve_vendor_outreach",
    "notes": "5 visitor requests, high demand",
    "visible_to_public": false,
    "assign_to_sales": "sales_admin_id"
}

Response (200):
{
    "success": true,
    "recommendation_id": "rec_789",
    "new_status": "vendor_outreach",
    "permission_granted": true,
    "assigned_to_sales": "sales_admin_id",
    "next_step": "Vendor outreach email ready to send"
}
```

### 4. Contact Vendor (Sales)

```http
POST /api/admin/vendor-outreach
Authorization: Bearer sales_token

{
    "recommendation_id": "rec_789",
    "vendor_email": "ali@bistro.com",
    "vendor_name": "Ali",
    "offering_type": "featured",
    "monthly_price": 500,
    "term_months": 12,
    "email_template": "premium_featured"
}

Response (201):
{
    "success": true,
    "outreach_id": "outreach_123",
    "vendor_email": "ali@bistro.com",
    "status": "outreach_sent",
    "follow_up_date": "2026-06-16"
}
```

### 5. Track Vendor Response

```http
POST /api/admin/vendor-response
Authorization: Bearer sales_token

{
    "outreach_id": "outreach_123",
    "vendor_decision": "interested",
    "vendor_notes": "Need to think about pricing",
    "next_steps": "Schedule call"
}

Response (200):
{
    "success": true,
    "status": "vendor_interested",
    "next_followup": "2026-06-16",
    "recommended_action": "Call vendor to discuss pricing"
}
```

### 6. Mark as Converted

```http
POST /api/admin/convert-recommendation
Authorization: Bearer admin_token

{
    "recommendation_id": "rec_789",
    "conversion_type": "vendor_agreed",
    "add_to_database": true,
    "business_details": {
        "name": "Ali's Restaurant",
        "description": "Traditional Siwan cuisine",
        "phone": "+20123456789",
        "website": "alibistro.com",
        "featured": true
    },
    "pricing_tier": "featured",
    "monthly_fee_usd": 500
}

Response (201):
{
    "success": true,
    "recommendation_id": "rec_789",
    "business_id": "biz_456",
    "status": "converted",
    "added_to_website": true,
    "visibility": "public - featured",
    "revenue_recorded": 500
}
```

---

## Admin Dashboard: Permission & Sales Management

### Dashboard Layout

```
ADMIN DASHBOARD
├─ Recommendations Queue
│  ├─ Pending Permission: 5
│  ├─ Vendor Outreach: 2
│  ├─ Converted This Month: 8
│  └─ Revenue Generated: $4,000
│
├─ Permission Management
│  ├─ View all pending
│  ├─ Quick approve/reject
│  ├─ Assign to sales team
│  └─ View audit trail
│
├─ Vendor Sales Pipeline
│  ├─ Active outreach: 5
│  ├─ Interested vendors: 2
│  ├─ Contracts pending: 1
│  └─ Monthly revenue: $4,500
│
├─ Metrics & Reports
│  ├─ Conversion rate: 60%
│  ├─ Average deal value: $500
│  ├─ Sales cycle: 14 days
│  └─ Revenue this month: $4,000
│
└─ Admin Settings
   ├─ Permission levels
   ├─ Email templates
   ├─ Pricing tiers
   └─ Visibility rules
```

---

## Business Rules: Permissions & Visibility

### Rule 1: Visibility Control
```
STATUS                    VISIBLE TO PUBLIC   VISIBLE TO ADMIN
─────────────────────────────────────────────────────────────
pending                   NO                  YES
under_review              NO                  YES
approved_free             YES                 YES
approved_premium          YES                 YES
vendor_outreach           NO                  YES
vendor_negotiating        NO                  YES
converted                 YES                 YES
rejected                  NO                  YES (history only)
```

### Rule 2: Permission Requirements
```
DECISION                    REQUIRES APPROVAL   PERMISSION LEVEL
──────────────────────────────────────────────────────────────
View Recommendation         No                  Viewer
Review Recommendation       No                  Reviewer
Approve (free)              Yes                 Approver
Reject                      Yes                 Approver
Assign to Sales             Yes                 Manager
Contact Vendor              No                  Salesperson
Offer Pricing               No                  Salesperson
Accept Payment              Yes                 Finance
Add to Database             Yes                 Approver/Content
```

### Rule 3: Public Display
```
IF approved_free OR approved_premium OR converted
THEN visible_to_public = true
ELSE visible_to_public = false

IF status = 'converted'
THEN show_in_journey_builders = true
ELSE show_in_journey_builders = false
```

---

## Revenue Tracking: Vendor Sales Model

### Pricing Tiers

```
TIER 1: STANDARD (Free)
├─ List on website
├─ Basic information
├─ No featured badge
├─ Standard placement
└─ Cost: $0

TIER 2: FEATURED ($500/month)
├─ Everything in Standard
├─ Featured badge
├─ Highlighted placement
├─ Boost in search results
├─ Visitor count tracking
├─ Basic analytics
└─ Cost: $500/month

TIER 3: PREMIUM ($1000/month)
├─ Everything in Featured
├─ Top placement
├─ Enhanced profile
├─ Direct booking integration
├─ Advanced analytics
├─ Monthly performance report
└─ Cost: $1000/month
```

### Revenue Calculation

```
Monthly Revenue Example:
├─ 5 vendors × $500 = $2,500
├─ 2 vendors × $1000 = $2,000
├─ 1 commission deal = $300
└─ Total: $4,800/month
```

---

## Summary: Admin Permission & Sales System

✅ **Admin Controls Everything**
- Permission required for all recommendations
- Approve/Reject decisions
- Visibility control (public/hidden)
- Permission audit trail

✅ **Recommendations Hidden by Default**
- Only visible to admin
- Visitors can't see pending recommendations
- Prevents confusion or bias

✅ **Vendor Sales Opportunity**
- Leverage visitor demand
- Turn suggestions into revenue
- Track sales pipeline
- Manage contracts and payments

✅ **Multiple Revenue Paths**
- Free listing (builds credibility)
- Featured listing ($500/month)
- Premium listing ($1000/month)
- Commission on bookings

✅ **Transparent Tracking**
- Full audit trail
- Revenue reports
- Sales metrics
- Performance analytics

This transforms visitor feedback into a **sales and revenue system** while maintaining **admin control and public trust**.

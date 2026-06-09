# Vendor Notification System: Forward Visitor Requests

## New Feature: Notify Vendors of Visitor Demand

### How It Works

```
VISITOR SUBMITS REQUEST
└─ "Ali's Restaurant"
   
ADMIN REVIEWS
└─ Decision: Forward to vendor
   
VENDOR GETS NOTIFIED
├─ Email: "5 Visitors Are Asking For You!"
├─ Message: "Your restaurant was recommended by Siwa Oasis visitors"
├─ Impact: "Join premium listing program"
└─ CTA: View your visitor requests
   
VENDOR SEES DASHBOARD
├─ "5 people requested you"
├─ Testimonials from visitors
├─ Join premium for $500/month
├─ Create business profile
└─ Direct booking integration
   
RESULT
├─ Vendor informed of demand
├─ Sales opportunity created
├─ Urgent: "People want you!"
└─ Conversion likely (social proof)
```

---

## Database Enhancement: Vendor Forwarding System

### Add to Migration 016

```sql
-- Add to visitor_recommendations table
ALTER TABLE visitor_recommendations
ADD COLUMN IF NOT EXISTS forwarded_to_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_notification_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS vendor_notification_email_status ENUM(
    'pending', 'sent', 'bounced', 'read'
) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS vendor_view_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_viewed_date TIMESTAMP NULL;

-- Create vendor notification log
CREATE TABLE IF NOT EXISTS vendor_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(255),
    
    notification_type ENUM(
        'initial_request',           -- "5 people asked for you"
        'new_request_added',         -- "Someone else recommended you"
        'request_milestone',         -- "Reached 10 requests!"
        'business_claim_reminder',   -- "Claim your profile"
        'sales_follow_up'            -- Sales touch point
    ) DEFAULT 'initial_request',
    
    email_subject VARCHAR(255),
    email_body MEDIUMTEXT,
    
    email_status ENUM(
        'queued', 'sent', 'bounced', 'clicked', 'read'
    ) DEFAULT 'queued',
    
    sent_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    
    vendor_response MEDIUMTEXT,
    vendor_response_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_email_status (email_status),
    INDEX idx_notification_type (notification_type),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
);

-- Create vendor portal logins
CREATE TABLE IF NOT EXISTS vendor_portal_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_email VARCHAR(255) UNIQUE NOT NULL,
    vendor_name VARCHAR(255),
    business_name VARCHAR(255),
    password_hash VARCHAR(255),
    portal_token VARCHAR(255),
    
    -- Business details
    phone VARCHAR(20),
    website VARCHAR(500),
    location VARCHAR(255),
    business_type_id VARCHAR(100),
    
    -- Account status
    status ENUM('pending', 'active', 'claimed', 'inactive') DEFAULT 'pending',
    claimed_at TIMESTAMP NULL,
    
    -- Profile
    business_description MEDIUMTEXT,
    profile_image_url VARCHAR(500),
    profile_complete BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_status (status),
    INDEX idx_claimed_at (claimed_at)
);

-- View all requests for a vendor
CREATE OR REPLACE VIEW vw_vendor_requests AS
SELECT 
    r.id as request_id,
    r.business_name,
    COUNT(*) as total_requests,
    COUNT(DISTINCT r.visitor_email) as unique_visitors,
    GROUP_CONCAT(DISTINCT r.visitor_name) as visitor_names,
    MAX(r.created_at) as most_recent_request,
    SUM(CASE WHEN r.urgency_level = 'high' THEN 1 ELSE 0 END) as high_priority_count,
    GROUP_CONCAT(DISTINCT r.why_recommended SEPARATOR ' | ') as visitor_feedback
FROM visitor_recommendations r
WHERE r.forwarded_to_vendor = TRUE
GROUP BY r.business_name;
```

---

## API Endpoint: Forward Recommendation to Vendor

```typescript
// POST /api/admin/forward-to-vendor
// Forward a recommendation to selected vendor(s)

interface ForwardToVendorRequest {
    recommendation_id: string;
    vendor_email: string;
    vendor_name?: string;
    notification_type: 'initial_request' | 'milestone' | 'follow_up';
    include_visitor_feedback: boolean; // Show what visitors said
    include_sales_offer?: boolean; // Include pricing offer
}

interface ForwardResponse {
    success: boolean;
    recommendation_id: string;
    vendor_email: string;
    notification_id: string;
    status: 'queued' | 'sent' | 'bounced';
    email_preview: string;
    next_followup: string; // When to follow up if no response
}
```

---

## Email Templates: Vendor Notifications

### Template 1: Initial Request ("People Want You!")

```
FROM: notifications@siwatoday.com
TO: ali@bistro.com
SUBJECT: 🌟 5 Visitors Are Asking For You! (Ali's Restaurant)

═══════════════════════════════════════════════════════════

Dear Ali,

Great news! 🎉

Your restaurant was mentioned 5 times on Siwa Oasis, 
our premier marketplace for Siwa tourism experiences.

WHAT VISITORS ARE SAYING:
────────────────────────
✓ "Best local food in Siwa!"
✓ "Amazing authentic cuisine"
✓ "Great service and prices"

VISITOR PROFILE:
────────────────
📍 From: USA, UK, Spain, Germany (international visitors)
🗓️ Travel dates: June - August 2026
💰 Budget: Mid-range to premium
👥 Groups: 2-5 people

WHAT THIS MEANS:
────────────────
Real customers WANT your business. They're looking for you RIGHT NOW.

TAKE ACTION:
────────────

Option 1: CLAIM YOUR FREE PROFILE
Get listed immediately:
- [Claim Your Restaurant]
- Add photos & information
- Enable direct bookings
- Cost: FREE

Option 2: FEATURED LISTING ($500/month)
Get these 5 requests PLUS:
- Premium placement
- More visibility
- Advanced analytics
- Marketing to 50,000+ travelers
- Direct booking integration
- [View Featured Package]

Option 3: PREMIUM PACKAGE ($1000/month)
Everything in Featured PLUS:
- White-glove vendor support
- Monthly performance reports
- Co-marketing opportunities
- Priority customer support
- [View Premium Package]

CAN'T DECIDE?
Let's discuss what's best for your business.
Call: +20 1234 567 890
Email: vendor-support@siwatoday.com
Chat: [Start Chat]

Want to see who requested you?
[View Your Requests] (Requires profile claim)

ABOUT SIWA OASIS:
─────────────────
Siwa Oasis connects local businesses with 50,000+ travelers monthly.
We're the #1 marketplace for authentic Siwa experiences.

Your success is our success!

Best regards,
Siwa Oasis Team
www.siwatoday.com

P.S. This is your first visitor request notification!
Next: We'll send you milestone updates (10 requests, 20 requests, etc.)

═══════════════════════════════════════════════════════════
```

### Template 2: Milestone Notification

```
FROM: notifications@siwatoday.com
TO: ali@bistro.com
SUBJECT: 🎉 Ali's Restaurant Reached 10 Visitor Requests!

Dear Ali,

Your restaurant just hit a major milestone! 

📊 UPDATED STATS:
├─ Total requests: 10
├─ Unique visitors: 8
├─ Countries: 4 (USA, UK, Spain, Germany)
└─ Rating trend: ⬆️ Increasing

🔥 YOUR POPULARITY IS GROWING!

In just 5 days, you went from 5 to 10 requests.
This shows real, growing demand from travelers.

WHAT'S NEXT?
────────────
Get your profile live before you miss bookings!

[Claim Your Profile Now - Takes 2 minutes]

Already claimed? Upgrade to Featured for $500/month
and capture even more bookings from these interested travelers.

[Upgrade to Featured]

See what visitors are saying:
[View All 10 Requests]

Questions? We're here to help!
vendor-support@siwatoday.com

Best regards,
Siwa Oasis Team
```

### Template 3: Sales Follow-up

```
FROM: sales@siwatoday.com
TO: ali@bistro.com
SUBJECT: Ali - Your 10 Visitor Requests Are Real Business Opportunity

Dear Ali,

Following up on our earlier message...

You have 10 visitors ACTIVELY LOOKING for your restaurant right now.

This isn't marketing hype—this is real, local demand.

WHAT YOU'RE MISSING:
────────────────────
❌ No online visibility → They can't find you
❌ No direct booking → You lose reservations
❌ No profile → Competitors get the bookings

WHAT YOU GAIN:
───────────────
✅ Featured on Siwa Oasis (seen by 50,000+ travelers)
✅ Direct booking system
✅ Real customer reviews
✅ Monthly bookings from tourism platform
✅ Professional online presence

QUICK NUMBERS:
───────────────
Premium Listing: $500/month
10-20 extra bookings/month at $50 average = $500-$1000 revenue
ROI: 100-200% per month!

READY TO START?
─────────────────
Let's have a 15-minute call to discuss your business.
Pick a time that works:

[Schedule Call - Free 15 min consultation]

Or reply with your preferred time: +20 123 456 789

Looking forward to partnering!

Ahmed Hassan
Business Development
Siwa Oasis
sales@siwatoday.com
```

---

## Vendor Portal: Dashboard

### What Vendors See

```
VENDOR PORTAL
Login: ali@bistro.com

═══════════════════════════════════════════════════════

YOUR REQUESTS OVERVIEW

🔥 10 PEOPLE HAVE REQUESTED YOU
├─ New this week: 5
├─ Trend: ⬆️ Growing
└─ Last request: 2 hours ago

VISITOR FEEDBACK
───────────────
✓ "Best local food in Siwa!" - John Smith (USA)
✓ "Amazing authentic cuisine" - Sarah Johnson (UK)
✓ "Great service and prices" - Maria Garcia (Spain)
✓ "Highly recommended!" - Ahmed Hassan (Egypt)
✓ "Worth a visit!" - Lisa Mueller (Germany)

VISITOR DETAILS
───────────────
Who's asking?
├─ Nationalities: 4 countries
├─ Travel dates: June-August 2026
├─ Group sizes: 2-5 people
└─ Budget level: Mid-range to premium

YOUR STATUS
───────────
Profile status: NOT CLAIMED
Action needed: [Claim Your Profile]

GROW YOUR BUSINESS
──────────────────
Options available:
├─ Free Listing → Just claim your profile
├─ Featured ($500/month) → Premium placement + 10x visibility
└─ Premium ($1000/month) → Everything + monthly reports

YOUR NEXT STEPS
───────────────
1. [Claim Your Profile] (takes 2 minutes)
2. Add business info & photos
3. Enable direct bookings
4. Start receiving reservations

GET HELP
────────
Chat with us: [Live Chat]
Email: vendor-support@siwatoday.com
Phone: +20 1234 567 890

═══════════════════════════════════════════════════════
```

---

## Admin Workflow: Forward Recommendations

### Step 1: Approve Recommendation

```
Admin reviews: "Ali's Restaurant"
Decision: Approve + Forward to Vendor

Status: "approved_forward_vendor"
```

### Step 2: Auto-Forward System

```
System automatically:
├─ Detects vendor email (from contact_email field)
├─ Checks vendor portal (already claimed? send different email)
├─ Generates personalized email
├─ Queue for sending
├─ Track open rates
└─ Schedule follow-ups
```

### Step 3: Manual Trigger (Optional)

```
Admin can also manually forward:

GET /api/admin/forward-to-vendor

{
    "recommendation_id": "rec_789",
    "vendor_email": "ali@bistro.com",
    "vendor_name": "Ali",
    "notification_type": "initial_request",
    "include_visitor_feedback": true,
    "include_sales_offer": true
}

Response:
{
    "success": true,
    "notification_id": "notif_456",
    "status": "queued",
    "email_will_send": true,
    "vendor_email": "ali@bistro.com",
    "scheduled_followup": "2026-06-16" (if no response)
}
```

---

## Vendor Actions: Claim Profile

### Vendor Clicks "Claim Your Profile"

```
VENDOR FLOW

1. EMAIL LINK
   Click: [Claim Your Restaurant]
   
2. CLAIM PAGE
   "Verify you own Ali's Restaurant"
   
   Email: ali@bistro.com ✓
   Restaurant name: Ali's Restaurant
   Verification: [Send Code to Email]
   
3. VERIFY EMAIL
   Code sent: ali@bistro.com
   Enter code: 123456
   
4. SETUP PROFILE
   ├─ Password: [Create secure password]
   ├─ Phone: +20 123 456 789
   ├─ Website: alibistro.com
   ├─ Location: Siwa old town
   ├─ Description: [Describe your restaurant]
   └─ Photos: [Upload 3-5 photos]
   
5. PROFILE COMPLETE
   Status: CLAIMED ✓
   
   Next options:
   ├─ Stay free (basic listing)
   ├─ Upgrade to Featured ($500/month)
   └─ Upgrade to Premium ($1000/month)

6. DASHBOARD ACCESS
   Vendor now sees:
   ├─ All 10 requests
   ├─ Visitor feedback
   ├─ Analytics
   └─ Booking management
```

---

## Automation: Milestone Notifications

### Send Notifications at Milestones

```
When 5 requests reached:
└─ Send: "5 People Are Asking For You!"
   
When 10 requests reached:
└─ Send: "Congrats! Reached 10 Requests!"
   
When 20 requests reached:
└─ Send: "Amazing! 20 Visitor Requests!"

When 2 weeks no action:
└─ Send: "Time-sensitive: Visitors still looking for you"

When vendor responds:
└─ Capture response
└─ Note in CRM
└─ Pass to sales team
```

---

## Implementation: 3 API Endpoints

### 1. Forward Recommendation to Vendor

```http
POST /api/admin/forward-to-vendor

{
    "recommendation_id": "rec_789",
    "vendor_email": "ali@bistro.com",
    "notification_type": "initial_request"
}

Response (201):
{
    "success": true,
    "notification_id": "notif_123",
    "vendor_email": "ali@bistro.com",
    "status": "queued",
    "email_preview": "5 Visitors Are Asking For You!",
    "followup_scheduled": "2026-06-16"
}
```

### 2. Get Vendor's Requests

```http
GET /api/vendor/my-requests
Authorization: Bearer vendor_token

Response (200):
{
    "vendor_email": "ali@bistro.com",
    "vendor_name": "Ali",
    "business_name": "Ali's Restaurant",
    "profile_claimed": true,
    "total_requests": 10,
    "unique_visitors": 8,
    "requests": [
        {
            "id": "rec_001",
            "visitor_name": "John Smith",
            "country": "USA",
            "reason": "Best local food in Siwa!",
            "date": "2026-06-08",
            "contact": "john@example.com"
        }
    ],
    "actions": [
        "claim_profile",
        "upgrade_featured",
        "upgrade_premium",
        "reply_to_request"
    ]
}
```

### 3. Vendor Response to Requests

```http
POST /api/vendor/respond-to-requests
Authorization: Bearer vendor_token

{
    "response": "Thanks for the requests! We're excited to be listed.",
    "interest_level": "very_interested",
    "preferred_contact": "phone",
    "phone": "+20 123 456 789"
}

Response (200):
{
    "success": true,
    "message": "Response sent to Siwa Oasis team",
    "next_steps": "Our sales team will contact you shortly"
}
```

---

## Vendor Benefits: Why They'll Participate

### Before Being Notified
```
Ali's Restaurant
├─ Unknown to tourists
├─ No online presence
├─ Few bookings from tourism
├─ Lost customers daily
└─ Struggling with visibility
```

### After Being Notified
```
Ali's Restaurant
├─ Knows 10 people want him
├─ Gets list of potential customers
├─ Can respond to leads
├─ Can upgrade to featured
├─ Starts getting bookings
├─ Professional online profile
└─ Ongoing marketing
```

### Financial Impact
```
Without listing: 0-1 bookings/month from tourism
With free listing: 2-3 bookings/month
With featured: 5-8 bookings/month
Revenue per booking: $50-100 (drinks, tips, groups)

Extra revenue: 5-8 bookings × $75 = $375-600/month
Cost of featured: $500/month
Net benefit: Breaks even + brand building + regulars

Year 1 additional revenue: $2,250-3,600
```

---

## Advanced: Request Aggregation

### Group Similar Requests

```
When forwarding, group by business:

Ali's Restaurant → 10 requests total
├─ Request 1: "Best local food" - John Smith
├─ Request 2: "Amazing cuisine" - Sarah Johnson
├─ Request 3: "Worth a visit" - Maria Garcia
└─ ... 7 more

Send single email with:
"10 visitors requested your restaurant"
Show top quotes
Show visitor breakdown
Show growth trend

Instead of: 10 separate emails
Better: 1 email showing aggregate demand
```

---

## Summary: Vendor Notification System

✅ **Notify vendors when requested**
- "5 people asked for you!"
- Real social proof
- Creates urgency

✅ **Show visitor feedback**
- What people love about them
- Authentic recommendations
- Builds confidence

✅ **Drive profile claims**
- Get basic info about vendors
- Build vendor relationships
- Grow platform data

✅ **Generate sales**
- Vendors see demand
- "Upgrade to featured" CTA
- Convert to paid listings

✅ **Vendor benefits**
- New customer channel
- Direct feedback
- Professional profile
- Easy bookings

✅ **Your revenue**
- $500/month featured listings
- Recurring vendors
- Scaling business model

---

## Implementation Steps

### Week 1: Core System
- [ ] Create vendor notification tables
- [ ] Create email templates
- [ ] Set up vendor portal login
- [ ] Deploy APIs

### Week 2: Integration
- [ ] Auto-forward on approval
- [ ] Track email opens/clicks
- [ ] Set up milestone triggers
- [ ] Test vendor flow

### Week 3: Optimization
- [ ] Monitor vendor response rates
- [ ] Optimize email timing
- [ ] A/B test email templates
- [ ] Scale to all vendors

### Week 4+: Growth
- [ ] Vendors start claiming profiles
- [ ] Track conversions to paid
- [ ] Monitor revenue
- [ ] Expand marketing

---

**This system turns visitor requests into vendor engagement and revenue!**

Vendors get:
✅ Customer demand proof
✅ Potential customers list
✅ Professional online presence
✅ Easy booking system

You get:
✅ Vendor contacts
✅ Premium listing sales
✅ Recurring revenue
✅ Growing platform

Win-win-win: Visitors get reviews, vendors get customers, you get revenue! 🎉

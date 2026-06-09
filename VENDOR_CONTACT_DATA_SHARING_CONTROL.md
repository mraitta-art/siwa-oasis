# Admin Control: Share Visitor Contact Data with Vendors

## Feature: Conditional Contact Data Sharing

### The Problem
```
Vendors want to reach out to visitors who recommended them.
But visitors might want privacy - not share their contact info.
Admin needs CONTROL over what gets shared.
```

### The Solution
```
ADMIN DECISION POINT

Send notification to vendor?
├─ Option 1: DON'T share contact info
│  └─ "5 people asked for you" (no names/emails)
│
├─ Option 2: Share only names
│  └─ "John, Sarah, Ahmed recommended you"
│
├─ Option 3: Share names + emails
│  └─ Full visitor details for direct outreach
│
└─ Option 4: Share all (names, emails, countries)
   └─ Maximum transparency for vendors
```

---

## Implementation: 3 Levels

### Level 1: NO Contact Data (Privacy Focus)
```
Email to vendor:
"5 Visitors Recommended Your Business!"

What they see:
✓ Business name
✓ Number of requests
✓ Feedback quotes (generic: "Great food")
✗ No visitor names
✗ No visitor emails
✗ No visitor phone numbers

Why use:
- Respect visitor privacy
- Comply with GDPR
- Safe for initial outreach
```

### Level 2: Names Only (Moderate)
```
Email to vendor:
"These 5 People Recommended You:
- John Smith (USA)
- Sarah Johnson (UK)
- Maria Garcia (Spain)
- Ahmed Hassan (Egypt)
- Lisa Mueller (Germany)"

What they see:
✓ First names + last initials
✓ Visitor countries
✓ Feedback quotes
✗ No email addresses
✗ No phone numbers

Why use:
- Moderate data sharing
- Vendors know who's interested
- Still protects visitor privacy
```

### Level 3: Full Contact Data (Maximum Outreach)
```
Email to vendor:
"5 People Recommended You:

1. John Smith
   Email: john@example.com
   Phone: +1 234 567 890
   Country: USA
   Message: "Best local food!"

2. Sarah Johnson
   Email: sarah@example.com
   Phone: +44 1234 567 890
   Country: UK
   Message: "Amazing authentic cuisine"
```

What they see:
✓ Full names
✓ Email addresses
✓ Phone numbers
✓ Countries
✓ What they said

Why use:
- Vendors can contact directly
- Maximize conversion potential
- Opt-in visitors who want engagement
```

---

## Database Schema Update

### Add to vendor_notifications Table

```sql
ALTER TABLE vendor_notifications
ADD COLUMN IF NOT EXISTS contact_data_sharing_level ENUM(
    'none',           -- Don't share any contact data
    'names_only',     -- Share first/last initial + country
    'emails_only',    -- Share names + emails only
    'full_contact',   -- Share names, emails, phones
    'anonymous'       -- No visitor identification at all
) DEFAULT 'names_only',
ADD COLUMN IF NOT EXISTS included_visitor_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS included_visitors_list JSON, -- {"john@example.com": "John Smith", ...}
ADD COLUMN IF NOT EXISTS admin_note VARCHAR(500),
ADD COLUMN IF NOT EXISTS visitor_consent_verified BOOLEAN DEFAULT FALSE;
```

### Add Admin Preference Table

```sql
CREATE TABLE IF NOT EXISTS admin_contact_sharing_preferences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(36) NOT NULL,
    
    -- Default sharing level
    default_sharing_level ENUM(
        'none', 'names_only', 'emails_only', 'full_contact', 'anonymous'
    ) DEFAULT 'names_only',
    
    -- When to share
    share_on_milestone BOOLEAN DEFAULT TRUE,
    share_on_initial BOOLEAN DEFAULT TRUE,
    share_on_followup BOOLEAN DEFAULT FALSE,
    
    -- Privacy considerations
    require_visitor_opt_in BOOLEAN DEFAULT FALSE,
    gdpr_compliant_mode BOOLEAN DEFAULT TRUE,
    
    -- Business logic
    only_share_high_priority BOOLEAN DEFAULT TRUE,
    only_share_with_featured_vendors BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id),
    UNIQUE KEY unique_admin_preference (admin_id)
);
```

---

## Updated API: Forward with Contact Control

### POST /api/admin/forward-to-vendor (Enhanced)

```typescript
interface ForwardToVendorRequest {
  recommendation_id: string;
  vendor_email: string;
  vendor_name?: string;
  notification_type: string;
  
  // NEW: Contact data sharing control
  contact_data_sharing_level?: 'none' | 'names_only' | 'emails_only' | 'full_contact' | 'anonymous';
  
  // NEW: Include specific visitors or all
  include_all_visitors?: boolean;
  specific_visitor_emails?: string[]; // Only share certain visitors
  
  // NEW: Admin notes/reason
  admin_note?: string;
}

interface ForwardResponse {
  success: boolean;
  notification_id: string;
  contact_data_sharing_level: string;
  visitors_included: number;
  preview: {
    subject: string;
    will_show_visitor_names: boolean;
    will_show_visitor_emails: boolean;
    will_show_visitor_phone: boolean;
  };
}
```

---

## Updated Email Templates

### Template with Contact Control

```typescript
// Email body generated based on sharing level

if (sharing_level === 'none') {
  // No visitor data
  body = `
Dear Ali,

Great news! 5 people recommended your restaurant on Siwa Oasis.

They loved your:
✓ Authentic local cuisine
✓ Friendly service
✓ Great value for money

Join Siwa Oasis Premium ($500/month) to directly connect with these visitors!
`;
}

if (sharing_level === 'names_only') {
  // Names and countries
  body = `
Dear Ali,

Great news! These 5 people recommended your restaurant:

1. John (USA)
2. Sarah (UK)
3. Maria (Spain)
4. Ahmed (Egypt)
5. Lisa (Germany)

They said:
✓ "Best local food in Siwa!"
✓ "Authentic cuisine"
✓ "Great service and prices"

Premium listing ($500/month) connects you directly with visitors like these!
`;
}

if (sharing_level === 'full_contact') {
  // All details
  body = `
Dear Ali,

Great news! These 5 people recommended your restaurant:

1. John Smith
   Email: john@example.com
   Phone: +1 234 567 890
   Country: USA
   Message: "Best local food in Siwa!"

2. Sarah Johnson
   Email: sarah@example.com
   Phone: +44 1234 567 890
   Country: UK
   Message: "Amazing authentic cuisine"

[More visitors...]

You can reach out to them directly about:
- Special offers or reservations
- Feedback on their experience
- Future visits and bookings
`;
}
```

---

## Admin Interface: Sharing Level Toggle

### When Approving Recommendation

```
ADMIN APPROVAL DECISION

Recommendation: "Ali's Restaurant"
Votes: 10
Status: Ready to forward to vendor

┌─────────────────────────────────────────────┐
│ CONTACT DATA SHARING                        │
├─────────────────────────────────────────────┤
│                                             │
│ How much visitor data to share?             │
│                                             │
│ ○ None (Privacy First)                      │
│   └─ Vendor sees only feedback, no names    │
│                                             │
│ ○ Names Only (Balanced)  [RECOMMENDED]      │
│   └─ Vendor sees names & countries          │
│                                             │
│ ○ Names + Emails (Moderate)                 │
│   └─ Vendor can email visitors              │
│                                             │
│ ○ Full Contact (Maximum)                    │
│   └─ All details: names, emails, phones     │
│                                             │
│ ○ Anonymous (No ID)                         │
│   └─ "5 people" with no identification      │
│                                             │
│ Admin Note:                                 │
│ [Vendor already has featured listing]       │
│                                             │
│ [Forward to Vendor ▼]                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Workflow: Admin Controls Contact Sharing

### Step 1: Approve & Forward

```
Admin reviews: "Ali's Restaurant"
Decision: Approve + Forward to Vendor

Contact sharing choice:
┌─────────────────────────────────┐
│ How much data?                  │
│                                 │
│ [None] [Names] [Full] [All] → → │
│        ^^^^^^ (selected)        │
└─────────────────────────────────┘

Click: "Forward to Vendor"
```

### Step 2: Preview Before Send

```
PREVIEW EMAIL:

To: ali@bistro.com
Subject: 🌟 5 Visitors Are Asking For You! (Ali's Restaurant)

─────────────────────────────────

Dear Ali,

Great news! 5 people recommended your restaurant on Siwa Oasis.

WHO RECOMMENDED YOU:
├─ John (USA)
├─ Sarah (UK)
├─ Maria (Spain)
├─ Ahmed (Egypt)
└─ Lisa (Germany)

WHAT THEY SAID:
✓ "Best local food in Siwa!"
✓ "Amazing authentic cuisine"
✓ "Great service and prices"
✓ "Highly recommended!"
✓ "Worth a visit!"

[Contact info NOT included - Privacy protected]

─────────────────────────────────

Sharing Level: Names Only ✓
Visitor Privacy: Protected ✓
GDPR Compliant: Yes ✓

[Confirm & Send] [Cancel]
```

### Step 3: Audit Trail

```
NOTIFICATION SENT

Vendor: ali@bistro.com
Business: Ali's Restaurant
Notification ID: notif_123
Status: Sent ✓
Time: 2026-06-09 14:30:00

Contact Sharing Level: Names Only
Visitors Included: 5
Visitor Names Shown: Yes
Visitor Emails Shown: No
Visitor Phones Shown: No

Admin: Ahmed Hassan
Reason: Featured vendor - initial outreach
Time Forwarded: 2026-06-09 14:30:00

─────────────────────────────────
```

---

## Privacy Levels Explained

### Level 1: NONE (Maximum Privacy)
```
What vendor sees:
"5 people recommended your restaurant"

Visitor data:
✗ No names
✗ No emails
✗ No phones
✗ No countries

Use when:
- Respecting visitor privacy
- Initial outreach only
- GDPR requirements
```

### Level 2: NAMES ONLY (Recommended)
```
What vendor sees:
"These 5 people recommended you:
- John (USA)
- Sarah (UK)
- Maria (Spain)
- Ahmed (Egypt)
- Lisa (Germany)"

Visitor data:
✓ First names only
✓ Countries
✓ Feedback quotes
✗ No emails
✗ No phone numbers

Use when:
- Balanced approach
- Vendors want context
- Visitor privacy respected
```

### Level 3: NAMES + EMAILS
```
What vendor sees:
"Contact these interested visitors:

1. John Smith - john@example.com
2. Sarah Johnson - sarah@example.com
3. Maria Garcia - maria@example.com"

Visitor data:
✓ Full names
✓ Email addresses
✓ What they said
✗ No phone numbers
✗ No location details

Use when:
- Vendor wants to email directly
- Visitor consent verified
- Sales-focused outreach
```

### Level 4: FULL CONTACT
```
What vendor sees:
"Contact these interested visitors:

1. John Smith
   Email: john@example.com
   Phone: +1 234 567 890
   Country: USA
   Message: "Best local food!"

2. Sarah Johnson
   Email: sarah@example.com
   Phone: +44 1234 567 890
   Country: UK
   Message: "Amazing cuisine""

Visitor data:
✓ Full names
✓ Email addresses
✓ Phone numbers
✓ Countries
✓ Detailed feedback

Use when:
- Direct vendor-visitor engagement
- High-value opportunities
- Visitor explicitly opted in
```

### Level 5: ANONYMOUS
```
What vendor sees:
"5 visitors recommended your business!

Feedback summary:
- Authentic local cuisine
- Great service
- Excellent value

Join Premium to see who!"

Visitor data:
✗ No identification
✗ No contact info
✗ No locations

Use when:
- Pure marketing message
- Teaser to get vendor interested
- Full data revealed after upgrade
```

---

## Implementation: 4 API Updates

### 1. Update Forward API

```typescript
// POST /api/admin/forward-to-vendor

const response = await fetch('/api/admin/forward-to-vendor', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recommendation_id: 'rec_789',
    vendor_email: 'ali@bistro.com',
    notification_type: 'initial_request',
    
    // NEW: Control contact data
    contact_data_sharing_level: 'names_only',  // or 'none', 'emails_only', 'full_contact'
    include_all_visitors: true,
    admin_note: 'Featured vendor - initial batch'
  })
});

// Response includes sharing level confirmation
{
  success: true,
  notification_id: 'notif_123',
  contact_data_sharing_level: 'names_only',
  visitors_included: 5,
  preview: {
    will_show_visitor_names: true,
    will_show_visitor_emails: false,
    will_show_visitor_phone: false
  }
}
```

### 2. Vendor Portal: Show What Was Shared

```typescript
// GET /api/vendor/my-requests

{
  requests: [
    {
      id: 'req_001',
      visitor_info: {
        name: 'John Smith',         // names_only level
        email: null,                // not shared
        phone: null,                // not shared
        country: 'USA'
      },
      message: 'Best local food!',
      contact_data_shared: 'names_only'
    }
  ]
}
```

### 3. Notification Tracking

```typescript
// GET /api/admin/forward-to-vendor/notif_123

{
  notification_id: 'notif_123',
  contact_data_sharing_level: 'names_only',
  visitor_data_included: {
    visitor_names: ['John Smith', 'Sarah Johnson', ...],
    visitor_emails: null,
    visitor_phones: null,
    contact_data_shared: true,
    sharing_level_used: 'names_only'
  },
  audit: {
    shared_at: '2026-06-09T14:30:00Z',
    admin_id: 'admin_001',
    admin_reason: 'Featured vendor initial outreach',
    privacy_compliant: true
  }
}
```

### 4. Admin Settings

```typescript
// POST /api/admin/settings/contact-sharing

{
  admin_id: 'admin_001',
  default_sharing_level: 'names_only',
  share_on_milestone: true,
  share_on_initial: true,
  share_on_followup: false,
  require_visitor_opt_in: true,
  gdpr_compliant_mode: true
}
```

---

## Real-World Scenarios

### Scenario 1: Privacy-Focused Admin

```
Admin setting: Always "None"

When vendor gets notification:
"5 people recommended your restaurant!"

No visitor data shared.
Vendor must upgrade to see who.
Maximum visitor privacy.
```

### Scenario 2: Sales-Focused Admin

```
Admin setting: Always "Full Contact"

When vendor gets notification:
"5 people recommended you:
- John Smith: john@example.com, +1 234 567 890
- Sarah Johnson: sarah@example.com, +44 1234 567 890
- ..."

Vendor can contact directly.
Maximum conversion potential.
```

### Scenario 3: Balanced Admin

```
Admin setting: Default "Names Only"

Override per situation:
- Initial outreach: Names only
- High-value vendor: Full contact
- Privacy-sensitive vendor: None
- GDPR territory: Emails only (no phones)
```

---

## Database Changes

### SQL Migration Additions

```sql
-- Add to vendor_notifications
ALTER TABLE vendor_notifications
ADD COLUMN contact_data_sharing_level ENUM(
    'none', 'names_only', 'emails_only', 'full_contact', 'anonymous'
) DEFAULT 'names_only',
ADD COLUMN included_visitors_json JSON,
ADD COLUMN visitor_privacy_compliant BOOLEAN DEFAULT TRUE,
ADD COLUMN gdpr_compliant BOOLEAN DEFAULT TRUE;

-- Create admin preferences
CREATE TABLE admin_contact_sharing_preferences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(36) NOT NULL UNIQUE,
    
    default_sharing_level ENUM(
        'none', 'names_only', 'emails_only', 'full_contact'
    ) DEFAULT 'names_only',
    
    share_on_milestone BOOLEAN DEFAULT TRUE,
    share_on_initial BOOLEAN DEFAULT TRUE,
    share_on_followup BOOLEAN DEFAULT FALSE,
    
    require_visitor_opt_in BOOLEAN DEFAULT FALSE,
    gdpr_compliant_mode BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id)
);
```

---

## Summary: Admin Controls

✅ **Choose what to share per notification**
- None (privacy only)
- Names only (balanced)
- Full contact (maximum)

✅ **Set default preferences**
- Different rules for different situations
- GDPR compliance toggle
- Visitor opt-in requirements

✅ **Track what was shared**
- Audit trail of contact data sharing
- Know exactly what vendors received
- Compliance documentation

✅ **Privacy by default**
- Visitors protected unless they opt-in
- GDPR-ready
- Respects visitor privacy

✅ **Flexible for business needs**
- Share minimally for privacy
- Share fully for sales conversions
- Adjust per vendor or situation

---

**Admin has FULL CONTROL over visitor privacy!** 🔒

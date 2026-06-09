# Auction System: Contact Visibility Control

## The Flow You're Describing

```
AUCTION ON WEBSITE (PUBLIC)
├─ Visible to all vendors
├─ Can show OR hide visitor contact
└─ "Privately internal" = internal admin-to-vendor communication only

TWO SCENARIOS:

SCENARIO 1: HIDDEN CONTACT (Maximum Privacy)
┌───────────────────────────────────────────┐
│ AUCTION VISIBLE (on website)              │
├───────────────────────────────────────────┤
│ Title: "Cooking Class Experience"         │
│ Description: Details about the request    │
│ Category: Culinary                        │
│ Price: Starting at $250/month             │
│                                           │
│ VISITOR CONTACT: ❌ NOT SHOWN             │
│ └─ Hidden during auction                  │
│                                           │
│ VENDOR CAN SEE:                           │
│ ✓ What visitor wants                      │
│ ✓ Group size (8 people)                   │
│ ✓ Budget level                            │
│ ✓ Travel dates                            │
│ ✗ Visitor name/email/phone                │
│                                           │
│ [Place Bid] → Bid placed                  │
└───────────────────────────────────────────┘

VENDOR REPLIES TO AUCTION
└─ "I'm interested in $350/month"
   └─ Email sent to: admin@siwatoday.com (INTERNAL)
   └─ NOT sent to visitor yet

ADMIN RECEIVES REPLY (INTERNAL)
├─ Vendor: Chef D
├─ Bid: $350/month
├─ Message: "I'm interested..."
└─ Admin decides: Permit or not?

IF ADMIN PERMITS:
└─ Vendor contact allowed ✓
   └─ Actual visitor contact released
   └─ Winner can now reach out directly

IF ADMIN DENIES:
└─ Vendor cannot contact visitor
   └─ Must work through admin only


SCENARIO 2: VISIBLE CONTACT (Direct Communication)
┌───────────────────────────────────────────┐
│ AUCTION VISIBLE (on website)              │
├───────────────────────────────────────────┤
│ Title: "Cooking Class Experience"         │
│ Description: Details about the request    │
│ Category: Culinary                        │
│ Price: Starting at $250/month             │
│                                           │
│ VISITOR CONTACT: ✓ SHOWN                  │
│ ├─ John Smith                             │
│ ├─ john@example.com                       │
│ ├─ +1 234 567 890                         │
│ └─ USA                                    │
│                                           │
│ [Place Bid] → Bid placed                  │
└───────────────────────────────────────────┘

VENDOR CAN CONTACT DIRECTLY
└─ Winning vendor reaches out directly
   └─ Can email/call immediately
   └─ Doesn't need admin permission
```

---

## Key Points: INTERNAL vs PUBLIC

```
PUBLIC WEBSITE:
├─ Auction listing visible to all vendors
├─ Shows business opportunity
└─ Attracts competitive bidding

INTERNAL/PRIVATE COMMUNICATION:
├─ Vendor → Admin (auction replies)
├─ Admin receives all vendor responses
├─ Admin permits or denies contact share
├─ Only then: Vendor → Visitor (if permitted)
└─ Completely private between Admin and Vendors
   └─ Not visible to public/other vendors/visitors
```

---

## Database Updates

### Add Contact Visibility Control to Auctions

```sql
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS show_visitor_contact BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_visibility_level ENUM(
    'none',          -- Contact completely hidden
    'partial',       -- Name only during auction
    'full',          -- All contact shown
    'email_only'     -- Email only, no phone
) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS admin_contact_email VARCHAR(255) COMMENT 'Where vendor replies go initially',
ADD COLUMN IF NOT EXISTS replies_received INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS permit_contact_after_bid BOOLEAN DEFAULT FALSE;
```

### Create Vendor Replies Table

```sql
CREATE TABLE IF NOT EXISTS auction_vendor_replies (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    -- Reply from vendor
    reply_subject VARCHAR(255),
    reply_message MEDIUMTEXT,
    bid_amount DECIMAL(10, 2),
    
    -- Status
    reply_status ENUM(
        'received',        -- Initial reply from vendor
        'admin_reviewed',  -- Admin read it
        'contact_permitted', -- Admin approved vendor contact
        'contact_denied',  -- Admin denied access
        'responded'        -- Admin responded to vendor
    ) DEFAULT 'received',
    
    -- When vendor can contact
    contact_permitted BOOLEAN DEFAULT FALSE,
    contact_permitted_at TIMESTAMP NULL,
    contact_permitted_by_admin_id VARCHAR(36),
    admin_reason TEXT,
    
    -- Visitor contact released to vendor
    visitor_contact_shared BOOLEAN DEFAULT FALSE,
    visitor_contact_shared_at TIMESTAMP NULL,
    
    -- Admin response to vendor
    admin_response_message MEDIUMTEXT,
    admin_responded_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_reply_status (reply_status),
    INDEX idx_contact_permitted (contact_permitted),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Workflow: Contact Hidden During Auction

### Step 1: Admin Opens Auction (with hidden contact)

```
OPEN AUCTION:

Title: "Authentic Cooking Class"
Category: Culinary

┌────────────────────────────────────┐
│ VISIBILITY SETTINGS                │
├────────────────────────────────────┤
│                                    │
│ Show visitor contact during        │
│ auction?                           │
│                                    │
│ ○ Yes - Show full contact         │
│         (name, email, phone)       │
│         Vendors contact directly   │
│                                    │
│ ○ No - Hide contact  [SELECTED]    │
│   └─ Vendor replies go to admin    │
│   └─ Admin permits before sharing  │
│                                    │
│ If hidden, replies go to:         │
│ vendor-replies@siwatoday.com       │
│                                    │
│ [Open Auction]                     │
└────────────────────────────────────┘
```

### Step 2: Auction Live (No Contact Shown)

```
WEBSITE - PUBLIC AUCTION

Title: "Authentic Egyptian Cooking Class"
Price: Starting at $250/month
Bids: 5 received

DESCRIPTION (VISIBLE):
"Visitor from USA wants authentic cooking class
with 8 other interested travelers.
High-quality group looking for professional service."

VISITOR CONTACT: ❌ HIDDEN
├─ Name: [NOT SHOWN]
├─ Email: [NOT SHOWN]
├─ Phone: [NOT SHOWN]
└─ Interested vendors must bid and wait

[Place Bid] → Wins with $350/month bid
```

### Step 3: Vendor Places Bid (Hidden Contact)

```
VENDOR VIEW:

Auction Details:
├─ Title: Cooking Class
├─ Category: Culinary
├─ Current bid: $300/month
├─ Your bid: [350]
├─ Contact info: HIDDEN
│  └─ "Contact hidden during auction"
│  └─ "If you win, admin will guide next steps"
└─ [Place Bid]

VENDOR BIDS: $350/month
```

### Step 4: Vendor Replies to Admin (INTERNAL)

```
VENDOR PERSPECTIVE:

You won the auction! 🎉

Auction: Cooking Class
Your winning bid: $350/month

Next step: Express your interest

┌──────────────────────────────────┐
│ CONTACT VENDOR INTEREST          │
├──────────────────────────────────┤
│                                  │
│ Your reply to admin:             │
│ (This is internal to Siwa Oasis) │
│                                  │
│ [Text area]                      │
│ "I can start immediately with   │
│  multiple weekly sessions. High  │
│  quality service guaranteed."    │
│                                  │
│ [Send Reply to Admin]            │
│                                  │
│ Reply goes to:                   │
│ vendor-replies@siwatoday.com     │
│ (Internal system only)           │
│                                  │
└──────────────────────────────────┘

EMAIL SENT TO: vendor-replies@siwatoday.com
FROM: chef@cooking.com
SUBJECT: Cooking Class Auction - Vendor Interest
BODY: "I can start immediately..."

⚠️ NOT sent to visitor
⚠️ INTERNAL communication only
```

### Step 5: Admin Reviews Reply (INTERNAL)

```
ADMIN PANEL - AUCTION REPLIES

Auction: "Cooking Class"
Winner: Chef D
Winning Bid: $350/month

VENDOR REPLY RECEIVED:
├─ From: Chef D (chef@cooking.com)
├─ Date: 2026-06-09 14:30:00
├─ Message: "I can start immediately..."
└─ Status: Pending admin review

ADMIN OPTIONS:
┌─────────────────────────────────────┐
│ PERMIT VISITOR CONTACT?             │
├─────────────────────────────────────┤
│                                     │
│ This vendor is winning bid for:     │
│ Cooking Class ($350/month)          │
│                                     │
│ Vendor message looks good?          │
│ ✓ Professional                      │
│ ✓ Committed                         │
│ ✓ Ready to start                    │
│                                     │
│ DECISION:                           │
│ ○ Permit contact - Share visitor    │
│              contact with vendor    │
│                                     │
│ ○ Deny contact - Keep internal only │
│                                     │
│ Reason: [text area]                 │
│ "Excellent vendor, ready to proceed"│
│                                     │
│ [Permit Contact] [Deny] [Review More]
└─────────────────────────────────────┘
```

### Step 6: Admin Permits (or Denies)

```
IF ADMIN PERMITS:
─────────────────
Admin clicks: [Permit Contact]

SYSTEM SENDS TO VENDOR:
"Great news! Your visitor contact is now available:

John Smith
Email: john@example.com
Phone: +1 234 567 890
Country: USA

You can now reach out directly to confirm
details and finalize the booking.

Next steps:
1. Contact visitor within 24 hours
2. Confirm schedule and details
3. Send first invoice
4. Start service"

VENDOR NOW HAS:
✓ Visitor name
✓ Visitor email
✓ Visitor phone
✓ Can contact directly

VISITOR STILL DOESN'T KNOW:
✗ Doesn't know winner yet
✗ Admin will contact visitor to confirm


IF ADMIN DENIES:
────────────────
Admin clicks: [Deny Contact]

SYSTEM SENDS TO VENDOR:
"Thank you for your interest in this auction.

Unfortunately, we've decided to go in a different
direction with this opportunity.

Don't worry - we have more auctions coming up!
Keep bidding on other opportunities."

VENDOR:
✗ Cannot see visitor contact
✗ Doesn't win the lead
```

---

## API Updates

### POST /api/admin/auctions/open (Updated)

```typescript
interface OpenAuctionRequest {
  recommendation_id: string;
  title: string;
  description: string;
  category: string;
  starting_price: number;
  reserve_price?: number;
  duration_days: number;
  
  // NEW: Contact visibility control
  show_visitor_contact: boolean; // true = show, false = hide
  contact_visibility_level: 'none' | 'partial' | 'full' | 'email_only';
  
  // NEW: Where vendor replies go
  admin_contact_email: string; // vendor-replies@siwatoday.com
  
  admin_note?: string;
}

Response:
{
  auction_id: 'auc_001',
  contact_visibility: 'none',
  vendor_replies_to: 'vendor-replies@siwatoday.com',
  message: 'Auction opened. Contact is HIDDEN. Vendor replies will go to admin.'
}
```

### POST /api/vendor/auctions/{id}/express-interest (New)

```typescript
interface ExpressInterestRequest {
  message: string;
  bid_amount: number;
  availability: string;
}

// Vendor sends this instead of contacting visitor directly
// If contact is hidden

Response:
{
  success: true,
  status: 'reply_sent',
  message: 'Your interest has been sent to admin. We will review and permit vendor contact if approved.'
}
```

### POST /api/admin/auction-replies/{id}/permit-contact (New)

```typescript
interface PermitContactRequest {
  reply_id: string;
  permit: boolean; // true = allow, false = deny
  reason?: string;
}

// Admin decides whether to share visitor contact

Response:
{
  success: true,
  action: 'contact_permitted' | 'contact_denied',
  vendor_notified: true,
  message: 'Vendor has been notified of your decision.'
}
```

---

## Real-World Example

### Scenario: Admin Wants Full Control

```
AUCTION OPENS: "Safari Adventure - Family of 8"
├─ Public on website: YES
├─ Contact shown: NO
├─ Vendor replies go to: vendor-replies@siwatoday.com
└─ Status: Internal processing only

BIDDING HAPPENS:
├─ Safari Company A: $800/month
├─ Safari Company B: $950/month (leading)
├─ Safari Company C: $900/month
└─ Auction ends

REPLIES RECEIVED:
├─ Company B: "We specialize in family safaris!"
├─ Company A: "We can provide guides and vehicles"
└─ Company C: "Ready to start immediately"

ADMIN REVIEWS:
├─ Checks Company B's credentials ✓ Good
├─ Checks their reviews ✓ Excellent
├─ Verifies their offer ✓ Professional
└─ PERMITS: Contact shared with Company B

COMPANY B GETS:
├─ Family name: Smith family (8 people)
├─ Email: smith@example.com
├─ Phone: +1 555 123 456
├─ Dates: June 15-22, 2026
└─ Budget: Flexible, quality-focused

COMPANY B CONTACTS DIRECTLY:
"Hi Smith family! We're thrilled to be your safari guide!"

VISITOR GETS QUALITY SERVICE:
✓ Admin filtered and approved the vendor
✓ Best vendor won through competition
✓ Professional experience guaranteed
```

---

## Key Advantages

### For Admin
✅ **Full Control**
- Decides who gets visitor contact
- Reviews vendor quality before sharing
- Filters low-quality vendors
- Can deny sketchy vendors

✅ **Privacy First**
- Visitor contact hidden during public auction
- Only released with admin approval
- Internal process completely private
- No direct vendor-visitor contact until approved

✅ **Quality Assurance**
- Can check vendor credentials
- Verify their bid commitment
- Ensure they're legitimate
- Protect visitor experience

### For Vendors
✅ **Fair Competition**
- Bid on opportunities
- Express genuine interest
- Professional vetting process
- Only qualified vendors get contact

### For Visitors
✅ **Protected Privacy**
- Contact not shown during public auction
- Only shared with admin-approved vendors
- Admin acts as gatekeeper
- Quality vendor guaranteed

---

## Implementation: Two Paths

### Path 1: CONTACT HIDDEN (Default)
```
1. Admin opens auction with show_visitor_contact = false
2. Website shows auction without contact
3. Vendors bid
4. Vendors express interest (replies to admin)
5. Admin reviews and permits
6. Vendor gets contact
7. Vendor contacts visitor
```

### Path 2: CONTACT SHOWN (Direct)
```
1. Admin opens auction with show_visitor_contact = true
2. Website shows auction WITH contact
3. Vendors bid
4. Winner can contact directly
5. No admin approval needed
```

---

## Summary: Contact Visibility in Auctions

✅ **Auction on website (PUBLIC)**
- Visible to all vendors
- Attracts bidding competition

✅ **Contact visibility control**
- Hidden by default (privacy)
- Can show if needed (direct contact)
- Admin decides per auction

✅ **INTERNAL communication**
- Vendor replies go to admin
- Admin only receives them
- Completely private
- Not shown to public or other vendors

✅ **Admin permits contact**
- Reviews vendor quality
- Approves or denies
- Only then: vendor gets visitor contact

✅ **Zero compromise on privacy**
- Visitor contact protected during auction
- Released only with admin approval
- Visitor never exposed to unvetted vendors

---

**This gives you maximum control and privacy!** 🔒

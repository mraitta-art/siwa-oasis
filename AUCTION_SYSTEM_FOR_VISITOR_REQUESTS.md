# Auction System: Competitive Bidding for Visitor Requests

## New Revenue Model: Vendor Auctions

### How It Works

```
VISITOR SUBMITS REQUEST
└─ "Authentic Egyptian Cooking Class"
   
ADMIN APPROVES
└─ Decision: Open Auction (instead of direct contact)
   
AUCTION OPENS FOR 7 DAYS
├─ Description: "Visitor wants cooking class"
├─ Estimated value: $500/month
├─ Starting bid: $250/month
└─ Deadline: 2026-06-16 5:00 PM

VENDORS COMPETE
├─ Chef A bids: $100/month
├─ Chef B bids: $150/month
├─ Chef C bids: $200/month
├─ Chef D bids: $250/month (current winning bid)
└─ More vendors can bid

AUCTION ENDS
└─ Chef D wins at $250/month!
   
WINNER NOTIFIED
├─ "You won the auction!"
├─ "Visitor contact info unlocked"
├─ "Start date: 2026-06-17"
└─ "Payment due: 2026-07-17"

VISITOR SERVED
└─ Only winner can see visitor contact
   └─ Chef D now owns this exclusive lead

REVENUE MODEL
├─ Winner pays: $250/month × 12 months = $3,000
├─ Siwa Oasis gets: 100% ($3,000)
└─ Profit: 100% margin
```

---

## Auction Flow: Step-by-Step

### Step 1: Admin Opens Auction

```
Recommendation: "Authentic Egyptian Cooking Class"
Votes: 8 people interested

Admin decision:

AUCTION OPTIONS:
┌─────────────────────────────────────┐
│ Start Price: $250/month             │
│ Auction Duration: 7 days            │
│ Max Bid Increment: $50/month        │
│ Reserve Price: $300/month (optional)│
│ Category: Culinary Experience       │
│                                     │
│ Description to show vendors:        │
│ "Visitor from USA wants to learn    │
│  authentic Egyptian cooking with    │
│  8 other interested travelers.      │
│  High-quality visitor group."       │
│                                     │
│ [Open Auction]  [Cancel]            │
└─────────────────────────────────────┘
```

### Step 2: Auction Live

```
AUCTION LIVE: "Authentic Egyptian Cooking Class"
Auction ID: auc_001
Status: OPEN
Time Remaining: 5 days 2 hours
Current Bid: $200/month (by Chef B)

DESCRIPTION:
Visitor from USA wants authentic Egyptian cooking class.
8 other travelers interested.
Multiple potential sessions/bookings.

AUCTION DETAILS:
├─ Starting Price: $250/month
├─ Current Bid: $200/month
├─ Bids Received: 3
├─ Minimum Next Bid: $250/month
└─ Ends: 2026-06-16 17:00:00

CURRENT BIDDER:
Chef B - Culinary Delights
Bid amount: $200/month
Bid time: 2026-06-09 14:30:00

BID HISTORY:
1. Chef A: $150/month (2026-06-09 10:00:00)
2. Chef B: $175/month (2026-06-09 12:15:00)
3. Chef B: $200/month (2026-06-09 14:30:00)

[Place Bid] [Watch Auction] [Back]
```

### Step 3: Vendor Places Bid

```
PLACE YOUR BID

Current winning bid: $200/month
Minimum bid required: $250/month

Your bid: [250] /month

Duration: 12 months
Total if you win: $3,000

Bid Commitment: "I agree to provide the service
at this price if I win the auction."

[Place Bid] [Cancel]
```

### Step 4: Auction Ends - Winner Declared

```
🎉 AUCTION CLOSED - YOU WON! 🎉

Auction: "Authentic Egyptian Cooking Class"
Your winning bid: $250/month

DETAILS:
├─ Visitor: John Smith (USA)
├─ Email: john@example.com
├─ Phone: +1 234 567 890
├─ Request: Authentic Egyptian cooking class
├─ Group size: 9 people
├─ Budget: Flexible, quality-focused
└─ Best dates: June-August 2026

NEXT STEPS:
1. Contact visitor within 24 hours
2. Finalize schedule and details
3. Invoice for first month ($250)
4. Monthly payment due on 17th of each month

EXCLUSIVE RIGHTS:
✓ Only you can serve this visitor
✓ Exclusive access to contact info
✓ Other vendors cannot bid on this request
✓ 12-month exclusive period

[Confirm Acceptance] [Contact Visitor] [View Contract]
```

### Step 5: Vendor Loses Auction

```
AUCTION CLOSED - BETTER LUCK NEXT TIME

Auction: "Authentic Egyptian Cooking Class"
Your bid: $175/month
Winning bid: $250/month
Winner: Chef D

The winner was willing to offer better value.
This shows there's demand in the market!

SUGGESTIONS:
├─ Watch more similar auctions
├─ Set higher maximum bid
├─ Improve your service offerings
└─ Check "Similar Auctions" to bid on others

[View All Auctions] [View Similar Auctions] [Back]
```

---

## Database Schema: Auction System

### New Tables

```sql
-- ============================================
-- AUCTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auctions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) UNIQUE NOT NULL,
    
    -- Auction details
    title VARCHAR(255) NOT NULL,
    description MEDIUMTEXT,
    category VARCHAR(100),
    
    -- Pricing
    starting_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2),
    reserve_price DECIMAL(10, 2),
    min_bid_increment DECIMAL(10, 2) DEFAULT 50,
    
    -- Timing
    auction_start_time TIMESTAMP NOT NULL,
    auction_end_time TIMESTAMP NOT NULL,
    duration_days INT,
    
    -- Status
    status ENUM(
        'draft',           -- Preparing
        'open',            -- Taking bids
        'extended',        -- Extended due to activity
        'closed',          -- Ended
        'processing',      -- Determining winner
        'completed'        -- Winner assigned
    ) DEFAULT 'draft',
    
    -- Winner details
    winning_bid_id VARCHAR(36),
    winning_vendor_id VARCHAR(36),
    winning_bid_amount DECIMAL(10, 2),
    winner_notified BOOLEAN DEFAULT FALSE,
    winner_accepted BOOLEAN DEFAULT FALSE,
    
    -- Auction metrics
    total_bids INT DEFAULT 0,
    unique_bidders INT DEFAULT 0,
    price_increase_percent DECIMAL(5, 2),
    
    -- Admin info
    opened_by_admin_id VARCHAR(36),
    admin_note MEDIUMTEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_status (status),
    INDEX idx_auction_end_time (auction_end_time),
    INDEX idx_winning_vendor_id (winning_vendor_id),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUCTION BIDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auction_bids (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    bid_amount DECIMAL(10, 2) NOT NULL,
    bid_sequence INT,
    
    -- Duration commitment
    contract_duration_months INT DEFAULT 12,
    total_contract_value DECIMAL(12, 2),
    
    -- Bid status
    is_active BOOLEAN DEFAULT TRUE,
    is_winning_bid BOOLEAN DEFAULT FALSE,
    
    -- Bid details
    vendor_notes TEXT,
    terms_accepted BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_bid_amount (bid_amount),
    INDEX idx_is_winning_bid (is_winning_bid),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUCTION WINNERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auction_winners (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) UNIQUE NOT NULL,
    bid_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    winning_bid_amount DECIMAL(10, 2),
    contract_duration_months INT DEFAULT 12,
    total_value DECIMAL(12, 2),
    
    -- Winner status
    winner_status ENUM(
        'won',             -- Auction won
        'accepted',        -- Winner accepted terms
        'rejected',        -- Winner rejected (rare)
        'active',          -- Contract active
        'completed',       -- Contract completed
        'cancelled'        -- Contract cancelled
    ) DEFAULT 'won',
    
    -- Contract dates
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Visitor details unlocked
    visitor_data_shared BOOLEAN DEFAULT FALSE,
    visitor_data_shared_date TIMESTAMP NULL,
    
    -- Visitor contact info
    visitor_id VARCHAR(36),
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_phone VARCHAR(20),
    
    -- Revenue
    first_payment_due DATE,
    next_payment_due DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_contract_start_date (contract_start_date),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (bid_id) REFERENCES auction_bids(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUCTION WATCHERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS auction_watchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    
    is_watching BOOLEAN DEFAULT TRUE,
    notify_on_bid BOOLEAN DEFAULT TRUE,
    notify_on_price_change BOOLEAN DEFAULT TRUE,
    notify_on_end BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_vendor_id (vendor_id),
    UNIQUE KEY unique_watcher (auction_id, vendor_id),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUCTION AUDIT TRAIL
-- ============================================

CREATE TABLE IF NOT EXISTS auction_audit_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    auction_id VARCHAR(36) NOT NULL,
    
    action_type ENUM(
        'created',
        'opened',
        'bid_placed',
        'bid_retracted',
        'extended',
        'price_updated',
        'winner_notified',
        'winner_accepted',
        'winner_rejected',
        'contract_active',
        'completed',
        'cancelled'
    ) NOT NULL,
    
    performed_by_user_id VARCHAR(36),
    performed_by_user_type ENUM('admin', 'vendor'),
    
    details JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_auction_id (auction_id),
    INDEX idx_action_type (action_type),
    
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

CREATE OR REPLACE VIEW vw_active_auctions AS
SELECT 
    a.id,
    a.title,
    a.status,
    a.starting_price,
    a.current_price,
    a.auction_end_time,
    TIMESTAMPDIFF(HOUR, NOW(), a.auction_end_time) as hours_remaining,
    a.total_bids,
    a.unique_bidders,
    a.price_increase_percent,
    COUNT(DISTINCT aw.vendor_id) as watchers_count
FROM auctions a
LEFT JOIN auction_watchers aw ON a.id = aw.auction_id
WHERE a.status IN ('open', 'extended')
GROUP BY a.id;

CREATE OR REPLACE VIEW vw_auction_leaderboard AS
SELECT 
    a.id,
    a.title,
    ab.vendor_id,
    v.vendor_name,
    ab.bid_amount,
    ab.bid_sequence,
    ab.created_at,
    ab.is_winning_bid,
    RANK() OVER (PARTITION BY a.id ORDER BY ab.bid_amount DESC) as bid_rank
FROM auctions a
JOIN auction_bids ab ON a.id = ab.auction_id
JOIN vendor_portal_accounts v ON ab.vendor_id = v.id
WHERE a.status IN ('open', 'extended')
ORDER BY a.id, ab.bid_amount DESC;

CREATE OR REPLACE VIEW vw_vendor_auction_stats AS
SELECT 
    v.id,
    v.vendor_name,
    COUNT(DISTINCT ab.auction_id) as participated_auctions,
    COUNT(CASE WHEN aw.id IS NOT NULL AND aw.is_watching = TRUE THEN 1 END) as watching_count,
    COUNT(CASE WHEN aw2.id IS NOT NULL THEN 1 END) as won_auctions,
    SUM(CASE WHEN aw2.id IS NOT NULL THEN aw2.total_value ELSE 0 END) as total_won_value,
    AVG(CASE WHEN aw2.id IS NOT NULL THEN aw2.winning_bid_amount ELSE NULL END) as avg_winning_bid,
    COUNT(CASE WHEN ab.is_winning_bid = FALSE THEN 1 END) as lost_bids
FROM vendor_portal_accounts v
LEFT JOIN auction_bids ab ON v.id = ab.vendor_id
LEFT JOIN auction_watchers aw ON v.id = aw.vendor_id
LEFT JOIN auction_winners aw2 ON v.id = aw2.vendor_id
GROUP BY v.id, v.vendor_name;
```

---

## API Endpoints: Auction System

### 1. Admin Opens Auction

```http
POST /api/admin/auctions/open

{
    recommendation_id: 'rec_789',
    title: 'Authentic Egyptian Cooking Class',
    description: 'Visitor from USA wants to learn authentic Egyptian cooking',
    category: 'culinary_experience',
    starting_price: 250,
    reserve_price: 300,
    min_bid_increment: 50,
    duration_days: 7,
    admin_note: 'High-quality visitor, multiple interested travelers'
}

Response (201):
{
    success: true,
    auction_id: 'auc_001',
    title: 'Authentic Egyptian Cooking Class',
    starting_price: 250,
    auction_end_time: '2026-06-16T17:00:00Z',
    status: 'open',
    message: 'Auction opened successfully. Vendors will be notified.'
}
```

### 2. Vendor Browsing Auctions

```http
GET /api/vendor/auctions?status=open&category=culinary

Response (200):
{
    auctions: [
        {
            id: 'auc_001',
            title: 'Authentic Egyptian Cooking Class',
            description: 'Visitor from USA wants...',
            category: 'culinary_experience',
            starting_price: 250,
            current_price: 200,
            current_leading_bid_by: 'Chef B',
            auction_end_time: '2026-06-16T17:00:00Z',
            hours_remaining: 42,
            total_bids: 3,
            unique_bidders: 2,
            your_highest_bid: null,
            your_position: 'not_bidding',
            can_bid: true,
            min_next_bid: 250
        }
    ]
}
```

### 3. Vendor Places Bid

```http
POST /api/vendor/auctions/auc_001/bid

Authorization: Bearer vendor_token

{
    bid_amount: 250,
    contract_duration_months: 12,
    vendor_notes: 'I can start immediately with multiple sessions'
}

Response (201):
{
    success: true,
    bid_id: 'bid_123',
    auction_id: 'auc_001',
    bid_amount: 250,
    total_contract_value: 3000,
    is_winning_bid: true,
    message: 'Bid placed! You are currently winning.',
    current_price: 250,
    next_minimum_bid: 300
}
```

### 4. Get Auction Details

```http
GET /api/vendor/auctions/auc_001

Response (200):
{
    auction: {
        id: 'auc_001',
        title: 'Authentic Egyptian Cooking Class',
        status: 'open',
        starting_price: 250,
        current_price: 200,
        reserve_price: 300,
        hours_remaining: 42,
        total_bids: 3,
        unique_bidders: 2,
        price_increase_percent: 25,
        
        bid_history: [
            {
                bid_amount: 150,
                vendor_name: 'Chef A',
                time_ago: '5 hours ago'
            },
            {
                bid_amount: 175,
                vendor_name: 'Chef B',
                time_ago: '2 hours ago'
            },
            {
                bid_amount: 200,
                vendor_name: 'Chef B',
                time_ago: '30 minutes ago'
            }
        ],
        
        your_bid: {
            bid_amount: 175,
            your_position: 'You are 2nd',
            to_win_need_bid: 250
        }
    }
}
```

### 5. Admin Closes Auction

```http
POST /api/admin/auctions/auc_001/close

Response (200):
{
    success: true,
    auction_id: 'auc_001',
    status: 'closed',
    winning_bid: 250,
    winning_vendor: 'Chef D',
    action: 'Winner notification sent'
}
```

---

## Real-World Revenue Examples

### Example 1: Standard Auction

```
Visitor Request: "Authentic Cooking Class"

AUCTION RESULTS:
├─ Starting Price: $250/month
├─ Bids Received: 5
├─ Final Winning Bid: $400/month
├─ Duration: 12 months
└─ Total Value: $4,800

REVENUE:
├─ Without auction: $250/month = $3,000/year
├─ With auction: $400/month = $4,800/year
└─ INCREASE: $1,800 (60% more revenue!)
```

### Example 2: High Demand Auction

```
Visitor Request: "Safari Adventure - Family of 8"

AUCTION RESULTS:
├─ Starting Price: $500/month
├─ Bids Received: 12
├─ Final Winning Bid: $1,200/month
├─ Duration: 12 months
└─ Total Value: $14,400

REVENUE:
├─ Without auction: $500/month = $6,000/year
├─ With auction: $1,200/month = $14,400/year
└─ INCREASE: $8,400 (140% more revenue!)
```

### Example 3: Multiple Auctions per Month

```
MONTHLY SCENARIO: 5 Auctions Opened

Auction 1 (Cooking): $400/month = $4,800/year
Auction 2 (Safari): $850/month = $10,200/year
Auction 3 (Accommodation): $600/month = $7,200/year
Auction 4 (Wellness): $500/month = $6,000/year
Auction 5 (Transport): $350/month = $4,200/year

TOTAL ANNUAL REVENUE: $32,400
Per Month: $2,700/month recurring

COMPARED TO:
Non-auction direct contact: ~$1,500/month × 5 = $7,500/year
Difference: $32,400 - $7,500 = $24,900 additional annual revenue!

PROFIT POTENTIAL: 433% increase in annual revenue
```

---

## Admin Workflow: Open Auction

### Decision Point

```
RECOMMENDATION APPROVED
Votes: 8

ADMIN DECISION:

┌─────────────────────────────────┐
│ How to monetize this?           │
│                                 │
│ ○ Direct contact (one vendor)   │
│   └─ $250/month fixed           │
│                                 │
│ ○ OPEN AUCTION (competition)    │
│   └─ Likely $400-600/month      │
│   └─ Creates urgency & demand   │
│                                 │
│ [Select Auction]                │
└─────────────────────────────────┘
```

### Configure Auction

```
AUCTION CONFIGURATION:

Title: Authentic Egyptian Cooking Class
Category: Culinary Experience

Pricing:
├─ Starting Price: $250/month
├─ Reserve Price: $300/month (won't sell below)
└─ Min Bid Increment: $50/month

Duration:
├─ Auction Length: 7 days
└─ Ends: 2026-06-16 17:00:00

Visibility:
├─ Notify all vendors: YES
├─ Category-specific vendors: NO
└─ Featured vendors only: NO

Admin Note:
"High-quality visitor group from USA.
8 people interested. Multiple booking potential."

[Open Auction] [Cancel]
```

### Monitor Auction

```
AUCTION DASHBOARD

Live Auction: "Authentic Egyptian Cooking Class"
Status: OPEN
Time Remaining: 3 days 5 hours

CURRENT BID: $400/month
Leading Vendor: Chef D (Culinary Masters)

BIDDING ACTIVITY:
├─ Total Bids: 7
├─ Unique Bidders: 4
├─ Price Increase: 60% (from $250 to $400)
└─ Avg Bid Time: Every 8 hours

LEADERBOARD:
1. Chef D: $400/month (1 hour ago)
2. Chef B: $350/month (5 hours ago)
3. Chef A: $300/month (1 day ago)

METRICS:
├─ Watchers: 12 vendors watching
├─ Engagement: 4 vendors placed bids
└─ Competition: Good price movement

[Watch Activity] [Close Early] [Extend] [Back]
```

---

## Advantages of Auction System

### For Admin (You)
```
✅ Revenue maximization
   └─ Average 100-200% increase vs fixed pricing

✅ Competitive market dynamics
   └─ Vendors bid against each other

✅ Price discovery
   └─ Market determines real value

✅ Multiple revenue opportunities
   └─ Every visitor request becomes auction

✅ Reduced sales effort
   └─ Vendors do the work competing

✅ Engagement metrics
   └─ Know market demand for each type
```

### For Vendors
```
✅ Exclusive access to hot leads
   └─ Win = Get exclusive visitor contact

✅ Competitive opportunity
   └─ Fair bidding system

✅ Know what they're paying for
   └─ Transparent pricing

✅ Verified interested visitors
   └─ Not cold leads, real demand

✅ Multiple per month
   └─ Many auctions to bid on
```

### For Visitors
```
✅ Vendors compete for quality
   └─ Best service wins

✅ Better service expectations
   └─ Vendors paying premium to serve you

✅ Professional handling
   └─ Vetted, competing vendors
```

---

## Auction Types by Duration

### Flash Auctions (24-48 hours)
```
Use: High-demand requests
Duration: 24-48 hours
Typical Revenue: 50-75% above asking
Example: "Last-minute group of 10 tourists"
```

### Standard Auctions (7 days)
```
Use: Regular requests
Duration: 7 days
Typical Revenue: 100-150% above asking
Example: "Cooking class group"
```

### Long Auctions (14 days)
```
Use: Specialized services
Duration: 14 days
Typical Revenue: 150-200% above asking
Example: "Month-long cultural immersion program"
```

---

## Implementation: 5 Steps

### Step 1: Database
- [ ] Create auction tables (migration 018)
- [ ] Create views and indexes
- [ ] Insert sample auctions

### Step 2: Admin APIs
- [ ] POST /api/admin/auctions/open
- [ ] POST /api/admin/auctions/{id}/close
- [ ] GET /api/admin/auctions

### Step 3: Vendor APIs
- [ ] GET /api/vendor/auctions
- [ ] GET /api/vendor/auctions/{id}
- [ ] POST /api/vendor/auctions/{id}/bid
- [ ] POST /api/vendor/auctions/{id}/watch

### Step 4: UI Components
- [ ] Admin: Open auction form
- [ ] Vendor: Browse auctions list
- [ ] Vendor: Auction detail + bidding
- [ ] Vendor: Watch list

### Step 5: Notifications
- [ ] New auction notification to vendors
- [ ] Outbid notification
- [ ] Auction ending soon warning
- [ ] Winner notification
- [ ] Loser notification

---

## Summary: Auction System

✅ **Revenue Multiplier**
- 100-200% increase through competition

✅ **Automatic Price Discovery**
- Market determines real value

✅ **Reduced Admin Effort**
- Vendors compete for leads

✅ **Vendor Engagement**
- Exciting, competitive platform

✅ **Scalable Model**
- Open 5+ auctions per month

✅ **Transparent & Fair**
- Visible bidding for everyone

✅ **Additional Revenue Stream**
- Existing leads now generate 2-3x more

---

**Auction System unlocks massive revenue potential!**

One visitor request can generate:
- Without auction: $250/month = $3,000/year
- With auction: $400-600/month = $4,800-7,200/year
- Increase: 60-140% more revenue per lead! 💰

# Database Configuration for Journey Request System

## Environment Variables

Create a `.env.local` file in the `siwa-oasis/` directory with the following variables:

### Database Connection
```env
# MySQL/MariaDB Connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=siwa_oasis

# Connection Pool Settings (optional)
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
```

### Email Notifications (when ready to implement)
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@siwa.today

# Or use SendGrid
SENDGRID_API_KEY=sg_xxxxxxxxxxxxx
```

### API Keys
```env
# Admin Dashboard Access
NEXT_PUBLIC_ADMIN_API_KEY=your_admin_key_here

# Stripe/Payment (for booking confirmations)
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxx
```

### Authentication
```env
# JWT Secret for existing auth system
JWT_SECRET=your_jwt_secret_here

# Admin role configuration
ADMIN_ROLE=admin
VENDOR_ROLE=vendor
VISITOR_ROLE=visitor
```

---

## Installation Steps

### 1. Install MySQL Driver
```bash
npm install mysql2/promise
```

### 2. Create .env.local File
Copy the template above and fill in your actual values:
```bash
cp .env.local.example .env.local
# Edit .env.local with your database credentials
```

### 3. Verify Connection
The `src/lib/journey-request-db.ts` file will automatically:
- Create connection pool on first import
- Handle connection pooling internally
- Release connections after each query

### 4. Test Database Functions

In a test route or component:
```typescript
import * as journeyDB from '@/lib/journey-request-db';

// Test connection
const policies = await journeyDB.getAllPolicies();
console.log('Policies loaded:', policies.length);
```

---

## API Routes - Quick Reference

### Admin Endpoints

#### 1. Manage Policies
```
POST /api/admin/journey-policies
GET /api/admin/journey-policies
```
**Body (POST):**
```json
{
  "policy_name": "Quick Custom",
  "description": "Fast turnaround custom journeys",
  "request_type": "custom",
  "auto_approve_enabled": true,
  "auto_approve_rule": "budget <= 500 AND items <= 5 AND duration <= 7",
  "max_items_allowed": 5,
  "max_days_allowed": 7,
  "vendor_commission_percent": 15,
  "created_by_admin": "admin_001"
}
```

**Response:**
```json
{
  "success": true,
  "id": "policy_001",
  "policy": { /* full policy object */ }
}
```

#### 2. List Journey Requests
```
GET /api/admin/journey-requests?status=approved&policy_id=policy_001
```
**Filters:**
- `status`: submitted, under_review, approved, quoted, booked
- `policy_id`: specific policy ID
- `limit`: max results (default 100)

**Response:**
```json
{
  "success": true,
  "count": 24,
  "requests": [ /* array of requests */ ]
}
```

#### 3. Request Details & Approval
```
GET /api/admin/journey-requests/[id]
PATCH /api/admin/journey-requests/[id]
```
**PATCH Body:**
```json
{
  "status": "approved",
  "approval_decision": "admin_approved",
  "approved_by_admin": "admin_001",
  "approval_notes": "Approved for vendor notification"
}
```

#### 4. Request Analytics
```
GET /api/admin/analytics/journey-requests?days=7&policy_id=policy_001
```
**Response:**
```json
{
  "success": true,
  "analytics": [
    {
      "date": "2024-01-15",
      "total_requests": 12,
      "auto_approved": 8,
      "admin_approved": 3,
      "rejected": 1,
      "bookings_completed": 5,
      "total_revenue_usd": 2500
    }
  ]
}
```

#### 5. Vendor Performance
```
GET /api/admin/analytics/vendor-performance
```
**Response:**
```json
{
  "success": true,
  "vendors": [
    {
      "vendor_id": "vendor_001",
      "vendor_name": "Siwa Paradise Hotel",
      "requests_received": 24,
      "response_rate": 92,
      "quote_win_rate": 67,
      "bookings_completed": 12,
      "total_revenue_generated": 5400,
      "rating": 4.8,
      "rank": 1
    }
  ]
}
```

---

### Visitor Endpoints

#### 1. Submit Request
```
POST /api/visitor/journey-requests
```
**Body:**
```json
{
  "visitor_id": "visitor_001",
  "visitor_email": "user@example.com",
  "visitor_name": "John Doe",
  "title": "Family Adventure to Siwa",
  "description": "5-day family trip with kids",
  "duration_days": 5,
  "budget_usd_max": 400,
  "vibe": "adventure",
  "pace": "moderate",
  "requested_items": ["hotel", "tour_guide", "meals"],
  "special_requirements": "Kid-friendly activities"
}
```

**Response:**
```json
{
  "success": true,
  "id": "req_001",
  "status": "approved",
  "auto_approved": true,
  "matched_policy": "policy_001"
}
```

#### 2. Track Request
```
GET /api/visitor/journey-requests/[id]
```
**Response:**
```json
{
  "success": true,
  "request": {
    "id": "req_001",
    "status": "approved",
    "interested_vendors": 3,
    "vendor_quotes": [ /* quote objects */ ]
  }
}
```

#### 3. Modify Request (If Pending)
```
PATCH /api/visitor/journey-requests/[id]
```
**Body (any fields to update):**
```json
{
  "title": "Updated title",
  "budget_usd_max": 500,
  "duration_days": 6
}
```

---

### Vendor Endpoints

#### 1. View Request Queue
```
GET /api/vendor/request-queue?vendor_id=vendor_001&status=new
```
**Filters:**
- `status`: new, interested, quoted, booked

**Response:**
```json
{
  "success": true,
  "queue": [
    {
      "id": "queue_001",
      "journey_request_id": "req_001",
      "match_score": 87,
      "reason_for_match": "Hotel match - family friendly",
      "title": "Family Adventure to Siwa",
      "duration_days": 5,
      "budget_usd_max": 400,
      "interested_vendors": 3
    }
  ]
}
```

#### 2. Submit Quote
```
PATCH /api/vendor/request-queue/[id]
```
**Body:**
```json
{
  "vendor_status": "quoted",
  "vendor_proposed_price": 380,
  "vendor_response_notes": "Package includes breakfast..."
}
```

---

## Database Utility Functions

### Direct Database Access

Use `src/lib/journey-request-db.ts` in server components or API routes:

```typescript
import * as journeyDB from '@/lib/journey-request-db';

// Get all policies
const policies = await journeyDB.getAllPolicies();

// Submit a visitor request
const requestId = await journeyDB.submitJourneyRequest({
  visitor_id: 'visitor_001',
  title: 'My Journey',
  budget_usd_max: 500,
  // ... other fields
});

// Get vendor's queue
const queue = await journeyDB.getVendorQueue('vendor_001', 'new');

// Get analytics
const analytics = await journeyDB.getDailyAnalytics('policy_001', 7);
```

---

## Migration Verification

After executing migration 021 in your production database:

### Verify Tables Exist
```sql
-- Check migration was successful
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'siwa_oasis' 
AND TABLE_NAME IN (
  'admin_journey_policies',
  'journey_requests',
  'vendor_request_queue',
  'journey_request_approvals',
  'journey_request_analytics'
);
```

### Expected Result (5 rows)
```
admin_journey_policies
journey_requests
vendor_request_queue
journey_request_approvals
journey_request_analytics
```

### Verify Seed Data
```sql
SELECT COUNT(*) FROM admin_journey_policies WHERE is_active = TRUE;
```
Expected: 4 policies pre-populated

---

## Troubleshooting

### Connection Issues

**Error: "connect ECONNREFUSED 127.0.0.1:3306"**
- Verify MySQL/MariaDB is running
- Check DB_HOST and DB_PORT in .env.local
- Ensure DB_USER and DB_PASSWORD are correct

**Error: "Access denied for user"**
- Verify credentials in .env.local
- Check user permissions in phpMyAdmin

### Query Issues

**Error: "Table 'siwa_oasis.journey_requests' doesn't exist"**
- Migration 021 hasn't been executed
- Run migration in cPanel or SSH: `mysql -u root -p siwa_oasis < migrations/021_journey_request_policy_engine.sql`

**Error: "Unknown column in where clause"**
- Check column names match migration schema
- Reference `JOURNEY_REQUEST_POLICY_ENGINE.md` for field names

### Performance Issues

**Slow analytics queries:**
- Verify indexes exist: `SHOW INDEX FROM journey_request_analytics;`
- Run: `ANALYZE TABLE journey_request_analytics;`
- Consider partitioning by date for large datasets

---

## Testing

### Local Testing
```typescript
// src/app/api/test/route.ts
import * as journeyDB from '@/lib/journey-request-db';

export async function GET() {
  try {
    const policies = await journeyDB.getAllPolicies();
    return Response.json({ success: true, policies });
  } catch (error) {
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

Visit: `http://localhost:3004/api/test`

### Production Testing
1. Deploy to Vercel
2. Update .env vars in Vercel dashboard
3. Test API endpoints with curl:

```bash
curl -X GET "https://siwa.today/api/admin/journey-requests" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps

1. **Configure Database Connection**
   - Add `.env.local` with database credentials
   - Test connection with `/api/test` endpoint

2. **Execute Migration**
   - Run migration 021 in production database
   - Verify 5 tables are created

3. **Replace Mock Data**
   - Update API routes to use `journey-request-db.ts` functions
   - Test each endpoint with real data

4. **Deploy to Production**
   - Commit changes to git
   - Push to trigger Vercel deployment
   - Verify all pages load correctly

5. **Monitor & Optimize**
   - Track error logs
   - Monitor query performance
   - Optimize as needed


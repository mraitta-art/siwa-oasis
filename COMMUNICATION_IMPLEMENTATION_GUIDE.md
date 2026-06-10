# Vendor Communication Platform - Implementation Guide

## Status: 🚀 Coming Soon

A complete multi-channel communication system connecting vendors and visitors is ready for implementation.

---

## 📋 What's Already Built (Ready to Integrate)

### ✅ Database Schema (Migration 017)
**File:** `migrations/017_vendor_notification_system.sql`

- `vendor_notifications` table - Tracks all communications
- `vendor_portal_accounts` table - Vendor self-service access
- `feature_subscriptions` table - Feature launch notifications
- Views for vendor request analytics
- Full indexing & relationships

**Columns Include:**
- `contact_data_sharing_level` - Privacy control (5 levels)
- `email_status` tracking (queued, sent, bounced, opened, clicked)
- Visitor consent verification
- GDPR compliance flags

### ✅ Email Service Wrapper
**File:** `src/lib/email-service.ts`

Supports 4 providers:
- SendGrid (SENDGRID_API_KEY)
- Mailgun (MAILGUN_API_KEY + MAILGUN_DOMAIN)
- AWS SES (AWS_SES_REGION + AWS_ACCESS_KEY_ID)
- Mock (dev/testing)

**Usage:**
```typescript
import { emailService } from '@/lib/email-service';

await emailService.send({
  to: 'vendor@example.com',
  subject: '5 Visitors Asked For You!',
  html: '<h1>Opportunity</h1>',
  text: 'Plain text version'
});
```

### ✅ Auction Contact Visibility System
**File:** `AUCTION_CONTACT_VISIBILITY_CONTROL.md`

Already implemented:
- Admin controls whether to show/hide visitor contact
- Two-tier communication (internal → external)
- Visitor privacy respected at all levels

### ✅ Tier-Based Contact Access
**Database:** `tier_features` column in `business_subscriptions`

Current tiers control:
- EMAIL access
- PHONE access
- WHATSAPP access

Example:
```json
{
  "journey_contact_email": true,
  "journey_contact_phone": true,
  "journey_contact_whatsapp": true
}
```

### ✅ Components Using Communication
- `SmartJourneyPlanner` - Collects visitor WhatsApp/phone
- `VanityBusinessClient` - Displays WeChat, social links
- Vendor pages - Contact preference selection

---

## 🔧 What Needs to Be Built

### Phase 1: Email Integration (~2-3 days)

**Tasks:**

1. **Email Templates** (`src/lib/email-templates.ts`)
   ```
   - VendorForwardingNotification
   - NewRequestAlert
   - MilestoneReached (10, 25, 50 requests)
   - ClaimProfileReminder
   - OfferAcceptedNotification
   - OfferRejectedNotification
   ```

2. **Vendor Notification API** (`src/app/api/admin/vendor-notifications/route.ts`)
   ```
   POST /api/admin/vendor-notifications
   - Forward recommendation to vendor
   - Set contact_data_sharing_level
   - Queue for email sending
   
   GET /api/admin/vendor-notifications
   - List all sent notifications
   - Filter by status, date, vendor
   - Track open rates & clicks
   ```

3. **Notification Event Hooks** (`src/lib/notification-hooks.ts`)
   ```
   - On recommendation submitted → Email admin
   - On admin dispatch → Email vendor
   - On offer submitted → Email customer
   - On offer accepted → Email both parties
   ```

### Phase 2: Admin Management (2-3 days)

**Create:** `src/app/admin/vendor-communication/request-review/page.tsx`

Dashboard for admins to:
- View pending recommendations
- Select vendors to notify
- Choose contact data sharing level
- Send or schedule notifications
- View notification history

### Phase 3: Customer Tracking (2-3 days)

**Create:** `src/app/visitor/requests/page.tsx`

Customer dashboard for:
- View submitted requests & status
- Compare offers from vendors
- Accept/reject offers
- Message vendors

**Create:** `src/app/api/visitor/requests/[id]/offer/route.ts`
- Accept offer
- Reject offer
- Counteroffer

### Phase 4: WhatsApp Integration (3-4 days)

**Dependencies:** `npm install twilio`

**Create:** `src/lib/whatsapp-service.ts`

Twilio WhatsApp Business API:
- Send templated messages
- Interactive buttons
- Media (images, documents)
- 2-way messaging

**Create:** `src/app/api/vendor-notifications/whatsapp/route.ts`
- Send WhatsApp notification
- Handle incoming messages

### Phase 5: SMS & WeChat (3-4 days)

**SMS Service:** `src/lib/sms-service.ts`
- Twilio SMS API
- 160 character limit
- 99% 2-minute delivery

**WeChat Service:** `src/lib/wechat-service.ts`
- WeChat Official Account API
- Template messages
- Custom menus

---

## 🔑 Environment Variables Needed

### For Email (Pick One)

```bash
# SendGrid
SENDGRID_API_KEY=sg_xxxxx

# Mailgun
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mail.siwatoday.com

# AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# General
EMAIL_FROM=notifications@siwatoday.com
```

### For WhatsApp

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=+1234567890
```

### For SMS

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_SMS_FROM=+1234567890
```

### For WeChat

```bash
WECHAT_APPID=xxx
WECHAT_APPSECRET=xxx
WECHAT_ACCOUNT_ID=xxx
```

---

## 📊 Privacy & Compliance

### Contact Data Sharing Levels

```
LEVEL 0 - NONE
├─ Don't share any contact data
├─ "5 people asked for you"
└─ No visitor identification

LEVEL 1 - ANONYMOUS
├─ Share country only
├─ "Visitors from: USA, UK, Egypt"
└─ No names or contact

LEVEL 2 - NAMES_ONLY
├─ First name + last initial
├─ Country
└─ "John S., Sarah J. (USA)"

LEVEL 3 - EMAILS_ONLY
├─ Names + email addresses
└─ No phone numbers

LEVEL 4 - FULL_CONTACT
├─ Names, emails, phones
├─ Country
└─ Full visitor identification
```

### GDPR Compliance

✅ Consent tracking in database
✅ Opt-in/opt-out controls
✅ Data deletion on request
✅ Privacy audit trail
✅ Admin approval before sharing

---

## 🏗️ Architecture Diagram

```
┌─ VISITOR SUBMITS REQUEST
│  └─ SmartJourneyPlanner → /api/journeys POST
│     └─ Stored in journey_requests
│
├─ EMAIL TO ADMIN
│  └─ New request notification
│
├─ ADMIN REVIEWS
│  └─ /admin/vendor-communication/request-review
│     └─ Selects vendors & sharing level
│
├─ SEND TO VENDOR
│  └─ /api/admin/vendor-notifications POST
│     └─ Creates vendor_notifications record
│     └─ Queues for email sending
│     └─ emailService.send() dispatches
│
├─ VENDOR RECEIVES EMAIL
│  └─ HTML email with offer CTA
│     └─ Can click to submit offer
│
├─ VENDOR SUBMITS OFFER
│  └─ /api/journeys/[id]/offers POST
│     └─ Creates journey_offers record
│     └─ EMAIL TO CUSTOMER
│
├─ CUSTOMER SEES OFFER
│  └─ /visitor/requests dashboard
│     └─ Lists all received offers
│     └─ Compare prices & vendors
│
└─ CUSTOMER ACCEPTS
   └─ /api/visitor/requests/[id]/accept
      └─ Update offer status
      └─ EMAIL TO BOTH PARTIES
      └─ Payment processing (Phase 6)
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Email templates render correctly
- [ ] Privacy levels mask data correctly
- [ ] Vendor notification queuing works
- [ ] SMS/WhatsApp formatting valid

### Integration Tests
- [ ] Email sends via all providers
- [ ] Vendor receives notification
- [ ] Customer sees offer
- [ ] Accept/reject workflow completes

### E2E Tests
- [ ] Full journey: visitor → admin → vendor → customer
- [ ] Contact data sharing respected
- [ ] Audit trail recorded
- [ ] GDPR compliance verified

---

## 📖 Documentation Files

These exist and are ready to reference:

- `MULTI_CHANNEL_VENDOR_COMMUNICATION.md` - Channel specs
- `VENDOR_NOTIFICATION_SYSTEM.md` - Forwarding logic
- `VENDOR_CONTACT_DATA_SHARING_CONTROL.md` - Privacy design
- `AUCTION_CONTACT_VISIBILITY_CONTROL.md` - Auction flow
- `SIWA_OASIS_MARKETPLACE_ANALYSIS.md` - Tier capabilities

---

## 🚀 Quick Start When Ready

1. **Configure Email Provider**
   - Choose: SendGrid, Mailgun, or AWS SES
   - Add credentials to `.env.local`

2. **Run Migration 017**
   ```sql
   SOURCE migrations/017_vendor_notification_system.sql;
   ```

3. **Implement Phase 1** (Email)
   - Create email templates
   - Build vendor notification API
   - Add event hooks

4. **Test Locally**
   - Mock email provider shows output in console
   - Use production provider in staging

5. **Deploy**
   - Push to GitHub → Auto-deploys to Vercel
   - Secrets configured in Vercel dashboard

---

## ✅ What's Ready Right Now

- [x] Database schema
- [x] Email service wrapper
- [x] Privacy controls
- [x] Tier-based access
- [x] Auction visibility logic
- [x] Coming soon page
- [x] Notification subscription endpoint

## ⏳ When You're Ready

1. Pick an email provider (SendGrid recommended)
2. Get API credentials
3. Implement phases 1-5
4. Test with production data
5. Go live!

---

**Estimated Total Implementation Time:** 2-3 weeks for full integration
**Difficulty Level:** Medium (straightforward architecture)
**Dependencies:** Node.js email/SMS libraries (Twilio, SendGrid, etc.)

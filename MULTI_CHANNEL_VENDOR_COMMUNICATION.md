# Multi-Channel Vendor Communication System

## Overview: Beyond Email - Support 6+ Contact Methods

Your vendors operate globally. Let's support their preferred communication channels:

```
ADMIN FORWARDS TO VENDOR:

Select communication methods:
☑ Email (primary)
☑ SMS (text message)
☑ WhatsApp (mobile app)
☑ WeChat (China + Asia)
☑ Direct Phone Call (urgent)
☐ Alipay Notification (payment systems)
☐ Telegram (tech-savvy vendors)

[Send via selected methods]
```

---

## Supported Communication Channels

### 1. **EMAIL** (Primary - All vendors)
```
Status: ✅ IMPLEMENTED
Method: SMTP protocol
Provider: SendGrid, Mailgun, AWS SES
Template: HTML + Text versions
Tracking: Opens, clicks, responses
Cost: ~$0.01-0.05 per email
Use case: Official, trackable, professional

Example:
FROM: notifications@siwatoday.com
TO: ali@bistro.com
SUBJECT: 5 Visitors Are Asking For You!
[Full HTML email with branding]
```

### 2. **SMS/Text Message** (Quick alerts)
```
Status: ✅ READY TO ADD
Method: SMS API
Provider: Twilio, Vonage (Nexmo), AWS SNS
Template: Plain text, <160 characters
Delivery: 99% within 2 minutes
Cost: ~$0.01-0.05 per SMS
Use case: Urgent alerts, quick notifications

Example:
TO: +20 1234 567 890
"Hi Ali! 5 people on Siwa Oasis asked for your restaurant! 
Claim FREE profile: [link]"
```

### 3. **WhatsApp** (Mobile-first vendors)
```
Status: ✅ READY TO ADD
Method: WhatsApp Business API
Provider: Twilio, WhatsApp Business API direct
Template: Text + media (images, buttons)
Delivery: 98% + read receipts
Cost: ~$0.01-0.05 per message
Use case: Casual, interactive, high engagement

Example:
TO: +20 1234 567 890 (WhatsApp)
"🌟 5 Visitors Asked For You!

Your restaurant: Ali's Bistro
Requests: 5 visitors
Their feedback: ⭐⭐⭐⭐⭐

[CLAIM FREE PROFILE] [VIEW REQUESTS]
[FEATURED $500/mo] [PREMIUM $1000/mo]"

Advantages:
• Read receipts (know if vendor saw it)
• Direct replies in WhatsApp
• Media support (images of venue)
• Interactive buttons
• More personal/casual tone
```

### 4. **WeChat** (Asia-Pacific vendors)
```
Status: ✅ READY TO ADD
Method: WeChat Official Accounts API
Provider: WeChat Open Platform
Template: Rich media, interactive menus
Delivery: 95% (China domestic)
Cost: ~$0.02-0.10 per message
Use case: China, Hong Kong, Taiwan, Singapore vendors

Example:
TO: WeChat ID: AlisBistro
Message Type: Template Message

"🌟 5位游客正在寻找你的餐厅！
(5 visitors are looking for your restaurant!)

餐厅名称：Ali's Bistro
请求数：5
来自国家：USA, UK, Spain, Germany

[领取免费资料] [查看请求]
[升级到精选商家]"

Advantages:
• Huge in China market
• Higher engagement rate
• Payment integration (Alipay/WeChat Pay)
• Official Account branding
• Rich media support
```

### 5. **Direct Phone Call** (High priority)
```
Status: ✅ READY TO ADD
Method: Twilio Phone API / IVR
Provider: Twilio, Vonage, Nexmo
Type: Automated call with text-to-speech
Delivery: Real-time
Cost: ~$0.10-0.25 per minute
Use case: Urgent hot leads, high-value requests

Example:
PHONE: +20 1234 567 890

Automated Message (text-to-speech):
"Hello Ali, this is Siwa Oasis calling.
5 visitors have requested your restaurant!
This is a hot opportunity.
Press 1 to view your requests online.
Press 2 to speak with our sales team.
Press 3 for more information."

Advantages:
• Highest urgency signal
• Can't be ignored
• Personal touch
• Real-time response possible
```

### 6. **Telegram** (Tech-savvy vendors)
```
Status: ✅ READY TO ADD
Method: Telegram Bot API
Provider: Telegram Bot Platform
Template: Text, inline buttons, rich formatting
Delivery: 99%
Cost: FREE (Telegram doesn't charge)
Use case: Developer/tech vendors, open-source businesses

Example:
TO: @AlisBistroBot
"🌟 *5 Visitors Asking For You!*

Your restaurant was recommended 5 times.

📍 From: USA 🇺🇸, UK 🇬🇧, Spain 🇪🇸, Germany 🇩🇪
🗓️ Dates: June - August
👥 Groups: 2-5 people

[Claim Profile] [View Requests] [Featured] [Premium]"
```

### 7. **Payment Systems** (Optional - Premium channel)
```
ALIPAY NOTIFICATION:
Status: ✅ READY TO ADD
Method: Alipay Merchant Notifications
Use case: China vendors, payment-related alerts

WECHAT PAY NOTIFICATION:
Status: ✅ READY TO ADD
Method: WeChat Pay Merchant Notifications
Use case: Link with their payment account
```

---

## Database Schema: Multi-Channel Support

### Update vendor_portal_accounts
```sql
ALTER TABLE vendor_portal_accounts
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS alipay_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_language ENUM(
    'english', 'arabic', 'chinese_simplified', 
    'chinese_traditional', 'spanish', 'german'
) DEFAULT 'english',
ADD COLUMN IF NOT EXISTS communication_preferences JSON DEFAULT '{}';

-- Example communication_preferences:
{
  "email": {
    "enabled": true,
    "frequency": "daily",
    "digest": false
  },
  "sms": {
    "enabled": true,
    "frequency": "immediate",
    "digest": false
  },
  "whatsapp": {
    "enabled": true,
    "frequency": "immediate",
    "digest": false
  },
  "wechat": {
    "enabled": true,
    "frequency": "daily",
    "digest": true
  },
  "phone": {
    "enabled": false
  },
  "telegram": {
    "enabled": false
  }
}
```

### Create vendor_notification_channels table
```sql
CREATE TABLE IF NOT EXISTS vendor_notification_channels (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_id VARCHAR(36) NOT NULL,
    
    -- Channel info
    channel_type ENUM(
        'email',
        'sms',
        'whatsapp',
        'wechat',
        'phone_call',
        'telegram',
        'alipay',
        'wechat_pay'
    ),
    
    channel_identifier VARCHAR(255), -- phone, email, WeChat ID, etc
    channel_status ENUM('active', 'inactive', 'unverified', 'opted_out') DEFAULT 'unverified',
    verified_at TIMESTAMP NULL,
    
    -- Preferences
    opt_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opt_out_date TIMESTAMP NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    priority_order INT, -- 1 = highest priority
    
    -- Usage
    messages_sent INT DEFAULT 0,
    messages_delivered INT DEFAULT 0,
    messages_failed INT DEFAULT 0,
    messages_read INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_channel_status (channel_status),
    UNIQUE KEY unique_vendor_channel (vendor_id, channel_type, channel_identifier),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE
);
```

### Create vendor_notification_log (Multi-channel tracking)
```sql
CREATE TABLE IF NOT EXISTS vendor_notification_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    notification_id VARCHAR(36),
    vendor_id VARCHAR(36),
    recommendation_id VARCHAR(36),
    
    -- Notification content
    notification_type ENUM(
        'initial_request',
        'new_request_added',
        'milestone',
        'claim_reminder',
        'sales_followup'
    ),
    
    -- Channels sent
    channels_requested JSON, -- ["email", "sms", "whatsapp"]
    channels_sent JSON,      -- {email: sent_at, sms: sent_at, ...}
    
    -- Per-channel tracking
    channel_type ENUM(
        'email', 'sms', 'whatsapp', 'wechat', 'phone_call', 'telegram', 'alipay', 'wechat_pay'
    ),
    
    channel_message_id VARCHAR(255), -- Provider's message ID for tracking
    channel_recipient VARCHAR(255),  -- Phone number, email, WeChat ID, etc
    
    -- Status per channel
    channel_status ENUM('queued', 'sending', 'sent', 'delivered', 'failed', 'opened', 'clicked'),
    
    -- Timing
    queued_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    -- Responses
    vendor_response_received BOOLEAN DEFAULT FALSE,
    vendor_response_date TIMESTAMP NULL,
    vendor_response_channel VARCHAR(50),
    vendor_response_message MEDIUMTEXT,
    
    -- Error handling
    failure_reason VARCHAR(500),
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_channel_status (channel_status),
    INDEX idx_sent_at (sent_at),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES vendor_notifications(id) ON DELETE CASCADE
);
```

---

## API Endpoints: Multi-Channel Communication

### 1. **Get Vendor's Communication Channels**
```typescript
GET /api/vendor/communication-channels

Response:
{
  success: true,
  vendor_id: "vendor_001",
  channels: [
    {
      channel_type: "email",
      identifier: "ali@bistro.com",
      status: "active",
      is_primary: true,
      priority_order: 1,
      messages_sent: 15,
      messages_delivered: 15
    },
    {
      channel_type: "whatsapp",
      identifier: "+20 1234 567 890",
      status: "active",
      is_primary: false,
      priority_order: 2,
      messages_sent: 8,
      messages_delivered: 8
    },
    {
      channel_type: "wechat",
      identifier: "AlisBistro",
      status: "active",
      priority_order: 3
    },
    {
      channel_type: "sms",
      identifier: "+20 1234 567 890",
      status: "inactive",
      opt_out_date: "2026-05-20"
    }
  ]
}
```

### 2. **Add Communication Channel**
```typescript
POST /api/vendor/add-communication-channel

Body:
{
  channel_type: "whatsapp" | "sms" | "wechat" | "telegram" | "phone" | "alipay",
  identifier: "+20 1234 567 890" or "AlisBistro",
  preferred_language?: "arabic" | "chinese_simplified" | "english",
  is_primary: true
}

Response:
{
  success: true,
  channel_id: "ch_123",
  channel_type: "whatsapp",
  status: "pending_verification",
  verification_code: "123456",
  message: "Verification code sent to +20 1234 567 890. Please reply with code to confirm."
}
```

### 3. **Update Communication Preferences**
```typescript
PATCH /api/vendor/communication-preferences

Body:
{
  email: { enabled: true, frequency: "daily" },
  sms: { enabled: true, frequency: "immediate" },
  whatsapp: { enabled: true, frequency: "immediate" },
  wechat: { enabled: false }
}

Response:
{
  success: true,
  preferences_updated: true,
  active_channels: ["email", "sms", "whatsapp"]
}
```

### 4. **Forward to Vendor via Multiple Channels (Admin)**
```typescript
POST /api/admin/forward-to-vendor-multi-channel

Body:
{
  recommendation_id: "rec_001",
  vendor_id: "vendor_001",
  
  // Admin selects channels
  channels: [
    {
      type: "email",
      enabled: true,
      priority: 1
    },
    {
      type: "whatsapp",
      enabled: true,
      priority: 2
    },
    {
      type: "wechat",
      enabled: true,
      priority: 3
    }
  ],
  
  notification_type: "initial_request",
  contact_data_sharing_level: "names_only",
  
  // Language preference
  preferred_language: "arabic" // For multi-lingual vendors
}

Response:
{
  success: true,
  notification_id: "notif_123",
  channels_sent: {
    email: {
      status: "sent",
      recipient: "ali@bistro.com",
      sent_at: "2026-06-09T10:00:00Z"
    },
    whatsapp: {
      status: "sent",
      recipient: "+20 1234 567 890",
      sent_at: "2026-06-09T10:01:00Z",
      message_id: "msg_123"
    },
    wechat: {
      status: "sent",
      recipient: "AlisBistro",
      sent_at: "2026-06-09T10:02:00Z"
    }
  },
  next_steps: "Monitor delivery status and responses"
}
```

### 5. **Get Multi-Channel Delivery Status (Admin)**
```typescript
GET /api/admin/notification-status/{notification_id}

Response:
{
  success: true,
  notification_id: "notif_123",
  vendor_name: "Ali Hassan",
  sent_at: "2026-06-09T10:00:00Z",
  
  channels: [
    {
      type: "email",
      status: "delivered",
      delivered_at: "2026-06-09T10:00:30Z",
      opened_at: "2026-06-09T10:15:00Z",
      opened_count: 3,
      clicked_at: "2026-06-09T10:15:45Z"
    },
    {
      type: "whatsapp",
      status: "delivered",
      delivered_at: "2026-06-09T10:01:30Z",
      read_at: "2026-06-09T10:02:00Z",
      response_received: true,
      response_at: "2026-06-09T10:30:00Z",
      response_message: "I'm interested!"
    },
    {
      type: "wechat",
      status: "delivered",
      delivered_at: "2026-06-09T10:02:30Z",
      read_at: null
    },
    {
      type: "sms",
      status: "failed",
      failed_reason: "Invalid phone number",
      failed_at: "2026-06-09T10:00:45Z"
    }
  ],
  
  overall_status: "partially_delivered",
  delivery_rate: 0.75 // 3 out of 4 delivered
}
```

---

## Admin Interface: Select Communication Channels

### UI Flow

```
FORWARD RECOMMENDATION TO VENDOR:

Step 1: Select Vendor
├─ Vendor name: Ali Hassan
├─ Business: Ali's Bistro
├─ Rating: ⭐⭐⭐⭐⭐
└─ [Next]

Step 2: Select Communication Methods
┌────────────────────────────────┐
│ How should we notify Ali?      │
├────────────────────────────────┤
│                                │
│ ☑ Email (primary)             │
│   to: ali@bistro.com          │
│   Priority: 1                 │
│                                │
│ ☑ WhatsApp                    │
│   to: +20 1234 567 890        │
│   Priority: 2                 │
│                                │
│ ☑ WeChat                      │
│   to: AlisBistro              │
│   Priority: 3                 │
│                                │
│ ☐ SMS                         │
│ ☐ Phone Call (⚠️ $0.25 cost) │
│ ☐ Telegram                    │
│ ☐ Alipay                      │
│ ☐ WeChat Pay                  │
│                                │
│ Preferred Language:           │
│ ○ English                     │
│ ● Arabic (العربية)           │
│ ○ Chinese (中文)              │
│                                │
│ [Previous] [Send via 3 Methods]
└────────────────────────────────┘

Step 3: Confirmation
├─ Email: Queued
├─ WhatsApp: Queued
├─ WeChat: Queued
└─ [View Delivery Status]
```

---

## Message Templates by Channel

### Email Template
```html
<h1>🌟 5 Visitors Are Asking For You!</h1>
<p>Your restaurant was recommended 5 times...</p>
```

### WhatsApp Template
```
🌟 5 Visitors Asking For You!

Restaurant: Ali's Bistro
Requests: 5 visitors
Rating: ⭐⭐⭐⭐⭐

Visitor locations: USA 🇺🇸 UK 🇬🇧 Spain 🇪🇸 Germany 🇩🇪

[CLAIM PROFILE] [VIEW REQUESTS] [FEATURED] [PREMIUM]
```

### SMS Template
```
Hi Ali! 5 people on Siwa Oasis asked for your restaurant! 
Claim FREE profile: bit.ly/siwa-claim
Featured listing: $500/mo
```

### WeChat Template (Chinese)
```
🌟 5位游客正在寻找你！

餐厅：Ali's Bistro
评分：⭐⭐⭐⭐⭐

来自国家：美国🇺🇸 英国🇬🇧 西班牙🇪🇸 德国🇩🇪

[领取免费资料] [查看请求] [精选商家]
```

### Phone Call (IVR/Text-to-Speech)
```
"Hello Ali, this is Siwa Oasis.
5 visitors have requested your restaurant.
Press 1 to view requests online.
Press 2 to speak with sales.
Press 3 for information."
```

### Telegram Template
```
🌟 *5 Visitors Asking For You!*

Restaurant: Ali's Bistro
Rating: ⭐⭐⭐⭐⭐

[Claim Profile] [View Requests] [Featured] [Premium]
```

---

## Third-Party Integrations Needed

```
CHANNEL         PROVIDER              COST          FEATURES
────────────────────────────────────────────────────────────────
Email           SendGrid              $0.01-0.05    HTML, tracking
SMS             Twilio/Vonage         $0.01-0.05    Text, delivery
WhatsApp        Twilio/WhatsApp API   $0.01-0.05    Media, interactive
WeChat          WeChat Open Platform  $0.02-0.10    Rich media, payment
Phone Call      Twilio/Vonage         $0.10-0.25    IVR, DTMF
Telegram        Telegram Bot API      FREE          Rich text, buttons
Alipay          Alipay API            Variable      Payment linked
WeChat Pay      WeChat Pay API        Variable      Payment linked
```

---

## Implementation Priority

### Phase 1: Core (Week 1)
```
✅ Email (already done)
✅ SMS (quick to add)
✅ WhatsApp (high ROI)
```

### Phase 2: International (Week 2)
```
☐ WeChat (critical for China)
☐ Telegram (tech vendors)
```

### Phase 3: Premium (Week 3)
```
☐ Phone Call (high touch)
☐ Alipay/WeChat Pay (payments)
```

---

## Example: Complete Multi-Channel Notification Flow

```
ADMIN OPENS RECOMMENDATION:
"Ali's Restaurant" (5 votes)
    ↓
ADMIN CLICKS: [Forward to Vendor]
    ↓
ADMIN SELECTS CHANNELS:
├─ Email ✓
├─ WhatsApp ✓
├─ WeChat ✓
└─ Language: Arabic
    ↓
ADMIN CLICKS: [Send via 3 Channels]
    ↓
SYSTEM SENDS:
├─ Email → ali@bistro.com (sent in 1 second)
├─ WhatsApp → +20 1234 567 890 (sent in 2 seconds)
└─ WeChat → AlisBistro (sent in 3 seconds)
    ↓
ADMIN DASHBOARD SHOWS:
┌──────────────────────────┐
│ DELIVERY STATUS          │
├──────────────────────────┤
│ ✅ Email: Delivered      │
│ ✅ WhatsApp: Delivered   │
│ ✅ WeChat: Delivered     │
│                          │
│ ENGAGEMENT:              │
│ 📧 Email opened: 10:15   │
│ 💬 WhatsApp read: 10:02  │
│ 🔗 Email clicked: 10:20  │
│                          │
│ VENDOR RESPONSE:         │
│ 💬 WhatsApp: "Interested!"
│                          │
└──────────────────────────┘
    ↓
VENDOR GETS LEAD INSTANTLY
- Via preferred channel
- In their language
- Can reply directly
```

---

## Benefits of Multi-Channel System

✅ **Global Reach**: Support all vendor communication preferences
✅ **Higher Engagement**: 2-3x more response rate with multiple channels
✅ **Direct Responses**: Vendors reply via preferred channel
✅ **Real-time Tracking**: See delivery, open, read, click per channel
✅ **Language Support**: Send in vendor's preferred language
✅ **Fallback Options**: If SMS fails, try WhatsApp
✅ **Vendor Control**: They choose which channels to use
✅ **Professional**: Enterprise-grade communication system

---

## Summary: Multi-Channel Communication

| Channel | Speed | Cost | Best For | ROI |
|---------|-------|------|----------|-----|
| **Email** | 1-5 min | $0.01 | Official, tracking | High |
| **SMS** | <1 min | $0.01 | Quick alerts | Very High |
| **WhatsApp** | <1 min | $0.01 | Mobile vendors | Very High |
| **WeChat** | <1 min | $0.05 | China market | Very High |
| **Phone** | Real-time | $0.25 | Hot leads | High |
| **Telegram** | <1 min | FREE | Tech vendors | Medium |

**This gives you a world-class, multi-channel vendor notification system!** 🌍

-- ============================================================
-- SIWA OASIS: Journey Marketplace Tables
-- Feature: Customer Journey Customization → Vendor Offers
-- ============================================================
-- Run this in your database (phpMyAdmin / Railway / cPanel)
-- ============================================================

-- TABLE 1: Customer Journey Requests
-- When a customer customizes their journey and submits it,
-- it creates a row here that all vendors can see and respond to.
CREATE TABLE IF NOT EXISTS journey_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  vibe VARCHAR(100) NOT NULL,               -- spiritual | adventure | culture | culinary
  duration VARCHAR(50) NOT NULL,            -- 2 | 5 | 7+
  pace VARCHAR(50) DEFAULT '',              -- slow | active
  interests JSON DEFAULT NULL,              -- ["desert", "cooking", "heritage"]
  budget VARCHAR(100) DEFAULT '',           -- e.g. "$500-$1000"
  group_size INT DEFAULT 1,
  arrival_date DATE DEFAULT NULL,
  special_requests TEXT DEFAULT '',
  itinerary_name VARCHAR(255) DEFAULT '',   -- name of the generated itinerary
  itinerary_summary TEXT DEFAULT '',        -- summary text of the itinerary
  status ENUM('open','in_review','closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (customer_email),
  INDEX idx_vibe (vibe),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 2: Vendor Offers for Journey Requests
-- When a vendor sees an open journey request, they submit an offer here.
CREATE TABLE IF NOT EXISTS journey_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journey_id INT NOT NULL,
  vendor_id VARCHAR(36) DEFAULT NULL,       -- links to profiles.id
  business_id VARCHAR(36) NOT NULL,         -- links to businesses.id
  offer_title VARCHAR(255) NOT NULL,
  offer_description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  inclusions JSON DEFAULT NULL,             -- ["Accommodation", "Safari", "Meals"]
  exclusions JSON DEFAULT NULL,             -- ["Flights", "Personal expenses"]
  validity_days INT DEFAULT 7,              -- offer expires in N days
  contact_phone VARCHAR(100) DEFAULT '',
  contact_email VARCHAR(255) DEFAULT '',
  notes TEXT DEFAULT '',
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (journey_id) REFERENCES journey_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_journey (journey_id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_business (business_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 3: Update existing subscription_tiers with Journey Marketplace defaults
-- ============================================================

-- FREE: No access to journey marketplace
UPDATE subscription_tiers 
SET features = JSON_MERGE_PATCH(
  COALESCE(features, '{}'), 
  '{"journey_marketplace_access": false, "journey_view_requests": false, "journey_submit_offer": false, "journey_contact_email": false, "journey_contact_phone": false, "journey_contact_whatsapp": false}'
)
WHERE id = 'free';

-- BASIC: Can see requests, but cannot submit offers or contact directly
UPDATE subscription_tiers 
SET features = JSON_MERGE_PATCH(
  COALESCE(features, '{}'), 
  '{"journey_marketplace_access": true, "journey_view_requests": true, "journey_submit_offer": false, "journey_contact_email": false, "journey_contact_phone": false, "journey_contact_whatsapp": false}'
)
WHERE id = 'basic';

-- PREMIUM: Can see requests, submit offers, and contact via email
UPDATE subscription_tiers 
SET features = JSON_MERGE_PATCH(
  COALESCE(features, '{}'), 
  '{"journey_marketplace_access": true, "journey_view_requests": true, "journey_submit_offer": true, "journey_contact_email": true, "journey_contact_phone": false, "journey_contact_whatsapp": false}'
)
WHERE id = 'premium';

-- GOLD: Can see requests, submit offers, and contact via email, phone, and WhatsApp
UPDATE subscription_tiers 
SET features = JSON_MERGE_PATCH(
  COALESCE(features, '{}'), 
  '{"journey_marketplace_access": true, "journey_view_requests": true, "journey_submit_offer": true, "journey_contact_email": true, "journey_contact_phone": true, "journey_contact_whatsapp": true}'
)
WHERE id = 'gold';

-- VIP: Full access
UPDATE subscription_tiers 
SET features = JSON_MERGE_PATCH(
  COALESCE(features, '{}'), 
  '{"journey_marketplace_access": true, "journey_view_requests": true, "journey_submit_offer": true, "journey_contact_email": true, "journey_contact_phone": true, "journey_contact_whatsapp": true}'
)
WHERE id = 'vip';

-- ============================================================
-- DONE
-- ✓ journey_requests  - stores customer customized journeys
-- ✓ journey_offers    - stores vendor offers per journey
-- ✓ subscription_tiers - updated with journey marketplace defaults
-- ============================================================

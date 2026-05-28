-- ============================================================
-- SIWA OASIS: SYSTEM EVOLUTION DATABASE SCHEMAS
-- Incremental, migration-safe extensions
-- ============================================================

-- 1. LOCAL PRODUCTS (Marketplace Integration)
CREATE TABLE IF NOT EXISTS local_products (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  story TEXT, -- The cultural or ecological narrative
  price_amount DECIMAL(10,2) DEFAULT 0.00,
  price_currency VARCHAR(10) DEFAULT 'EGP',
  stock_status ENUM('in_stock', 'out_of_stock', 'made_to_order') DEFAULT 'in_stock',
  images JSON, -- Array of image URLs
  attributes JSON, -- Dynamic details (organic, variety, weight)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. LOCAL EXPERIENCES (Wellness, Eco-tourism, Safaris)
CREATE TABLE IF NOT EXISTS local_experiences (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  duration VARCHAR(100), -- e.g. "4 Hours", "2 Days"
  price_range VARCHAR(20) DEFAULT '$$', -- $, $$, $$$, $$$$
  vibe_tags JSON, -- Array of vibe classifications e.g. ["spiritual", "rustic"]
  wellness_benefits JSON, -- e.g. ["salt_inhalation", "skin_rejuvenation"]
  itinerary JSON, -- Timeline/stops
  images JSON,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. JOURNEY ITINERARIES (Smart Planner Outputs)
CREATE TABLE IF NOT EXISTS journey_itineraries (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vibe VARCHAR(100) NOT NULL,
  duration_days INT DEFAULT 1,
  nodes JSON NOT NULL, -- Chronological list of businesses / experiences
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

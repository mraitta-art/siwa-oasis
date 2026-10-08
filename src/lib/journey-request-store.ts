import { execute } from '@/lib/db';

let journeyTablesReady: Promise<void> | null = null;

export function ensureJourneyTables(): Promise<void> {
  if (!journeyTablesReady) journeyTablesReady = initializeJourneyTables();
  return journeyTablesReady;
}

async function initializeJourneyTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS journey_requests (
      id VARCHAR(100) PRIMARY KEY,
      request_code VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255) DEFAULT '',
      duration_days INT DEFAULT 3,
      travel_dates VARCHAR(100) DEFAULT '',
      adults_count INT DEFAULT 2,
      children_count INT DEFAULT 0,
      selected_experiences JSON DEFAULT NULL,
      accommodation_preference VARCHAR(255) DEFAULT 'ecolodge',
      transport_preference VARCHAR(255) DEFAULT '4x4_land_cruiser',
      meal_preference VARCHAR(255) DEFAULT 'traditional_siwan',
      guide_language VARCHAR(50) DEFAULT 'english',
      interface_language VARCHAR(10) DEFAULT 'en',
      catalog_revision INT DEFAULT NULL,
      special_notes TEXT,
      estimated_price DECIMAL(10,2) DEFAULT 0.00,
      discount_amount DECIMAL(10,2) DEFAULT 0.00,
      final_price DECIMAL(10,2) DEFAULT 0.00,
      selected_business_ids JSON DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'open',
      distribution_status VARCHAR(50) DEFAULT 'admin_review',
      target_business_type_id VARCHAR(100) DEFAULT NULL,
      target_vendor_id VARCHAR(100) DEFAULT NULL,
      reveal_contact BOOLEAN DEFAULT 1,
      request_type VARCHAR(50) DEFAULT 'journey',
      budget VARCHAR(100) DEFAULT NULL,
      duration VARCHAR(100) DEFAULT NULL,
      group_size INT DEFAULT 2,
      arrival_date VARCHAR(100) DEFAULT NULL,
      special_requests TEXT DEFAULT NULL,
      itinerary_name VARCHAR(255) DEFAULT NULL,
      itinerary_summary TEXT DEFAULT NULL,
      custom_details JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_code (request_code),
      INDEX idx_phone (customer_phone),
      INDEX idx_status (status),
      INDEX idx_dist (distribution_status)
    )
  `);

  const compatibilityColumns = [
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS request_code VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) DEFAULT ''`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS adults_count INT DEFAULT 2`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS children_count INT DEFAULT 0`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS selected_experiences JSON DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS accommodation_preference VARCHAR(255) DEFAULT 'ecolodge'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS transport_preference VARCHAR(255) DEFAULT '4x4_land_cruiser'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS meal_preference VARCHAR(255) DEFAULT 'traditional_siwan'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS guide_language VARCHAR(50) DEFAULT 'english'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2) DEFAULT 0.00`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT 0.00`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS selected_business_ids JSON DEFAULT NULL`,
    `ALTER TABLE journey_requests MODIFY COLUMN status VARCHAR(50) DEFAULT 'open'`,
    `ALTER TABLE journey_requests MODIFY COLUMN visitor_email VARCHAR(255) NULL`,
    `ALTER TABLE journey_requests MODIFY COLUMN title VARCHAR(255) NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS distribution_status VARCHAR(50) DEFAULT 'admin_review'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS target_business_type_id VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS target_vendor_id VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS reveal_contact BOOLEAN DEFAULT 1`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'journey'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS budget VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS duration VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS group_size INT DEFAULT 2`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS arrival_date VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS special_requests TEXT DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS itinerary_name VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS itinerary_summary TEXT DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS custom_details JSON DEFAULT NULL`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS interface_language VARCHAR(10) DEFAULT 'en'`,
    `ALTER TABLE journey_requests ADD COLUMN IF NOT EXISTS catalog_revision INT DEFAULT NULL`,
    `ALTER TABLE journey_requests MODIFY COLUMN accommodation_preference VARCHAR(255) DEFAULT 'ecolodge'`,
    `ALTER TABLE journey_requests MODIFY COLUMN transport_preference VARCHAR(255) DEFAULT '4x4_land_cruiser'`,
    `ALTER TABLE journey_requests MODIFY COLUMN meal_preference VARCHAR(255) DEFAULT 'traditional_siwan'`,
  ];
  for (const sql of compatibilityColumns) {
    try { await execute(sql); } catch {}
  }

  await execute(`
    CREATE TABLE IF NOT EXISTS journey_vendor_dispatches (
      id VARCHAR(100) PRIMARY KEY,
      request_id VARCHAR(100) NOT NULL,
      business_id VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'experience_provider',
      vendor_status VARCHAR(50) DEFAULT 'pending',
      quoted_price DECIMAL(10,2) DEFAULT NULL,
      vendor_notes TEXT,
      whatsapp_notified BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_req (request_id),
      INDEX idx_biz (business_id),
      INDEX idx_vstatus (vendor_status)
    )
  `);
}

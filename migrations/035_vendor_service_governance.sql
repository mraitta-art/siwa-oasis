-- Admin governance and dynamic category registry for canonical vendor services.
CREATE TABLE IF NOT EXISTS vendor_service_categories (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_service_categories_active (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO vendor_service_categories (id, label, description, sort_order) VALUES
  ('accommodation', 'Accommodation', 'Rooms, lodges, camps, and stays.', 10),
  ('transportation', 'Transportation', 'Transfers, vehicles, drivers, and rentals.', 20),
  ('restaurant', 'Food & Dining', 'Restaurants, meals, catering, and dining experiences.', 30),
  ('activity', 'Activities', 'Wellness, culture, adventure, and local activities.', 40),
  ('tour', 'Tours', 'Guided, private, group, and self-guided tours.', 50),
  ('package', 'Packages', 'Combined journeys and service bundles.', 60),
  ('facility', 'Facilities', 'Amenities and facilities offered to customers.', 70),
  ('other', 'Other', 'Any additional vendor service.', 100)
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), sort_order = VALUES(sort_order);

CREATE TABLE IF NOT EXISTS vendor_service_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  service_id VARCHAR(36) NOT NULL,
  admin_id VARCHAR(36) NULL,
  action VARCHAR(60) NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vendor_service_audit_service (service_id, created_at),
  INDEX idx_vendor_service_audit_admin (admin_id, created_at),
  CONSTRAINT fk_vendor_service_audit_service FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
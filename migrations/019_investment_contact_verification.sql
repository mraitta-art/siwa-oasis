-- Manual responsibility verification for investment opportunity submissions.
CREATE TABLE IF NOT EXISTS investment_contact_verifications (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  slot_number TINYINT NOT NULL,
  phone VARCHAR(32) NOT NULL,
  contact_name VARCHAR(255) DEFAULT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  called_at DATETIME DEFAULT NULL,
  verified_by VARCHAR(36) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_investment_contact_slot (business_id, slot_number),
  INDEX idx_investment_contact_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

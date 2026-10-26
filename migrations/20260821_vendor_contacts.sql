-- Multiple CRM contacts per vendor
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(100) DEFAULT NULL,
  job_title VARCHAR(150) DEFAULT NULL,
  contact_role VARCHAR(100) DEFAULT 'general',
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_contacts_vendor (vendor_id),
  INDEX idx_vendor_contacts_email (email),
  CONSTRAINT fk_vendor_contacts_vendor FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Only one primary contact is enforced by application logic so this works on MySQL 5.7+.

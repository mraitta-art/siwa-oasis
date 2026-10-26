CREATE TABLE IF NOT EXISTS vendor_service_controls (
  business_id VARCHAR(36) NOT NULL PRIMARY KEY,
  qr_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  allow_section_label_edit BOOLEAN NOT NULL DEFAULT FALSE,
  minisite_status ENUM('active', 'suspended', 'expired') NOT NULL DEFAULT 'active',
  services_expires_at DATETIME NULL,
  admin_note VARCHAR(500) NULL,
  updated_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_service_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_vendor_service_status (minisite_status),
  INDEX idx_vendor_service_expiry (services_expires_at)
);

INSERT INTO vendor_service_controls (business_id)
SELECT id FROM businesses
WHERE NOT EXISTS (
  SELECT 1 FROM vendor_service_controls vsc WHERE vsc.business_id = businesses.id
);

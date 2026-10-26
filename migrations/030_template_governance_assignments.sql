CREATE TABLE IF NOT EXISTS minisite_template_tier_access (
  template_id VARCHAR(100) NOT NULL,
  tier_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id, tier_id),
  CONSTRAINT fk_template_access_template FOREIGN KEY (template_id) REFERENCES minisite_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_template_access_tier FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_template_assignments (
  business_id VARCHAR(36) NOT NULL PRIMARY KEY,
  template_id VARCHAR(100) NOT NULL,
  assignment_source ENUM('admin', 'tier_default', 'business_type_default') NOT NULL DEFAULT 'admin',
  assigned_by VARCHAR(36) NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_assignment_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_assignment_template FOREIGN KEY (template_id) REFERENCES minisite_templates(id) ON DELETE RESTRICT
);

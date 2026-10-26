CREATE TABLE IF NOT EXISTS vendor_template_trials (
  business_id VARCHAR(36) NOT NULL PRIMARY KEY,
  trial_template_id VARCHAR(100) NULL,
  trial_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME NOT NULL,
  selected_template_id VARCHAR(100) NULL,
  CONSTRAINT fk_vendor_trial_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendor_trial_template FOREIGN KEY (trial_template_id) REFERENCES minisite_templates(id) ON DELETE SET NULL,
  CONSTRAINT fk_vendor_selected_template FOREIGN KEY (selected_template_id) REFERENCES minisite_templates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS minisite_vendor_handoffs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  business_id VARCHAR(100) NOT NULL,
  revision INT NOT NULL,
  status ENUM('draft', 'sent', 'delivered', 'read', 'failed', 'followup_due', 'replied', 'accepted', 'changes_requested', 'published', 'expired') NOT NULL DEFAULT 'draft',
  layout JSON NOT NULL,
  vendor_phone VARCHAR(32) NULL,
  token_hash CHAR(64) NULL,
  token_expires_at DATETIME NULL,
  whatsapp_message_id VARCHAR(255) NULL,
  whatsapp_error TEXT NULL,
  agreement_version VARCHAR(80) NULL,
  agreement_language VARCHAR(8) NULL,
  agreement_hash CHAR(64) NULL,
  accepted_name VARCHAR(255) NULL,
  accepted_at DATETIME NULL,
  accepted_ip VARCHAR(64) NULL,
  acceptance_user_agent VARCHAR(500) NULL,
  acceptance_authority BOOLEAN NULL,
  changes_requested_note TEXT NULL,
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_minisite_handoff_revision (business_id, revision),
  UNIQUE KEY uq_minisite_handoff_message (whatsapp_message_id),
  INDEX idx_minisite_handoff_status (status, updated_at),
  INDEX idx_minisite_handoff_business (business_id, created_at),
  INDEX idx_minisite_handoff_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS minisite_vendor_handoff_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  handoff_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSON NULL,
  actor_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_minisite_handoff_event (handoff_id, created_at),
  CONSTRAINT fk_minisite_handoff_event
    FOREIGN KEY (handoff_id) REFERENCES minisite_vendor_handoffs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

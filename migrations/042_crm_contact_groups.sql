CREATE TABLE IF NOT EXISTS crm_contacts (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  phone_international BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(255) NULL,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  opted_in_at DATETIME NULL,
  opted_out_at DATETIME NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'admin_import',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_contacts_phone (phone),
  INDEX idx_crm_contacts_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_groups (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_group_members (
  group_id VARCHAR(36) NOT NULL,
  member_type ENUM('contact', 'business') NOT NULL,
  member_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, member_type, member_id),
  INDEX idx_crm_group_members_member (member_type, member_id),
  CONSTRAINT fk_crm_group_members_group
    FOREIGN KEY (group_id) REFERENCES crm_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_whatsapp_campaigns (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  language_code VARCHAR(16) NOT NULL,
  message_text TEXT NOT NULL,
  status ENUM('queued', 'sending', 'sent', 'partial', 'failed') NOT NULL DEFAULT 'queued',
  created_by VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crm_campaign_group (group_id, created_at),
  CONSTRAINT fk_crm_campaign_group
    FOREIGN KEY (group_id) REFERENCES crm_groups(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_whatsapp_campaign_recipients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  campaign_id VARCHAR(36) NOT NULL,
  contact_id VARCHAR(36) NOT NULL,
  recipient_phone VARCHAR(32) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  whatsapp_message_id VARCHAR(255) NULL,
  status ENUM('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
  claim_token VARCHAR(36) NULL,
  provider_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_crm_campaign_contact (campaign_id, contact_id),
  UNIQUE KEY uq_crm_campaign_message (whatsapp_message_id),
  INDEX idx_crm_campaign_recipient_status (campaign_id, status),
  CONSTRAINT fk_crm_campaign_recipient_campaign
    FOREIGN KEY (campaign_id) REFERENCES crm_whatsapp_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_crm_campaign_recipient_contact
    FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS crm_announcements (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL,
  kind ENUM('ribbon', 'news') NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NULL,
  body_ar TEXT NOT NULL,
  body_en TEXT NULL,
  cta_text_ar VARCHAR(120) NULL,
  cta_text_en VARCHAR(120) NULL,
  cta_url VARCHAR(1000) NULL,
  status ENUM('published', 'archived') NOT NULL DEFAULT 'published',
  created_by VARCHAR(100) NULL,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  INDEX idx_crm_announcement_group_status (group_id, status, published_at),
  INDEX idx_crm_announcement_expiry (expires_at),
  CONSTRAINT fk_crm_announcement_group
    FOREIGN KEY (group_id) REFERENCES crm_groups(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

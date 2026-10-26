CREATE TABLE IF NOT EXISTS minisite_manifests (
  business_id VARCHAR(100) NOT NULL PRIMARY KEY,
  draft_revision INT NOT NULL DEFAULT 1,
  published_revision INT NULL,
  draft_manifest JSON NOT NULL,
  published_manifest JSON NULL,
  draft_status ENUM('draft', 'pending_review', 'published', 'archived') NOT NULL DEFAULT 'draft',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  CONSTRAINT fk_minisite_manifest_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_minisite_manifest_status (draft_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS minisite_manifest_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id VARCHAR(100) NOT NULL,
  revision INT NOT NULL,
  status ENUM('draft', 'pending_review', 'published', 'archived') NOT NULL,
  manifest JSON NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  actor_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_minisite_manifest_revision_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_minisite_manifest_revision (business_id, revision),
  INDEX idx_minisite_manifest_revision_created (business_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS minisite_manifest_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_id VARCHAR(100) NOT NULL,
  revision INT NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSON NULL,
  actor_id VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_minisite_manifest_event_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_minisite_manifest_event_business (business_id, revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
-- Migration 027: Add missing section blog/curation configuration columns
-- These failed to apply in 019 because TiDB doesn't support ADD COLUMN (...) multi-column syntax.

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS auto_publish_blogs TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'If 1: vendor blogs publish immediately. If 0: require admin approval';

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS curation_policy ENUM('auto_approve','manual_review','admin_only') NOT NULL DEFAULT 'manual_review'
    COMMENT 'How vendor blog/image content is approved';

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS auto_publish_images TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'If 1: vendor gallery images approved immediately';

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS max_gallery_items INT NOT NULL DEFAULT 50
    COMMENT 'Maximum images vendors can upload to this section';

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS content_instructions MEDIUMTEXT DEFAULT NULL
    COMMENT 'Admin guidance shown to vendors when filling this section';

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS vendor_permissions JSON DEFAULT NULL
    COMMENT 'Per-section vendor capability overrides (JSON)';

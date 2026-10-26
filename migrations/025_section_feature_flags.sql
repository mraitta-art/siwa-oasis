-- ================================================================
-- Migration 025: Section Feature Flags (Gallery and Blog)
-- ================================================================

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS enable_gallery TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Toggle to enable or disable the uploader gallery tab for vendors',
  ADD COLUMN IF NOT EXISTS enable_blog TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Toggle to enable or disable the mini blog story tab for vendors';

ALTER TABLE sections
  ADD INDEX IF NOT EXISTS idx_enable_gallery (enable_gallery),
  ADD INDEX IF NOT EXISTS idx_enable_blog (enable_blog);

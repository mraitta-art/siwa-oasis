-- ================================================================
-- SIWA OASIS: Section Two-Part Architecture Migration
-- Standard Foundation + Custom Components per section
-- ================================================================

-- 1. Add show_on_minisite to sections (independent from show_on_public)
ALTER TABLE sections ADD COLUMN IF NOT EXISTS show_on_minisite TINYINT(1) DEFAULT 1
  COMMENT 'Independent visibility toggle for the business minisite';

-- 2. Add section_id to business_media (null = legacy chapter-based)
ALTER TABLE business_media ADD COLUMN IF NOT EXISTS section_id VARCHAR(100) DEFAULT NULL
  COMMENT 'Links media to a specific section (null = chapter/legacy)';
ALTER TABLE business_media ADD INDEX idx_section (section_id);

-- 3. Add section_id to business_posts (null = general business blog)
ALTER TABLE business_posts ADD COLUMN IF NOT EXISTS section_id VARCHAR(100) DEFAULT NULL
  COMMENT 'Scopes blog post to a specific section (null = general)';
ALTER TABLE business_posts ADD INDEX idx_section (section_id);

-- 4. Backfill: set show_on_minisite = show_on_public for existing sections
UPDATE sections SET show_on_minisite = show_on_public WHERE show_on_minisite IS NULL;

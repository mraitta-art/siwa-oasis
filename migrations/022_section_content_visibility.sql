-- ================================================================
-- Migration 022: Section Two-Part Content Architecture
-- Adds gallery visibility + section_blogs table
-- ================================================================

-- 1. Add visibility flags to vendor_gallery
ALTER TABLE vendor_gallery
  ADD COLUMN IF NOT EXISTS show_on_main TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Show this image on the main siwa.today website',
  ADD COLUMN IF NOT EXISTS show_on_minisite TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Show this image on the business mini-site';

ALTER TABLE vendor_gallery
  ADD INDEX IF NOT EXISTS idx_show_on_main (show_on_main),
  ADD INDEX IF NOT EXISTS idx_show_on_minisite (show_on_minisite);

-- 2. Create section_blogs table
CREATE TABLE IF NOT EXISTS section_blogs (
    id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_id   VARCHAR(100) NOT NULL,
    business_id  VARCHAR(100) NOT NULL,
    vendor_id    VARCHAR(100) NOT NULL,

    title        VARCHAR(500) NOT NULL,
    content      LONGTEXT,
    excerpt      VARCHAR(1000),

    -- Visibility
    show_on_main      TINYINT(1) NOT NULL DEFAULT 1,
    show_on_minisite  TINYINT(1) NOT NULL DEFAULT 1,

    -- Workflow
    status   ENUM('draft','pending','published','rejected') DEFAULT 'pending',
    approved_by  VARCHAR(100) DEFAULT NULL,
    approval_note MEDIUMTEXT,
    approved_at  TIMESTAMP NULL DEFAULT NULL,
    published_at TIMESTAMP NULL DEFAULT NULL,

    -- Timestamps
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_section_id  (section_id),
    INDEX idx_business_id (business_id),
    INDEX idx_vendor_id   (vendor_id),
    INDEX idx_status      (status),
    INDEX idx_show_on_main     (show_on_main),
    INDEX idx_show_on_minisite (show_on_minisite),

    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 3. Backfill: sections.show_on_minisite from show_on_public for any nulls
UPDATE sections SET show_on_minisite = show_on_public WHERE show_on_minisite IS NULL;

-- 4. Add business_id to vendor_gallery for easier queries (optional backfill)
ALTER TABLE vendor_gallery
  ADD COLUMN IF NOT EXISTS business_id VARCHAR(100) DEFAULT NULL
    COMMENT 'Copied from profiles.business_id at upload time';

ALTER TABLE vendor_gallery
  ADD INDEX IF NOT EXISTS idx_business_id (business_id);

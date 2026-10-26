ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en';

ALTER TABLE blog_posts
  ADD INDEX IF NOT EXISTS idx_blog_target_language
    (target_business_id, target_section_id, language, target_type);

ALTER TABLE section_blogs
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS featured_image_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by_admin VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_on_minisite TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en';

ALTER TABLE section_blogs
  ADD INDEX IF NOT EXISTS idx_section_blog_language
    (business_id, section_id, language);

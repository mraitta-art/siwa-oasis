/**
 * Database Schema for Independent Homepage Management System
 * Allows managing multiple homepages independently with different layouts and sections
 */

-- Create homepages table
CREATE TABLE IF NOT EXISTS homepages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type ENUM('main', 'category', 'service', 'custom') DEFAULT 'custom',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  theme VARCHAR(50) DEFAULT 'dark',
  layout VARCHAR(50) DEFAULT 'standard',
  title VARCHAR(255),
  description TEXT,
  meta_keywords VARCHAR(255),
  meta_description TEXT,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_type (type),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create homepage_sections table
CREATE TABLE IF NOT EXISTS homepage_sections (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  homepage_id VARCHAR(36) NOT NULL,
  section_type ENUM('hero', 'features', 'gallery', 'testimonials', 'team', 'faq', 'pricing', 'cta', 'custom') DEFAULT 'custom',
  title VARCHAR(255),
  description TEXT,
  content LONGTEXT,
  position INT DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  style_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_homepage (homepage_id),
  INDEX idx_type (section_type),
  INDEX idx_position (position),
  FOREIGN KEY (homepage_id) REFERENCES homepages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create homepage_section_items table
CREATE TABLE IF NOT EXISTS homepage_section_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  section_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  content TEXT,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  position INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section (section_id),
  INDEX idx_position (position),
  FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create homepage_versions table (for version control)
CREATE TABLE IF NOT EXISTS homepage_versions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  homepage_id VARCHAR(36) NOT NULL,
  version_number INT DEFAULT 1,
  data JSON NOT NULL,
  change_summary TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_homepage (homepage_id),
  INDEX idx_version (version_number),
  FOREIGN KEY (homepage_id) REFERENCES homepages(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create homepage_analytics table
CREATE TABLE IF NOT EXISTS homepage_analytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  homepage_id VARCHAR(36) NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  avg_session_duration INT DEFAULT 0,
  date DATE,
  INDEX idx_homepage (homepage_id),
  INDEX idx_date (date),
  FOREIGN KEY (homepage_id) REFERENCES homepages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for common queries
CREATE INDEX idx_homepages_status_type ON homepages(status, type);
CREATE INDEX idx_homepages_published ON homepages(status, published_at);
CREATE INDEX idx_sections_enabled ON homepage_sections(homepage_id, enabled);

-- Create view for published homepages
CREATE VIEW published_homepages AS
SELECT 
  h.*,
  COUNT(DISTINCT s.id) as section_count,
  COUNT(DISTINCT si.id) as item_count
FROM homepages h
LEFT JOIN homepage_sections s ON h.id = s.homepage_id
LEFT JOIN homepage_section_items si ON s.id = si.section_id
WHERE h.status = 'published'
GROUP BY h.id;

-- Create view for homepage metrics
CREATE VIEW homepage_metrics AS
SELECT 
  h.id,
  h.name,
  h.slug,
  COUNT(DISTINCT s.id) as section_count,
  SUM(CASE WHEN s.enabled THEN 1 ELSE 0 END) as enabled_sections,
  COALESCE(a.views, 0) as views,
  COALESCE(a.clicks, 0) as clicks,
  COALESCE(a.conversions, 0) as conversions
FROM homepages h
LEFT JOIN homepage_sections s ON h.id = s.homepage_id
LEFT JOIN homepage_analytics a ON h.id = a.homepage_id AND DATE(a.date) = CURDATE()
GROUP BY h.id;

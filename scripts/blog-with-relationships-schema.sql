-- ============================================
-- SIWA OASIS: Blog System with Content Relationships
-- UNIVERSAL MIGRATION - Works on ALL MySQL servers
-- Compatible with: Local, cPanel, Railway, Any MySQL 5.7+
-- ============================================
-- 
-- This migration:
-- 1. Creates blog tables (if not exist)
-- 2. Adds content relationship system
-- 3. Links blogs to forms, pages, businesses
-- 4. Safe to run multiple times (no conflicts)
--
-- Run this AFTER your main schema.sql
-- ============================================

-- ============================================
-- PART 1: BLOG CORE TABLES
-- ============================================

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  featured_image VARCHAR(500),
  author_id VARCHAR(36),
  category_id INT,
  status ENUM('draft', 'published', 'scheduled') DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  reading_time INT DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  INDEX idx_status (status),
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_author (author_id),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#D4AF37',
  icon VARCHAR(50),
  parent_id INT NULL,
  sort_order INT DEFAULT 0,
  post_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  FOREIGN KEY (parent_id) REFERENCES blog_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS blog_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Post Tags (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Comments Table
CREATE TABLE IF NOT EXISTS blog_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_url VARCHAR(500),
  content TEXT NOT NULL,
  status ENUM('pending', 'approved', 'spam') DEFAULT 'pending',
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post (post_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Sidebar Configurations
CREATE TABLE IF NOT EXISTS blog_sidebar_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_type VARCHAR(100) DEFAULT 'all',
  layout ENUM('left', 'right', 'both', 'none') DEFAULT 'right',
  components JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_page_type (page_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PART 2: CONTENT RELATIONSHIP SYSTEM
-- ============================================
-- This allows blogs to be linked to ANY content type
-- Works with forms, pages, businesses, minisites, etc.

-- Content Relationships Table (UNIVERSAL)
CREATE TABLE IF NOT EXISTS content_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_type ENUM('blog_post', 'form', 'page', 'minisite', 'business', 'component') NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  target_type ENUM('blog_post', 'form', 'page', 'minisite', 'business', 'component') NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  relationship_type ENUM('related_to', 'embeds', 'references', 'belongs_to', 'features') DEFAULT 'related_to',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source (source_type, source_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_relationship (relationship_type),
  UNIQUE KEY idx_unique_relation (source_type, source_id, target_type, target_id, relationship_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PART 3: INSERT DEFAULT DATA
-- ============================================
-- (Blog references to existing tables will be added via application logic)

-- Default Blog Categories
INSERT IGNORE INTO blog_categories (id, name, slug, description, color, icon, sort_order) VALUES
(1, 'Travel', 'travel', 'Travel guides and tips for Siwa Oasis', '#3B82F6', 'fas fa-plane', 1),
(2, 'Culture', 'culture', 'Siwa culture, traditions, and heritage', '#8B5CF6', 'fas fa-landmark', 2),
(3, 'Food', 'food', 'Local cuisine and restaurants', '#EF4444', 'fas fa-utensils', 3),
(4, 'Adventure', 'adventure', 'Activities and outdoor experiences', '#F59E0B', 'fas fa-mountain', 4),
(5, 'Wellness', 'wellness', 'Spas, relaxation, and health', '#10B981', 'fas fa-spa', 5),
(6, 'Photography', 'photography', 'Photo galleries and tips', '#EC4899', 'fas fa-camera', 6);

-- Default Blog Tags
INSERT IGNORE INTO blog_tags (id, name, slug, usage_count) VALUES
(1, 'Siwa Oasis', 'siwa-oasis', 0),
(2, 'Desert', 'desert', 0),
(3, 'History', 'history', 0),
(4, 'Local Food', 'local-food', 0),
(5, 'Photography', 'photography', 0),
(6, 'Adventure', 'adventure', 0),
(7, 'Culture', 'culture', 0),
(8, 'Travel Tips', 'travel-tips', 0),
(9, 'Accommodation', 'accommodation', 0),
(10, 'Activities', 'activities', 0);

-- Default Sidebar Configuration
INSERT IGNORE INTO blog_sidebar_configs (page_type, layout, components) VALUES
('all', 'right', JSON_ARRAY(
  JSON_OBJECT('id', 'widget_search_1', 'type', 'search', 'title', 'Search Blog', 'order', 0),
  JSON_OBJECT('id', 'widget_recent_1', 'type', 'recent_posts', 'title', 'Recent Posts', 'order', 1, 'count', 5),
  JSON_OBJECT('id', 'widget_categories_1', 'type', 'categories', 'title', 'Categories', 'order', 2),
  JSON_OBJECT('id', 'widget_tags_1', 'type', 'tags_cloud', 'title', 'Popular Tags', 'order', 3, 'limit', 20),
  JSON_OBJECT('id', 'widget_newsletter_1', 'type', 'newsletter', 'title', 'Newsletter', 'order', 4, 'message', 'Subscribe for updates')
)),
('homepage', 'right', JSON_ARRAY(
  JSON_OBJECT('id', 'widget_featured', 'type', 'featured_posts', 'title', 'Featured Posts', 'order', 0, 'count', 3),
  JSON_OBJECT('id', 'widget_categories_2', 'type', 'categories', 'title', 'Browse by Category', 'order', 1),
  JSON_OBJECT('id', 'widget_social', 'type', 'social_links', 'title', 'Follow Us', 'order', 2)
));

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- 
-- Tables created:
-- ✓ blog_posts
-- ✓ blog_categories
-- ✓ blog_tags
-- ✓ blog_post_tags
-- ✓ blog_comments
-- ✓ blog_sidebar_configs
-- ✓ content_relationships
--
-- Default data:
-- ✓ 6 blog categories
-- ✓ 10 blog tags
-- ✓ 2 sidebar configurations
--
-- This migration is:
-- ✓ Safe to run multiple times
-- ✓ Compatible with all MySQL servers
-- ✓ Won't conflict with existing data
-- ✓ Works on Local, cPanel, Railway
-- ============================================

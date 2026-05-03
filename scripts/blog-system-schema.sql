-- ============================================
-- SIWA OASIS: Advanced Blog System Schema
-- ============================================

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  featured_image VARCHAR(500),
  author_id INT,
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
  INDEX idx_published (published_at),
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
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

-- Blog Post Tags (Many-to-Many)
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_post (post_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog Sidebar Configurations
CREATE TABLE IF NOT EXISTS blog_sidebar_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_type VARCHAR(50) NOT NULL DEFAULT 'all',
  layout ENUM('left', 'right', 'both', 'none') DEFAULT 'right',
  components JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_page_type (page_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default blog categories
INSERT IGNORE INTO blog_categories (name, slug, description, color, icon) VALUES
('Travel', 'travel', 'Travel guides and tips for Siwa Oasis', '#3498db', 'fa-plane'),
('Culture', 'culture', 'Siwan culture and heritage', '#9b59b6', 'fa-landmark'),
('Food', 'food', 'Traditional Siwan cuisine', '#e67e22', 'fa-utensils'),
('Adventure', 'adventure', 'Desert adventures and activities', '#e74c3c', 'fa-mountain'),
('Wellness', 'wellness', 'Spa, meditation, and wellness', '#27ae60', 'fa-spa'),
('Photography', 'photography', 'Photo guides and galleries', '#D4AF37', 'fa-camera');

-- Insert default blog tags
INSERT IGNORE INTO blog_tags (name, slug) VALUES
('Siwa Oasis', 'siwa-oasis'),
('Desert Safari', 'desert-safari'),
('Salt Lakes', 'salt-lakes'),
('Cleopatra Spring', 'cleopatra-spring'),
('Shali Fortress', 'shali-fortress'),
('Traditional Food', 'traditional-food'),
('Eco Tourism', 'eco-tourism'),
('Luxury Stay', 'luxury-stay'),
('Camping', 'camping'),
('Stargazing', 'stargazing');

-- Insert default sidebar configuration
INSERT IGNORE INTO blog_sidebar_configs (page_type, layout, components) VALUES
('all', 'right', JSON_ARRAY(
  JSON_OBJECT('id', 'widget_search_1', 'type', 'search', 'title', 'Search Blog', 'order', 0),
  JSON_OBJECT('id', 'widget_recent_1', 'type', 'recent_posts', 'title', 'Recent Posts', 'order', 1, 'count', 5),
  JSON_OBJECT('id', 'widget_categories_1', 'type', 'categories', 'title', 'Categories', 'order', 2),
  JSON_OBJECT('id', 'widget_tags_1', 'type', 'tags_cloud', 'title', 'Popular Tags', 'order', 3, 'limit', 20),
  JSON_OBJECT('id', 'widget_newsletter_1', 'type', 'newsletter', 'title', 'Newsletter', 'order', 4, 'message', 'Subscribe for updates')
));

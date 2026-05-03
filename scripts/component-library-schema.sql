-- ============================================
-- SIWA OASIS: Component Library System
-- Reusable components that can be assigned to any page
-- ============================================

-- Component Library Table
CREATE TABLE IF NOT EXISTS component_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('carousel', 'blog_sidebar', 'gallery', 'testimonials', 'cta_section', 'features', 'custom') NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  config JSON NOT NULL,
  thumbnail VARCHAR(500),
  description TEXT,
  is_global BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
  -- Note: Foreign key to profiles table commented out as it may not exist
  -- FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page-Component Assignments
CREATE TABLE IF NOT EXISTS page_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(100) NOT NULL,
  page_type VARCHAR(50) DEFAULT 'website',
  component_library_id INT NOT NULL,
  position INT DEFAULT 0,
  section ENUM('header', 'body', 'footer', 'sidebar') DEFAULT 'body',
  custom_overrides JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page (page_id, page_type),
  INDEX idx_component (component_library_id),
  INDEX idx_section (section),
  INDEX idx_position (position),
  FOREIGN KEY (component_library_id) REFERENCES component_library(id) ON DELETE CASCADE,
  UNIQUE KEY idx_unique_assignment (page_id, page_type, component_library_id, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Component Usage Analytics
CREATE TABLE IF NOT EXISTS component_usage_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  component_library_id INT NOT NULL,
  page_id VARCHAR(100),
  action ENUM('created', 'assigned', 'removed', 'updated') NOT NULL,
  performed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_component (component_library_id),
  INDEX idx_action (action),
  FOREIGN KEY (component_library_id) REFERENCES component_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert example carousel components
INSERT IGNORE INTO component_library (name, type, category, config, description, is_global) VALUES
('Hero Showcase Carousel', 'carousel', 'hero', 
 JSON_OBJECT(
   'slides', JSON_ARRAY(
     JSON_OBJECT('id', 'slide_1', 'type', 'youtube', 'mediaUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'title', 'Discover Siwa', 'subtitle', 'Experience the magic', 'ctaText', 'EXPLORE NOW', 'ctaLink', '/tours')
   ),
   'autoPlayInterval', 8000,
   'height', '100vh',
   'showIndicators', TRUE,
   'showArrows', TRUE,
   'showProgress', TRUE
 ),
 'Premium hero carousel for homepage showcase', TRUE),

('Hotel Gallery Carousel', 'carousel', 'hero',
 JSON_OBJECT(
   'slides', JSON_ARRAY(
     JSON_OBJECT('id', 'slide_1', 'type', 'image', 'mediaUrl', '', 'title', 'Luxury Hotels', 'subtitle', 'Finest accommodations', 'ctaText', 'VIEW ROOMS', 'ctaLink', '/hotels')
   ),
   'autoPlayInterval', 6000,
   'height', '80vh',
   'showIndicators', TRUE,
   'showArrows', TRUE,
   'showProgress', FALSE
 ),
 'Hotel showcase carousel with image slides', TRUE),

('Standard Blog Sidebar', 'blog_sidebar', 'sidebar',
 JSON_OBJECT(
   'components', JSON_ARRAY(
     JSON_OBJECT('id', 'widget_search', 'type', 'search', 'title', 'Search Blog', 'order', 0),
     JSON_OBJECT('id', 'widget_recent', 'type', 'recent_posts', 'title', 'Recent Posts', 'order', 1, 'count', 5),
     JSON_OBJECT('id', 'widget_categories', 'type', 'categories', 'title', 'Categories', 'order', 2),
     JSON_OBJECT('id', 'widget_tags', 'type', 'tags_cloud', 'title', 'Tags', 'order', 3, 'limit', 20),
     JSON_OBJECT('id', 'widget_newsletter', 'type', 'newsletter', 'title', 'Newsletter', 'order', 4)
   ),
   'layout', 'right'
 ),
 'Standard blog sidebar with search, recent posts, categories, tags, and newsletter', TRUE),

('Minimal Blog Sidebar', 'blog_sidebar', 'sidebar',
 JSON_OBJECT(
   'components', JSON_ARRAY(
     JSON_OBJECT('id', 'widget_search', 'type', 'search', 'title', 'Search', 'order', 0),
     JSON_OBJECT('id', 'widget_recent', 'type', 'recent_posts', 'title', 'Recent Posts', 'order', 1, 'count', 3),
     JSON_OBJECT('id', 'widget_categories', 'type', 'categories', 'title', 'Categories', 'order', 2)
   ),
   'layout', 'right'
 ),
 'Minimal blog sidebar with essential widgets only', TRUE);

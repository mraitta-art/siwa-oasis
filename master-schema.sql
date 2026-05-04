-- ============================================================
-- SIWA OASIS: UNIFIED MASTER SCHEMA
-- Generated: 2026-05-03
-- 
-- This file contains ALL tables needed for the complete platform:
--   Part 1: Core Platform (18 tables + seeds)
--   Part 2: Blog System (7 tables + seeds)  
--   Part 3: Component Library (3 tables + seeds)
--
-- INSTRUCTIONS:
--   1. Create your database in cPanel/phpMyAdmin first
--   2. Select that database
--   3. Import this entire file
--
-- Compatible with: MySQL 8.0+, TiDB Cloud, Railway MySQL
-- ============================================================

-- ============================================================
-- SIWA OASIS: MySQL Production Schema
-- Complete marketplace platform with governance engine
-- ============================================================


-- 1. PROFILES (Users & Roles)
CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','content_admin','sales_manager','support_agent','salesman','vendor','public') NOT NULL DEFAULT 'vendor',
  display_name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  business_id VARCHAR(36) DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. LOCATIONS (Geography Engine)
CREATE TABLE locations (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('country','governorate','city','town','neighborhood') NOT NULL,
  parent_id VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- 3. BUSINESS TYPES (Typology Engine)
CREATE TABLE business_types (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) DEFAULT 'fas fa-building',
  icon_color VARCHAR(20) DEFAULT '#8b5cf6',
  description TEXT,
  is_parent BOOLEAN DEFAULT FALSE,
  parent_id VARCHAR(100) DEFAULT NULL,
  sections JSON DEFAULT (JSON_ARRAY()),
  own_sections JSON DEFAULT (JSON_ARRAY()),
  active BOOLEAN DEFAULT TRUE,
  sort_order DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES business_types(id) ON DELETE SET NULL
);

-- 4. SECTIONS (Data Section Definitions)
CREATE TABLE sections (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) DEFAULT 'fa-info-circle',
  required BOOLEAN DEFAULT FALSE,
  vendor_editable BOOLEAN DEFAULT TRUE,
  show_on_public BOOLEAN DEFAULT TRUE,
  is_filterable BOOLEAN DEFAULT FALSE,
  show_on_card BOOLEAN DEFAULT FALSE,
  is_universal BOOLEAN DEFAULT FALSE,
  section_type ENUM('general', 'additional', 'universal') DEFAULT 'general',
  description TEXT,
  inheritance_rules JSON DEFAULT NULL,
  display_order INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  options JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. FIELD DEFINITIONS (Element Library Registry)
CREATE TABLE field_definitions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) DEFAULT 'fa-square',
  category VARCHAR(100) DEFAULT 'Standard',
  has_options BOOLEAN DEFAULT FALSE,
  validation_type VARCHAR(50) DEFAULT 'text',
  search_mapping VARCHAR(50) DEFAULT 'none',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. FORM FIELDS (Field Definitions per Type/Section)
CREATE TABLE form_fields (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_type_id VARCHAR(100) NOT NULL,
  section_id VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  section_origin ENUM('inherited', 'own', 'template') DEFAULT 'own',
  required BOOLEAN DEFAULT FALSE,
  vendor_editable BOOLEAN DEFAULT TRUE,
  searchable BOOLEAN DEFAULT FALSE,
  search_step VARCHAR(50) DEFAULT NULL,
  help_text TEXT,
  options JSON DEFAULT NULL,
  validation JSON DEFAULT (JSON_OBJECT()),
  acl JSON DEFAULT (JSON_OBJECT()),
  default_value TEXT,
  sort_order INT DEFAULT 0,
  required_feature VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_type_id) REFERENCES business_types(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE KEY uk_field (business_type_id, section_id, name)
);

-- 6. CUSTOM EXPRESSIONS (Vibe/Terminology Engine)
CREATE TABLE custom_expressions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'select',
  options JSON DEFAULT (JSON_ARRAY()),
  searchable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SUBSCRIPTION TIERS
CREATE TABLE subscription_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_amount DECIMAL(10,2) DEFAULT 0,
  price_currency VARCHAR(10) DEFAULT 'USD',
  price_period VARCHAR(20) DEFAULT 'month',
  version INT DEFAULT 1,
  features JSON DEFAULT (JSON_OBJECT()),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. SEARCH POLICIES (RBAC Visibility)
CREATE TABLE search_policies (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(50) NOT NULL,
  allowed_fields JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. BUSINESSES (The Core Entity)
CREATE TABLE businesses (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type_id VARCHAR(100) NOT NULL,
  location_id VARCHAR(100) DEFAULT NULL,
  vendor_id VARCHAR(36) DEFAULT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  status ENUM('active','inactive','hidden','pending') DEFAULT 'active',
  published BOOLEAN DEFAULT TRUE,
  approved_by_vendor BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  custom_data JSON DEFAULT NULL,
  draft_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES business_types(id),
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 10. SEARCH ENGINES (Multi-criteria search config)
CREATE TABLE search_engines (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  allowed_fields JSON DEFAULT (JSON_ARRAY()),
  filters JSON DEFAULT (JSON_ARRAY()),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. SEARCH PAGES (URL Slug → Category Routing)
CREATE TABLE search_pages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  target_type VARCHAR(50) DEFAULT 'category',
  target_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. WEBSITE TEMPLATES (CMS Homepage Components)
CREATE TABLE website_templates (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'website',
  header_components JSON DEFAULT (JSON_ARRAY()),
  body_components JSON DEFAULT (JSON_ARRAY()),
  footer_components JSON DEFAULT (JSON_ARRAY()),
  site_settings JSON DEFAULT (JSON_OBJECT()),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12b. WEBSITE CONFIGS (JSON-based configuration storage)
CREATE TABLE IF NOT EXISTS website_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) UNIQUE NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. CARD TEMPLATES (Per-type card layout)
CREATE TABLE card_templates (
  id VARCHAR(100) PRIMARY KEY,
  business_type_id VARCHAR(100),
  layout VARCHAR(50) DEFAULT 'standard',
  visible_fields JSON DEFAULT (JSON_ARRAY()),
  policy_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_type_id) REFERENCES business_types(id) ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES search_policies(id) ON DELETE SET NULL
);

-- 14. MINISITE TEMPLATES (Categorical Minisite Configs)
CREATE TABLE minisite_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(100) DEFAULT NULL,
  tier VARCHAR(50) DEFAULT 'free',
  components JSON DEFAULT NULL,
  settings JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES business_types(id) ON DELETE SET NULL
);

-- 15. EXPERIENCE PACKAGES (Bundled Multi-Business)
CREATE TABLE experience_packages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  business_ids JSON DEFAULT (JSON_ARRAY()),
  pricing JSON DEFAULT (JSON_OBJECT()),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. UPGRADE REQUESTS
CREATE TABLE upgrade_requests (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36) NOT NULL,
  requested_by VARCHAR(36) DEFAULT NULL,
  client_name VARCHAR(255),
  requested_tier VARCHAR(50) NOT NULL,
  requested_features JSON DEFAULT (JSON_OBJECT()),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by VARCHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 17. AUDIT LOG
CREATE TABLE audit_log (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 18. ACTIVITY LOG (Recent Activity Feed)
CREATE TABLE activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message TEXT NOT NULL,
  user_email VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin Users (passwords are bcrypt hashes)
-- super123, content123, sales123, support123, salesman123, vendor123
INSERT INTO profiles (id, email, password_hash, role, display_name, subscription_tier, active) VALUES
('a1', 'super@siwa.com', '$2b$10$Xy060W..9q4kdPM64x3LBOqW8VbpIsYG9GQotW.lECkj48Zqr1CRS', 'super_admin', 'Super Admin', 'premium', TRUE),
('a2', 'content@siwa.com', '$2b$10$7TkIV.lRT.QfdA7LMB7L3evFJpfwGwVttUKi3cp9E6crDsC2EspgW', 'content_admin', 'Content Admin', 'premium', TRUE),
('a3', 'salesmanager@siwa.com', '$2b$10$UwrNseTOgCPOj7RZf.YgzO9KYKwEaWRUkOT7mnHK0tIMQXj0Ek4be', 'sales_manager', 'Sales Manager', 'premium', TRUE),
('a4', 'support@siwa.com', '$2b$10$1.OBA6UeAbCd3E8uyrXQE.SFywMJheKPWZcrRxE9lkNETt8WzUKsO', 'support_agent', 'Support Agent', 'basic', TRUE),
('a5', 'salesman@siwa.com', '$2b$10$5N1EdMCV2stliffkQLkT.ODYQCFMMUH0XmGqqVpLG6T91ihz3Wv8.', 'salesman', 'Field Salesman', 'free', TRUE),
('a6', 'vendor@siwa.com', '$2b$10$E0tH4FCp8vmdU2l9NXubiuD5LU94bK5uWzg/D.cce3D59Y3WusA92', 'vendor', 'Demo Vendor', 'free', TRUE);

-- Default Subscription Tiers
INSERT INTO subscription_tiers (id, name, price_amount, features) VALUES
('free', 'Free', 0, '{"maxBusinesses":1,"canPublishMinisite":false,"canCustomizeTemplate":false,"maxImages":5,"maxSlides":3,"maxStorageMB":10,"maxCustomBlocks":2}'),
('basic', 'Basic', 9.99, '{"maxBusinesses":3,"canPublishMinisite":true,"canCustomizeTemplate":false,"maxImages":15,"maxSlides":10,"maxStorageMB":50,"maxCustomBlocks":5}'),
('premium', 'Premium', 29.99, '{"maxBusinesses":10,"canPublishMinisite":true,"canCustomizeTemplate":true,"maxImages":50,"maxSlides":20,"maxStorageMB":250,"maxCustomBlocks":15}'),
('gold', 'Gold VIP', 79.99, '{"maxBusinesses":50,"canPublishMinisite":true,"canCustomizeTemplate":true,"maxImages":100,"maxSlides":50,"maxStorageMB":1000,"maxCustomBlocks":50}'),
('vip', 'Enterprise/VIP', 199.99, '{"maxBusinesses":999,"canPublishMinisite":true,"canCustomizeTemplate":true,"maxImages":999,"maxSlides":999,"maxStorageMB":10000,"maxCustomBlocks":999}');

-- Default Business Types
-- 1. PARENTS
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, sections, sort_order) VALUES
('accommodation', 'Accommodation', 'fas fa-bed', '#8b5cf6', TRUE, NULL, '["basic","location","contact"]', 1),
('food', 'Food & Beverage', 'fas fa-utensils', '#f59e0b', TRUE, NULL, '["basic","location","contact","menu"]', 2),
('adventure', 'Adventure & Safari', 'fas fa-jeep', '#10b981', TRUE, NULL, '["basic","location","contact","schedule"]', 3),
('wellness', 'Health & Wellness', 'fas fa-spa', '#27ae60', TRUE, NULL, '["basic","location","contact"]', 4),
('crafts', 'Trade & Crafts', 'fas fa-store', '#ef4444', TRUE, NULL, '["basic","location","contact","products"]', 5),
('logistics', 'Logistics & Transport', 'fas fa-truck-moving', '#2c3e50', TRUE, NULL, '["basic","location","contact"]', 6);

-- 2. CHILDREN: ACCOMMODATION
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('hotel', 'Full-Service Hotel', 'fas fa-hotel', '#8b5cf6', FALSE, 'accommodation', '["star_rating","room_types","facilities"]', 1.1),
('siwa_lodge', 'Traditional Siwan Lodge', 'fas fa-landmark', '#D4AF37', FALSE, 'accommodation', '["construction_material","vibe"]', 1.2),
('desert_camp', 'Desert Camp', 'fas fa-campground', '#8b5cf6', FALSE, 'accommodation', '["tent_types","campfire"]', 1.3),
('eco_lodge', 'Eco-Lodge', 'fas fa-leaf', '#10b981', FALSE, 'accommodation', '["vibe"]', 1.4);

-- 3. CHILDREN: FOOD
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('restaurant', 'Standard Restaurant', 'fas fa-utensils', '#f59e0b', FALSE, 'food', '["cuisine_type","seating"]', 2.1),
('siwan_kitchen', 'Traditional Siwan Kitchen', 'fas fa-utensils', '#D4AF37', FALSE, 'food', '["cuisine_type"]', 2.2),
('cafe_juice', 'Cafe & Juice Bar', 'fas fa-mug-hot', '#f59e0b', FALSE, 'food', '["coffee_types"]', 2.3);

-- 4. CHILDREN: ADVENTURE
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('safari_4x4', '4x4 Desert Safari', 'fas fa-jeep', '#10b981', FALSE, 'adventure', '["tour_types","duration"]', 3.1),
('camel_trek', 'Camel Trekking', 'fas fa-horse', '#f59e0b', FALSE, 'adventure', '["tour_types","duration"]', 3.2),
('nature_tour', 'Nature & Bird Watching', 'fas fa-binoculars', '#10b981', FALSE, 'adventure', '["tour_types"]', 3.3),
('heritage_tour', 'Historical Heritage Tour', 'fas fa-landmark', '#D4AF37', FALSE, 'adventure', '["languages"]', 3.4);

-- 5. CHILDREN: WELLNESS
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('sand_bath', 'Therapeutic Sand Bath', 'fas fa-sun', '#f59e0b', FALSE, 'wellness', '["duration"]', 4.1),
('salt_therapy', 'Salt Cave Therapy', 'fas fa-moon', '#3b82f6', FALSE, 'wellness', '[]', 4.2),
('hot_spring', 'Hot Spring Experience', 'fas fa-water', '#3b82f6', FALSE, 'wellness', '["facilities"]', 4.3);

-- 6. CHILDREN: CRAFTS
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('embroidery', 'Siwan Embroidery & Textile', 'fas fa-cut', '#ef4444', FALSE, 'crafts', '["categories"]', 5.1),
('date_olive', 'Dates & Olives Trade', 'fas fa-seedling', '#27ae60', FALSE, 'crafts', '["categories"]', 5.2),
('artisan_shop', 'Handmade Artisan Shop', 'fas fa-store', '#ef4444', FALSE, 'crafts', '["categories"]', 5.3);

-- 7. CHILDREN: LOGISTICS
INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, own_sections, sort_order) VALUES
('tuk_tuk', 'Local Tuk-Tuk Service', 'fas fa-motorcycle', '#f59e0b', FALSE, 'logistics', '[]', 6.1),
('equipment_rental', 'Equipment Rental', 'fas fa-tools', '#2c3e50', FALSE, 'logistics', '["categories"]', 6.2);

-- Default Sections
INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal) VALUES
('basic', 'Basic Information', 'fa-info-circle', TRUE, TRUE, TRUE, FALSE, FALSE, FALSE),
('location', 'Location', 'fa-map-marker-alt', TRUE, TRUE, TRUE, FALSE, FALSE, FALSE),
('contact', 'Contact Details', 'fa-phone', TRUE, TRUE, TRUE, FALSE, FALSE, FALSE),
('menu', 'Menu', 'fa-list', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('schedule', 'Schedule', 'fa-calendar', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('products', 'Products', 'fa-box', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('star_rating', 'Star Rating', 'fa-star', FALSE, FALSE, TRUE, FALSE, FALSE, FALSE),
('room_types', 'Room Types', 'fa-bed', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('facilities', 'Facilities', 'fa-wifi', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('tent_types', 'Tent Types', 'fa-campground', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('campfire', 'Campfire', 'fa-fire', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('construction_material', 'Construction Material', 'fa-cube', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('construction_era', 'Construction Era', 'fa-clock', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('vibe', 'Vibe & Atmosphere', 'fa-feather', FALSE, TRUE, TRUE, TRUE, TRUE, TRUE),
('cuisine_type', 'Cuisine Type', 'fa-utensils', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('seating', 'Seating Capacity', 'fa-chair', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('coffee_types', 'Coffee Types', 'fa-mug-hot', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('tour_types', 'Tour Types', 'fa-route', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('duration', 'Duration', 'fa-hourglass', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('languages', 'Languages', 'fa-language', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE),
('categories', 'Categories', 'fa-tags', FALSE, TRUE, TRUE, FALSE, FALSE, FALSE);

-- Default Search Policies
INSERT INTO search_policies (id, name, description, role, allowed_fields) VALUES
('public_policy', 'Public View Policy', 'Basic business info only', 'public', '["name","description","stars","cuisine","category","price"]'),
('vendor_policy', 'Vendor View Policy', 'Contact info visible to vendors', 'vendor', '["name","description","stars","cuisine","phone","email","address","price","category"]'),
('admin_policy', 'Admin View Policy', 'Full access to all fields', 'admin', '["*"]');

-- Default Custom Expressions
INSERT INTO custom_expressions (id, name, type, options, searchable) VALUES
('construction_material', 'Construction Material', 'select', '["Kershef (Salt Brick)","Palm Wood","Stone","Modern"]', TRUE),
('construction_era', 'Construction Era', 'select', '["Ancient (pre-Islamic)","Traditional (1800-1950)","Modern (1950-2000)","Contemporary (2000+)"]', TRUE),
('vibe', 'Vibe & Atmosphere', 'select', '["Rustic","Authentic","Spiritual","Luxury","Eco-friendly"]', TRUE);

-- Default Search Engine
INSERT INTO search_engines (id, name, allowed_fields, filters) VALUES
('se_full_discovery', 'Universal Oasis Search', '["Name","Location","Vibe"]', '[]');

-- Default Website Template
INSERT INTO website_templates (id, site_settings) VALUES
('website', '{"name":"Siwa Today","tagline":"Explore ancient traditions, natural springs, and unforgettable experiences in the heart of the Egyptian desert.","logoText":"Siwa Today","logoIcon":"fa-sun","accentColor":"#D4AF37","searchPlaceholder":"Search hotels, tours, cuisine, vibes…","footerText":"Your guide to the Siwa Oasis experience."}');

-- Sample Businesses
INSERT INTO businesses (id, name, type_id, vendor_id, subscription_tier, status, published, views, custom_data) VALUES
('b1', 'Siwa Paradise Hotel', 'hotel', 'a6', 'free', 'active', TRUE, 1247, '{"basic":{"name":"Siwa Paradise Hotel","description":"Luxury desert resort with stunning views of the Great Sand Sea"},"star_rating":{"stars":"5"},"contact":{"phone":"+20 123456789","email":"info@siwaparadise.com"},"location":{"address":"Main Road, Siwa","city":"Siwa"}}'),
('b2', 'Cleopatra Restaurant', 'restaurant', NULL, 'free', 'active', TRUE, 892, '{"basic":{"name":"Cleopatra Restaurant","description":"Authentic Siwan cuisine in traditional setting"},"cuisine_type":{"cuisine":"Traditional Siwan"},"contact":{"phone":"+20 123456788","email":"info@cleopatra.com"},"location":{"address":"Market Square, Siwa"}}');

-- Update vendor with business_id
UPDATE profiles SET business_id = 'b1' WHERE id = 'a6';


-- ============================================================
-- PART 2: BLOG SYSTEM + CONTENT RELATIONSHIPS
-- (7 tables: blog_posts, blog_categories, blog_tags,
--  blog_post_tags, blog_comments, blog_sidebar_configs,
--  content_relationships)
-- ============================================================

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


-- ============================================================
-- PART 3: COMPONENT LIBRARY SYSTEM
-- (3 tables: component_library, page_components,
--  component_usage_log)
-- ============================================================

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

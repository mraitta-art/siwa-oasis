-- Migration: Create admin-editable Services & Categories tables
-- Date: 2026-05-30

-- ═════════════════════════════════════════════════════════════════
-- TABLE: page_services
-- ═════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `page_services` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `tagline` TEXT,
  `icon` VARCHAR(50) NOT NULL,
  `color` VARCHAR(7),
  `image_url` VARCHAR(500),
  `search_link` VARCHAR(500),
  `display_order` INT DEFAULT 0,
  `is_visible` BOOLEAN DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════
-- TABLE: page_experience_categories
-- ═════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `page_experience_categories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT,
  `icon` VARCHAR(50) NOT NULL,
  `image_url` VARCHAR(500),
  `color` VARCHAR(7),
  `link` VARCHAR(500),
  `display_order` INT DEFAULT 0,
  `is_visible` BOOLEAN DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════
-- INSERT: Initial Services (from hardcoded data)
-- ═════════════════════════════════════════════════════════════════
INSERT IGNORE INTO `page_services` (id, name, tagline, icon, color, image_url, search_link, display_order, is_visible) VALUES
('accommodation', 'Stay & Shelter', 'Desert camps, Kershef lodges, eco-retreats, and full-service hotels.', 'fa-bed', '#8b5cf6', 'https://images.unsplash.com/photo-1482192505345-5852b41ade5c?q=80&w=800', '/search/vibe?category=accommodation', 1, 1),
('food', 'Food & Gastronomy', 'Traditional Siwan kitchens, organic date harvests, and desert-side cafés.', 'fa-utensils', '#f59e0b', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800', '/search/vibe?category=food', 2, 1),
('adventure', 'Adventure & Safari', '4×4 sand sea expeditions, camel treks, and heritage walking tours.', 'fa-compass', '#10b981', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800', '/search/vibe?category=adventure', 3, 1),
('wellness', 'Health & Wellness', 'Therapeutic sand baths, mineral salt lakes, and ancient hot springs.', 'fa-spa', '#27ae60', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800', '/search/vibe?category=wellness', 4, 1),
('crafts', 'Crafts & Marketplace', 'Siwan embroidery, handmade pottery, rock salt lamps, and local olive oil.', 'fa-store', '#ef4444', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800', '/search/vibe?category=crafts', 5, 1),
('logistics', 'Transport & Logistics', 'Local tuk-tuks, desert equipment rental, and guided transfer services.', 'fa-truck-moving', '#64748b', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800', '/search/vibe?category=logistics', 6, 1);

-- ═════════════════════════════════════════════════════════════════
-- INSERT: Initial Experience Categories (from hardcoded data)
-- ═════════════════════════════════════════════════════════════════
INSERT IGNORE INTO `page_experience_categories` (id, title, subtitle, icon, image_url, color, link, display_order, is_visible) VALUES
('wellness', 'WELLNESS & HEALING', 'Float in salt lakes, immerse in natural springs, and experience therapeutic desert sand baths.', 'fa-spa', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800', '#10B981', '/search/vibe?category=wellness', 1, 1),
('slow-food', 'AGRICULTURE & SLOW FOOD', 'Taste organic date orchards, ancestral olive presses, and traditional Siwan gastronomy.', 'fa-seedling', 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800', '#f59e0b', '/search/vibe?category=food', 2, 1),
('crafts', 'ARTISAN CRAFTS & TRADES', 'Explore rock salt lamps, hand-embroidered textiles, and clay pottery crafted across generations.', 'fa-store', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800', '#ef4444', '/search/vibe?category=crafts', 3, 1),
('safaris', 'ECO-SAFARIS & RETREATS', 'Nomadic camping in the Great Sand Sea, eco-lodges of Kershef, and spiritual stargazing.', 'fa-campground', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800', '#8b5cf6', '/search/vibe?category=adventure', 4, 1);

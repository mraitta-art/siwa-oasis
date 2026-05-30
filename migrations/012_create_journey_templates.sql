-- ═════════════════════════════════════════════════════════════════
-- Migration 012: Create Journey Templates table
-- ═════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `journey_templates` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `subtitle` VARCHAR(255),
  `duration_days` INT DEFAULT 3,
  `themes` JSON,                      -- Array of theme IDs (wellness, slow-food, crafts, safaris)
  `services` JSON,                    -- Array of service IDs (accommodation, food, adventure, etc.)
  `featured_image_url` VARCHAR(500),
  `icon` VARCHAR(50),
  `color` VARCHAR(7),
  `highlights` JSON,                  -- Array of strings (e.g., ["Spa therapy", "Farm tour", "Craft workshop"])
  `itinerary_details` JSON,           -- Array of daily plans with timeline
  `featured_businesses` JSON,         -- Array of business IDs to feature
  `estimated_cost_usd_min` INT,
  `estimated_cost_usd_max` INT,
  `difficulty_level` ENUM('easy', 'moderate', 'challenging') DEFAULT 'moderate',
  `best_season` VARCHAR(100),         -- e.g., "October to April"
  `max_group_size` INT,
  `admin_notes` TEXT,
  `display_order` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT 0,
  `is_visible` BOOLEAN DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order),
  INDEX idx_is_featured (is_featured),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════
-- INSERT: Initial Journey Templates
-- ═════════════════════════════════════════════════════════════════

INSERT IGNORE INTO `journey_templates` (
  id, name, description, subtitle, duration_days, themes, services, 
  featured_image_url, icon, color, highlights, estimated_cost_usd_min, 
  estimated_cost_usd_max, difficulty_level, best_season, max_group_size, 
  display_order, is_featured
) VALUES
(
  'wellness-retreat',
  'Wellness & Healing Retreat',
  'Float in natural salt lakes, immerse yourself in therapeutic hot springs, and experience ancient sand bath treatments. This rejuvenating journey combines modern wellness practices with Siwa\'s natural healing resources.',
  'Therapeutic Desert Sanctuary',
  4,
  JSON_ARRAY('wellness'),
  JSON_ARRAY('wellness', 'accommodation', 'food'),
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
  'fa-spa',
  '#10B981',
  JSON_ARRAY('Salt lake float', 'Thermal spring immersion', 'Sand bath therapy', 'Yoga sunrise session', 'Organic wellness meals'),
  800,
  1500,
  'easy',
  'October to April',
  8,
  1,
  1
),
(
  'culinary-journey',
  'Culinary & Slow Food Experience',
  'Discover ancient Siwan gastronomy through hands-on cooking classes, farm visits to organic date orchards, and dining experiences with local chefs. Taste the authentic flavors of the desert.',
  'Farm to Table Heritage',
  3,
  JSON_ARRAY('slow-food'),
  JSON_ARRAY('food', 'accommodation', 'adventure'),
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800',
  'fa-utensils',
  '#f59e0b',
  JSON_ARRAY('Olive oil pressing', 'Date harvest tour', 'Traditional cooking class', 'Local market tour', 'Farm-to-table dinner'),
  700,
  1400,
  'moderate',
  'September to May',
  6,
  2,
  1
),
(
  'artisan-deep-dive',
  'Artisan Crafts & Trades Experience',
  'Work alongside master craftspeople to learn traditional Siwan embroidery, pottery, and rock salt lamp creation. Support local artisans while creating your own souvenirs.',
  'Hands-On Heritage Craftsmanship',
  4,
  JSON_ARRAY('crafts'),
  JSON_ARRAY('crafts', 'accommodation', 'food'),
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
  'fa-store',
  '#ef4444',
  JSON_ARRAY('Embroidery workshop', 'Pottery studio visit', 'Rock salt lamp creation', 'Local artisan meeting', 'Craft market tour'),
  600,
  1200,
  'moderate',
  'Year-round',
  8,
  3,
  1
),
(
  'adventure-safari',
  'Desert Adventure & Safari Expedition',
  'Experience Siwa\'s dramatic landscapes through 4x4 sand sea expeditions, camel trekking, and guided heritage walks. Discover ancient sites and natural wonders in authentic style.',
  'Grand Sand Sea Exploration',
  3,
  JSON_ARRAY('safaris'),
  JSON_ARRAY('adventure', 'accommodation', 'logistics'),
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
  'fa-compass',
  '#10b981',
  JSON_ARRAY('4x4 sand sea expedition', 'Camel trek sunset', 'Ancient site tours', 'Stargazing night camp', 'Heritage walking tour'),
  900,
  1600,
  'challenging',
  'October to April',
  10,
  4,
  1
),
(
  'cultural-immersion',
  'Cultural & Heritage Immersion',
  'Deep dive into Siwan culture through local homestays, traditional ceremonies, museum visits, and conversations with community elders. Understand the soul of Siwa.',
  'Living History & Community Connection',
  5,
  JSON_ARRAY('wellness', 'slow-food', 'crafts'),
  JSON_ARRAY('accommodation', 'food', 'crafts', 'adventure'),
  'https://images.unsplash.com/photo-1516026672322-5e36f05c2ce7?q=80&w=800',
  'fa-book',
  '#a78bfa',
  JSON_ARRAY('Homestay experience', 'Local ceremony participation', 'Museum tour', 'Elder storytelling', 'Traditional music session'),
  650,
  1300,
  'moderate',
  'October to May',
  6,
  5,
  1
);

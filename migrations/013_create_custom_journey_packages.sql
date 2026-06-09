-- ════════════════════════════════════════════════════════════════════
-- Migration 013: Custom Journey Package Builder
-- Feature: Consultants can combine specific child businesses into 
--          custom journey packages
-- ════════════════════════════════════════════════════════════════════

-- TABLE 1: Custom Journey Packages
-- Stores packaged journeys created by consultants/guides
CREATE TABLE IF NOT EXISTS `custom_journey_packages` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `consultant_id` VARCHAR(36) DEFAULT NULL,           -- who created it
  `consultant_name` VARCHAR(255) DEFAULT 'Anonymous',
  `duration_days` INT DEFAULT 3,
  `vibe` VARCHAR(100) DEFAULT 'adventure',            -- adventure | wellness | culinary | cultural
  `pace` VARCHAR(50) DEFAULT 'moderate',              -- slow | moderate | active
  `group_size_min` INT DEFAULT 1,
  `group_size_max` INT DEFAULT 10,
  `price_usd` DECIMAL(10,2) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `included_services` JSON DEFAULT (JSON_ARRAY()),    -- ["accommodation", "food", "tours"]
  `difficulty` ENUM('easy', 'moderate', 'challenging') DEFAULT 'moderate',
  `best_season` VARCHAR(100) DEFAULT 'Year-round',
  `image_url` VARCHAR(500),
  `is_public` BOOLEAN DEFAULT TRUE,                   -- visible to all visitors
  `is_featured` BOOLEAN DEFAULT FALSE,                -- featured on homepage
  `view_count` INT DEFAULT 0,
  `booking_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_consultant (consultant_id),
  INDEX idx_vibe (vibe),
  INDEX idx_is_public (is_public),
  INDEX idx_is_featured (is_featured),
  INDEX idx_created (created_at),
  FOREIGN KEY (consultant_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 2: Custom Journey Package Items
-- Links specific businesses to a custom package
CREATE TABLE IF NOT EXISTS `custom_journey_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `package_id` VARCHAR(36) NOT NULL,
  `business_id` VARCHAR(36) NOT NULL,
  `parent_type_id` VARCHAR(100) NOT NULL,            -- accommodation | food | adventure | etc
  `parent_type_name` VARCHAR(255),                   -- "Accommodation" | "Food & Beverage"
  `child_type_id` VARCHAR(100) NOT NULL,             -- hotel | siwa_lodge | restaurant | etc
  `child_type_name` VARCHAR(255),                    -- "Full-Service Hotel" | "Restaurant"
  `business_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `price_usd` DECIMAL(10,2) DEFAULT NULL,
  `sequence_order` INT DEFAULT 0,                    -- order in itinerary
  `day_number` INT DEFAULT NULL,                     -- which day (1, 2, 3, etc)
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES custom_journey_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_package (package_id),
  INDEX idx_business (business_id),
  INDEX idx_parent_type (parent_type_id),
  INDEX idx_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 3: Journey Package Bookings
-- Track who booked which custom packages
CREATE TABLE IF NOT EXISTS `custom_journey_bookings` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `package_id` VARCHAR(36) NOT NULL,
  `visitor_name` VARCHAR(255) NOT NULL,
  `visitor_email` VARCHAR(255),
  `visitor_phone` VARCHAR(50),
  `group_size` INT DEFAULT 1,
  `arrival_date` DATE,
  `departure_date` DATE,
  `total_price_usd` DECIMAL(10,2),
  `special_requests` TEXT,
  `status` ENUM('inquiry', 'booked', 'completed', 'cancelled') DEFAULT 'inquiry',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES custom_journey_packages(id) ON DELETE CASCADE,
  INDEX idx_package (package_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ✓ custom_journey_packages      - main package definition
-- ✓ custom_journey_items         - businesses included in package
-- ✓ custom_journey_bookings      - visitor bookings/inquiries
-- ════════════════════════════════════════════════════════════════════

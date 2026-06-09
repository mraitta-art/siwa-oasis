-- ════════════════════════════════════════════════════════════════════
-- Migration 014: Enhanced Itinerary Timeline System
-- Feature: Day-by-day scheduling with multiple activities per day
--          at specific times with durations
-- ════════════════════════════════════════════════════════════════════

-- TABLE: Enhanced Journey Timeline Items
-- Stores individual timeline activities with precise timing
CREATE TABLE IF NOT EXISTS `journey_timeline_items` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `package_id` VARCHAR(36) NOT NULL,
  `day_number` INT NOT NULL,                         -- Which day (1, 2, 3, etc)
  `sequence_order` INT DEFAULT 0,                    -- Order within the day (auto-sorted by time)
  `start_time` TIME NOT NULL,                        -- HH:MM format (09:00)
  `duration_minutes` INT DEFAULT 60,                 -- How long (in minutes)
  `end_time` TIME GENERATED ALWAYS AS (
    ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60))
  ) STORED,                                          -- Auto-calculated end time
  
  -- Business Info
  `business_id` VARCHAR(36) NOT NULL,
  `business_name` VARCHAR(255) NOT NULL,
  `business_type_id` VARCHAR(100),
  `business_type_name` VARCHAR(255),
  `parent_type_id` VARCHAR(100),
  `parent_type_name` VARCHAR(255),
  
  -- Additional Details
  `activity_type` VARCHAR(100),                      -- accommodation|meal|tour|experience|transfer
  `notes` TEXT,                                      -- Special instructions
  `location_notes` VARCHAR(255),                     -- e.g., "Main hotel entrance"
  `booking_required` BOOLEAN DEFAULT FALSE,          -- Needs advance booking
  `estimated_cost_usd` DECIMAL(10,2) DEFAULT NULL,
  
  -- Constraints & Validation
  `check_overlap` BOOLEAN DEFAULT TRUE,              -- Flag for checking overlaps
  `is_transition` BOOLEAN DEFAULT FALSE,             -- Transfer between locations
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (package_id) REFERENCES custom_journey_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  INDEX idx_package (package_id),
  INDEX idx_day (day_number),
  INDEX idx_time (start_time),
  INDEX idx_business (business_id),
  INDEX idx_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: Itinerary Day Summaries
-- Quick overview of each day in a journey
CREATE TABLE IF NOT EXISTS `journey_day_summaries` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `package_id` VARCHAR(36) NOT NULL,
  `day_number` INT NOT NULL,
  `theme` VARCHAR(100),                              -- e.g., "Wellness Day", "Adventure Day"
  `summary_description` VARCHAR(500),                -- e.g., "Relax with spa and wellness activities"
  `accommodation_id` VARCHAR(36),                    -- Which hotel for this night
  `accommodation_name` VARCHAR(255),
  `breakfast_included` BOOLEAN DEFAULT TRUE,
  `lunch_included` BOOLEAN DEFAULT FALSE,
  `dinner_included` BOOLEAN DEFAULT TRUE,
  `total_activities_count` INT DEFAULT 0,
  `estimated_day_cost_usd` DECIMAL(10,2),
  `sunrise_time` TIME,                               -- e.g., 06:15
  `sunset_time` TIME,                                -- e.g., 18:45
  `weather_notes` VARCHAR(255),
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (package_id) REFERENCES custom_journey_packages(id) ON DELETE CASCADE,
  FOREIGN KEY (accommodation_id) REFERENCES businesses(id) ON DELETE SET NULL,
  INDEX idx_package (package_id),
  UNIQUE KEY unique_day (package_id, day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: Activity Conflicts & Warnings
-- Flags potential issues in itinerary (overlapping times, etc)
CREATE TABLE IF NOT EXISTS `itinerary_validations` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `package_id` VARCHAR(36) NOT NULL,
  `validation_type` ENUM(
    'overlap_warning',              -- Two activities at same time
    'tight_schedule',               -- Not enough buffer time
    'location_distance',            -- Activities far apart
    'booking_conflict',             -- Needs advance booking
    'missing_accommodation',        -- No accommodation for a day
    'transportation_needed'         -- May need transfer between locations
  ) NOT NULL,
  `day_number` INT,
  `item_id_1` VARCHAR(36),
  `item_id_2` VARCHAR(36),
  `severity` ENUM('info', 'warning', 'error') DEFAULT 'warning',
  `message` TEXT NOT NULL,
  `resolved` BOOLEAN DEFAULT FALSE,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (package_id) REFERENCES custom_journey_packages(id) ON DELETE CASCADE,
  INDEX idx_package (package_id),
  INDEX idx_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════════
-- USAGE EXAMPLES
-- ════════════════════════════════════════════════════════════════════

-- Example: Create a 3-day wellness package
-- INSERT INTO custom_journey_packages (id, name, description, duration_days, vibe, pace, price_usd)
-- VALUES ('pkg_wellness_001', 'Desert Wellness Escape', 'Rejuvenation through natural healing', 3, 'wellness', 'slow', 1200);
--
-- INSERT INTO journey_timeline_items 
--   (package_id, day_number, sequence_order, start_time, duration_minutes, business_id, business_name, activity_type, notes)
-- VALUES
--   ('pkg_wellness_001', 1, 1, '15:00', 30, 'b1', 'Siwa Paradise Hotel', 'accommodation', 'Check-in and rest'),
--   ('pkg_wellness_001', 1, 2, '18:00', 120, 'b7', 'Cleopatra Restaurant', 'meal', 'Welcome dinner'),
--   ('pkg_wellness_001', 2, 1, '07:00', 60, 'b17', 'Siwa Therapeutic Sand Spa', 'experience', 'Sunrise sand bath therapy'),
--   ('pkg_wellness_001', 2, 2, '08:30', 60, 'b1', 'Siwa Paradise Hotel', 'meal', 'Organic breakfast'),
--   ('pkg_wellness_001', 2, 3, '10:00', 120, 'b18', 'Salt Lake Wellness Center', 'experience', 'Salt float and mineral therapy'),
--   ('pkg_wellness_001', 2, 4, '12:30', 90, 'b9', "Grandma Fatima's Kitchen", 'meal', 'Traditional lunch'),
--   ('pkg_wellness_001', 2, 5, '15:00', 120, 'b1', 'Siwa Paradise Hotel', 'experience', 'Spa massage and rest'),
--   ('pkg_wellness_001', 2, 6, '19:00', 120, 'b7', 'Cleopatra Restaurant', 'meal', 'Gourmet dinner'),
--   ('pkg_wellness_001', 3, 1, '07:00', 60, 'b1', 'Siwa Paradise Hotel', 'meal', 'Yoga and breakfast'),
--   ('pkg_wellness_001', 3, 2, '09:00', 60, 'b17', 'Siwa Therapeutic Sand Spa', 'experience', 'Final sand bath'),
--   ('pkg_wellness_001', 3, 3, '11:00', 120, 'b1', 'Siwa Paradise Hotel', 'accommodation', 'Check-out and departure');

-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ✓ journey_timeline_items       - precise activity scheduling
-- ✓ journey_day_summaries        - day-level overview
-- ✓ itinerary_validations       - conflict detection
-- ════════════════════════════════════════════════════════════════════

-- Dynamic, category-specific field templates for repeatable vendor services.
CREATE TABLE IF NOT EXISTS vendor_service_templates (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(80) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_templates_category (category, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS vendor_service_template_fields (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(40) NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options JSON NULL,
  validation JSON NULL,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_template_field (template_id, name),
  INDEX idx_service_template_fields_template (template_id, active, display_order),
  CONSTRAINT fk_service_template_fields_template FOREIGN KEY (template_id) REFERENCES vendor_service_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO vendor_service_templates (id, category, label, description) VALUES
  ('accommodation_standard', 'accommodation', 'Accommodation service', 'Rooms, lodges, camps, and stays.'),
  ('transportation_standard', 'transportation', 'Transportation service', 'Transfers, vehicles, drivers, and rentals.'),
  ('restaurant_standard', 'restaurant', 'Food and dining service', 'Meals, restaurants, catering, and dining experiences.'),
  ('activity_standard', 'activity', 'Activity service', 'Wellness, cultural, and adventure activities.'),
  ('tour_standard', 'tour', 'Tour service', 'Guided, private, group, and self-guided tours.'),
  ('package_standard', 'package', 'Package service', 'Combined journeys and service bundles.')
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), active = TRUE;

INSERT INTO vendor_service_template_fields (id, template_id, name, label, field_type, required, options, display_order) VALUES
  (UUID(), 'accommodation_standard', 'unit_type', 'Room / Unit Type', 'select', TRUE, JSON_ARRAY('Standard Room','Suite','Eco Lodge','Luxury Tent','Family Villa'), 10),
  (UUID(), 'accommodation_standard', 'capacity', 'Guest Capacity', 'number', TRUE, NULL, 20),
  (UUID(), 'accommodation_standard', 'amenities', 'Amenities', 'multiselect', FALSE, JSON_ARRAY('WiFi','Air Conditioning','Breakfast','Pool','Private Bathroom','Dune View'), 30),
  (UUID(), 'accommodation_standard', 'check_in_out', 'Check-in / Check-out', 'text', FALSE, NULL, 40),
  (UUID(), 'transportation_standard', 'vehicle_type', 'Vehicle Type', 'select', TRUE, JSON_ARRAY('Sedan','4x4 Jeep','Minibus','Tuk-Tuk','Bicycle / Scooter'), 10),
  (UUID(), 'transportation_standard', 'route', 'Route / Coverage', 'text', TRUE, NULL, 20),
  (UUID(), 'transportation_standard', 'passenger_capacity', 'Passenger Capacity', 'number', TRUE, NULL, 30),
  (UUID(), 'transportation_standard', 'driver_languages', 'Driver Languages', 'multiselect', FALSE, JSON_ARRAY('Arabic','English','French','Italian'), 40),
  (UUID(), 'restaurant_standard', 'cuisine', 'Cuisine', 'multiselect', TRUE, JSON_ARRAY('Traditional Siwan','Egyptian','Mediterranean','International','Vegetarian','Vegan'), 10),
  (UUID(), 'restaurant_standard', 'service_style', 'Service Style', 'multiselect', FALSE, JSON_ARRAY('Dine-in','Takeaway','Delivery','Catering','Private Events'), 20),
  (UUID(), 'restaurant_standard', 'dietary_options', 'Dietary Options', 'multiselect', FALSE, JSON_ARRAY('Halal','Vegetarian','Vegan','Gluten-free'), 30),
  (UUID(), 'activity_standard', 'activity_type', 'Activity Type', 'select', TRUE, JSON_ARRAY('Wellness','Adventure','Cultural','Nature','Dining'), 10),
  (UUID(), 'activity_standard', 'duration', 'Duration', 'text', TRUE, NULL, 20),
  (UUID(), 'activity_standard', 'difficulty', 'Difficulty', 'select', FALSE, JSON_ARRAY('Easy','Moderate','Challenging'), 30),
  (UUID(), 'activity_standard', 'equipment', 'Equipment Included', 'multiselect', FALSE, JSON_ARRAY('None','Sandboard','Safety Equipment','Telescope','Camping Gear'), 40),
  (UUID(), 'tour_standard', 'tour_type', 'Tour Type', 'select', TRUE, JSON_ARRAY('Private','Group','Self-guided','Half-day','Full-day','Multi-day'), 10),
  (UUID(), 'tour_standard', 'stops', 'Main Stops / Highlights', 'textarea', TRUE, NULL, 20),
  (UUID(), 'tour_standard', 'guide_languages', 'Guide Languages', 'multiselect', FALSE, JSON_ARRAY('Arabic','English','French','Italian'), 30),
  (UUID(), 'package_standard', 'included_services', 'Included Services', 'multiselect', TRUE, JSON_ARRAY('Accommodation','Transportation','Meals','Tours','Activities','Guide'), 10),
  (UUID(), 'package_standard', 'duration_days', 'Duration in Days', 'number', TRUE, NULL, 20),
  (UUID(), 'package_standard', 'group_size', 'Group Size', 'text', FALSE, NULL, 30),
  (UUID(), 'package_standard', 'exclusions', 'Exclusions', 'textarea', FALSE, NULL, 40)
ON DUPLICATE KEY UPDATE label = VALUES(label), field_type = VALUES(field_type), options = VALUES(options), display_order = VALUES(display_order), active = TRUE;
-- Section Components - Admins define what components each section has
CREATE TABLE IF NOT EXISTS section_components (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_id VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL COMMENT 'location, hours, team, testimonials, faq, features, pricing, etc.',
    
    -- Component metadata
    label VARCHAR(255) NOT NULL COMMENT 'Display label for vendors',
    description TEXT COMMENT 'Instructions for vendors',
    is_required BOOLEAN DEFAULT FALSE,
    is_repeatable BOOLEAN DEFAULT FALSE COMMENT 'Can add multiple instances',
    max_items INT DEFAULT 1,
    display_order INT DEFAULT 0,
    
    -- Configuration
    config JSON DEFAULT NULL COMMENT 'Component-specific config (fields, options, etc.)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_section_id (section_id),
    INDEX idx_component_type (component_type),
    INDEX idx_display_order (display_order),
    
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Component data - Vendors fill in data for components
CREATE TABLE IF NOT EXISTS section_component_data (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_component_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100),
    
    -- Component content
    title VARCHAR(255),
    data JSON NOT NULL COMMENT 'Component data as JSON',
    
    -- Publishing
    status ENUM('draft', 'published', 'pending_approval') DEFAULT 'draft',
    approved_by_admin VARCHAR(100),
    published_at TIMESTAMP NULL,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_section_component_id (section_component_id),
    INDEX idx_business_id (business_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (section_component_id) REFERENCES section_components(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Available component templates library
CREATE TABLE IF NOT EXISTS component_templates (
    id VARCHAR(50) PRIMARY KEY COMMENT 'location, hours, team_member, testimonial, faq_item, feature, price_tier, etc.',
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    category VARCHAR(100) COMMENT 'Basic, Advanced, Showcase',
    fields JSON COMMENT 'Default field definitions for this component type',
    example_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-populate component templates
INSERT INTO component_templates VALUES
('location', 'Location', 'fa-map-pin', 'Business location with map coordinates', 'Basic', 
 '[{"name": "address", "type": "text", "label": "Full Address", "required": true}, {"name": "lat", "type": "number", "label": "Latitude"}, {"name": "lng", "type": "number", "label": "Longitude"}, {"name": "phone", "type": "tel", "label": "Contact Phone"}]',
 '{"address": "123 Desert Ave, Dubai", "lat": 25.2048, "lng": 55.2708, "phone": "+971501234567"}',
 NOW()),

('hours', 'Business Hours', 'fa-clock', 'Operating hours for the business', 'Basic',
 '[{"name": "day", "type": "select", "label": "Day", "options": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}, {"name": "open", "type": "time", "label": "Opens"}, {"name": "close", "type": "time", "label": "Closes"}, {"name": "closed", "type": "checkbox", "label": "Closed"}]',
 '{"day": "Monday", "open": "09:00", "close": "21:00", "closed": false}',
 NOW()),

('team_member', 'Team Member', 'fa-user', 'Team member profile card', 'Basic',
 '[{"name": "name", "type": "text", "label": "Name", "required": true}, {"name": "role", "type": "text", "label": "Role/Position"}, {"name": "bio", "type": "textarea", "label": "Bio"}, {"name": "image", "type": "image", "label": "Photo"}, {"name": "phone", "type": "tel", "label": "Phone"}]',
 '{"name": "Ahmed Al-Mansouri", "role": "Manager", "bio": "15 years of hospitality experience", "phone": "+971501234567"}',
 NOW()),

('testimonial', 'Customer Testimonial', 'fa-quote-left', 'Customer review or testimonial', 'Basic',
 '[{"name": "customer_name", "type": "text", "label": "Customer Name", "required": true}, {"name": "rating", "type": "select", "label": "Rating", "options": ["5", "4", "3", "2", "1"]}, {"name": "quote", "type": "textarea", "label": "Review Text", "required": true}, {"name": "photo", "type": "image", "label": "Customer Photo"}]',
 '{"customer_name": "Fatima Al-Maktoum", "rating": "5", "quote": "Excellent service and amazing experience!", "photo": ""}',
 NOW()),

('faq', 'FAQ Item', 'fa-question-circle', 'Frequently asked question and answer', 'Basic',
 '[{"name": "question", "type": "text", "label": "Question", "required": true}, {"name": "answer", "type": "textarea", "label": "Answer", "required": true}]',
 '{"question": "What are your hours?", "answer": "We are open 9AM-10PM daily"}',
 NOW()),

('feature', 'Feature/Highlight', 'fa-star', 'Product or service feature', 'Showcase',
 '[{"name": "title", "type": "text", "label": "Feature Title", "required": true}, {"name": "description", "type": "textarea", "label": "Description"}, {"name": "icon", "type": "text", "label": "Icon/Image"}, {"name": "highlight", "type": "checkbox", "label": "Featured Highlight"}]',
 '{"title": "24/7 Support", "description": "Always available for our customers", "icon": "fa-headset", "highlight": true}',
 NOW()),

('pricing', 'Pricing Tier', 'fa-tag', 'Product or service pricing', 'Showcase',
 '[{"name": "name", "type": "text", "label": "Tier Name", "required": true}, {"name": "price", "type": "number", "label": "Price", "required": true}, {"name": "currency", "type": "text", "label": "Currency", "default": "AED"}, {"name": "description", "type": "textarea", "label": "What is included"}, {"name": "features", "type": "textarea", "label": "Features (one per line)"}]',
 '{"name": "Gold Package", "price": 599, "currency": "AED", "description": "Premium services", "features": "24/7 Support\\nFree Consultation"}',
 NOW()),

('gallery_showcase', 'Gallery Showcase', 'fa-images', 'Curated gallery of images', 'Showcase',
 '[{"name": "title", "type": "text", "label": "Gallery Title"}, {"name": "images", "type": "image-multi", "label": "Upload Images", "max": 20}]',
 '{"title": "Our Work", "images": []}',
 NOW());

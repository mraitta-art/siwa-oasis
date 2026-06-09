-- Migration 015: Create Visitor Recommendations & Lead Tracking System
-- Purpose: Capture visitor suggestions for new businesses that don't exist in database
-- This enables hybrid mode: real data + sample data + visitor suggestions → leads

-- ============================================================================
-- Table 1: Visitor Recommendations (Core Lead Capture)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visitor_recommendations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Business Information
    business_name VARCHAR(255) NOT NULL,
    business_type_id VARCHAR(100),
    parent_type_id VARCHAR(100) NOT NULL,
    description MEDIUMTEXT,
    location VARCHAR(255),
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Visitor Information (Lead Source)
    visitor_id VARCHAR(36),
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visitor_country VARCHAR(100),
    visitor_language VARCHAR(10),
    
    -- Journey Context
    journey_id VARCHAR(36),
    journey_package_id VARCHAR(36),
    journey_context MEDIUMTEXT,
    why_recommended TEXT,
    urgency_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    
    -- Status Management
    status ENUM('pending', 'under_review', 'approved', 'converted', 'ignored') DEFAULT 'pending',
    votes INT DEFAULT 1,
    
    -- Admin Management
    admin_notes TEXT,
    assigned_to_admin_id VARCHAR(36),
    converted_to_business_id VARCHAR(36),
    reject_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    converted_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for Query Optimization
    INDEX idx_status (status),
    INDEX idx_parent_type (parent_type_id),
    INDEX idx_visitor_email (visitor_email),
    INDEX idx_created_at (created_at),
    INDEX idx_votes (votes DESC),
    INDEX idx_assigned_admin (assigned_to_admin_id),
    INDEX idx_converted_business (converted_to_business_id),
    INDEX idx_urgency (urgency_level),
    
    -- Foreign Keys
    FOREIGN KEY (converted_to_business_id) REFERENCES businesses(id) ON DELETE SET NULL,
    CONSTRAINT fk_parent_type CHECK (parent_type_id IN (
        'accommodation', 'food_and_beverage', 'adventure_safari', 
        'health_wellness', 'crafts_trade', 'logistics_transport'
    ))
);

-- ============================================================================
-- Table 2: Recommendation Interactions (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_interactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Reference
    recommendation_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36),
    
    -- Action Details
    action ENUM(
        'viewed', 'voted_up', 'voted_down', 'commented', 
        'assigned', 'converted', 'ignored', 'approved', 'rejected'
    ) NOT NULL,
    details JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    
    -- Foreign Keys
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Table 3: Lead Conversion Log (Track Business Onboarding)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_conversion_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Reference
    recommendation_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(36),
    
    -- Timeline
    suggestion_date TIMESTAMP,
    first_contact_date TIMESTAMP NULL,
    response_received_date TIMESTAMP NULL,
    onboarded_date TIMESTAMP NULL,
    
    -- Contact Information
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(20),
    
    -- Outcome
    conversion_status ENUM(
        'pending', 'contacted', 'interested', 'negotiating', 
        'agreed', 'onboarded', 'rejected', 'no_response'
    ) DEFAULT 'pending',
    conversion_notes TEXT,
    estimated_value_usd DECIMAL(10, 2),
    
    -- Sales Assignment
    assigned_to_sales_id VARCHAR(36),
    follow_up_date DATE NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_business_id (business_id),
    INDEX idx_status (conversion_status),
    INDEX idx_assigned_sales (assigned_to_sales_id),
    INDEX idx_follow_up (follow_up_date),
    
    -- Foreign Keys
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
);

-- ============================================================================
-- Table 4: Recommendation Analytics (Stats & Insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_analytics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Period
    report_date DATE NOT NULL,
    report_period ENUM('daily', 'weekly', 'monthly', 'quarterly') DEFAULT 'daily',
    
    -- Counts
    total_recommendations INT DEFAULT 0,
    new_recommendations INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    converted_count INT DEFAULT 0,
    ignored_count INT DEFAULT 0,
    
    -- By Category
    by_parent_type JSON,
    by_urgency JSON,
    by_visitor_country JSON,
    
    -- Conversion Metrics
    conversion_rate DECIMAL(5, 2),
    avg_time_to_conversion_days INT,
    top_recommended_type VARCHAR(100),
    top_recommended_business VARCHAR(255),
    
    -- Visitor Metrics
    unique_visitors INT,
    repeat_suggesters INT,
    avg_suggestions_per_visitor DECIMAL(5, 2),
    
    -- Created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_report_date (report_date),
    INDEX idx_report_period (report_period),
    UNIQUE KEY unique_period (report_date, report_period)
);

-- ============================================================================
-- Views for Admin Dashboard
-- ============================================================================

-- View: Active Recommendations (Not yet processed)
CREATE OR REPLACE VIEW vw_active_recommendations AS
SELECT 
    r.id,
    r.business_name,
    r.parent_type_id,
    r.visitor_name,
    r.visitor_email,
    r.votes,
    r.urgency_level,
    r.status,
    r.created_at,
    (SELECT COUNT(*) FROM recommendation_interactions WHERE recommendation_id = r.id) as interaction_count
FROM visitor_recommendations r
WHERE r.status IN ('pending', 'under_review', 'approved')
ORDER BY r.votes DESC, r.urgency_level DESC, r.created_at DESC;

-- View: High-Value Leads (Multi-voted, high urgency)
CREATE OR REPLACE VIEW vw_high_value_leads AS
SELECT 
    r.id,
    r.business_name,
    r.parent_type_id,
    r.votes,
    COUNT(DISTINCT r.visitor_email) as unique_voters,
    r.urgency_level,
    r.status,
    r.created_at
FROM visitor_recommendations r
WHERE r.votes >= 2 AND r.urgency_level IN ('medium', 'high')
AND r.status IN ('pending', 'under_review')
GROUP BY r.id
ORDER BY r.votes DESC;

-- View: Conversion Performance
CREATE OR REPLACE VIEW vw_conversion_performance AS
SELECT 
    DATE(r.created_at) as date,
    COUNT(DISTINCT r.id) as total_suggestions,
    COUNT(DISTINCT CASE WHEN r.status = 'converted' THEN r.id END) as converted,
    COUNT(DISTINCT CASE WHEN r.status = 'converted' THEN r.id END) / COUNT(DISTINCT r.id) * 100 as conversion_rate_percent
FROM visitor_recommendations r
GROUP BY DATE(r.created_at)
ORDER BY date DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Composite index for common admin queries
ALTER TABLE visitor_recommendations 
ADD INDEX idx_status_created (status, created_at DESC);

ALTER TABLE visitor_recommendations 
ADD INDEX idx_parent_urgency (parent_type_id, urgency_level, status);

ALTER TABLE visitor_recommendations 
ADD INDEX idx_visitor_journey (visitor_email, journey_context(100));

-- ============================================================================
-- Sample Data (For Testing)
-- ============================================================================

-- Insert sample recommendations for testing
INSERT INTO visitor_recommendations (
    business_name, business_type_id, parent_type_id, description,
    visitor_name, visitor_email, visitor_country,
    journey_context, why_recommended, urgency_level, status, votes
) VALUES
(
    'Ali\'s Authentic Siwan Bistro',
    'modern_siwan_restaurant',
    'food_and_beverage',
    'Traditional Siwan cuisine with modern presentation, located in old town',
    'John Smith', 'john@example.com', 'United States',
    '3-Day Culinary Escape Package', 'Best local food we found, authentic flavors', 'high', 'pending', 3
),
(
    'Desert Rose Eco-Camp',
    'eco_lodge',
    'accommodation',
    'Sustainable eco-lodge with solar power and traditional architecture',
    'Sarah Johnson', 'sarah@example.com', 'United Kingdom',
    'Sustainable Tourism Journey', 'Amazing environmental practices', 'medium', 'pending', 2
),
(
    'Siwa Traditional Crafts Workshop',
    'craft_workshop',
    'crafts_trade',
    'Interactive weaving and pottery workshop run by local artisans',
    'Maria Garcia', 'maria@example.com', 'Spain',
    'Cultural Immersion Package', 'Incredible hands-on experience', 'high', 'under_review', 5
);

-- ============================================================================
-- End of Migration 015
-- ============================================================================

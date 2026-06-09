-- Migration 016: Admin Permission & Vendor Sales System
-- Purpose: Add admin approval, permissions, and vendor sales tracking to Option 3
-- Features: Permission control, visibility control, sales pipeline, revenue tracking

-- ============================================================================
-- Table 1: Enhanced visitor_recommendations (Updated from Migration 015)
-- ============================================================================

-- First, back up and modify existing table if it exists
ALTER TABLE visitor_recommendations
ADD COLUMN IF NOT EXISTS admin_permission_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS admin_id_assigned VARCHAR(36),
ADD COLUMN IF NOT EXISTS admin_permission_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_permission_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS permit_decision ENUM('approved', 'rejected', 'pending') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS visible_to_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visible_to_admin BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS visible_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_status ENUM(
    'not_contacted', 'outreach_sent', 'no_response', 'interested',
    'negotiating', 'agreed', 'rejected_by_vendor', 'already_listed'
) DEFAULT 'not_contacted',
ADD COLUMN IF NOT EXISTS sales_lead_assigned_to VARCHAR(36),
ADD COLUMN IF NOT EXISTS sales_outreach_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS sales_response_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS sales_value_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sales_term_months INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_notes TEXT;

-- Update status enum to include new options
ALTER TABLE visitor_recommendations 
MODIFY COLUMN status ENUM(
    'pending', 'under_review', 'approved', 'converted', 'ignored',
    'approved_free', 'approved_premium', 'vendor_outreach',
    'vendor_interested', 'vendor_negotiating', 'rejected'
) DEFAULT 'pending';

-- Add indexes for new columns
ALTER TABLE visitor_recommendations
ADD INDEX IF NOT EXISTS idx_admin_permission (admin_permission_required, permit_decision),
ADD INDEX IF NOT EXISTS idx_visible (visible_to_public, visible_to_admin),
ADD INDEX IF NOT EXISTS idx_sales_status (sales_status),
ADD INDEX IF NOT EXISTS idx_admin_assigned (admin_id_assigned);

-- ============================================================================
-- Table 2: Admin Permission Audit Trail (New)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_permissions_audit (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL,
    
    action ENUM(
        'viewed',
        'permitted_free',
        'permitted_premium',
        'rejected',
        'assigned_to_sales',
        'vendor_contacted',
        'vendor_response',
        'converted',
        'visibility_changed'
    ) NOT NULL,
    
    permission_granted BOOLEAN DEFAULT NULL,
    notes MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Table 3: Vendor Sales Pipeline (New)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_sales_pipeline (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36),
    
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255) NOT NULL,
    vendor_phone VARCHAR(20),
    vendor_website VARCHAR(500),
    
    -- Pipeline Stage
    stage ENUM(
        'prospect',
        'outreach_sent',
        'responded',
        'qualified',
        'proposal_sent',
        'negotiating',
        'won',
        'lost'
    ) DEFAULT 'prospect',
    
    -- Pricing
    offering_type ENUM('featured', 'premium', 'standard') DEFAULT 'standard',
    monthly_price_usd DECIMAL(10, 2),
    annual_price_usd DECIMAL(10, 2),
    contract_term_months INT DEFAULT 0,
    
    -- Engagement
    outreach_email_count INT DEFAULT 0,
    last_contact_date TIMESTAMP NULL,
    next_followup_date DATE NULL,
    response_count INT DEFAULT 0,
    
    -- Decision
    vendor_decision ENUM(
        'pending',
        'interested',
        'not_interested',
        'already_listed',
        'needs_more_info',
        'agreed'
    ) DEFAULT 'pending',
    
    vendor_decision_date TIMESTAMP NULL,
    vendor_notes MEDIUMTEXT,
    
    -- Sales Rep
    assigned_to_sales_id VARCHAR(36),
    assigned_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    won_date TIMESTAMP NULL,
    lost_date TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_stage (stage),
    INDEX idx_assigned_sales (assigned_to_sales_id),
    INDEX idx_followup (next_followup_date),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Table 4: Admin Permission Settings (New)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_permission_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(36) NOT NULL UNIQUE,
    
    -- Permission Levels
    can_view_recommendations BOOLEAN DEFAULT TRUE,
    can_approve_recommendations BOOLEAN DEFAULT FALSE,
    can_reject_recommendations BOOLEAN DEFAULT FALSE,
    can_contact_vendors BOOLEAN DEFAULT FALSE,
    can_view_revenue BOOLEAN DEFAULT FALSE,
    can_edit_database BOOLEAN DEFAULT FALSE,
    can_manage_admin_permissions BOOLEAN DEFAULT FALSE,
    
    -- Department/Role
    department ENUM(
        'admin',
        'sales',
        'content',
        'finance',
        'management'
    ) DEFAULT 'admin',
    
    -- Access Level
    access_level ENUM(
        'viewer',
        'reviewer',
        'approver',
        'salesperson',
        'manager',
        'superadmin'
    ) DEFAULT 'viewer',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id),
    INDEX idx_access_level (access_level),
    INDEX idx_department (department)
);

-- ============================================================================
-- Table 5: Revenue Tracking (New)
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_tracking (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36),
    vendor_id VARCHAR(36),
    sales_pipeline_id VARCHAR(36),
    
    -- Revenue Details
    revenue_source ENUM(
        'vendor_featured_listing',
        'vendor_premium_package',
        'commission',
        'affiliate'
    ) DEFAULT 'vendor_featured_listing',
    
    amount_usd DECIMAL(10, 2),
    term_months INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    
    -- Payment Status
    payment_status ENUM(
        'pending',
        'paid',
        'partially_paid',
        'overdue',
        'cancelled'
    ) DEFAULT 'pending',
    
    payment_date TIMESTAMP NULL,
    invoice_number VARCHAR(100),
    
    -- Metrics
    expected_value_usd DECIMAL(10, 2),
    actual_value_usd DECIMAL(10, 2),
    commission_rate_percent DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_start_date (start_date),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE SET NULL
);

-- ============================================================================
-- Views for Admin Dashboard
-- ============================================================================

-- View: Pending Permissions (Admin needs to decide)
CREATE OR REPLACE VIEW vw_pending_permissions AS
SELECT 
    r.id,
    r.business_name,
    r.parent_type_id,
    r.visitor_name,
    r.votes,
    r.urgency_level,
    r.created_at,
    DATEDIFF(NOW(), r.created_at) as days_pending,
    r.contact_email as vendor_email,
    r.contact_phone as vendor_phone,
    'APPROVE' as recommended_action
FROM visitor_recommendations r
WHERE r.status = 'pending'
  AND r.admin_permission_required = TRUE
  AND r.permit_decision = 'pending'
ORDER BY r.votes DESC, r.urgency_level DESC, r.created_at ASC;

-- View: Active Vendor Outreach (Sales in progress)
CREATE OR REPLACE VIEW vw_active_vendor_outreach AS
SELECT 
    vsp.id as pipeline_id,
    r.id as recommendation_id,
    r.business_name,
    vsp.vendor_name,
    vsp.vendor_email,
    vsp.stage,
    vsp.vendor_decision,
    vsp.monthly_price_usd,
    vsp.next_followup_date,
    vsp.assigned_to_sales_id,
    DATEDIFF(vsp.next_followup_date, NOW()) as days_until_followup
FROM vendor_sales_pipeline vsp
JOIN visitor_recommendations r ON vsp.recommendation_id = r.id
WHERE vsp.stage IN ('outreach_sent', 'responded', 'qualified', 'proposal_sent', 'negotiating')
  AND (vsp.next_followup_date IS NULL OR vsp.next_followup_date <= CURDATE() + INTERVAL 7 DAY)
ORDER BY vsp.next_followup_date ASC;

-- View: Revenue Pipeline (Expected income)
CREATE OR REPLACE VIEW vw_revenue_pipeline AS
SELECT 
    vsp.id,
    r.business_name,
    vsp.vendor_name,
    vsp.offering_type,
    vsp.monthly_price_usd,
    vsp.contract_term_months,
    (vsp.monthly_price_usd * vsp.contract_term_months) as total_contract_value,
    vsp.stage,
    vsp.vendor_decision,
    CASE 
        WHEN vsp.stage = 'won' THEN 'CONFIRMED'
        WHEN vsp.stage IN ('proposal_sent', 'negotiating') THEN 'LIKELY'
        WHEN vsp.stage IN ('qualified', 'responded') THEN 'POSSIBLE'
        ELSE 'UNLIKELY'
    END as confidence_level
FROM vendor_sales_pipeline vsp
JOIN visitor_recommendations r ON vsp.recommendation_id = r.id
WHERE vsp.stage != 'lost';

-- View: Monthly Revenue Report
CREATE OR REPLACE VIEW vw_monthly_revenue_report AS
SELECT 
    DATE_TRUNC(r.created_at, MONTH) as month,
    COUNT(DISTINCT r.id) as total_recommendations,
    SUM(CASE WHEN r.permit_decision = 'approved' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN vsp.stage = 'won' THEN 1 ELSE 0 END) as vendor_deals_won,
    SUM(CASE WHEN vsp.stage = 'won' THEN (vsp.monthly_price_usd * vsp.contract_term_months) ELSE 0 END) as revenue_generated,
    ROUND(SUM(CASE WHEN vsp.stage = 'won' THEN 1 ELSE 0 END) / COUNT(DISTINCT r.id) * 100, 2) as conversion_rate
FROM visitor_recommendations r
LEFT JOIN vendor_sales_pipeline vsp ON r.id = vsp.recommendation_id
GROUP BY DATE_TRUNC(r.created_at, MONTH)
ORDER BY month DESC;

-- ============================================================================
-- Sample Data: Demo Admin Settings
-- ============================================================================

INSERT INTO admin_permission_settings (admin_id, can_view_recommendations, can_approve_recommendations, 
    can_reject_recommendations, can_contact_vendors, can_edit_database, department, access_level)
VALUES
    ('admin_001', TRUE, TRUE, TRUE, FALSE, TRUE, 'admin', 'approver'),
    ('admin_002', TRUE, FALSE, FALSE, TRUE, FALSE, 'sales', 'salesperson'),
    ('admin_003', TRUE, TRUE, TRUE, TRUE, TRUE, 'management', 'manager'),
    ('admin_004', TRUE, FALSE, FALSE, FALSE, FALSE, 'admin', 'viewer');

-- ============================================================================
-- End of Migration 016
-- ============================================================================

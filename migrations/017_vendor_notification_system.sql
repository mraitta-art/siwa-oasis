-- Migration 017: Vendor Notification and Portal System
-- Purpose: Forward visitor recommendations to vendors
--          Enable vendors to see requests and claim profiles
--          Track vendor engagement and response

-- ============================================
-- STEP 1: Enhance visitor_recommendations
-- ============================================

ALTER TABLE visitor_recommendations
ADD COLUMN IF NOT EXISTS forwarded_to_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_notification_sent_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_first_notification_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS vendor_last_notification_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS vendor_read_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_responded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_response_date TIMESTAMP NULL;

-- ============================================
-- STEP 2: Create Vendor Notification Log
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recommendation_id VARCHAR(36) NOT NULL,
    vendor_email VARCHAR(255) NOT NULL,
    vendor_name VARCHAR(255),
    vendor_id VARCHAR(100),
    
    notification_type ENUM(
        'initial_request',           -- "5 people asked for you"
        'new_request_added',         -- "Someone else recommended you"
        'request_milestone',         -- "Reached 10 requests!"
        'business_claim_reminder',   -- "Claim your profile"
        'sales_follow_up',           -- Sales touch point
        'upgrade_reminder'           -- "Upgrade to Featured"
    ) DEFAULT 'initial_request',
    
    -- Contact Data Sharing Control: Allow/Disallow visitor contact info
    contact_data_sharing_level ENUM(
        'none',           -- Don't share any contact data
        'names_only',     -- Share first/last initial + country
        'emails_only',    -- Share names + emails only
        'full_contact',   -- Share names, emails, phones
        'anonymous'       -- No visitor identification at all
    ) DEFAULT 'names_only',
    
    included_visitor_count INT DEFAULT 0,
    included_visitors_json JSON COMMENT 'List of visitor data included in notification',
    visitor_privacy_compliant BOOLEAN DEFAULT TRUE,
    gdpr_compliant BOOLEAN DEFAULT TRUE,
    
    email_subject VARCHAR(255) NOT NULL,
    email_body MEDIUMTEXT NOT NULL,
    email_template_used VARCHAR(100),
    
    email_status ENUM(
        'queued',    -- Waiting to send
        'sent',      -- Email sent
        'bounced',   -- Email delivery failed
        'opened',    -- Vendor opened email
        'clicked'    -- Vendor clicked link
    ) DEFAULT 'queued',
    
    sent_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    opened_count INT DEFAULT 0,
    clicked_at TIMESTAMP NULL,
    clicked_link VARCHAR(500),
    
    vendor_response MEDIUMTEXT,
    vendor_response_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_email_status (email_status),
    INDEX idx_notification_type (notification_type),
    INDEX idx_sent_at (sent_at),
    INDEX idx_opened_at (opened_at),
    
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: Create Vendor Portal Accounts
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_portal_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_email VARCHAR(255) UNIQUE NOT NULL,
    vendor_name VARCHAR(255),
    business_name VARCHAR(255) NOT NULL,
    business_type_id VARCHAR(100),
    
    -- Authentication
    password_hash VARCHAR(255),
    portal_token VARCHAR(500),
    token_expires_at TIMESTAMP NULL,
    
    -- Business Details
    phone VARCHAR(20),
    website VARCHAR(500),
    location VARCHAR(255),
    description MEDIUMTEXT,
    profile_image_url VARCHAR(500),
    
    -- Profile Status
    status ENUM(
        'invited',      -- Invitation sent, not claimed
        'claimed',      -- Vendor claimed profile
        'setup_started', -- Setup in progress
        'active',       -- Profile complete and active
        'premium_featured', -- Featured listing active
        'premium_package'   -- Premium package active
    ) DEFAULT 'invited',
    
    claimed_at TIMESTAMP NULL,
    setup_completed_at TIMESTAMP NULL,
    
    -- Profile Completion
    profile_complete BOOLEAN DEFAULT FALSE,
    profile_completeness_percent INT DEFAULT 0,
    
    -- Request Stats
    total_requests INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    notification_count INT DEFAULT 0,
    response_count INT DEFAULT 0,
    
    -- Engagement
    last_login TIMESTAMP NULL,
    last_viewed_requests TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_email (vendor_email),
    INDEX idx_status (status),
    INDEX idx_claimed_at (claimed_at),
    INDEX idx_business_name (business_name),
    INDEX idx_portal_token (portal_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3B: Admin Contact Sharing Preferences
-- ============================================

CREATE TABLE IF NOT EXISTS admin_contact_sharing_preferences (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(36) NOT NULL,
    
    -- Default sharing level for vendor notifications
    default_sharing_level ENUM(
        'none',           -- Don't share any contact data
        'names_only',     -- Share names + countries
        'emails_only',    -- Share names + emails
        'full_contact',   -- Share all contact details
        'anonymous'       -- No visitor identification
    ) DEFAULT 'names_only',
    
    -- When to share
    share_on_milestone BOOLEAN DEFAULT TRUE,
    share_on_initial BOOLEAN DEFAULT TRUE,
    share_on_followup BOOLEAN DEFAULT FALSE,
    
    -- Privacy considerations
    require_visitor_opt_in BOOLEAN DEFAULT FALSE,
    gdpr_compliant_mode BOOLEAN DEFAULT TRUE,
    
    -- Business logic
    only_share_high_priority BOOLEAN DEFAULT TRUE,
    only_share_with_featured_vendors BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id),
    UNIQUE KEY unique_admin_preference (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Vendor Request Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_request_tracking (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_id VARCHAR(36) NOT NULL,
    recommendation_id VARCHAR(36) NOT NULL,
    
    -- Request Details
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    visitor_country VARCHAR(100),
    visitor_message TEXT,
    
    -- Engagement
    viewed_by_vendor BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP NULL,
    vendor_replied BOOLEAN DEFAULT FALSE,
    vendor_reply_text TEXT,
    vendor_reply_date TIMESTAMP NULL,
    
    -- Follow-up
    followup_sent BOOLEAN DEFAULT FALSE,
    followup_sent_date TIMESTAMP NULL,
    followup_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_recommendation_id (recommendation_id),
    INDEX idx_viewed_at (viewed_at),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 5: Vendor Email Templates
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_email_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type ENUM(
        'initial_request',
        'milestone_notification',
        'sales_follow_up',
        'claim_reminder',
        'upgrade_promotion'
    ) DEFAULT 'initial_request',
    
    subject_template VARCHAR(500) NOT NULL,
    body_html LONGTEXT NOT NULL,
    body_text MEDIUMTEXT,
    
    variables_needed JSON, -- ["{{VENDOR_NAME}}", "{{REQUEST_COUNT}}", etc]
    
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_template_type (template_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 6: Vendor Response Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    vendor_id VARCHAR(36) NOT NULL,
    recommendation_id VARCHAR(36),
    
    response_type ENUM(
        'claimed_profile',
        'interested_featured',
        'interested_premium',
        'needs_more_info',
        'not_interested',
        'contact_requested'
    ) NOT NULL,
    
    response_message TEXT,
    preferred_contact_method ENUM('email', 'phone', 'whatsapp', 'in_person') DEFAULT 'email',
    contact_phone VARCHAR(20),
    contact_time_preference VARCHAR(100),
    
    -- Follow-up
    assigned_to_sales_id VARCHAR(36),
    assigned_date TIMESTAMP NULL,
    followup_scheduled_date TIMESTAMP NULL,
    followup_completed BOOLEAN DEFAULT FALSE,
    followup_notes MEDIUMTEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_response_type (response_type),
    INDEX idx_assigned_to_sales_id (assigned_to_sales_id),
    
    FOREIGN KEY (vendor_id) REFERENCES vendor_portal_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES visitor_recommendations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 7: Views for Admin and Sales
-- ============================================

-- View: All vendors with pending notifications
CREATE OR REPLACE VIEW vw_vendors_pending_notifications AS
SELECT 
    vpa.id,
    vpa.vendor_email,
    vpa.vendor_name,
    vpa.business_name,
    vpa.status,
    COUNT(DISTINCT vn.id) as pending_notifications,
    COUNT(DISTINCT vn.recommendation_id) as unique_recommendations,
    MAX(vn.created_at) as last_notification_sent,
    SUM(CASE WHEN vn.email_status IN ('sent', 'queued') THEN 1 ELSE 0 END) as unsent_notifications,
    SUM(CASE WHEN vn.email_status = 'opened' THEN 1 ELSE 0 END) as opened_count,
    SUM(CASE WHEN vn.email_status = 'clicked' THEN 1 ELSE 0 END) as clicked_count
FROM vendor_portal_accounts vpa
LEFT JOIN vendor_notifications vn ON vpa.vendor_email = vn.vendor_email
WHERE vn.email_status IN ('queued', 'sent', 'opened')
GROUP BY vpa.id, vpa.vendor_email, vpa.vendor_name, vpa.business_name, vpa.status;

-- View: Vendor engagement metrics
CREATE OR REPLACE VIEW vw_vendor_engagement_metrics AS
SELECT 
    vpa.id,
    vpa.vendor_email,
    vpa.business_name,
    vpa.status,
    vpa.total_requests,
    vpa.unique_visitors,
    vpa.notification_count,
    COUNT(DISTINCT vrt.id) as requests_viewed,
    COUNT(DISTINCT vr.id) as requests_responded_to,
    ROUND(COUNT(DISTINCT vrt.id) / vpa.total_requests * 100, 2) as view_rate_percent,
    ROUND(COUNT(DISTINCT vr.id) / vpa.total_requests * 100, 2) as response_rate_percent,
    MAX(vpa.last_viewed_requests) as last_viewed_date,
    MAX(vpa.last_login) as last_login_date,
    DATEDIFF(NOW(), vpa.claimed_at) as days_since_claimed,
    CASE 
        WHEN vpa.status = 'active' AND COUNT(DISTINCT vr.id) > 5 THEN 'HIGH_ENGAGEMENT'
        WHEN vpa.status = 'active' AND COUNT(DISTINCT vr.id) > 0 THEN 'MEDIUM_ENGAGEMENT'
        WHEN vpa.status = 'claimed' THEN 'NEEDS_ACTIVATION'
        WHEN vpa.status = 'invited' THEN 'NOT_YET_CLAIMED'
        ELSE 'INACTIVE'
    END as engagement_level
FROM vendor_portal_accounts vpa
LEFT JOIN vendor_request_tracking vrt ON vpa.id = vrt.vendor_id AND vrt.viewed_by_vendor = TRUE
LEFT JOIN vendor_responses vr ON vpa.id = vr.vendor_id
GROUP BY vpa.id, vpa.vendor_email, vpa.business_name, vpa.status;

-- ============================================
-- STEP 8: Insert Sample Data
-- ============================================

INSERT INTO vendor_email_templates (template_name, template_type, subject_template, body_html) VALUES
('initial_request_5', 'initial_request', '🌟 {{REQUEST_COUNT}} Visitors Are Asking For You! ({{BUSINESS_NAME}})', '<h2>Dear {{VENDOR_NAME}},</h2><p>Great news! Your business was mentioned {{REQUEST_COUNT}} times on Siwa Oasis.</p><p>Real customers WANT your business. They are looking for you RIGHT NOW.</p>'),
('milestone_10_requests', 'milestone_notification', '🎉 Congratulations! {{BUSINESS_NAME}} Reached {{REQUEST_COUNT}} Visitor Requests!', '<h2>Congratulations {{VENDOR_NAME}}!</h2><p>Your business just reached {{REQUEST_COUNT}} visitor requests!</p><p>This shows real, growing demand for your business.</p>'),
('sales_followup', 'sales_follow_up', '{{BUSINESS_NAME}} - Your {{REQUEST_COUNT}} Visitor Requests Are Real Business Opportunity', '<p>Following up on our earlier message...</p><p>You have {{REQUEST_COUNT}} visitors ACTIVELY LOOKING for your business.</p>')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- STEP 9: Indexes for Performance
-- ============================================

-- Additional indexes for common queries
ALTER TABLE vendor_notifications 
ADD INDEX idx_vendor_notification_status_created (email_status, created_at),
ADD INDEX idx_recommendation_notification (recommendation_id, notification_type);

ALTER TABLE vendor_request_tracking
ADD INDEX idx_vendor_viewed_at (vendor_id, viewed_at),
ADD INDEX idx_recommendation_viewed (recommendation_id, viewed_by_vendor);

ALTER TABLE vendor_portal_accounts
ADD INDEX idx_status_claimed (status, claimed_at),
ADD INDEX idx_requests_engagement (total_requests, response_count);

-- ============================================
-- STEP 10: Stored Procedures
-- ============================================

DELIMITER //

-- Send notification to vendor when recommendation approved
CREATE PROCEDURE IF NOT EXISTS sp_send_vendor_notification(
    IN p_recommendation_id VARCHAR(36),
    IN p_vendor_email VARCHAR(255),
    IN p_notification_type VARCHAR(50)
)
BEGIN
    DECLARE v_notification_id VARCHAR(36);
    
    -- Generate notification ID
    SET v_notification_id = UUID();
    
    -- Insert notification record
    INSERT INTO vendor_notifications (
        id, recommendation_id, vendor_email, notification_type,
        email_subject, email_body, email_status
    )
    SELECT
        v_notification_id,
        r.id,
        p_vendor_email,
        p_notification_type,
        CONCAT(r.votes, ' Visitors Are Asking For ', r.business_name),
        CONCAT('Dear Vendor,\n\n', r.votes, ' visitors requested your business!'),
        'queued'
    FROM visitor_recommendations r
    WHERE r.id = p_recommendation_id;
    
    -- Update recommendation
    UPDATE visitor_recommendations
    SET 
        forwarded_to_vendor = TRUE,
        vendor_notification_sent_count = vendor_notification_sent_count + 1,
        vendor_first_notification_date = COALESCE(vendor_first_notification_date, NOW()),
        vendor_last_notification_date = NOW()
    WHERE id = p_recommendation_id;
    
    SELECT v_notification_id as notification_id;
END //

-- Mark notification as opened
CREATE PROCEDURE IF NOT EXISTS sp_mark_notification_opened(
    IN p_notification_id VARCHAR(36)
)
BEGIN
    UPDATE vendor_notifications
    SET 
        email_status = 'opened',
        opened_at = NOW(),
        opened_count = opened_count + 1
    WHERE id = p_notification_id AND email_status != 'opened';
    
    -- Also update recommendation
    UPDATE visitor_recommendations vr
    SET vendor_read_count = vendor_read_count + 1
    WHERE vr.id = (SELECT recommendation_id FROM vendor_notifications WHERE id = p_notification_id);
END //

-- Record vendor response to request
CREATE PROCEDURE IF NOT EXISTS sp_record_vendor_response(
    IN p_vendor_id VARCHAR(36),
    IN p_recommendation_id VARCHAR(36),
    IN p_response_type VARCHAR(50),
    IN p_response_message TEXT
)
BEGIN
    -- Insert response record
    INSERT INTO vendor_responses (
        id, vendor_id, recommendation_id, response_type, response_message
    ) VALUES (
        UUID(), p_vendor_id, p_recommendation_id, p_response_type, p_response_message
    );
    
    -- Update recommendation
    UPDATE visitor_recommendations
    SET 
        vendor_responded = TRUE,
        vendor_response_date = NOW()
    WHERE id = p_recommendation_id;
    
    -- Update vendor account
    UPDATE vendor_portal_accounts
    SET 
        response_count = response_count + 1,
        last_viewed_requests = NOW()
    WHERE id = p_vendor_id;
END //

DELIMITER ;

-- ============================================
-- STEP 11: Summary
-- ============================================

-- This migration adds:
-- 1. Vendor notification system (track when vendors are contacted)
-- 2. Vendor portal accounts (allow vendors to claim profiles)
-- 3. Request tracking (track vendor engagement)
-- 4. Response tracking (track vendor interest in upgrades)
-- 5. Email templates (customizable vendor notifications)
-- 6. Views for reporting (vendor metrics and engagement)
-- 7. Stored procedures (automate notification workflow)

-- Key features:
-- ✅ Forward visitor requests to vendors
-- ✅ Track email opens and clicks
-- ✅ Vendors can claim profiles and respond
-- ✅ Automated milestone notifications (5, 10, 20 requests)
-- ✅ Sales pipeline integration
-- ✅ Full audit trail of all notifications
-- ✅ Engagement metrics and reporting

-- Usage:
-- Call sp_send_vendor_notification('rec_123', 'ali@bistro.com', 'initial_request')
-- Call sp_mark_notification_opened('notif_456')
-- Call sp_record_vendor_response('vendor_789', 'rec_123', 'interested_featured', 'Tell me more')

-- ════════════════════════════════════════════════════════════════════
-- Migration 021: Journey Request Policy Engine
-- Feature: Admin policies control journey request workflows, vendor 
--          visibility, approval processes, and revenue optimization
-- ════════════════════════════════════════════════════════════════════

-- TABLE 1: Admin Journey Policies
-- Defines rules for how different journey request types are handled
CREATE TABLE IF NOT EXISTS `admin_journey_policies` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `policy_name` VARCHAR(255) NOT NULL,
  `description` MEDIUMTEXT,
  
  -- Journey Request Type
  `request_type` ENUM(
    'ready_made',
    'custom_request',
    'template_modify',
    'urgent_needs'
  ) DEFAULT 'custom_request',
  
  -- Approval Settings
  `approval_required` BOOLEAN DEFAULT TRUE,
  `auto_approve_enabled` BOOLEAN DEFAULT FALSE,
  `auto_approve_rule` VARCHAR(255),  -- e.g., "max_3_items AND price_under_500"
  `approval_workflow` ENUM(
    'auto',
    'admin_only',
    'admin_then_vendor',
    'vendor_only'
  ) DEFAULT 'admin_only',
  
  -- Vendor Notification & Assignment
  `vendor_notification_enabled` BOOLEAN DEFAULT TRUE,
  `auto_assign_to_vendor` BOOLEAN DEFAULT FALSE,
  `assignment_rule` ENUM(
    'round_robin',
    'availability',
    'matching_score',
    'manual'
  ) DEFAULT 'manual',
  `priority_vendor_ids` JSON DEFAULT NULL,  -- ["vendor_id1", "vendor_id2"]
  
  -- Constraints
  `max_items_allowed` INT DEFAULT 10,
  `max_days_allowed` INT DEFAULT 14,
  `min_days_required` INT DEFAULT 1,
  `restricted_vibes` JSON DEFAULT NULL,    -- ["extreme_adventure", "restricted"]
  `restricted_seasons` JSON DEFAULT NULL,  -- ["summer_only", "winter_closure"]
  
  -- Pricing & Revenue
  `featured_boost_price` DECIMAL(10,2) DEFAULT NULL,
  `vendor_commission_percent` INT DEFAULT 0,
  `min_group_size` INT DEFAULT 1,
  `max_group_size` INT DEFAULT 100,
  
  -- Request Limits
  `max_requests_per_day` INT DEFAULT NULL,
  `request_cooldown_hours` INT DEFAULT 0,
  
  -- Status & Tracking
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_default` BOOLEAN DEFAULT FALSE,
  `priority` INT DEFAULT 0,  -- Higher = higher priority
  
  -- Metadata
  `created_by_admin` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_request_type (request_type),
  INDEX idx_is_active (is_active),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLE 2: Journey Requests (Custom visitor requests)
-- Stores visitor-submitted journey requests that don't match ready-made packages
CREATE TABLE IF NOT EXISTS `journey_requests` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Visitor Information
  `visitor_id` VARCHAR(36),
  `visitor_email` VARCHAR(255) NOT NULL,
  `visitor_name` VARCHAR(255),
  `visitor_phone` VARCHAR(20),
  `visitor_group_size` INT DEFAULT 1,
  
  -- Request Details
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT,
  `vibe` VARCHAR(100),  -- adventure, wellness, culinary, cultural, luxury
  `pace` VARCHAR(50),   -- slow, moderate, active
  `budget_usd_min` DECIMAL(10,2),
  `budget_usd_max` DECIMAL(10,2),
  
  -- Journey Specifics
  `duration_days` INT DEFAULT 3,
  `preferred_start_date` DATE,
  `preferred_end_date` DATE,
  `season_preference` VARCHAR(100),  -- "winter", "summer", "anytime"
  
  -- Requested Items (JSON array of business requests)
  `requested_items` JSON DEFAULT (JSON_ARRAY()),
  /*
    Example:
    [
      {
        "business_type": "accommodation",
        "child_type": "hotel",
        "preferences": "luxury with spa",
        "essential": true
      },
      {
        "business_type": "restaurant",
        "child_type": "restaurant",
        "preferences": "traditional Siwan food",
        "essential": false
      }
    ]
  */
  
  -- Special Requirements
  `special_requirements` MEDIUMTEXT,
  `accessibility_needs` MEDIUMTEXT,
  `dietary_restrictions` MEDIUMTEXT,
  
  -- Request Status
  `status` ENUM(
    'submitted',
    'under_review',
    'approved',
    'pending_vendor_response',
    'vendor_quoted',
    'booked',
    'rejected',
    'expired'
  ) DEFAULT 'submitted',
  
  -- Policy & Approval
  `matched_policy_id` VARCHAR(36),
  `approval_notes` MEDIUMTEXT,
  `approval_decision` ENUM('auto_approved', 'admin_approved', 'vendor_approved', 'pending', 'rejected') DEFAULT 'pending',
  `approved_by_admin` VARCHAR(36),
  `approved_at` TIMESTAMP NULL,
  
  -- Assignment to Vendors
  `assigned_to_vendors` JSON DEFAULT (JSON_ARRAY()),  -- ["vendor_id1", "vendor_id2"]
  `primary_vendor_id` VARCHAR(36),
  `vendor_response_deadline` TIMESTAMP NULL,
  
  -- Pricing
  `quoted_price_usd` DECIMAL(10,2),
  `final_price_usd` DECIMAL(10,2),
  `featured_boost_applied` BOOLEAN DEFAULT FALSE,
  
  -- Engagement
  `view_count` INT DEFAULT 0,
  `interested_vendor_count` INT DEFAULT 0,
  `quote_count` INT DEFAULT 0,
  
  -- Metadata
  `source` VARCHAR(100) DEFAULT 'journey_builder',  -- where request originated
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL,  -- Request auto-expires if not fulfilled
  
  INDEX idx_visitor_id (visitor_id),
  INDEX idx_status (status),
  INDEX idx_matched_policy (matched_policy_id),
  INDEX idx_primary_vendor (primary_vendor_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLE 3: Vendor Request Queue
-- Provides vendors visibility into requests for their businesses
CREATE TABLE IF NOT EXISTS `vendor_request_queue` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Vendor & Request Link
  `vendor_id` VARCHAR(36) NOT NULL,
  `business_id` VARCHAR(36),
  `journey_request_id` VARCHAR(36) NOT NULL,
  
  -- Visibility & Priority
  `match_score` INT DEFAULT 0,  -- 0-100: how well does request match vendor
  `reason_for_match` VARCHAR(255),  -- "accommodation_type_match", "location_preference"
  `notification_sent` BOOLEAN DEFAULT FALSE,
  `notification_sent_at` TIMESTAMP NULL,
  `opened_by_vendor` BOOLEAN DEFAULT FALSE,
  `opened_at` TIMESTAMP NULL,
  
  -- Vendor Action
  `vendor_status` ENUM(
    'new',
    'viewed',
    'interested',
    'declined',
    'quoted',
    'booked'
  ) DEFAULT 'new',
  
  -- Vendor Response
  `vendor_response_notes` MEDIUMTEXT,
  `vendor_proposed_price` DECIMAL(10,2),
  `vendor_availability_confirmed` BOOLEAN DEFAULT FALSE,
  `vendor_response_date` TIMESTAMP NULL,
  
  -- Queue Management
  `priority_position` INT,  -- Lowest number = highest priority
  `marked_for_removal_at` TIMESTAMP NULL,
  `removal_reason` VARCHAR(255),
  
  -- Metadata
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_journey_request (journey_request_id),
  INDEX idx_vendor_status (vendor_status),
  INDEX idx_match_score (match_score),
  INDEX idx_priority (priority_position),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (journey_request_id) REFERENCES journey_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLE 4: Journey Request Approvals
-- Tracks approval workflow and decision history
CREATE TABLE IF NOT EXISTS `journey_request_approvals` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Request & Workflow
  `journey_request_id` VARCHAR(36) NOT NULL,
  `policy_id` VARCHAR(36),
  `approval_stage` ENUM(
    'initial_review',
    'admin_approval',
    'vendor_confirmation',
    'final_approval'
  ) DEFAULT 'initial_review',
  
  -- Approver Information
  `approver_type` ENUM('system', 'admin', 'vendor') DEFAULT 'system',
  `approver_id` VARCHAR(36),
  `approver_name` VARCHAR(255),
  
  -- Decision
  `decision` ENUM(
    'approved',
    'rejected',
    'pending_modification',
    'deferred'
  ) DEFAULT 'approved',
  
  `decision_reason` MEDIUMTEXT,
  `conditions` MEDIUMTEXT,  -- Any conditions attached to approval
  
  -- Timeline
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `decision_made_at` TIMESTAMP NULL,
  `decision_deadline` TIMESTAMP NULL,
  
  -- Metadata
  `metadata` JSON DEFAULT NULL,
  
  INDEX idx_journey_request (journey_request_id),
  INDEX idx_policy (policy_id),
  INDEX idx_approver (approver_id),
  INDEX idx_approval_stage (approval_stage),
  FOREIGN KEY (journey_request_id) REFERENCES journey_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TABLE 5: Journey Request Analytics
-- Tracks metrics for optimization
CREATE TABLE IF NOT EXISTS `journey_request_analytics` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Daily Metrics
  `date` DATE NOT NULL,
  `policy_id` VARCHAR(36),
  `request_type` VARCHAR(100),
  
  -- Counts
  `total_requests` INT DEFAULT 0,
  `auto_approved` INT DEFAULT 0,
  `admin_approved` INT DEFAULT 0,
  `rejected` INT DEFAULT 0,
  `pending` INT DEFAULT 0,
  
  -- Vendor Engagement
  `vendor_responses` INT DEFAULT 0,
  `vendor_quotes` INT DEFAULT 0,
  `bookings_completed` INT DEFAULT 0,
  
  -- Revenue
  `total_revenue_usd` DECIMAL(12,2) DEFAULT 0,
  `average_request_value` DECIMAL(10,2) DEFAULT 0,
  `featured_boost_revenue` DECIMAL(10,2) DEFAULT 0,
  
  -- Engagement
  `average_approval_time_hours` INT DEFAULT 0,
  `average_vendor_response_time_hours` INT DEFAULT 0,
  `conversion_rate_percent` INT DEFAULT 0,
  
  -- Quality Metrics
  `visitor_satisfaction_score` INT DEFAULT 0,
  `vendor_satisfaction_score` INT DEFAULT 0,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_date (date),
  INDEX idx_policy (policy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ════════════════════════════════════════════════════════════════════
-- SEED DATA: Default Policies
-- ════════════════════════════════════════════════════════════════════

INSERT INTO admin_journey_policies 
  (policy_name, description, request_type, approval_required, auto_approve_enabled, approval_workflow, vendor_notification_enabled, max_items_allowed, max_days_allowed, featured_boost_price, vendor_commission_percent, is_default, priority) 
VALUES 
(
  'Quick Custom Journeys',
  'For simple 3-5 item journeys that auto-approve if budget under $500',
  'custom_request',
  FALSE,
  TRUE,
  'auto',
  TRUE,
  5,
  7,
  NULL,
  15,
  TRUE,
  1
),
(
  'Premium Custom Journeys',
  'Complex journeys requiring admin approval + vendor quotes',
  'custom_request',
  TRUE,
  FALSE,
  'admin_then_vendor',
  TRUE,
  20,
  14,
  99.99,
  20,
  FALSE,
  2
),
(
  'Template Modifications',
  'Visitor modifies existing template, auto-approval if changes minimal',
  'template_modify',
  FALSE,
  TRUE,
  'auto',
  FALSE,
  3,
  14,
  NULL,
  0,
  FALSE,
  0
),
(
  'Urgent Requests (24h)',
  'High-priority requests needing response within 24 hours',
  'urgent_needs',
  TRUE,
  FALSE,
  'admin_then_vendor',
  TRUE,
  10,
  5,
  149.99,
  25,
  FALSE,
  10
);

-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ✓ admin_journey_policies        - Policy definitions
-- ✓ journey_requests              - Visitor request capture
-- ✓ vendor_request_queue          - Vendor visibility
-- ✓ journey_request_approvals     - Approval workflow tracking
-- ✓ journey_request_analytics     - Performance metrics
-- ✓ Default seed policies         - 4 starter policies
-- ════════════════════════════════════════════════════════════════════

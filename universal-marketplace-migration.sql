-- ============================================================
-- SIWA OASIS: Universal Marketplace Upgrade
-- This migration upgrades the existing journey_requests table
-- to handle arbitrary request types and admin routing.
-- ============================================================

-- 1. Add new columns to journey_requests
ALTER TABLE journey_requests
ADD COLUMN request_type VARCHAR(50) DEFAULT 'journey' AFTER customer_email,
ADD COLUMN custom_details JSON DEFAULT NULL AFTER pace,
ADD COLUMN distribution_status ENUM('admin_review', 'dispatched') DEFAULT 'admin_review' AFTER status,
ADD COLUMN target_business_type_id VARCHAR(100) DEFAULT NULL AFTER distribution_status,
ADD COLUMN target_vendor_id VARCHAR(36) DEFAULT NULL AFTER target_business_type_id;

-- 2. Create index for routing efficiency
CREATE INDEX idx_distribution ON journey_requests (distribution_status);
CREATE INDEX idx_target_type ON journey_requests (target_business_type_id);
CREATE INDEX idx_target_vendor ON journey_requests (target_vendor_id);
CREATE INDEX idx_request_type ON journey_requests (request_type);

-- 3. Auto-dispatch old requests so they don't disappear from the vendor dashboard
UPDATE journey_requests SET distribution_status = 'dispatched' WHERE distribution_status = 'admin_review';

-- ============================================================
-- DONE: The table is now a universal marketplace request table.
-- ============================================================

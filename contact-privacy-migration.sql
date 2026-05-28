-- ============================================================
-- SIWA OASIS: Marketplace Contact Privacy Update
-- ============================================================

-- Add a column to let the Admin control if the customer's
-- contact info is visible to vendors, or if it must be 
-- kept private (forcing vendors to use the platform offers).
ALTER TABLE journey_requests
ADD COLUMN reveal_contact BOOLEAN DEFAULT FALSE AFTER distribution_status;

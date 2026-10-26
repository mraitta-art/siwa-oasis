-- ================================================================
-- Migration 023: Enforce Anonymous Vendor & Business Claim State
-- ================================================================

-- 1. Add is_claimed column to businesses table
--    false = still held by anonymous, waiting for real vendor
--    true  = a vendor has registered and claimed this name
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_claimed TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '0 = anonymous/unclaimed, 1 = vendor has claimed this business';

ALTER TABLE businesses
  ADD INDEX IF NOT EXISTS idx_is_claimed (is_claimed);

-- 2. Backfill: mark existing businesses that have a real vendor_id as claimed
UPDATE businesses
  SET is_claimed = 1
  WHERE vendor_id IS NOT NULL
    AND vendor_id != 'anonymous'
    AND vendor_id != '';

-- 3. Ensure anonymous system profile exists
--    This profile acts as the default placeholder owner for all unclaimed listings.
INSERT IGNORE INTO profiles (id, email, role, display_name, created_at)
  VALUES (
    'anonymous',
    'anonymous@siwa.today',
    'anonymous',
    'Unclaimed Listing',
    NOW()
  );

-- 4. Backfill: set vendor_id = 'anonymous' for all NULL vendor_ids
UPDATE businesses
  SET vendor_id = 'anonymous'
  WHERE vendor_id IS NULL OR vendor_id = '';

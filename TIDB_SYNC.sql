-- SIWA OASIS PRODUCTION SYNCHRONIZATION (TiDB)
-- Run this script on TiDB Cloud to ensure schema matches development.

-- 1. Businesses Table Stabilization
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS active TINYINT(1) DEFAULT 1;

-- 2. Section Visibility Governance (Ensure columns exist)
ALTER TABLE sections ADD COLUMN IF NOT EXISTS show_on_public TINYINT(1) DEFAULT 1;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_filterable TINYINT(1) DEFAULT 0;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS show_on_card TINYINT(1) DEFAULT 0;

-- 3. Verify all sections are active by default
UPDATE sections SET active = 1 WHERE active IS NULL;
UPDATE sections SET show_on_public = 1 WHERE show_on_public IS NULL;

-- Migration: Add visitor_profiles table and visitor_id to request tables
-- Run this migration in your MySQL / TiDB database (phpMyAdmin or CLI)

START TRANSACTION;

-- 1) Create visitor_profiles table
CREATE TABLE IF NOT EXISTS visitor_profiles (
  id VARCHAR(36) PRIMARY KEY,
  primary_name VARCHAR(255),
  emails JSON DEFAULT (JSON_ARRAY()),
  phones JSON DEFAULT (JSON_ARRAY()),
  metadata JSON DEFAULT NULL,
  consent JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Add visitor_id to journey_requests (if it exists)
-- Note: MySQL doesn't support ALTER TABLE IF EXISTS.
-- The sync tool will auto-create the table if it exists locally,
-- or skip this ALTER if the table doesn't exist in either environment.
ALTER TABLE journey_requests
  ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(36) DEFAULT NULL;

-- Note: If you have other per-business request tables, repeat ALTER TABLE to add visitor_id.

COMMIT;

-- Backfill suggestions (run separately after migration):
-- 1) Create one visitor profile per distinct customer_email and link existing requests.
-- 2) Decide rules for duplicates and phones, then merge accordingly.

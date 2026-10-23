-- Migration 044: 3-Level Vendor Minisite System - Phase 1 (Foundation)
--
-- Adds the data foundation for the three service levels of a vendor minisite:
--   template  -> self-serve minisite generated from a category template
--   curated   -> Siwa team curates content / media on top of the template
--   managed   -> fully done-for-you minisite, owned by an assigned account manager
--
-- What this migration does
--   1. businesses.service_level + businesses.account_manager_id (+ index)
--   2. vendor_portal_accounts.profile_id  -> link a portal account to a login profile
--   3. profiles.portal_account_id         -> reverse link, used by the unified CRM entity
--   4. Foreign keys for the new reference columns
--   5. vendor_level_transitions           -> audit trail of every level change
--   6. Backfill: link existing portal accounts to profiles by email
--   7. unified_vendor_view                -> single queryable vendor entity for CRM
--
-- Deployment notes
--   * Purely additive: nothing is dropped, renamed or retyped, so this is safe to apply
--     before the Phase 2 application code ships.
--   * Column and index changes are guarded with IF NOT EXISTS (same pattern as 016-043).
--   * MySQL/TiDB have no "ADD CONSTRAINT IF NOT EXISTS", so the foreign keys in section 4
--     are created once. scripts/smart-sync.js tracks applied migrations by file hash and
--     skips them on later runs, so the statements below must not be edited after applying.
--   * The two new link columns form a circular reference by design
--     (profiles <-> vendor_portal_accounts). Both sides are nullable and
--     ON DELETE SET NULL, so deleting either side simply unlinks the pair.
--     They also assume both tables share one collation, which holds on TiDB (database
--     default utf8mb4_bin). If a deployment reports ER_FK_INCOMPATIBLE_COLUMNS, skip
--     those two ADD CONSTRAINT statements - the columns and the view work without them.

-- ============================================
-- 1. BUSINESSES: service level + account manager
-- ============================================

-- service_level drives which minisite workflow a business follows. The 'template' default
-- keeps every existing row on the free/self-serve path. The view treats NULL as 'template'
-- so rows written before an app-side default existed stay consistent.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS service_level VARCHAR(20) DEFAULT 'template'
    COMMENT 'Minisite service level: template | curated | managed'
    CHECK (service_level IN ('template', 'curated', 'managed')),
  ADD COLUMN IF NOT EXISTS account_manager_id VARCHAR(36) DEFAULT NULL
    COMMENT 'profiles.id of the staff member who owns this vendor account';

ALTER TABLE businesses
  ADD INDEX IF NOT EXISTS idx_businesses_service_level (service_level),
  ADD INDEX IF NOT EXISTS idx_businesses_account_manager (account_manager_id);

-- ============================================
-- 2. VENDOR PORTAL ACCOUNTS: link to a login profile
-- ============================================

-- Portal accounts are created by the outreach flow (migration 017) before a vendor ever
-- logs in. profile_id connects that early CRM record to the real login once claimed.
ALTER TABLE vendor_portal_accounts
  ADD COLUMN IF NOT EXISTS profile_id VARCHAR(36) DEFAULT NULL
    COMMENT 'profiles.id of the linked login once the vendor account is claimed';

ALTER TABLE vendor_portal_accounts
  ADD INDEX IF NOT EXISTS idx_vpa_profile_id (profile_id);

-- ============================================
-- 3. PROFILES: reverse link to the portal account
-- ============================================

-- Reverse pointer so a profile row resolves its portal account in a single lookup
-- without scanning vendor_portal_accounts. Kept in sync by the application layer.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portal_account_id VARCHAR(36) DEFAULT NULL
    COMMENT 'vendor_portal_accounts.id linked to this login (reverse of vpa.profile_id)';

ALTER TABLE profiles
  ADD INDEX IF NOT EXISTS idx_profiles_portal_account (portal_account_id);

-- ============================================
-- 4. FOREIGN KEYS for the new reference columns
-- ============================================

ALTER TABLE businesses
  ADD CONSTRAINT fk_businesses_account_manager
    FOREIGN KEY (account_manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE vendor_portal_accounts
  ADD CONSTRAINT fk_vpa_profile
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_portal_account
    FOREIGN KEY (portal_account_id) REFERENCES vendor_portal_accounts(id) ON DELETE SET NULL;

-- ============================================
-- 5. VENDOR LEVEL TRANSITIONS (audit trail)
-- ============================================

-- One row per level change. from_level is NULL for the very first assignment of a level.
-- Written by admin UI actions (manual / admin_promotion) and by the usage-based
-- upgrade/downgrade jobs (auto_upgrade / auto_downgrade).
CREATE TABLE IF NOT EXISTS vendor_level_transitions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  from_level VARCHAR(20) NULL,
  to_level VARCHAR(20) NOT NULL,
  triggered_by VARCHAR(36) NULL COMMENT 'profiles.id of the admin/system actor',
  trigger_type VARCHAR(30) DEFAULT 'manual',
  reason TEXT NULL,
  metadata TEXT NULL COMMENT 'JSON payload with context (usage snapshot, admin note, etc.)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vlt_business (business_id),
  INDEX idx_vlt_created (created_at),
  INDEX idx_vlt_triggered_by (triggered_by),
  -- NULL from_level evaluates to UNKNOWN and therefore passes, which is intended.
  CONSTRAINT chk_vlt_from_level CHECK (from_level IN ('template', 'curated', 'managed')),
  CONSTRAINT chk_vlt_to_level CHECK (to_level IN ('template', 'curated', 'managed')),
  CONSTRAINT chk_vlt_trigger_type CHECK (trigger_type IN ('manual', 'auto_upgrade', 'auto_downgrade', 'admin_promotion')),
  CONSTRAINT fk_vlt_business
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT fk_vlt_triggered_by
    FOREIGN KEY (triggered_by) REFERENCES profiles(id) ON DELETE SET NULL
);
-- No explicit CHARSET/COLLATE on purpose (unlike migrations 016-043): the table inherits
-- the database default so its foreign keys to businesses/profiles always share the
-- collation of those pre-existing core tables.

-- ============================================
-- 6. BACKFILL: link existing portal accounts to profiles
-- ============================================

-- vendor_portal_accounts.vendor_email and profiles.email are both unique, so a match is
-- unambiguous. Only vendor logins that are not linked yet are touched, which keeps the
-- statement idempotent.
UPDATE vendor_portal_accounts vpa
JOIN profiles p ON p.email = vpa.vendor_email
SET vpa.profile_id = p.id,
    p.portal_account_id = vpa.id
WHERE vpa.profile_id IS NULL
  AND p.portal_account_id IS NULL
  AND p.role = 'vendor';

-- ============================================
-- 7. UNIFIED VENDOR VIEW (CRM entity)
-- ============================================

-- One row per vendor identity, covering both populations:
--   a) vendors that already have a login profile (claimed, onboarding, active)
--   b) portal accounts that are not linked to a profile yet (invited, never claimed)
-- Branch (a) fans out to at most one portal account and one primary business
-- (profiles.business_id). Branch (b) is anti-joined against profiles so a vendor can
-- never appear twice. Extra businesses of a vendor are queried from businesses.vendor_id.
--
-- last_activity_at uses the best available signal:
--   portal login -> portal request view -> profile update.
CREATE OR REPLACE VIEW unified_vendor_view AS
SELECT
  COALESCE(vpa.id, p.id)                                              AS vendor_id,
  p.id                                                                AS profile_id,
  vpa.id                                                              AS portal_account_id,
  COALESCE(NULLIF(TRIM(p.display_name), ''), vpa.vendor_name, b.name)  AS vendor_name,
  COALESCE(p.email, vpa.vendor_email)                                 AS email,
  COALESCE(p.phone, vpa.phone)                                        AS phone,
  b.id                                                                AS business_id,
  COALESCE(b.name, vpa.business_name)                                 AS business_name,
  COALESCE(b.type_id, vpa.business_type_id)                           AS business_type_id,
  bt.name                                                             AS business_type_name,
  COALESCE(b.service_level, 'template')                               AS service_level,
  COALESCE(b.subscription_tier, p.subscription_tier)                  AS subscription_tier,
  p.approval_status                                                   AS approval_status,
  vpa.status                                                          AS portal_status,
  vpa.claimed_at                                                      AS claimed_at,
  b.account_manager_id                                                AS account_manager_id,
  am.display_name                                                     AS account_manager_name,
  am.email                                                            AS account_manager_email,
  COALESCE(vpa.last_login, vpa.last_viewed_requests, p.updated_at)     AS last_activity_at,
  p.created_at                                                        AS created_at
FROM profiles p
LEFT JOIN vendor_portal_accounts vpa ON vpa.profile_id = p.id
LEFT JOIN businesses b ON b.id = p.business_id
LEFT JOIN business_types bt ON bt.id = b.type_id
LEFT JOIN profiles am ON am.id = b.account_manager_id
WHERE p.role = 'vendor' OR vpa.id IS NOT NULL

UNION ALL

SELECT
  vpa.id,
  NULL,
  vpa.id,
  COALESCE(NULLIF(TRIM(vpa.vendor_name), ''), vpa.business_name),
  vpa.vendor_email,
  vpa.phone,
  NULL,
  vpa.business_name,
  vpa.business_type_id,
  bt.name,
  'template',
  NULL,
  NULL,
  vpa.status,
  vpa.claimed_at,
  NULL,
  NULL,
  NULL,
  COALESCE(vpa.last_login, vpa.last_viewed_requests, vpa.updated_at),
  vpa.created_at
FROM vendor_portal_accounts vpa
LEFT JOIN business_types bt ON bt.id = vpa.business_type_id
WHERE vpa.profile_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p2 WHERE p2.portal_account_id = vpa.id
  );

-- Migration 047: create the vendor CRM tables that only existed behind a setup endpoint
--
-- Why this exists
--   /api/jana/vendor-lifecycle/setup creates vendor_lifecycle_events and vendor_messages
--   on demand, but nothing guaranteed that endpoint had ever been called. The live TiDB
--   schema had neither table, so every audit write from
--     - /api/jana/vendor-lifecycle            (logEvent)
--     - /api/jana/approval-packages           (account_manager_assigned / _removed)
--   failed with ER_NO_SUCH_TABLE. The approval-packages route swallows that error by
--   design, so account-manager changes were saved without any audit trail.
--
-- Deployment notes
--   * CREATE TABLE IF NOT EXISTS only: re-running is a no-op and the setup endpoint keeps
--     working (it becomes a no-op too).
--   * Column set and indexes are copied verbatim from the setup route so both definitions
--     can never disagree.
--   * No foreign keys on purpose, matching the setup route: vendor_id is either a
--     profiles.id or a vendor_portal_accounts.id depending on where the vendor came from.

CREATE TABLE IF NOT EXISTS vendor_lifecycle_events (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL,
  business_id VARCHAR(36),
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  performed_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vle_vendor_id (vendor_id)
);

CREATE TABLE IF NOT EXISTS vendor_messages (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL,
  business_id VARCHAR(36),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  action_trigger VARCHAR(50),
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vm_vendor_id (vendor_id),
  INDEX idx_vm_business_id (business_id)
);

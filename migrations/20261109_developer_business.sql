-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRATION: a developer gains a corporate home
--  File: migrations/20261109_developer_business.sql
--
--  WHY THIS EXISTS
--  The `developers` row answers one question well — "what has this brand built".
--  It does NOT answer "who are they, where is head office, how do I reach them".
--  That rich, admin-controlled content (identity, offices, addresses, contact
--  numbers, media, RTL, with per-field show/hide) ALREADY lives in the business
--  engine: sections -> businesses.custom_data -> the minisite, governed by the
--  field-visibility rules. Building a second, parallel form system for developers
--  would duplicate all of that and drift from it. So instead a developer links to
--  ONE businesses row that speaks for the brand. The developer's public page then
--  presents that corporate presence, and the business's own visibility rules
--  decide what is shown and what stays hidden. One source of truth, reused.
--
--  business_id is VARCHAR(36) to match businesses.id exactly — TiDB rejects an
--  FK whose column type differs from the referenced key.
--
--  IDEMPOTENT: ADD COLUMN IF NOT EXISTS, the FK is added only if missing and the
--  index only if missing — the same guarded pattern 20261107_developers.sql uses.
--  Nothing is backfilled: an unlinked developer simply has no corporate band, and
--  every read degrades gracefully.
--
--  APPLY (run BEFORE the app that reads this deploys)
--    node migrations/run_migration.js migrations/20261109_developer_business.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE developers ADD COLUMN IF NOT EXISTS business_id VARCHAR(36)
  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
  COMMENT 'Optional link to the businesses row carrying this brand''s corporate identity / contacts';

-- The FK is added one guarded statement at a time, because TiDB takes inline FK
-- syntax only on CREATE TABLE. ON DELETE SET NULL: deleting the corporate page
-- never deletes the developer, only the link.
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'developers'
     AND CONSTRAINT_NAME = 'fk_developers_business') = 0,
  'ALTER TABLE developers ADD CONSTRAINT fk_developers_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL',
  'SELECT ''fk_developers_business already exists'''
);
PREPARE add_fk FROM @sql;
EXECUTE add_fk;
DEALLOCATE PREPARE add_fk;

-- Index for the admin "which developer owns this business?" lookup. Added only if
-- missing (TiDB has no CREATE INDEX IF NOT EXISTS).
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'developers'
     AND INDEX_NAME = 'idx_developers_business') = 0,
  'ALTER TABLE developers ADD INDEX idx_developers_business (business_id)',
  'SELECT ''idx_developers_business already exists'''
);
PREPARE add_idx FROM @sql;
EXECUTE add_idx;
DEALLOCATE PREPARE add_idx;

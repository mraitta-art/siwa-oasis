-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRATION: the DEVELOPER as a first-class entity
--  File: migrations/20261107_developers.sql
--
--  WHY THIS EXISTS
--  `developments.developer_name` is a free-text string, so "Sodic", "sodic"
--  and "Sokkar for Development" are three different developers to the database
--  even when they are one. To answer "show me everything this developer has
--  built" — a genuine differentiator for an investor — the developer becomes a
--  row of its own that developments point at. A buyer can then browse a
--  developer's whole portfolio and compare it, the same way they compare
--  projects.
--
--  This is a SCHEMA-ALIGNING backfill, not demonstration data: it only creates
--  developer records that mirror the developer names ALREADY on real projects.
--  Nothing is invented; the existing strings simply gain a canonical home.
--
--  IDEMPOTENT: CREATE/ADD IF NOT EXISTS, the FK is added only if missing, and
--  the backfill groups by slug with ON DUPLICATE KEY plus a WHERE that skips
--  already-linked rows, so it runs cleanly on a fresh DB and a populated one.
--
--  HOW TO APPLY (same runner as every other migration)
--    node migrations/run_migration.js migrations/20261107_developers.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS developers (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL COMMENT 'Developer name, English / canonical',
  name_ar VARCHAR(255) DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  about TEXT DEFAULT NULL,
  about_ar TEXT DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_developers_slug (slug),
  INDEX idx_developers_active (active, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- The id column is created bin on purpose. The whole production schema keys its
-- id columns on utf8mb4_bin (developments.id, businesses.id), and a foreign key
-- requires an IDENTICAL charset + collation on both sides, so developers.id must
-- be bin too or fk_developments_developer is rejected (ER_FK_INCOMPATIBLE_COLUMNS).
-- TiDB cannot CONVERT an indexed column in place, so the collation is set here at
-- CREATE time rather than repaired afterwards.

ALTER TABLE developments ADD COLUMN IF NOT EXISTS developer_id VARCHAR(64) DEFAULT NULL;

-- The FK is added one statement at a time, guarded, because TiDB takes the
-- inline-FK style only on CREATE TABLE — the same pattern the units table uses.
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'developments'
     AND CONSTRAINT_NAME = 'fk_developments_developer') = 0,
  'ALTER TABLE developments ADD CONSTRAINT fk_developments_developer FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE SET NULL',
  'SELECT ''fk_developments_developer already exists'''
);
PREPARE add_fk FROM @sql;
EXECUTE add_fk;
DEALLOCATE PREPARE add_fk;

-- Index for the "everything this developer built" read, which filters
-- developments by developer_id. Added only if missing (TiDB has no
-- CREATE INDEX IF NOT EXISTS).
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'developments'
     AND INDEX_NAME = 'idx_developments_developer') = 0,
  'ALTER TABLE developments ADD INDEX idx_developments_developer (developer_id)',
  'SELECT ''idx_developments_developer already exists'''
);
PREPARE add_idx FROM @sql;
EXECUTE add_idx;
DEALLOCATE PREPARE add_idx;

-- ── Backfill: one developer row per distinct real developer name ─────────────
-- The slug mirrors the TypeScript slugifyDeveloper() in markets-admin.ts
-- exactly: lower, runs of non-alphanumerics collapse to '-', then trim leading
-- and trailing '-'. Grouped by slug so two spellings that map to one slug
-- create a single developer. Empty slugs (a name with no letters/digits) are
-- skipped. ON DUPLICATE KEY keeps it idempotent and only refreshes `name`,
-- never the manual `name_ar` / logo / about.
INSERT INTO developers (id, slug, name, active)
SELECT UUID(), src.slug, MIN(TRIM(src.developer_name)), 1
FROM (
  SELECT
    developer_name,
    TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRIM(developer_name)), '[^a-z0-9]+', '-'), '-+', '-')) AS slug
  FROM developments
  WHERE developer_name IS NOT NULL AND TRIM(developer_name) <> ''
) src
WHERE src.slug <> ''
GROUP BY src.slug
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Link each development to its developer by the matching slug ──────────────
-- Correlated subquery reads the `developers` table (not the table being
-- updated), so this is legal even while updating `developments`.
UPDATE developments
SET developer_id = (
  SELECT dev.id
  FROM developers dev
  WHERE dev.slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRIM(developments.developer_name)), '[^a-z0-9]+', '-'), '-+', '-'))
  LIMIT 1
)
WHERE developer_name IS NOT NULL
  AND TRIM(developer_name) <> ''
  AND developer_id IS NULL;

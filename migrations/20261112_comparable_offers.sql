-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRATION: the data-honesty layer under project comparison
--  File: migrations/20261112_comparable_offers.sql
--
--  WHY THIS EXISTS
--  `compareDevelopments()` already answers "what does it cost": price, price/m²,
--  area, bedrooms, finishing, down payment, term, handover, facilities. Four
--  things it cannot answer today, and an Egyptian buyer asks all four before
--  signing:
--
--  1. WHO SAID THIS NUMBER AND WHEN. A verified developer price list and a stale
--     portal listing currently look identical. `data_verified_at` is one blunt
--     stamp per project; a price needs its own provenance. → `price_snapshots`.
--  2. ARE WE COMPARING LIKE WITH LIKE. We compare every sale unit of a compound
--     against every sale unit of another, so a 2-bed semi-finished lines up
--     beside a 3-bed finished villa. The comparable key is
--     (development × unit_type × finishing), optionally narrowed by area and
--     bedrooms. → `unit_offers`.
--  3. WHAT DOES THE CONTRACT COMMIT ME TO. Maintenance deposit, transfer fees,
--     broker commission, late-delivery and late-payment terms are the deciding
--     numbers in this market and none of them are storable anywhere today.
--     → `development_contract_terms`.
--  4. HOW DOES THE PUBLIC CORRECT US. Provenance that nobody can dispute is a
--     claim, not evidence. → `correction_requests`.
--
--  THE CONTRACT THIS FILE KEEPS (all of it is "increase only")
--  - Nothing is retyped or dropped. `units.price` / `units.price_per_sqm` stay
--    DECIMAL(12,2); integer-EGP money is refused, rounding is a display concern.
--  - `finishing` stays VARCHAR-compatible: `unit_offers.finishing` holds the same
--    `UNIT_FINISHING_OPTIONS` ids, plus '' as the documented "not stated" value.
--    '' rather than NULL because a TiDB unique key treats NULLs as distinct, and
--    two "nobody said" rows for one project would then be allowed to coexist.
--  - Every new table starts UNPUBLISHED (`published = 0` default) and every public
--    read filters `published = 1`, so no row becomes a public claim before an
--    admin approves it.
--  - `price_snapshots` is append-only: an update is a new row, never an edit in
--    place, so "the price was 9,500 in September" stays provable.
--  - Every column is additive and every FK is guarded. Re-running this file is a
--    no-op on a populated database.
--
--  IDEMPOTENT: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, and one
--  guarded statement per FK / index — the pattern `20261107_developers.sql` uses.
--
--  HOW TO APPLY (same runner as every other migration)
--    node --env-file=.env scripts/run_migration.js migrations/20261112_comparable_offers.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. The comparable key: one offer per (project × unit type × finishing) ────
CREATE TABLE IF NOT EXISTS unit_offers (
  id VARCHAR(64) PRIMARY KEY,
  development_id VARCHAR(64) NOT NULL,
  unit_type VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'apartment | villa | townhouse …; free text like units.unit_type',
  finishing VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'UNIT_FINISHING_OPTIONS id; empty string = not stated (NULL would defeat the unique key)',
  area_min_sqm DECIMAL(8,2) NULL COMMENT 'set when the offer covers a band rather than one size',
  area_max_sqm DECIMAL(8,2) NULL,
  bedrooms TINYINT NULL COMMENT 'NULL = any bedroom count, i.e. the offer spans the grade',
  published TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 until an admin approves; public reads only ever see 1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_unit_offers (development_id, unit_type, finishing),
  INDEX idx_unit_offers_dev (development_id, published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ── 2. Provenance: append-only, one row per source per capture ───────────────
-- ppm_* is EGP per built m², held at the same DECIMAL(12,2) scale as
-- units.price_per_sqm so the two can never disagree through precision loss.
-- `source_hash` is MD5(source_url), written by the caller (seed + admin API) and
-- NOT a generated column, because TiDB does not allow an index over a generated
-- expression here. It exists so one unique key can prove "this exact source at
-- this exact minute was already captured" without comparing 600-char URLs.
CREATE TABLE IF NOT EXISTS price_snapshots (
  id VARCHAR(64) PRIMARY KEY,
  offer_id VARCHAR(64) NOT NULL,
  ppm_min DECIMAL(12,2) NULL COMMENT 'low end of the quoted band, EGP per built m²',
  ppm_mid DECIMAL(12,2) NULL COMMENT 'the figure we print',
  ppm_max DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EGP',
  source_type VARCHAR(32) NOT NULL COMMENT 'DEVELOPER_PRICE_LIST | PORTAL_LISTING | NEWS',
  source_url VARCHAR(600) NOT NULL,
  source_hash CHAR(32) NOT NULL COMMENT 'MD5(source_url), written by the caller',
  note TEXT NULL,
  captured_at DATETIME NOT NULL COMMENT 'when the figure was read, not when the row was written',
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_snapshot_identity (offer_id, source_hash, captured_at),
  INDEX idx_snapshot_offer (offer_id, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ── 3. Contract obligations: one row per project, all of it optional ─────────
-- A missing numeric component stays NULL and is printed as `غير موثّق`. It is
-- never zeroed: "no transfer fee on record" and "transfer fee is EGP 0" are
-- different claims and only one of them is ours to make.
-- `maintenance_due_timing` is the one ENUM here because it is a closed three-way
-- question with no wording a project could plausibly invent.
CREATE TABLE IF NOT EXISTS development_contract_terms (
  id VARCHAR(64) PRIMARY KEY,
  development_id VARCHAR(64) NOT NULL,
  maintenance_note TEXT NULL,
  maintenance_deposit_pct DECIMAL(5,2) NULL,
  maintenance_due_timing ENUM('at_contract','at_delivery','unknown') NOT NULL DEFAULT 'unknown',
  transfer_fees_note TEXT NULL,
  transfer_fees_pct DECIMAL(5,2) NULL,
  transfer_fees_fixed DECIMAL(12,2) NULL,
  broker_commission_pct DECIMAL(5,2) NULL,
  reservation_note TEXT NULL,
  late_delivery_terms TEXT NULL,
  late_client_terms TEXT NULL,
  doc_url VARCHAR(600) NULL COMMENT 'contract / terms PDF on Cloudinary (media-storage, resource_type raw)',
  source_url VARCHAR(600) NULL,
  verified_at DATETIME NULL COMMENT 'stamped only when an admin explicitly checks it, never auto-set',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contract_terms_dev (development_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ── 4. Corrections: the public's dispute channel, admin-facing ───────────────
-- Deliberately NO foreign keys. A correction is a message log: it must survive
-- whatever happens to the row it complains about, and an intake must not fail
-- because a project was archived mid-flight. The ids are references in spirit and
-- resolved by the admin queue, which is where these rows are ever read.
CREATE TABLE IF NOT EXISTS correction_requests (
  id VARCHAR(64) PRIMARY KEY,
  developer_id VARCHAR(64) NULL,
  development_id VARCHAR(64) NULL,
  message TEXT NOT NULL,
  contact VARCHAR(200) NULL,
  status ENUM('open','accepted','rejected') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ── Foreign keys: one guarded statement each (TiDB needs them added apart) ────
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'unit_offers'
     AND CONSTRAINT_NAME = 'fk_unit_offers_development') = 0,
  'ALTER TABLE unit_offers ADD CONSTRAINT fk_unit_offers_development FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE CASCADE',
  'SELECT ''fk_unit_offers_development already exists'''
);
PREPARE add_fk FROM @sql;
EXECUTE add_fk;
DEALLOCATE PREPARE add_fk;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'price_snapshots'
     AND CONSTRAINT_NAME = 'fk_price_snapshots_offer') = 0,
  'ALTER TABLE price_snapshots ADD CONSTRAINT fk_price_snapshots_offer FOREIGN KEY (offer_id) REFERENCES unit_offers(id) ON DELETE CASCADE',
  'SELECT ''fk_price_snapshots_offer already exists'''
);
PREPARE add_fk FROM @sql;
EXECUTE add_fk;
DEALLOCATE PREPARE add_fk;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'development_contract_terms'
     AND CONSTRAINT_NAME = 'fk_contract_terms_development') = 0,
  'ALTER TABLE development_contract_terms ADD CONSTRAINT fk_contract_terms_development FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE CASCADE',
  'SELECT ''fk_contract_terms_development already exists'''
);
PREPARE add_fk FROM @sql;
EXECUTE add_fk;
DEALLOCATE PREPARE add_fk;

-- ── Additive columns on tables that already exist ───────────────────────────
-- `developers.website` stays NULL in the seed: an official-site button must never
-- render against an unverified URL, so the column exists but no row earns it.
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS website VARCHAR(500) NULL
    COMMENT 'verified official site; printed only when it holds an https:// value';

ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS delivery_note TEXT NULL
    COMMENT 'what "delivered" actually means here: phase, date, evidence';

-- 0 = coordinates we have not checked. The public page prints `الموقع تقريبي`
-- while it is 0, so an approximate pin can never read as a surveyed one.
ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS location_verified TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'admin-checked coordinates; 0 prints the approximate-location label';

-- Verify:
--   SHOW TABLES LIKE '%offer%'; SHOW TABLES LIKE '%snapshot%';
--   SELECT COUNT(*) AS offers_unpublished FROM unit_offers WHERE published = 0;
--   SHOW COLUMNS FROM developments LIKE 'location_verified';

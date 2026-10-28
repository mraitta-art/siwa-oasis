-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRATION: ADMIN-CHOSEN ROOT URL (the "upper hand")
--  File: migrations/20261108_place_at_root.sql
--
--  WHY THIS EXISTS
--  By rule a project lives at /{market}/{slug} and a developer at
--  /developers/{slug}. Sometimes the owner of a brand wants the short, direct
--  address instead — siwify.com/sodic, siwify.com/hacienda-bay — a vanity URL
--  printed on a billboard. That is a decision with consequences (it must not
--  collide with an existing address, and moving it breaks the old link), so it
--  belongs to the admin, deliberately, after the UI warns them. This adds the
--  single flag that records that decision; the routing reads it last, so a
--  vanity can only ever claim an address nothing else already owns.
--
--  IDEMPOTENT: ADD COLUMN IF NOT EXISTS on both tables; nothing backfilled, so
--  every existing row keeps the default (0 = follow the rules).
--
--  HOW TO APPLY
--    node migrations/run_migration.js migrations/20261108_place_at_root.sql
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE developments ADD COLUMN IF NOT EXISTS place_at_root TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = this project also resolves at siwify.com/{slug}, not only /{market}/{slug}. Admin-assigned vanity; see 20261108.';

ALTER TABLE developers ADD COLUMN IF NOT EXISTS place_at_root TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = this developer resolves at siwify.com/{slug} instead of /developers/{slug}. Admin-assigned vanity; see 20261108.';

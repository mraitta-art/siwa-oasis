-- The facts a buyer compares one project against another on.
--
-- `developments` already carried the supply story — developer, phases, delivery
-- year, status — and `units` carried the per-unit money. What was missing is the
-- project-level comparison data a portal like Aqarmap's Compound Guide shows but
-- never lets you put side by side: what is built inside the compound, the payment
-- plans on offer, and when those prices were last checked.
--
-- `facilities` is the compound's own list (pools, club, security, landscape). A
-- unit may override it through `units.amenities`; this is the building default.
-- It is a list nobody sorts by, so it stays JSON until a facet needs a column.
--
-- `payment_plans` lets a project advertise its plans before a single unit row is
-- entered — a compound marketed off-plan has plans on day one and inventory later.
-- Each entry is `{ name, down_payment_pct, installment_years, frequency,
-- post_handover }`. A unit's own `down_payment_pct` / `installment_years` still
-- win when present; this is the fallback the calculator seeds from.
--
-- `data_verified_at` is the trust stamp. Admin-curated numbers without a date are
-- a rumor; the public page prints "prices verified on {date}" so a stale plan is
-- visibly stale. Never auto-set — an admin writes it when they actually check.
--
-- Every column is nullable and additive: existing rows stay valid, and a town or
-- village container simply leaves them empty. Re-running this file is a no-op.

ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS facilities JSON NULL
    COMMENT 'compound-level facilities; a unit may override via units.amenities';

ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS payment_plans JSON NULL
    COMMENT 'project payment plans: [{ name, down_payment_pct, installment_years, frequency, post_handover }]';

ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS data_verified_at DATETIME NULL
    COMMENT 'when an admin last checked prices/plans; printed on the public page';

-- Verify:
--   SELECT slug, kind, facilities, payment_plans, data_verified_at FROM developments;

-- ═══════════════════════════════════════════════════════════════════════════
--  MIGRATION: New Cairo — a second real-estate marketplace, same structure
--  File: migrations/20261115_new_cairo_market.sql
--
--  WHY THIS EXISTS
--  `20261104_el_alamein_reference_data.sql` closed with the sentence "Ras El
--  Hekma reuses this same tree when it opens." The tree cannot be reused today:
--  a typology carries ONE `market_id`, and `createBusinessEntity` refuses a
--  listing whose category is tagged for another market (rule
--  `TYPE_NOT_IN_MARKET`, src/lib/business-creation.ts). So opening a second
--  real-estate market meant either duplicating six typology rows — six more
--  copies of the same section lists and intake questions, drifting apart on the
--  first edit — or widening the scope to hold more than one market.
--
--  This file widens it, the way `sections` already does. A section opens per
--  market through `options.markets`, a JSON ARRAY (`sec_7_investment` carries
--  `{"markets":["el-alamein"]}`). `business_types` gets the same shape:
--  `market_ids JSON NULL`.
--
--  THE CONTRACT THIS FILE KEEPS (all of it is "increase only")
--  - `business_types.market_id` is NOT touched. It keeps its exact meaning — the
--  market that OWNS the category — and every existing read of it still answers
--  the same question. `market_ids` only ever ADDS markets that may also offer it.
--  - Siwa is unchanged. Its intake sees shared categories (`market_id IS NULL`)
--  plus its own tags; the real-estate rows are tagged `el-alamein` and listed in
--  `market_ids` for `el-alamein` + `new-cairo`, so neither Cairo nor the North
--  Coast leaks a compound category into the Siwa wizard.
--  - Nothing below invents supply. No compound, no unit, no business, no price.
--  An empty marketplace is the honest starting point, exactly as El Alamein was
--  seeded ("no compound or unit published yet").
--  - The market is created DARK (`active = 0`), the way both North Coast
--  investment markets were seeded. Flipping it on is an admin decision made when
--  there is something real to index, not a side effect of this file.
--  - `host` stays NULL on purpose. El Alamein and Ras El Hekma carry
--  `*.siwify.com` values; `businessPublicPath` builds public addresses from
--  `markets.host`, so giving New Cairo a host before its DNS and Vercel domain
--  exist would publish links to a domain that does not answer. New Cairo lives at
--  `/new-cairo/{slug}` until an admin sets a host they have provisioned.
--  - Coordinates are a place centre, not a surveyed point, and this file does not
--  pretend otherwise: no project pin is created here, and `developments.location_verified`
--  (20261112) is what labels a real pin as approximate.
--
--  IDEMPOTENT: INSERT … ON DUPLICATE KEY UPDATE, ADD COLUMN IF NOT EXISTS, and a
--  `NOT JSON_CONTAINS(…)` guard on the section door so re-running appends nothing.
--
--  HOW TO APPLY (same runner as every other migration; .env.local holds the real
--  database variables, .env holds placeholders)
--    node --env-file=.env.local scripts/run_migration.js migrations/20261115_new_cairo_market.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. The city: New Cairo, inside Cairo governorate ────────────────────────
-- Shaped exactly like `resolveCityLocation()` builds one from the admin market
-- form: id `eg-{governorateSlug}-{marketSlug}`, path `{governoratePath}/
-- {marketSlug}`, `name` carrying the English label with `name_ar` beside it, and
-- `market_id` back-referencing the market. The older 20261025 geo seed put the
-- Arabic name in `name`; a row created through the UI today does not, so this
-- follows the code path rather than the seed.
INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-cairo-new-cairo', 'New Cairo', 'القاهرة الجديدة', 'New Cairo', 'city', 'eg-cairo', 'new-cairo', 'eg/cairo/new-cairo', 30.0000000, 31.6000000, 1, 100)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  path = VALUES(path), parent_id = VALUES(parent_id), type = VALUES(type), sort_order = VALUES(sort_order);

-- ── 2. The market ───────────────────────────────────────────────────────────
-- Navy `#0F4C81` is the accent the properties vertical already paints
-- (`MINISITE_VERTICAL_THEMES.properties.accent`), so a New Cairo minisite and a
-- North Coast one wear the same skin rather than two blues that nearly match.
INSERT INTO markets
  (id, slug, location_id, name_ar, name_en, host, default_locale, currency, revenue_model, theme_accent, active, launch_notes)
VALUES
  ('new-cairo', 'new-cairo', 'eg-cairo-new-cairo', 'القاهرة الجديدة', 'New Cairo', NULL, 'ar', 'EGP',
   'realestate_lead', '#0F4C81', 0,
   'Dark. Cairo investment market: compounds, apartments, commercial units and brokerages, converting on price per m2, payment plans and viewing requests. Reuses the El Alamein real-estate tree through business_types.market_ids. Arabic-first, path-based at /new-cairo until a host is provisioned. Open it when the first compounds and units are entered — nothing is seeded here.')
ON DUPLICATE KEY UPDATE
  name_ar = VALUES(name_ar), name_en = VALUES(name_en), location_id = VALUES(location_id),
  default_locale = VALUES(default_locale), currency = VALUES(currency),
  revenue_model = VALUES(revenue_model), theme_accent = VALUES(theme_accent),
  launch_notes = VALUES(launch_notes);
-- `host` and `active` are deliberately NOT in the UPDATE list: re-running this
-- file must never take back a host an admin set, or open a market they closed.

-- A city that is a market says so, the way `linkLocationToMarket()` does when the
-- admin form creates one, and the way `20261025_markets_and_geo.sql` links the
-- North Coast areas back to theirs.
UPDATE locations SET market_id = 'new-cairo' WHERE id = 'eg-cairo-new-cairo';

-- ── 3. A category may now be offered in more than one market ────────────────
-- NULL for every existing row, so today's behaviour is byte-identical until the
-- UPDATE below opts specific categories in.
ALTER TABLE business_types
  ADD COLUMN IF NOT EXISTS market_ids JSON NULL
    COMMENT 'extra markets allowed to offer this category; market_id remains the owner';

-- The real-estate family: owned by El Alamein, offered in both. The parent is
-- listed too, otherwise the tree would show an empty industry in New Cairo.
UPDATE business_types
   SET market_ids = JSON_ARRAY('el-alamein', 'new-cairo')
 WHERE id IN (
   'real_estate', 'gated_compound', 'sea_view_apartment', 'villa_chalet', 'commercial_unit', 'brokerage_office'
 );

-- ── 4. The section this market lives in ─────────────────────────────────────
-- `sec_7_investment` is switched off platform-wide so it never lands on a Siwa
-- accommodation page; `options.markets` is the per-market door. Appending rather
-- than overwriting, guarded so a second run adds nothing.
UPDATE sections
   SET options = JSON_ARRAY_APPEND(
         COALESCE(options, JSON_OBJECT('markets', JSON_ARRAY())),
         '$.markets',
         'new-cairo'
       )
 WHERE id = 'sec_7_investment'
   AND NOT JSON_CONTAINS(
     COALESCE(JSON_EXTRACT(options, '$.markets'), JSON_ARRAY()),
     JSON_ARRAY('new-cairo')
   );

-- The intake questions need no copy. `20261104_el_alamein_reference_data.sql`
-- wrote them on the PARENT (`business_type_id = 'real_estate'`) precisely so each
-- child inherits them, so New Cairo gets ownership system, project stage, payment
-- plan prose, delivery provision, developer record, resale rights, service
-- charges and contact preference with this file adding nothing.
--
-- Known and deliberate: `beach_access` and `distance_to_sea` sit on that same
-- parent, so they appear in New Cairo too, where neither question has an answer.
-- Left alone rather than silently re-tagged, because moving them would also
-- remove them from El Alamein compounds that legitimately have beach access.
-- Fixing it properly needs a market door on `form_fields`, which is a separate
-- decision, not a side effect of opening a city.

-- Verify:
--   SELECT id, slug, location_id, active, host FROM markets WHERE slug = 'new-cairo';
--   SELECT id, slug, path, market_id FROM locations WHERE id = 'eg-cairo-new-cairo';
--   SELECT id, market_id, market_ids FROM business_types WHERE id = 'gated_compound';
--   SELECT options FROM sections WHERE id = 'sec_7_investment';
--   -- Siwa must NOT see the property tree:
--   SELECT id FROM business_types WHERE active = TRUE
--     AND (market_id IS NULL OR market_id = 'siwa'
--          OR (market_ids IS NOT NULL AND JSON_CONTAINS(market_ids, JSON_ARRAY('siwa'))))
--     AND id IN ('real_estate','gated_compound');

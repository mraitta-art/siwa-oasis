-- Markets foundation: geography, one row per market, and business scoping.
--
-- Why: `locations` has modelled country -> neighbourhood since the first schema
-- but nothing ever wrote to it, and `businesses.location_id` is read by no query.
-- Every read in the app is therefore global, which is fine while Siwa is the
-- only market and wrong the day El Alamein opens on the same platform.
--
-- Run once:
--   node scripts/run_migration.js migrations/20261025_markets_and_geo.sql
--
-- Properties this file keeps:
--   * Siwa is the default market, so existing rows and existing URLs do not move.
--   * New markets are seeded dark (`active = 0`); a dark market gets no route,
--     no sitemap entry and no index until it has real supply.
--   * Resorts and compounds are NOT locations. They are `developments`, because
--     they have units, prices, payment plans and delivery dates.

-- ── 1. Geography: bilingual names, coordinates, path, market link, `area` level ──

ALTER TABLE locations
  ADD COLUMN name_ar VARCHAR(255) DEFAULT NULL,
  ADD COLUMN name_en VARCHAR(255) DEFAULT NULL,
  ADD COLUMN path VARCHAR(255) DEFAULT NULL,
  ADD COLUMN lat DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN lng DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN market_id VARCHAR(64) DEFAULT NULL,
  MODIFY COLUMN type ENUM('country','governorate','city','town','neighborhood','area') NOT NULL;

ALTER TABLE locations
  ADD UNIQUE KEY uq_locations_path (path),
  ADD INDEX idx_locations_market (market_id);

-- `name` stays the display name and is not copied into name_ar/name_en: the
-- table does not record which language it holds, so guessing would corrupt it.
-- Every row seeded below carries both names explicitly.

-- ── 2. Markets: the unit of branding, categories, pricing and policy ─────────
-- No foreign keys to `locations` here on purpose: markets reference a location
-- and a location records its market, which is a cycle MySQL will not accept.

CREATE TABLE IF NOT EXISTS markets (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  location_id VARCHAR(100) DEFAULT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  host VARCHAR(255) DEFAULT NULL,
  default_locale VARCHAR(8) NOT NULL DEFAULT 'en',
  currency CHAR(3) NOT NULL DEFAULT 'EGP',
  revenue_model ENUM('tourism_whatsapp','directory_lead','realestate_lead')
    NOT NULL DEFAULT 'tourism_whatsapp',
  theme_accent VARCHAR(20) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 0,
  launch_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_markets_slug (slug),
  UNIQUE KEY uq_markets_host (host),
  INDEX idx_markets_location (location_id)
);

-- ── 3. Developments: resorts, compounds and projects (not geography) ────────
-- "Marassi" is a sold, phased, priced thing with units — three properties that
-- a location row cannot hold and that the real-estate pages need to rank.

CREATE TABLE IF NOT EXISTS developments (
  id VARCHAR(64) PRIMARY KEY,
  market_id VARCHAR(64) NOT NULL,
  location_id VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(150) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  developer_name VARCHAR(255) DEFAULT NULL,
  lat DECIMAL(10,7) DEFAULT NULL,
  lng DECIMAL(10,7) DEFAULT NULL,
  phases TEXT DEFAULT NULL,
  delivery_year SMALLINT DEFAULT NULL,
  status ENUM('announced','under_construction','delivered','sold_out') NOT NULL DEFAULT 'announced',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_developments_slug (slug),
  INDEX idx_developments_market (market_id),
  INDEX idx_developments_location (location_id)
);

-- ── 3b. Units: the inventory inside a development or a listing ──────────────
-- A chalet is not a business. Five hundred chalets in one compound are five
-- hundred units under one page, otherwise the site grows five hundred thin
-- minisites and a sitemap nobody should crawl. A unit belongs either to a
-- development (its compound) or to the business that lists it (a management
-- company), usually to both.

CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(64) PRIMARY KEY,
  market_id VARCHAR(64) NOT NULL DEFAULT 'siwa',
  development_id VARCHAR(64) DEFAULT NULL,
  business_id VARCHAR(36) DEFAULT NULL,
  location_id VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(150) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) DEFAULT NULL,
  unit_type VARCHAR(64) DEFAULT NULL,
  listing_kind ENUM('rent_night','rent_month','sale') NOT NULL DEFAULT 'rent_night',
  bedrooms TINYINT DEFAULT NULL,
  bathrooms TINYINT DEFAULT NULL,
  area_sqm DECIMAL(8,2) DEFAULT NULL,
  price DECIMAL(12,2) DEFAULT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EGP',
  price_per_sqm DECIMAL(12,2) DEFAULT NULL,
  down_payment_pct DECIMAL(5,2) DEFAULT NULL,
  installment_years TINYINT DEFAULT NULL,
  delivery_year SMALLINT DEFAULT NULL,
  finishing VARCHAR(64) DEFAULT NULL,
  furnished TINYINT(1) DEFAULT NULL,
  status ENUM('available','reserved','sold','rented','inactive') NOT NULL DEFAULT 'available',
  media JSON DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_units_slug (slug),
  INDEX idx_units_development (development_id, status),
  INDEX idx_units_business (business_id),
  INDEX idx_units_market (market_id, active)
);

-- ── 4. Categories and businesses belong to a market ────────────────────────
-- A type with market_id NULL is shared by every market (a restaurant is a
-- restaurant everywhere); a type tagged with a market is only offered there
-- ("Salt Lakes Tour" in El Alamein would be a contradiction). Siwa's own view is
-- unchanged either way, because every read asks for `market_id IS NULL OR
-- market_id = <market>`.

-- TiDB validates an index expression against the table as it was, so a column
-- and an index on that column cannot arrive in the same ALTER: split them.

ALTER TABLE business_types
  ADD COLUMN market_id VARCHAR(64) DEFAULT NULL;

ALTER TABLE business_types
  ADD INDEX idx_business_types_market (market_id);

-- Default 'siwa' means the ALTER itself backfills every existing listing, so no
-- data migration and no code change is required for the current market.

ALTER TABLE businesses
  ADD COLUMN market_id VARCHAR(64) NOT NULL DEFAULT 'siwa',
  ADD COLUMN development_id VARCHAR(64) DEFAULT NULL;

ALTER TABLE businesses
  ADD INDEX idx_businesses_market (market_id, status),
  ADD INDEX idx_businesses_development (development_id);

-- The same name in two markets is two listings, not a conflict. The slug stops
-- being globally unique and becomes unique inside its market, which is what the
-- address says anyway: /siwa/gagal-hotel and /el-alamein/gagal-hotel are two
-- different properties that happen to share a name.

ALTER TABLE businesses
  DROP INDEX idx_business_slug,
  ADD UNIQUE KEY uq_businesses_market_slug (market_id, slug);

-- ── 5. Seed the geography: Egypt, its 27 governorates, and the launch areas ──

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg', 'مصر', 'مصر', 'Egypt', 'country', NULL, 'eg', 'eg', 26.8205530, 30.8024980, 1, 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  path = VALUES(path), lat = VALUES(lat), lng = VALUES(lng);

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, active, sort_order)
VALUES
  ('eg-cairo',        'القاهرة',        'القاهرة',        'Cairo',         'governorate', 'eg', 'cairo',        'eg/cairo',        1, 10),
  ('eg-giza',         'الجيزة',         'الجيزة',         'Giza',          'governorate', 'eg', 'giza',         'eg/giza',         1, 20),
  ('eg-alexandria',   'الإسكندرية',     'الإسكندرية',     'Alexandria',    'governorate', 'eg', 'alexandria',   'eg/alexandria',   1, 30),
  ('eg-dakahlia',     'الدقهلية',       'الدقهلية',       'Dakahlia',      'governorate', 'eg', 'dakahlia',     'eg/dakahlia',     1, 40),
  ('eg-red-sea',      'البحر الأحمر',   'البحر الأحمر',   'Red Sea',       'governorate', 'eg', 'red-sea',      'eg/red-sea',      1, 50),
  ('eg-beheira',      'البحيرة',        'البحيرة',        'Beheira',       'governorate', 'eg', 'beheira',      'eg/beheira',      1, 60),
  ('eg-fayoum',       'الفيوم',         'الفيوم',         'Fayoum',        'governorate', 'eg', 'fayoum',       'eg/fayoum',       1, 70),
  ('eg-gharbia',      'الغربية',        'الغربية',        'Gharbia',       'governorate', 'eg', 'gharbia',      'eg/gharbia',      1, 80),
  ('eg-ismailia',     'الإسماعيلية',    'الإسماعيلية',    'Ismailia',      'governorate', 'eg', 'ismailia',     'eg/ismailia',     1, 90),
  ('eg-monufia',      'المنوفية',       'المنوفية',       'Monufia',       'governorate', 'eg', 'monufia',      'eg/monufia',      1, 100),
  ('eg-minya',        'المنيا',         'المنيا',         'Minya',         'governorate', 'eg', 'minya',        'eg/minya',        1, 110),
  ('eg-qalyubia',     'القليوبية',      'القليوبية',      'Qalyubia',      'governorate', 'eg', 'qalyubia',     'eg/qalyubia',     1, 120),
  ('eg-new-valley',   'الوادي الجديد',  'الوادي الجديد',  'New Valley',    'governorate', 'eg', 'new-valley',   'eg/new-valley',   1, 130),
  ('eg-suez',         'السويس',         'السويس',         'Suez',          'governorate', 'eg', 'suez',         'eg/suez',         1, 140),
  ('eg-aswan',        'أسوان',          'أسوان',          'Aswan',         'governorate', 'eg', 'aswan',        'eg/aswan',        1, 150),
  ('eg-assiut',       'أسيوط',          'أسيوط',          'Assiut',        'governorate', 'eg', 'assiut',       'eg/assiut',       1, 160),
  ('eg-beni-suef',    'بني سويف',       'بني سويف',       'Beni Suef',     'governorate', 'eg', 'beni-suef',    'eg/beni-suef',    1, 170),
  ('eg-port-said',    'بورسعيد',        'بورسعيد',        'Port Said',     'governorate', 'eg', 'port-said',    'eg/port-said',    1, 180),
  ('eg-damietta',     'دمياط',          'دمياط',          'Damietta',      'governorate', 'eg', 'damietta',     'eg/damietta',     1, 190),
  ('eg-sharqia',      'الشرقية',        'الشرقية',        'Sharqia',       'governorate', 'eg', 'sharqia',      'eg/sharqia',      1, 200),
  ('eg-south-sinai',  'جنوب سيناء',     'جنوب سيناء',     'South Sinai',   'governorate', 'eg', 'south-sinai',  'eg/south-sinai',  1, 210),
  ('eg-kafr-el-sheikh','كفر الشيخ',     'كفر الشيخ',      'Kafr El Sheikh','governorate', 'eg', 'kafr-el-sheikh','eg/kafr-el-sheikh',1, 220),
  ('eg-matrouh',      'مطروح',          'مطروح',          'Matrouh',       'governorate', 'eg', 'matrouh',      'eg/matrouh',      1, 230),
  ('eg-luxor',        'الأقصر',         'الأقصر',         'Luxor',         'governorate', 'eg', 'luxor',        'eg/luxor',        1, 240),
  ('eg-qena',         'قنا',            'قنا',            'Qena',          'governorate', 'eg', 'qena',         'eg/qena',         1, 250),
  ('eg-north-sinai',  'شمال سيناء',     'شمال سيناء',     'North Sinai',   'governorate', 'eg', 'north-sinai',  'eg/north-sinai',  1, 260),
  ('eg-sohag',        'سوهاج',          'سوهاج',          'Sohag',         'governorate', 'eg', 'sohag',        'eg/sohag',        1, 270)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  path = VALUES(path), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order);

-- Launch geography. Coordinates are place centres, good enough for a map and
-- for "near me" distance; they are not boundary polygons.
INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-matrouh-siwa',             'سيوة',          'سيوة',           'Siwa',              'city',         'eg-matrouh', 'siwa',             'eg/matrouh/siwa',             29.2032000, 25.5195000, 1, 10),
  ('eg-matrouh-siwa-shali',       'الشالي',        'الشالي',         'Shali',             'neighborhood', 'eg-matrouh-siwa', 'shali',      'eg/matrouh/siwa/shali',       NULL,       NULL,       1, 11),
  ('eg-matrouh-siwa-dakrour',     'الدكرور',       'الدكرور',        'Dakrour',           'neighborhood', 'eg-matrouh-siwa', 'dakrour',    'eg/matrouh/siwa/dakrour',     NULL,       NULL,       1, 12),
  ('eg-matrouh-elalamein',        'العلمين',       'العلمين',        'El Alamein',        'city',         'eg-matrouh', 'el-alamein',       'eg/matrouh/el-alamein',       30.8418000, 28.9500000, 1, 20),
  ('eg-matrouh-new-alamein',      'العلمين الجديدة','العلمين الجديدة','New Alamein',      'city',         'eg-matrouh', 'new-alamein',      'eg/matrouh/new-alamein',      30.9500000, 28.8500000, 1, 21),
  ('eg-matrouh-sidi-abdelrahman', 'سيدي عبد الرحمن','سيدي عبد الرحمن','Sidi Abdel Rahman','area',        'eg-matrouh', 'sidi-abdelrahman', 'eg/matrouh/sidi-abdelrahman', 30.9667000, 28.7333000, 1, 22),
  ('eg-matrouh-raselhekma',       'راس الحكمة',    'راس الحكمة',     'Ras El Hekma',      'area',         'eg-matrouh', 'ras-el-hekma',     'eg/matrouh/ras-el-hekma',     31.1997000, 27.8477000, 1, 23)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  path = VALUES(path), lat = VALUES(lat), lng = VALUES(lng), type = VALUES(type);

-- ── 6. Seed the markets themselves: Siwa live, the two North Coast areas dark ──

INSERT INTO markets
  (id, slug, location_id, name_ar, name_en, host, default_locale, currency, revenue_model, theme_accent, active, launch_notes)
VALUES
  ('siwa', 'siwa', 'eg-matrouh-siwa', 'سيوة', 'Siwa Oasis', 'siwify.com', 'en', 'EGP',
   'tourism_whatsapp', '#D4AF37', 1,
   'Live. Tourism intent: stay / go / retreats hubs, WhatsApp as the conversion.'),
  ('el-alamein', 'el-alamein', 'eg-matrouh-elalamein', 'العلمين', 'El Alamein', 'elalamein.siwify.com', 'ar', 'EGP',
   'realestate_lead', '#0F4C81', 0,
   'Dark. Investment intent: developments, price per m2, payment plans, viewing requests. Index only after the first 15 verified brokers and 3 developments.'),
  ('ras-el-hekma', 'ras-el-hekma', 'eg-matrouh-raselhekma', 'راس الحكمة', 'Ras El Hekma', 'raselhekma.siwify.com', 'ar', 'EGP',
   'realestate_lead', '#0B6E4F', 0,
   'Dark. Mixed resort + investment intent. Opens after El Alamein proves the lead flow.')
ON DUPLICATE KEY UPDATE
  name_ar = VALUES(name_ar), name_en = VALUES(name_en), host = VALUES(host),
  location_id = VALUES(location_id), revenue_model = VALUES(revenue_model),
  theme_accent = VALUES(theme_accent), launch_notes = VALUES(launch_notes);

-- Link each area back to its market. Only the areas above are markets today.
UPDATE locations SET market_id = 'siwa'        WHERE id = 'eg-matrouh-siwa';
UPDATE locations SET market_id = 'el-alamein'   WHERE id IN ('eg-matrouh-elalamein', 'eg-matrouh-new-alamein', 'eg-matrouh-sidi-abdelrahman');
UPDATE locations SET market_id = 'ras-el-hekma'  WHERE id = 'eg-matrouh-raselhekma';

-- ── 6b. Tag the categories that only make sense in Siwa ─────────────────────
-- Only the rows whose name or subject is Siwa itself (the salt lakes, the
-- Siwan kitchen, Gebel Dakrur, the tuk-tuks). Everything with a generic name
-- stays NULL, which means "shared" — a restaurant, a hotel, an apartment or a
-- villa is the same category on the North Coast as in the oasis.
--
-- This does not change Siwa in any way: the market filter in the app is
-- `market_id IS NULL OR market_id = <market>`, so a tagged row still renders
-- exactly where it does today. It only stops those categories from being
-- offered in a market where they would be a contradiction.

UPDATE business_types
SET market_id = 'siwa'
WHERE id IN (
  -- accommodation
  'siwa_lodge',
  -- travel & excursions
  'salt_lakes', 'rock_climbing', 'oasis_cycling',
  -- arts, culture & heritage
  'embroidery',
  -- crafts
  'date_olive', 'salt_crafts', 'pottery_clay', 'handmade_jewelry', 'tentmaking_and_canvas_crafts',
  -- food
  'siwan_kitchen', 'desert_dining_event',
  -- industry
  'date_factory', 'herbal_factory', 'olive_mill', 'salt_factory', 'water_factory',
  -- investment
  'ecolodge_development',
  -- logistics
  'tuk_tuk', 'local_guide_service', 'boat_service', 'donkey_cart',
  -- education
  'language_school',
  -- events
  'live_music_venue',
  -- retreats
  'siwa_retreats',
  -- wellness
  'sand_bath', 'salt_therapy', 'hot_spring', 'traditional_medicine'
);

-- ── 7. Defensive verification (read these rows, do not assume) ───────────────

SELECT m.slug, m.active, m.revenue_model, l.path, l.name_en
FROM markets m
LEFT JOIN locations l ON l.id = m.location_id
ORDER BY m.active DESC, m.slug;

SELECT market_id, COUNT(*) AS businesses FROM businesses GROUP BY market_id;

SELECT COALESCE(market_id, '(shared)') AS scope, COUNT(*) AS types
FROM business_types GROUP BY market_id ORDER BY types DESC;

SELECT COUNT(*) AS units FROM units;

SELECT COUNT(*) AS developments FROM developments;

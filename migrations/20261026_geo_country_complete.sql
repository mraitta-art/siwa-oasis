-- ─────────────────────────────────────────────────────────────────────────────
-- Complete the country geography: every governorate gets its capital, and the
-- coast gets the places a market can actually open in.
--
-- `20261025_markets_and_geo.sql` seeded Egypt, the 27 governorates and the
-- Matrouh launch areas. That left 26 governorates with no city under them, so a
-- market could only be created where a place happened to exist. This file fills
-- the missing level and the resort towns that a North Coast / Red Sea market
-- needs on day one.
--
-- Ids follow `<governorate-id>-<slug>` and paths follow `<governorate>/<slug>`,
-- which is exactly what the dashboard derives when it creates a place, so a row
-- shown here and a row created by hand are indistinguishable.
--
-- Idempotent: re-running updates names and coordinates in place.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Governorate capitals ─────────────────────────────────────────────────
-- Cairo, Giza, Alexandria, Suez, Port Said, Damietta, Kafr El Sheikh, Fayoum,
-- Luxor, Qena, Assiut, Minya, Beni Suef, Sohag, Aswan, Sharqia, Dakahlia,
-- Gharbia, Monufia, Qalyubia and Beheira are named after the city that holds
-- their capital, so the city keeps the governorate's own slug and takes a
-- `-capital` id suffix.

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-cairo-capital',         'القاهرة',        'القاهرة',         'Cairo',          'city', 'eg-cairo',         'cairo',          'eg/cairo/cairo',                    30.0444000, 31.2357000, 1, 10),
  ('eg-giza-capital',          'الجيزة',         'الجيزة',          'Giza',           'city', 'eg-giza',          'giza',           'eg/giza/giza',                      30.0131000, 31.2089000, 1, 10),
  ('eg-alexandria-capital',    'الإسكندرية',     'الإسكندرية',      'Alexandria',     'city', 'eg-alexandria',    'alexandria',     'eg/alexandria/alexandria',          31.2001000, 29.9187000, 1, 10),
  ('eg-dakahlia-mansoura',     'المنصورة',       'المنصورة',        'Mansoura',       'city', 'eg-dakahlia',      'mansoura',       'eg/dakahlia/mansoura',              31.0409000, 31.3785000, 1, 10),
  ('eg-red-sea-hurghada',      'الغردقة',        'الغردقة',         'Hurghada',       'city', 'eg-red-sea',       'hurghada',       'eg/red-sea/hurghada',               27.2579000, 33.8116000, 1, 10),
  ('eg-beheira-damanhour',     'دمنهور',         'دمنهور',          'Damanhour',      'city', 'eg-beheira',       'damanhour',      'eg/beheira/damanhour',              31.0341000, 30.4682000, 1, 10),
  ('eg-fayoum-capital',        'الفيوم',         'الفيوم',          'Fayoum',         'city', 'eg-fayoum',        'fayoum',         'eg/fayoum/fayoum',                  29.3084000, 30.8428000, 1, 10),
  ('eg-gharbia-tanta',         'طنطا',           'طنطا',            'Tanta',          'city', 'eg-gharbia',       'tanta',          'eg/gharbia/tanta',                  30.7865000, 31.0004000, 1, 10),
  ('eg-ismailia-capital',      'الإسماعيلية',    'الإسماعيلية',     'Ismailia',       'city', 'eg-ismailia',      'ismailia',       'eg/ismailia/ismailia',              30.5965000, 32.2715000, 1, 10),
  ('eg-monufia-shebin-el-kom', 'شبين الكوم',     'شبين الكوم',      'Shebin El Kom',  'city', 'eg-monufia',       'shebin-el-kom',  'eg/monufia/shebin-el-kom',          30.5586000, 31.0090000, 1, 10),
  ('eg-minya-capital',         'المنيا',         'المنيا',          'Minya',          'city', 'eg-minya',         'minya',          'eg/minya/minya',                    28.1099000, 30.7503000, 1, 10),
  ('eg-qalyubia-banha',        'بنها',           'بنها',            'Banha',          'city', 'eg-qalyubia',      'banha',          'eg/qalyubia/banha',                 30.4660000, 31.1848000, 1, 10),
  ('eg-new-valley-kharga',     'الخارجة',        'الخارجة',         'Kharga',         'city', 'eg-new-valley',    'kharga',         'eg/new-valley/kharga',              25.4390000, 30.5586000, 1, 10),
  ('eg-suez-capital',          'السويس',         'السويس',          'Suez',           'city', 'eg-suez',          'suez',           'eg/suez/suez',                      29.9668000, 32.5498000, 1, 10),
  ('eg-aswan-capital',         'أسوان',          'أسوان',           'Aswan',          'city', 'eg-aswan',         'aswan',          'eg/aswan/aswan',                    24.0889000, 32.8998000, 1, 10),
  ('eg-assiut-capital',        'أسيوط',          'أسيوط',           'Assiut',         'city', 'eg-assiut',        'assiut',         'eg/assiut/assiut',                  27.1809000, 31.1837000, 1, 10),
  ('eg-beni-suef-capital',     'بني سويف',       'بني سويف',        'Beni Suef',      'city', 'eg-beni-suef',     'beni-suef',      'eg/beni-suef/beni-suef',            29.0661000, 31.0994000, 1, 10),
  ('eg-port-said-capital',     'بورسعيد',        'بورسعيد',         'Port Said',      'city', 'eg-port-said',     'port-said',      'eg/port-said/port-said',            31.2653000, 32.3019000, 1, 10),
  ('eg-damietta-capital',      'دمياط',          'دمياط',           'Damietta',       'city', 'eg-damietta',      'damietta',       'eg/damietta/damietta',              31.4165000, 31.8133000, 1, 10),
  ('eg-sharqia-zagazig',       'الزقازيق',       'الزقازيق',        'Zagazig',        'city', 'eg-sharqia',       'zagazig',        'eg/sharqia/zagazig',                30.5877000, 31.5020000, 1, 10),
  ('eg-south-sinai-el-tor',    'الطور',          'الطور',           'El Tor',         'city', 'eg-south-sinai',   'el-tor',         'eg/south-sinai/el-tor',             28.2417000, 33.6225000, 1, 10),
  ('eg-kafr-el-sheikh-capital','كفر الشيخ',      'كفر الشيخ',       'Kafr El Sheikh', 'city', 'eg-kafr-el-sheikh','kafr-el-sheikh', 'eg/kafr-el-sheikh/kafr-el-sheikh',  31.1107000, 30.9388000, 1, 10),
  ('eg-matrouh-marsa-matrouh', 'مرسى مطروح',     'مرسى مطروح',      'Marsa Matrouh',  'city', 'eg-matrouh',       'marsa-matrouh',  'eg/matrouh/marsa-matrouh',          31.3543000, 27.2373000, 1, 30),
  ('eg-luxor-capital',         'الأقصر',         'الأقصر',          'Luxor',          'city', 'eg-luxor',         'luxor',          'eg/luxor/luxor',                    25.6872000, 32.6396000, 1, 10),
  ('eg-qena-capital',          'قنا',            'قنا',             'Qena',           'city', 'eg-qena',          'qena',           'eg/qena/qena',                      26.1551000, 32.7160000, 1, 10),
  ('eg-north-sinai-el-arish',  'العريش',         'العريش',          'El Arish',       'city', 'eg-north-sinai',   'el-arish',       'eg/north-sinai/el-arish',           31.1316000, 33.7984000, 1, 10),
  ('eg-sohag-capital',         'سوهاج',          'سوهاج',           'Sohag',          'city', 'eg-sohag',         'sohag',          'eg/sohag/sohag',                    26.5591000, 31.6957000, 1, 10)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  type = VALUES(type), parent_id = VALUES(parent_id), path = VALUES(path),
  lat = VALUES(lat), lng = VALUES(lng), sort_order = VALUES(sort_order);

-- ── 2. The Red Sea coast ────────────────────────────────────────────────────
-- Hurghada is the market the operator asked about, and a resort market is only
-- as good as the towns it can list in. `area` is used for the bays, which are
-- stretches of coast rather than built-up cities.

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-red-sea-el-gouna',      'الجونة',         'الجونة',          'El Gouna',       'town', 'eg-red-sea-hurghada', 'el-gouna',      'eg/red-sea/hurghada/el-gouna',      27.3947000, 33.6772000, 1, 10),
  ('eg-red-sea-sahl-hasheesh', 'سهل حشيش',       'سهل حشيش',        'Sahl Hasheesh',  'area', 'eg-red-sea',          'sahl-hasheesh', 'eg/red-sea/sahl-hasheesh',          27.1000000, 33.8000000, 1, 20),
  ('eg-red-sea-makadi-bay',    'خليج مكادي',     'خليج مكادي',      'Makadi Bay',     'area', 'eg-red-sea',          'makadi-bay',    'eg/red-sea/makadi-bay',             26.9800000, 33.8500000, 1, 30),
  ('eg-red-sea-soma-bay',      'سوما باي',       'سوما باي',        'Soma Bay',       'area', 'eg-red-sea',          'soma-bay',      'eg/red-sea/soma-bay',               26.8600000, 33.9300000, 1, 40),
  ('eg-red-sea-safaga',        'سفاجا',          'سفاجا',           'Safaga',         'city', 'eg-red-sea',          'safaga',        'eg/red-sea/safaga',                 26.7500000, 33.9300000, 1, 50),
  ('eg-red-sea-marsa-alam',    'مرسى علم',       'مرسى علم',        'Marsa Alam',     'city', 'eg-red-sea',          'marsa-alam',    'eg/red-sea/marsa-alam',             25.0670000, 34.8900000, 1, 60)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  type = VALUES(type), parent_id = VALUES(parent_id), path = VALUES(path),
  lat = VALUES(lat), lng = VALUES(lng), sort_order = VALUES(sort_order);

-- ── 3. South Sinai ──────────────────────────────────────────────────────────

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-south-sinai-sharm-el-sheikh', 'شرم الشيخ', 'شرم الشيخ', 'Sharm El Sheikh', 'city', 'eg-south-sinai', 'sharm-el-sheikh', 'eg/south-sinai/sharm-el-sheikh', 27.9158000, 34.3299000, 1, 20),
  ('eg-south-sinai-dahab',           'دهب',       'دهب',       'Dahab',           'town', 'eg-south-sinai', 'dahab',           'eg/south-sinai/dahab',           28.5091000, 34.5136000, 1, 30),
  ('eg-south-sinai-nuweiba',         'نويبع',     'نويبع',     'Nuweiba',         'town', 'eg-south-sinai', 'nuweiba',         'eg/south-sinai/nuweiba',         29.0333000, 34.6667000, 1, 40)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  type = VALUES(type), parent_id = VALUES(parent_id), path = VALUES(path),
  lat = VALUES(lat), lng = VALUES(lng), sort_order = VALUES(sort_order);

-- ── 4. Alexandria's beach strip ─────────────────────────────────────────────
-- The western beaches are where the city's summer supply actually sits, and
-- they are areas rather than governorate-level places.

INSERT INTO locations (id, name, name_ar, name_en, type, parent_id, slug, path, lat, lng, active, sort_order)
VALUES
  ('eg-alexandria-borg-el-arab', 'برج العرب', 'برج العرب', 'Borg El Arab', 'city', 'eg-alexandria', 'borg-el-arab', 'eg/alexandria/borg-el-arab', 30.9167000, 29.5500000, 1, 20),
  ('eg-alexandria-el-agamy',     'العجمي',    'العجمي',    'El Agamy',     'area', 'eg-alexandria', 'el-agamy',     'eg/alexandria/el-agamy',     31.0967000, 29.7667000, 1, 30),
  ('eg-alexandria-king-mariout', 'المعمورة',  'المعمورة',  'King Mariout', 'area', 'eg-alexandria', 'king-mariout', 'eg/alexandria/king-mariout', 31.1000000, 29.6500000, 1, 40)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), name_en = VALUES(name_en),
  type = VALUES(type), parent_id = VALUES(parent_id), path = VALUES(path),
  lat = VALUES(lat), lng = VALUES(lng), sort_order = VALUES(sort_order);

-- ── 5. Verification — read these rows, do not assume ────────────────────────

-- Every governorate should now hold at least one city or area.
SELECT g.id AS governorate, COUNT(c.id) AS places
FROM locations g
LEFT JOIN locations c ON c.parent_id = g.id
WHERE g.type = 'governorate'
GROUP BY g.id
HAVING places = 0;

SELECT type, COUNT(*) AS places FROM locations GROUP BY type ORDER BY places DESC;

-- The example from the brief: Hurghada, ready to become a market.
SELECT id, path, name_en, type, market_id
FROM locations
WHERE path = 'eg/red-sea/hurghada';

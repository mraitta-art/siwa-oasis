-- ============================================================================
-- 20261119_link_developer_businesses.sql
--
-- Creates a corporate business profile for each of the 5 seeded developers
-- and links developers.business_id → businesses.id so each developer gets
-- a branded minisite using the standard business engine.
--
-- Idempotent: INSERT ... ON DUPLICATE KEY UPDATE id = id
--             UPDATE ... WHERE business_id IS NULL
-- ============================================================================

-- ── 1. Ensure businesses table has name_ar ──────────────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255) DEFAULT NULL;

-- ── 2. Corporate business profiles ──────────────────────────────────────────
INSERT INTO businesses (id, slug, name, name_ar, type_id, market_id, status, published, service_level)
VALUES
  ('biz_emaar_misr',          'emaar-misr',              'Emaar Misr',               'إعمار مصر',              'brokerage_office', 'el-alamein', 'active', 1, 'level_2'),
  ('biz_palm_hills',          'palm-hills',              'Palm Hills Developments',  'بالم هيلز للتطوير',      'brokerage_office', 'el-alamein', 'active', 1, 'level_2'),
  ('biz_sodic',               'sodic',                   'SODIC',                    'سوديك',                  'brokerage_office', 'el-alamein', 'active', 1, 'level_2'),
  ('biz_hassan_allam',        'hassan-allam-properties', 'Hassan Allam Properties',  'حسن علام العقارية',      'brokerage_office', 'el-alamein', 'active', 1, 'level_2'),
  ('biz_mountain_view',       'mountain-view',           'Mountain View',            'ماونتن فيو',             'brokerage_office', 'el-alamein', 'active', 1, 'level_2')
ON DUPLICATE KEY UPDATE id = id;

-- ── 3. Link developers → businesses ─────────────────────────────────────────
UPDATE developers SET business_id = 'biz_emaar_misr'    WHERE name = 'Emaar Misr'              AND (business_id IS NULL OR business_id = '');
UPDATE developers SET business_id = 'biz_palm_hills'    WHERE name = 'Palm Hills Developments'  AND (business_id IS NULL OR business_id = '');
UPDATE developers SET business_id = 'biz_sodic'         WHERE name = 'SODIC'                    AND (business_id IS NULL OR business_id = '');
UPDATE developers SET business_id = 'biz_hassan_allam'  WHERE name = 'Hassan Allam Properties'  AND (business_id IS NULL OR business_id = '');
UPDATE developers SET business_id = 'biz_mountain_view' WHERE name = 'Mountain View'             AND (business_id IS NULL OR business_id = '');

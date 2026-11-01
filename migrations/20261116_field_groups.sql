-- ═══════════════════════════════════════════════════════════════════════════
--  FIELD GROUPS — the categorization layer a section never had
--  +  units.price_basis, the money-period axis three listing kinds share
--  +  sec_4_gastronomy, the section id typologies already declare but that
--     has no registry row
--
--  WHY THIS EXISTS
--  A section answers "what does this page say about this business", one value
--  per question. Admins have no way to bundle related questions under a name
--  they chose themselves, so a hero slide could only ever carry up to eight
--  loose field keys (MAX_FIELDS_PER_BLOCK) with no heading — "financial terms",
--  "booking & cancellation", "room offer" were words in nobody's data. This
--  adds the missing noun.
--
--  WHY A GROUP IS SCOPED EXACTLY LIKE A FIELD
--  `form_fields` is resolved by walking SECTION_TEMPLATE -> parent -> child,
--  most specific definition winning on `${section_id}:${name}:${version_type}`
--  (src/app/api/jana/forms/route.ts). `field_groups` carries the same
--  (business_type_id, section_id, name) triple, so the same walk resolves a
--  group: define "الشروط المالية / Financial terms" once on the `real_estate`
--  parent and its 5 children inherit it; a child may redefine the same `name`
--  to change its membership or its wording. No parallel inheritance system was
--  invented, which is the whole reason membership is a column on the field and
--  not a join table — a field that inherits, overrides, or is excluded carries
--  its group with it automatically.
--
--  `excluded` is the one subtractive case the merge could not express: today a
--  child can add and replace a parent's field but cannot refuse it. DEFAULT 0
--  means all 62 existing rows keep answering exactly as they do now.
--
--  `price_basis` exists because `units.price` already means three different
--  things — per night for rent_night, per month for rent_month, total for sale
--  — inferred from `listing_kind`. A timeshare week is *sold* (so the kind is
--  `sale`) but priced *per week*, and the inference breaks. `listing_kind` is
--  deliberately NOT widened: UNIT_KINDS (src/lib/unit-terms.ts) and the read in
--  src/lib/developments.ts both whitelist the three enum values and coerce
--  anything unknown to 'rent_night', so a fourth enum value would render a
--  timeshare as a nightly rental rather than fail loudly. NULL keeps the old
--  inference, so no existing row changes meaning.
--
--  NO FOREIGN KEYS HERE ON PURPOSE
--  `form_fields` has never had an FK to `business_types` or `sections`; the
--  section delete route removes its dependants by hand. A guarded FK on
--  field_groups would make section deletion fail on rows that reference an id
--  like `sec_4_gastronomy` before that row existed — exactly the dangling state
--  this file repairs below. The references are soft, like every other registry
--  reference in this schema.
--
--  IDEMPOTENT: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, one
--  guarded statement per index, INSERT ... ON DUPLICATE KEY UPDATE id = id for
--  the row that must never overwrite an admin's edit. Re-running is a no-op.
--
--  HOW TO APPLY (same runner as every other migration, run it twice)
--    node --env-file=.env.local scripts/run_migration.js migrations/20261116_field_groups.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. The group: a named bundle of one section's fields ────────────────────
CREATE TABLE IF NOT EXISTS field_groups (
  id VARCHAR(64) PRIMARY KEY,
  business_type_id VARCHAR(100) NOT NULL COMMENT 'SECTION_TEMPLATE, a parent, or a child — same scoping as form_fields',
  section_id VARCHAR(100) NOT NULL COMMENT 'exactly one section: a block already carries sectionId, and a cross-section group would break the "read this section''s own answer" guarantee',
  name VARCHAR(64) NOT NULL COMMENT 'machine key, stable; a child redefines the same name to override membership',
  label VARCHAR(255) NOT NULL,
  label_ar VARCHAR(191) NULL COMMENT 'the heading a hero slide prints; required by the seed, blank is a bug not a feature',
  help_text TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_field_groups (business_type_id, section_id, name),
  INDEX idx_field_groups_lookup (business_type_id, section_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ── 2. Membership travels with the field definition ────────────────────────
ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS group_key VARCHAR(64) DEFAULT NULL
    COMMENT 'field_groups.name within this (business_type_id, section_id); NULL = ungrouped, renders as it does today';

ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS excluded TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'a child refuses a parent field; the merge drops it. Never set on a parent definition an admin still wants';

-- A column and an index on it cannot share one ALTER on TiDB, so: split.
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'form_fields'
     AND INDEX_NAME = 'idx_form_fields_group') = 0,
  'ALTER TABLE form_fields ADD INDEX idx_form_fields_group (business_type_id, section_id, group_key)',
  'SELECT ''idx_form_fields_group already exists'''
);
PREPARE add_idx FROM @sql;
EXECUTE add_idx;
DEALLOCATE PREPARE add_idx;

-- ── 3. The money period, orthogonal to listing_kind and ownership_type ──────
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS price_basis VARCHAR(16) DEFAULT NULL
    COMMENT 'total | night | month | week | year. NULL = inferred from listing_kind, the pre-existing behaviour';

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'units'
     AND INDEX_NAME = 'idx_units_price_basis') = 0,
  'ALTER TABLE units ADD INDEX idx_units_price_basis (market_id, price_basis, active)',
  'SELECT ''idx_units_price_basis already exists'''
);
PREPARE add_idx FROM @sql;
EXECUTE add_idx;
DEALLOCATE PREPARE add_idx;

-- ── 4. Repair the dangling id: adventure and retreats already declare it ────
-- `sec_4_gastronomy` appears in business_types.sections for two parents (and
-- therefore in every child that inherits from them, 24 typologies counting the
-- food family's 10 children) while `sections` has no row for it. Nothing errored:
-- the readers silently drop a section they cannot resolve, so `restaurant`,
-- `cafe` and `cafe_juice` had no dining shelf at all.
--
-- ON DUPLICATE KEY UPDATE id = id is intentional. The first run creates the row;
-- every later run must not undo an admin's rename, icon or curation policy.
INSERT INTO sections (
  id, name, name_ar, icon, description,
  required, vendor_editable, show_on_public, is_filterable, show_on_card,
  is_universal, section_type, inheritance_rules,
  display_order, sort_order, options, active,
  propagation_hero, propagation_blog, propagation_card,
  show_on_minisite, enable_gallery, enable_blog,
  curation_policy, auto_publish_images, max_gallery_items, auto_publish_blogs,
  has_miniblog, miniblog_enabled, has_gallery, gallery_enabled
) VALUES (
  'sec_4_gastronomy',
  'Food & Dining',
  'المأكولات والمشروبات',
  'fa-utensils',
  'What is served, where, and at what table. The menu itself is catalog data, not a field on this page.',
  0, 1, 1, 0, 1,
  0, 'general',
  JSON_OBJECT('content_policy', JSON_OBJECT(
    'vendor_can_upload_images', TRUE,
    'vendor_can_add_captions', TRUE,
    'vendor_can_write_blog', TRUE,
    'vendor_can_submit_carousel', FALSE,
    'vendor_can_request_main_carousel', FALSE,
    'requires_approval', TRUE
  )),
  0, 4, NULL, 1,
  1, 0, 1,
  1, 1, 1,
  'auto_approve', 0, 50, 0,
  1, 1, 1, 1
)
ON DUPLICATE KEY UPDATE id = id;

-- ── 5. Verify ──────────────────────────────────────────────────────────────
--   SELECT COUNT(*) FROM field_groups;
--   SELECT business_type_id, section_id, COUNT(group_key) FROM form_fields GROUP BY 1,2;
--   SELECT id, name, name_ar, section_type FROM sections WHERE id = 'sec_4_gastronomy';
--   SELECT COLUMN_NAME FROM information_schema.COLUMNS
--     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('form_fields','units')
--       AND COLUMN_NAME IN ('group_key','excluded','price_basis');

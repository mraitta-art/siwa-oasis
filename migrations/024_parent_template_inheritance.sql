-- ================================================================
-- Migration 024: Parent Type Default Minisite Template Inheritance
-- ================================================================

-- 1. Add default_template_id to business_types
--    Only parent types use this — children inherit it for minisite rendering.
ALTER TABLE business_types
  ADD COLUMN IF NOT EXISTS default_template_id VARCHAR(100) DEFAULT NULL
  COMMENT 'Parent types: the free minisite template all children inherit';

ALTER TABLE business_types
  ADD INDEX IF NOT EXISTS idx_default_template (default_template_id);

-- 2. Auto-wire: for each parent type, if there is exactly one template with
--    matching category_id (= that parent's id), set it as the default.
UPDATE business_types bt
  INNER JOIN (
    SELECT category_id, MIN(id) as tmpl_id
    FROM minisite_templates
    WHERE category_id IS NOT NULL
    GROUP BY category_id
  ) tmpl ON tmpl.category_id = bt.id
SET bt.default_template_id = tmpl.tmpl_id
WHERE bt.is_parent = 1 AND bt.default_template_id IS NULL;

-- 3. Add resolved_template_id to businesses:
--    The actual template used (explicit > child > parent > tier).
--    Stored so the minisite renderer can look it up without joins.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS resolved_template_id VARCHAR(100) DEFAULT NULL
  COMMENT 'Final resolved template for minisite rendering (may be inherited from parent type)';

-- Backfill resolved_template_id from existing template_id
UPDATE businesses SET resolved_template_id = template_id WHERE template_id IS NOT NULL AND resolved_template_id IS NULL;

-- The hierarchy stops being a list of strings in code.
--
-- Three changes, all additive:
--
--   business_types.name_ar    A category could only ever be named once, so an
--                             Arabic-first market showed English chips. This
--                             adds the second name; readers fall back with `||`,
--                             never with `??`, because an admin can save ''.
--
--   business_types.market_id  Already added by 20261025 (29 Siwa rows are tagged).
--                             Nothing to do here; the editor can now write it.
--
--   locations.type            Was an ENUM, which meant a new level ("district")
--                             required a schema change before an admin could use
--                             it. As VARCHAR the vocabulary lives in
--                             src/lib/geo-admin.ts CHILD_TYPES alone, so the next
--                             level is a code change only — and a level the code
--                             does not list is still refused on write.
--
-- Deployment notes
--   * MODIFY COLUMN keeps every existing row: the enum values are already valid
--     strings ('country', 'governorate', 'city', 'town', 'area', 'neighborhood').
--   * DEFAULT 'city' matches toGeoType()'s fallback, so a row inserted without a
--     type behaves exactly as it does today.
--   * Re-running is a no-op on name_ar and harmless on type.

ALTER TABLE business_types
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255) DEFAULT NULL
    COMMENT 'Arabic category name; NULL means the English name is used';

ALTER TABLE locations
  MODIFY COLUMN type VARCHAR(32) NOT NULL DEFAULT 'city'
    COMMENT 'country | governorate | city | district | town | area | neighborhood';

-- Verification: the vocabulary in use, and how deep the tree currently goes.
SELECT type, COUNT(*) AS places
FROM locations
GROUP BY type
ORDER BY places DESC;

SELECT COALESCE(NULLIF(market_id, ''), '(shared)') AS scope,
       COUNT(*) AS types,
       SUM(name_ar IS NOT NULL AND TRIM(name_ar) <> '') AS with_arabic
FROM business_types
GROUP BY scope;

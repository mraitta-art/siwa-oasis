-- What a container inside a market actually is.
--
--   'compound' -> a project by a developer (Hacienda, Marassi): developer,
--                 delivery year, status, units, payment plans.
--   'town'     -> a settlement with a mix of schools, shops, cafés and homes
--                 (El Hammam). Nobody developed it and it has no delivery date.
--   'village'  -> a smaller settlement or a named village inside a market.
--   'resort'   -> a hospitality container that is a destination in itself.
--
-- One table, one URL shape (/{market}/{slug}), one page. A separate table
-- would mean a second resolver, a second facet query and two slug namespaces
-- that can disagree about the same address.
--
-- Re-running this file is a no-op: the ADD only happens once. Every row that
-- exists today is a compound, which is what the column's default records.
ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS kind VARCHAR(16) NOT NULL DEFAULT 'compound'
    COMMENT 'compound | town | village | resort';

-- Verify:
--   SELECT kind, COUNT(*) AS containers FROM developments GROUP BY kind;

-- Reclassify an existing row (a project that turned out to be a town):
--   UPDATE developments SET kind = 'town' WHERE slug = 'el-hammam';

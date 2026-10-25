-- Arabic becomes storable, not required.
--
-- Two additive, nullable columns. Nothing is backfilled and nothing is enforced:
-- an admin writes Arabic when it is known, and every reader falls back to the
-- English name when it is not, so no page can render blank.
--
--   businesses.name_ar             A listing's Arabic display name. Until now it
--                                  had no home except a custom_data blob, which is
--                                  not queryable and therefore useless for cards,
--                                  facets and the compound grid.
--   developments.page_business_id  The business that serves as this compound's
--                                  page. NULL keeps today's behaviour: structural
--                                  page only (header + its own listings).
--
-- Deployment notes
--   * ADD COLUMN IF NOT EXISTS, matching migrations 016-047. Re-running is a no-op.
--   * Column and index stay in separate ALTERs: TiDB validates an index expression
--     against the table as it was, the same reason 20261025 split business_types.
--   * Safe before or after the application code ships: every reader added in
--     src/lib/developments.ts sits inside try/catch, so a missing column degrades
--     to the pre-migration result instead of throwing ER_BAD_FIELD_ERROR.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255) DEFAULT NULL
    COMMENT 'Arabic display name entered by an admin; NULL means not written yet';

ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS page_business_id VARCHAR(36) DEFAULT NULL
    COMMENT 'businesses.id serving as this compound page; NULL = structural page only';

ALTER TABLE developments
  ADD INDEX IF NOT EXISTS idx_developments_page_business (page_business_id);

-- Arabic coverage report. Read-only; nothing here blocks anything.
SELECT
  COUNT(*) AS businesses_total,
  SUM(name_ar IS NOT NULL AND TRIM(name_ar) <> '') AS with_arabic
FROM businesses;

SELECT
  COUNT(*) AS compounds_total,
  SUM(name_ar IS NULL OR TRIM(name_ar) = '') AS missing_arabic,
  SUM(TRIM(name_ar) = TRIM(name_en)) AS arabic_is_english
FROM developments;

SELECT market_id, slug, name_ar, name_en, page_business_id
FROM developments
ORDER BY market_id, slug;

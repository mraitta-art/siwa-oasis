-- Migration 046: add the businesses columns the vendor flows already write
--
-- Why this exists
--   The vendor minisite acceptance route and the business claim route both write
--   `businesses.is_published` and `businesses.vendor_phone`, and
--   /api/jana/vendor-services selects `b.published, b.is_published`. The live TiDB
--   schema has neither column (checked against information_schema), so those
--   statements failed with ER_BAD_FIELD_ERROR: claiming a business or accepting a
--   curated minisite could not complete in production.
--
-- Deployment notes
--   * Purely additive: nothing is dropped, renamed or retyped.
--   * `published` stays the canonical public flag (public minisite visibility reads
--     the published minisite_vendor_handoffs revision, not this column).
--     `is_published` is the legacy mirror the claim/acceptance code writes, so it is
--     backfilled from `published` once to keep the two from disagreeing.
--   * Statement guards use IF NOT EXISTS, matching migrations 016-045.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_published TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Legacy mirror of published, written by the claim/acceptance flows',
  ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(32) DEFAULT NULL
    COMMENT 'Vendor WhatsApp/contact phone captured at claim or acceptance';

-- One-time backfill. Only promotes already-published businesses; a row that was
-- never published stays at the column default 0.
UPDATE businesses
SET is_published = 1
WHERE published = 1
  AND is_published = 0;

-- Where a listing's public address lives.
--
--   'root'   -> siwify.com/villa-name           (what a QR code has always printed)
--   'market' -> siwify.com/hurghada/villa-name
--
-- The column records the choice only: market_id and location_id still file the
-- listing inside its market and zone, so geography never depends on the address.
--
-- Two statements on purpose. Existing rows inherit 'market' because that is the
-- shape their canonical has used until now, and a deploy must not move a URL
-- that may already be indexed. The default then flips to 'root', so from here on
-- every new listing answers at the short address without anyone ticking a box.
-- Re-running this file rewrites no row: the ADD is a no-op once the column
-- exists, and SET DEFAULT only affects future inserts.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS url_style VARCHAR(16) NOT NULL DEFAULT 'market'
    COMMENT 'root = /{slug}, market = /{market}/{slug}';

ALTER TABLE businesses ALTER COLUMN url_style SET DEFAULT 'root';

-- Flip one listing when its QR should become its address:
--   UPDATE businesses SET url_style = 'root' WHERE slug = '...';

-- Both must come back empty before any listing is switched to 'root': a root
-- address is one global namespace, because a QR code carries no market.
--   SELECT slug, COUNT(*) AS copies FROM businesses GROUP BY slug HAVING copies > 1;
--   SELECT id, slug FROM businesses WHERE slug REGEXP '[^a-z0-9-]';

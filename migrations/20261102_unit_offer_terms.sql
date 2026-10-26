-- The money and the calendar of a rental.
--
-- A unit already says what it is (`listing_kind` = rent_night | rent_month |
-- sale), how many bedrooms it has and what it costs. What it could not say is
-- what a tenant actually asks before booking: how much deposit, how long the
-- minimum stay is, and from when it is free. Those three are filtered on, so
-- they are columns and not JSON.
--
-- `amenities` is the exception: a per-unit override of the building's
-- facilities. It is a list nobody sorts by yet, so it stays JSON until a facet
-- needs it.
--
-- Every column is nullable and additive: existing rows stay valid, and a unit
-- that never rents simply leaves them empty. Re-running this file is a no-op.
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS deposit DECIMAL(12,2) NULL
    COMMENT 'refundable amount asked for a rental';

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS deposit_months TINYINT NULL
    COMMENT 'rent units that price the deposit in months instead of cash';

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS min_stay_nights SMALLINT NULL
    COMMENT 'shortest bookable stay; nightly and monthly rentals only';

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS available_from DATE NULL
    COMMENT 'first date a renter can move in';

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS amenities JSON NULL
    COMMENT 'per-unit facilities, overriding the building list';

-- Verify:
--   SELECT slug, listing_kind, price, deposit, min_stay_nights, available_from FROM units;

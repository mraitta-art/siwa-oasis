-- Migration: Add double-blind moderation columns to journey_offers

ALTER TABLE journey_offers 
ADD COLUMN admin_approved_offer BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN visitor_accepted BOOLEAN DEFAULT FALSE AFTER admin_approved_offer,
ADD COLUMN admin_approved_match BOOLEAN DEFAULT FALSE AFTER visitor_accepted;

-- We don't necessarily need indexes on these boolean flags unless we have huge tables,
-- but adding one for admin_approved_offer might speed up visitor dashboard queries.
CREATE INDEX idx_admin_approved_offer ON journey_offers(admin_approved_offer);

-- Migration: Add customer_phone to journey_requests and make customer_email optional

ALTER TABLE journey_requests 
ADD COLUMN customer_phone VARCHAR(50) DEFAULT NULL AFTER customer_email,
MODIFY COLUMN customer_email VARCHAR(255) DEFAULT NULL;

-- Add an index for faster lookups on the Visitor Dashboard
CREATE INDEX idx_customer_phone ON journey_requests(customer_phone);

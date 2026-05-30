-- Migration 013: Add investment-related fields to journey_templates
-- This extends journey templates to support investment opportunities alongside experiences

ALTER TABLE journey_templates ADD COLUMN (
  is_investment_journey BOOLEAN DEFAULT 0 COMMENT 'Marks this as an investment-focused journey',
  investment_types JSON COMMENT 'Array of investment types: ["real_estate", "timeshare", "wholesale", "business", "agriculture"]',
  investment_description TEXT COMMENT 'Description of investment opportunity',
  minimum_investment_usd INT DEFAULT 0 COMMENT 'Minimum investment amount in USD',
  estimated_roi_percent INT DEFAULT 0 COMMENT 'Estimated annual return on investment (percent)',
  investment_partner_name VARCHAR(255) COMMENT 'Name of investment partner/broker',
  investment_partner_contact VARCHAR(255) COMMENT 'Contact info for investment partner',
  featured_properties JSON COMMENT 'Array of specific properties/opportunities to showcase',
  success_stories JSON COMMENT 'Array of investor testimonials and case studies',
  requirements_text TEXT COMMENT 'Qualifications/requirements to participate'
);

-- Create index for investment journeys
CREATE INDEX idx_is_investment_journey ON journey_templates(is_investment_journey);

-- Example: Update one of the existing templates to include optional investment information
UPDATE journey_templates 
SET 
  is_investment_journey = 0,
  investment_types = JSON_ARRAY(),
  investment_description = NULL
WHERE id = 'wellness-retreat';

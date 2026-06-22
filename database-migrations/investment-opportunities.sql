/**
 * Database Schema for Investment Opportunities System
 * Allows businesses to list investment opportunities with admin visibility control
 */

-- ============================================================
-- INVESTMENT OPPORTUNITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_opportunities (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36) NOT NULL,
  opportunity_title VARCHAR(255) NOT NULL,
  opportunity_type ENUM('equity', 'partnership', 'franchise', 'joint_venture', 'sponsorship', 'vendor_network', 'affiliate') DEFAULT 'partnership',
  
  -- Investment Details
  description TEXT,
  detailed_description LONGTEXT,
  investment_amount_min DECIMAL(12, 2),
  investment_amount_max DECIMAL(12, 2),
  expected_roi_percent DECIMAL(5, 2), -- Expected Return on Investment percentage
  timeline_months INT, -- How long until ROI
  target_investors INT, -- How many investors needed
  investors_current INT DEFAULT 0,
  
  -- Terms & Conditions
  equity_percent_offered DECIMAL(5, 2), -- % equity for partnership/joint venture
  revenue_sharing_percent DECIMAL(5, 2), -- % of revenue for other types
  profit_split_terms TEXT, -- Detailed profit sharing terms
  investment_terms TEXT, -- Terms and conditions
  exit_strategy TEXT, -- How investor can exit
  
  -- Business Info
  business_stage ENUM('startup', 'growth', 'established', 'expansion') DEFAULT 'established',
  annual_revenue DECIMAL(12, 2),
  years_in_business INT,
  team_size INT,
  market_size DECIMAL(12, 2), -- TAM - Total Addressable Market
  
  -- Documentation
  business_plan_url VARCHAR(500),
  financial_projections_url VARCHAR(500),
  pitch_deck_url VARCHAR(500),
  
  -- Media
  image_url VARCHAR(500),
  gallery_urls JSON, -- Array of image URLs
  
  -- Status & Visibility
  status ENUM('draft', 'published', 'closed', 'funded') DEFAULT 'draft',
  visibility_on_main_site BOOLEAN DEFAULT FALSE, -- Can admins show on main site?
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until DATE,
  
  -- Admin Controls
  approval_status ENUM('pending', 'approved', 'rejected', 'needs_revision') DEFAULT 'pending',
  approval_notes TEXT,
  approved_by VARCHAR(36),
  visibility_changed_reason TEXT, -- Why admin hid/showed on main site
  
  -- Analytics
  views_count INT DEFAULT 0,
  inquiries_count INT DEFAULT 0,
  investor_applications INT DEFAULT 0,
  
  metadata JSON,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business (business_id),
  INDEX idx_status (status),
  INDEX idx_type (opportunity_type),
  INDEX idx_visibility (visibility_on_main_site),
  INDEX idx_featured (is_featured),
  INDEX idx_approval (approval_status),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVESTOR PROFILES TABLE - Track investor information
-- ============================================================
CREATE TABLE IF NOT EXISTS investor_profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36),
  investor_name VARCHAR(255),
  investor_type ENUM('individual', 'company', 'fund', 'angel', 'venture_capital') DEFAULT 'individual',
  
  -- Investment Preferences
  min_investment DECIMAL(12, 2),
  max_investment DECIMAL(12, 2),
  preferred_types JSON, -- Array of opportunity types they're interested in
  industries_of_interest JSON, -- Array of industry keywords
  
  -- Investor Info
  bio TEXT,
  experience_years INT,
  successful_exits INT,
  portfolio_companies INT,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Status
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_verified (verified),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVESTMENT APPLICATIONS TABLE - Track investor interest
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_applications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  opportunity_id VARCHAR(36) NOT NULL,
  investor_id VARCHAR(36),
  user_id VARCHAR(36),
  
  -- Application Details
  investment_amount DECIMAL(12, 2),
  application_message TEXT,
  application_status ENUM('submitted', 'reviewing', 'accepted', 'rejected', 'negotiating', 'funded') DEFAULT 'submitted',
  
  -- Timeline
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  responded_at TIMESTAMP NULL,
  funded_at TIMESTAMP NULL,
  
  -- Response from Business
  business_response TEXT,
  next_steps TEXT,
  
  -- Contact Info
  investor_email VARCHAR(255),
  investor_phone VARCHAR(20),
  
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_opportunity (opportunity_id),
  INDEX idx_investor (investor_id),
  INDEX idx_user (user_id),
  INDEX idx_status (application_status),
  FOREIGN KEY (opportunity_id) REFERENCES investment_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES investor_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVESTMENT FAQS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_faqs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  opportunity_id VARCHAR(36) NOT NULL,
  question VARCHAR(500),
  answer TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_opportunity (opportunity_id),
  FOREIGN KEY (opportunity_id) REFERENCES investment_opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVESTMENT MILESTONES TABLE - Track business progress
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_milestones (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  opportunity_id VARCHAR(36) NOT NULL,
  milestone_title VARCHAR(255),
  milestone_description TEXT,
  target_date DATE,
  completion_date DATE,
  status ENUM('planned', 'in_progress', 'completed', 'delayed', 'completed_early') DEFAULT 'planned',
  position INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_opportunity (opportunity_id),
  FOREIGN KEY (opportunity_id) REFERENCES investment_opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Featured investment opportunities visible on main site
CREATE VIEW featured_investment_opportunities AS
SELECT 
  io.*,
  b.business_name,
  b.business_type,
  COUNT(DISTINCT ia.id) as application_count
FROM investment_opportunities io
LEFT JOIN businesses b ON io.business_id = b.id
LEFT JOIN investment_applications ia ON io.id = ia.opportunity_id
WHERE io.status IN ('published', 'funded')
AND io.visibility_on_main_site = TRUE
AND io.is_featured = TRUE
AND (io.featured_until IS NULL OR io.featured_until >= CURDATE())
GROUP BY io.id;

-- All active investment opportunities visible on main site
CREATE VIEW active_investment_opportunities AS
SELECT 
  io.*,
  b.business_name,
  b.business_type,
  COUNT(DISTINCT ia.id) as application_count,
  COUNT(DISTINCT ia.investor_id) as unique_investors
FROM investment_opportunities io
LEFT JOIN businesses b ON io.business_id = b.id
LEFT JOIN investment_applications ia ON io.id = ia.opportunity_id AND ia.application_status NOT IN ('rejected', 'submitted')
WHERE io.status IN ('published', 'funded')
AND io.visibility_on_main_site = TRUE
AND io.approval_status = 'approved'
GROUP BY io.id;

-- Investment opportunity stats per business
CREATE VIEW business_investment_stats AS
SELECT 
  io.business_id,
  b.business_name,
  COUNT(io.id) as total_opportunities,
  COUNT(CASE WHEN io.status = 'published' THEN 1 END) as active_opportunities,
  COUNT(CASE WHEN io.status = 'funded' THEN 1 END) as funded_opportunities,
  COALESCE(SUM(io.investors_current), 0) as total_investors,
  COALESCE(SUM(io.investor_applications), 0) as total_applications
FROM investment_opportunities io
LEFT JOIN businesses b ON io.business_id = b.id
GROUP BY io.business_id;

-- Investor analytics
CREATE VIEW investor_analytics AS
SELECT 
  ip.id,
  ip.investor_name,
  COUNT(DISTINCT ia.id) as applications_submitted,
  COUNT(DISTINCT CASE WHEN ia.application_status = 'funded' THEN ia.id END) as funded_deals,
  COUNT(DISTINCT CASE WHEN ia.application_status IN ('accepted', 'negotiating', 'funded') THEN ia.id END) as active_deals,
  COALESCE(SUM(ia.investment_amount), 0) as total_invested
FROM investor_profiles ip
LEFT JOIN investment_applications ia ON ip.id = ia.investor_id
GROUP BY ip.id;

/**
 * Database Schema for Packages, Offers & Discounts System
 * Flexible system supporting product bundles, discounts, and special offers
 * with admin control and vendor access permissions
 */

-- ============================================================
-- PACKAGES TABLE - Product bundles and service packages
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36),
  package_name VARCHAR(255) NOT NULL,
  description TEXT,
  package_type ENUM('bundle', 'tier', 'service_package', 'combo') DEFAULT 'bundle',
  
  -- Package Contents
  included_items JSON, -- Array of items in bundle (e.g., [{"name": "Hotel Night", "qty": 2}, {"name": "Tour", "qty": 1}])
  base_price DECIMAL(10, 2),
  package_price DECIMAL(10, 2),
  savings_amount DECIMAL(10, 2), -- Calculated: base_price - package_price
  savings_percentage DECIMAL(5, 2), -- Calculated percentage
  
  -- Availability
  status ENUM('active', 'inactive', 'draft') DEFAULT 'draft',
  valid_from DATE,
  valid_until DATE,
  quantity_available INT DEFAULT -1, -- -1 = unlimited
  quantity_sold INT DEFAULT 0,
  
  -- Settings
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  visibility ENUM('public', 'members_only', 'private') DEFAULT 'public',
  target_business_types JSON, -- Array of business_type IDs for per-type packages
  
  -- Admin Controls
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approval_notes TEXT,
  
  metadata JSON, -- Custom fields
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business (business_id),
  INDEX idx_status (status),
  INDEX idx_featured (is_featured),
  INDEX idx_type (package_type),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OFFERS TABLE - Special offers and promotions
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36),
  offer_title VARCHAR(255) NOT NULL,
  offer_description TEXT,
  offer_type ENUM('discount_percent', 'discount_fixed', 'buy_x_get_y', 'free_item', 'loyalty_points', 'seasonal', 'flash_sale', 'referral') DEFAULT 'discount_percent',
  
  -- Discount Details
  discount_value DECIMAL(10, 2), -- Percentage (0-100) or fixed amount
  discount_type VARCHAR(50), -- 'percent', 'fixed', 'points', etc.
  minimum_purchase DECIMAL(10, 2), -- Minimum purchase to qualify
  maximum_discount DECIMAL(10, 2), -- Cap on discount amount
  
  -- Buy X Get Y Details (for buy_x_get_y type)
  buy_quantity INT,
  buy_item VARCHAR(255),
  get_quantity INT,
  get_item VARCHAR(255),
  
  -- Loyalty & Referral
  points_earned INT,
  referral_reward DECIMAL(10, 2),
  
  -- Availability
  status ENUM('active', 'inactive', 'draft') DEFAULT 'draft',
  valid_from DATETIME,
  valid_until DATETIME,
  usage_limit INT DEFAULT -1, -- -1 = unlimited
  usage_count INT DEFAULT 0,
  usage_per_user INT DEFAULT 1, -- How many times one user can use
  
  -- Settings
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  visibility ENUM('public', 'members_only', 'private', 'code_only') DEFAULT 'public',
  coupon_code VARCHAR(50),
  
  -- Admin Controls
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approval_notes TEXT,
  
  metadata JSON,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business (business_id),
  INDEX idx_status (status),
  INDEX idx_type (offer_type),
  INDEX idx_coupon (coupon_code),
  INDEX idx_featured (is_featured),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DISCOUNTS TABLE - System-wide or targeted discounts
-- ============================================================
CREATE TABLE IF NOT EXISTS discounts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36),
  discount_name VARCHAR(255) NOT NULL,
  discount_description TEXT,
  discount_type ENUM('percent', 'fixed', 'tiered', 'volume', 'seasonal', 'category_based') DEFAULT 'percent',
  
  -- Discount Details
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2), -- For fixed amount discounts
  min_quantity INT, -- For volume discounts
  max_quantity INT,
  tier_levels JSON, -- For tiered discounts: [{"qty": 10, "percent": 5}, {"qty": 20, "percent": 10}]
  
  -- Targeting
  applicable_to ENUM('all_items', 'specific_items', 'specific_category', 'specific_package') DEFAULT 'all_items',
  applicable_item_ids JSON, -- Array of product/service IDs
  applicable_category_id VARCHAR(36),
  
  -- Availability
  status ENUM('active', 'inactive', 'draft') DEFAULT 'draft',
  valid_from DATE,
  valid_until DATE,
  
  -- Settings
  is_automatic BOOLEAN DEFAULT FALSE, -- Apply without code
  coupon_code VARCHAR(50),
  is_stackable BOOLEAN DEFAULT FALSE, -- Can combine with other discounts
  
  -- Admin Controls
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approval_notes TEXT,
  
  metadata JSON,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business (business_id),
  INDEX idx_status (status),
  INDEX idx_type (discount_type),
  INDEX idx_coupon (coupon_code),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VENDOR FEATURE PERMISSIONS - Control what vendors can use
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_feature_permissions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id VARCHAR(36),
  business_type_id VARCHAR(36),
  
  -- Feature Permissions
  can_create_packages BOOLEAN DEFAULT FALSE,
  can_create_offers BOOLEAN DEFAULT FALSE,
  can_create_discounts BOOLEAN DEFAULT FALSE,
  
  -- Restrictions
  packages_limit INT DEFAULT -1, -- -1 = unlimited
  offers_limit INT DEFAULT -1,
  discounts_limit INT DEFAULT -1,
  requires_approval BOOLEAN DEFAULT FALSE,
  
  -- Status
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  suspended_reason TEXT,
  
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business (business_id),
  INDEX idx_business_type (business_type_id),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (business_type_id) REFERENCES business_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DISCOUNT USAGE TRACKING - Track when discounts are used
-- ============================================================
CREATE TABLE IF NOT EXISTS discount_usage (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  discount_id VARCHAR(36) NOT NULL,
  offer_id VARCHAR(36),
  package_id VARCHAR(36),
  user_id VARCHAR(36),
  
  order_id VARCHAR(36),
  discount_value_applied DECIMAL(10, 2),
  original_amount DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  
  usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_discount (discount_id),
  INDEX idx_offer (offer_id),
  INDEX idx_package (package_id),
  INDEX idx_user (user_id),
  INDEX idx_date (usage_date),
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SYSTEM SETTINGS - Global permissions and settings
-- ============================================================
CREATE TABLE IF NOT EXISTS poi_system_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Global Toggles (apply to all vendors unless overridden)
  vendors_can_create_packages BOOLEAN DEFAULT FALSE,
  vendors_can_create_offers BOOLEAN DEFAULT FALSE,
  vendors_can_create_discounts BOOLEAN DEFAULT FALSE,
  
  -- Default Limits
  default_packages_limit INT DEFAULT 20,
  default_offers_limit INT DEFAULT 50,
  default_discounts_limit INT DEFAULT 50,
  
  -- Approval Settings
  packages_require_approval BOOLEAN DEFAULT TRUE,
  offers_require_approval BOOLEAN DEFAULT FALSE,
  discounts_require_approval BOOLEAN DEFAULT FALSE,
  
  -- Display Settings
  show_savings_percentage BOOLEAN DEFAULT TRUE,
  show_original_price BOOLEAN DEFAULT TRUE,
  highlight_featured_deals BOOLEAN DEFAULT TRUE,
  max_featured_count INT DEFAULT 5,
  
  -- Email Notifications
  notify_admin_on_new_vendor_package BOOLEAN DEFAULT TRUE,
  notify_customer_on_offer BOOLEAN DEFAULT FALSE,
  
  metadata JSON,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================
CREATE INDEX idx_packages_valid ON packages(valid_from, valid_until, status);
CREATE INDEX idx_offers_valid ON offers(valid_from, valid_until, status);
CREATE INDEX idx_discounts_valid ON discounts(valid_from, valid_until, status);
CREATE INDEX idx_packages_business_status ON packages(business_id, status, is_featured);
CREATE INDEX idx_offers_business_status ON offers(business_id, status, is_featured);

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Active packages
CREATE VIEW active_packages AS
SELECT 
  p.*,
  b.business_name,
  bt.business_type_name
FROM packages p
LEFT JOIN businesses b ON p.business_id = b.id
LEFT JOIN business_types bt ON b.business_type = bt.id
WHERE p.status = 'active'
AND (p.valid_from IS NULL OR p.valid_from <= CURDATE())
AND (p.valid_until IS NULL OR p.valid_until >= CURDATE())
AND (p.quantity_available = -1 OR p.quantity_available > p.quantity_sold);

-- Active offers
CREATE VIEW active_offers AS
SELECT 
  o.*,
  b.business_name,
  bt.business_type_name
FROM offers o
LEFT JOIN businesses b ON o.business_id = b.id
LEFT JOIN business_types bt ON b.business_type = bt.id
WHERE o.status = 'active'
AND (o.valid_from IS NULL OR o.valid_from <= NOW())
AND (o.valid_until IS NULL OR o.valid_until >= NOW())
AND (o.usage_limit = -1 OR o.usage_count < o.usage_limit);

-- Featured deals (combines packages and offers)
CREATE VIEW featured_deals AS
SELECT 
  'package' as deal_type,
  p.id,
  p.package_name as deal_title,
  p.description as deal_description,
  p.package_price as deal_price,
  p.savings_amount,
  p.savings_percentage,
  p.is_featured,
  p.display_order,
  p.created_at,
  b.business_name
FROM packages p
LEFT JOIN businesses b ON p.business_id = b.id
WHERE p.status = 'active' AND p.is_featured = TRUE

UNION ALL

SELECT 
  'offer' as deal_type,
  o.id,
  o.offer_title as deal_title,
  o.offer_description as deal_description,
  NULL as deal_price,
  NULL as savings_amount,
  o.discount_value as savings_percentage,
  o.is_featured,
  o.display_order,
  o.created_at,
  b.business_name
FROM offers o
LEFT JOIN businesses b ON o.business_id = b.id
WHERE o.status = 'active' AND o.is_featured = TRUE

ORDER BY display_order ASC, created_at DESC;

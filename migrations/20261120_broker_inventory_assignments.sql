-- Migration: Broker Inventory Assignments (Multi-Broker Syndication System)
-- Enables assigning developers, compounds (developments), or specific units to brokers.
-- Tracks broker referral slug, custom contact info, commissions, and routing parameters.

CREATE TABLE IF NOT EXISTS broker_inventory_assignments (
  id VARCHAR(36) PRIMARY KEY,
  broker_id VARCHAR(36) NOT NULL,
  developer_id VARCHAR(36) NULL,
  development_id VARCHAR(36) NULL,
  unit_business_id VARCHAR(36) NULL,
  assignment_level ENUM('developer', 'development', 'unit') NOT NULL DEFAULT 'development',
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  broker_slug VARCHAR(100) NOT NULL,
  custom_phone VARCHAR(50) NULL,
  custom_whatsapp VARCHAR(50) NULL,
  status ENUM('active', 'paused', 'revoked') NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_broker (broker_id),
  INDEX idx_developer (developer_id),
  INDEX idx_development (development_id),
  INDEX idx_unit (unit_business_id),
  INDEX idx_slug (broker_slug),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

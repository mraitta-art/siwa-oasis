-- Migration 028: Add is_master column to businesses
-- Indicates if this record represents a template typology blueprint, rather than a real public listing.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_master TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'If 1: represents a master category blueprint template, preview-only on public site';

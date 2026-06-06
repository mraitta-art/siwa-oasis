-- ================================================================
-- SIWA OASIS: Business Profile Engine — DB Migration
-- Run ALL 4 statements in order in your DB console / phpMyAdmin
-- ================================================================

-- ---------------------------------------------------------------
-- 0. Create blueprint_atoms (Global Field Atom Registry)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blueprint_atoms (
  id              VARCHAR(100) PRIMARY KEY COMMENT 'unique atom key e.g. wifi, star_rating',
  label           VARCHAR(255) NOT NULL,
  type            VARCHAR(50)  NOT NULL COMMENT 'matches FIELD_TYPES in governance/constants.ts',
  chapter         ENUM('identity','vibe','amenities','cuisine','programs','ecology','invest','offers') NOT NULL,
  options_json    JSON         NULL COMMENT 'for select/multiselect/checkbox_group types',
  validation_json JSON         NULL COMMENT '{"required":bool,"min":n,"max":n,"pattern":str}',
  display_hint    VARCHAR(500) NULL,
  icon            VARCHAR(100) NULL COMMENT 'FontAwesome class e.g. fa-wifi',
  layer_default   TINYINT      DEFAULT 1 COMMENT '0=core 1=standard 2=private',
  tags_json       JSON         NULL COMMENT '["hospitality","eco","dining"]',
  sort_order      INT          DEFAULT 0,
  active          BOOLEAN      DEFAULT true,
  created_at      DATETIME     DEFAULT NOW(),
  updated_at      DATETIME     DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_chapter (chapter),
  INDEX idx_layer   (layer_default),
  INDEX idx_active  (active)
);

-- ---------------------------------------------------------------
-- 1. Add blueprint_schema column to business_types
-- ---------------------------------------------------------------
ALTER TABLE business_types
  ADD COLUMN IF NOT EXISTS blueprint_schema JSON NULL
  COMMENT 'Layer 1+2 field atom IDs per chapter {"chapters":{"amenities":{"layer1":["wifi"],"layer2":[]}}}';

-- ---------------------------------------------------------------
-- 2. Create business_media table (chapter gallery)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_media (
  id          VARCHAR(36)  PRIMARY KEY,
  business_id VARCHAR(100) NOT NULL,
  chapter     ENUM('identity','vibe','amenities','cuisine','programs','ecology','invest','offers') NOT NULL,
  url         TEXT         NOT NULL,
  public_id   VARCHAR(255) NULL COMMENT 'Cloudinary public_id for deletion',
  type        ENUM('image','video') DEFAULT 'image',
  caption     VARCHAR(255) NULL,
  is_pinned   BOOLEAN      DEFAULT false,
  pin_order   INT          DEFAULT 0,
  uploaded_at DATETIME     DEFAULT NOW(),
  INDEX idx_biz     (business_id),
  INDEX idx_chapter (business_id, chapter),
  INDEX idx_pins    (business_id, is_pinned, pin_order)
);

-- ---------------------------------------------------------------
-- 3. Create business_posts table (mini blog)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_posts (
  id          VARCHAR(36)  PRIMARY KEY,
  business_id VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        LONGTEXT     NULL,
  cover_url   TEXT         NULL,
  category    VARCHAR(100) NULL,
  published   BOOLEAN      DEFAULT false,
  created_at  DATETIME     DEFAULT NOW(),
  updated_at  DATETIME     DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_biz (business_id),
  INDEX idx_pub (business_id, published)
);

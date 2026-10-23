-- Migration 045: 3-Level Vendor Minisite System - Phase 2 (Level 1 - Template Outreach)
--
-- Adds the outreach template library that powers the batch "template outreach" flow:
-- an admin picks a business type, the system finds the active template for that type,
-- personalizes it for every unclaimed business of the type (and/or its child types),
-- then records the outreach as minisite_vendor_handoffs rows plus a crm_whatsapp_campaigns
-- tracking row.
--
-- What this migration does
--   1. outreach_templates            -> per-business-type outreach copy (EN/AR)
--   2. Indexes on business_type_id and is_active
--
-- Deployment notes
--   * Purely additive: nothing is dropped, renamed or retyped, so this is safe to apply
--     before the Phase 2 application code ships.
--   * Mirrored in master-schema.sql (PART 5). scripts/smart-sync.js tracks applied
--     migrations by file hash, so the statements below must not be edited after applying.
--   * No foreign keys on purpose: business_type_id VARCHAR(36) references
--     business_types(id) logically (type ids are VARCHAR(100) in the core schema) and
--     minisite_template_id references minisite_templates(id). Keeping them un-enforced
--     mirrors onboard_invites and keeps type/template renames from blocking outreach rows.
--   * included_features holds a JSON array of free-feature strings highlighted in the
--     message (rendered as the {featureList} placeholder).

-- ============================================
-- 1. OUTREACH TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS outreach_templates (
  id VARCHAR(36) PRIMARY KEY,
  business_type_id VARCHAR(36) NOT NULL COMMENT 'business_types.id this template targets',
  target_scope VARCHAR(20) DEFAULT 'both'
    COMMENT 'parent_only = the type itself, children_only = its child types, both = all'
    CHECK(target_scope IN ('parent_only', 'children_only', 'both')),
  template_name VARCHAR(255) NOT NULL,
  message_subject_en TEXT NULL,
  message_subject_ar TEXT NULL,
  message_body_en TEXT NULL,
  message_body_ar TEXT NULL,
  included_features TEXT NULL COMMENT 'JSON array of free features highlighted as {featureList}',
  cta_type VARCHAR(30) DEFAULT 'claim_profile'
    CHECK(cta_type IN ('claim_profile', 'preview_minisite', 'register')),
  minisite_template_id VARCHAR(36) NULL COMMENT 'minisite_templates.id pre-attached to generated drafts',
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(36) NULL COMMENT 'profiles.id of the admin who created the template',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. INDEXES
-- ============================================

ALTER TABLE outreach_templates
  ADD INDEX IF NOT EXISTS idx_outreach_templates_type (business_type_id),
  ADD INDEX IF NOT EXISTS idx_outreach_templates_active (is_active);

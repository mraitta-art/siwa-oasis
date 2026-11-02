-- ============================================================================
-- 20261118_real_estate_form_complete.sql
--
-- Completes the real-estate developer intake form with every topic a compound
-- buyer or investor would want answered before making contact.
--
-- What is added:
--   A. 12 new form_fields on the `real_estate` parent (inherited by all 5 children):
--      Project scope    → total_area_sqm, total_unit_count
--      Phasing          → phase_count, current_phase
--      Facilities       → internal_retail (malls/shops), community_services
--                         (schools/clinics/mosques), clubhouse_features
--      Operations       → hotel_program (post-handover rental management)
--      Investment       → mortgage_availability, roi_guarantee,
--                         defects_liability
--      Visual           → masterplan_image
--
--   B. 4 new field_groups that bundle the additions into labelled panels:
--      sec_3_facilities → "project_scope",  "amenities"
--      sec_6_guardian   → "post_handover"
--      sec_7_investment → "buyer_protection"
--
--   C. group_key membership set on all new fields
--
--   D. Arabic labels filled for every new field
--
-- Intentionally NOT added (belong to units table, entered via /vendor/inventory):
--   price, area_sqm, bedrooms, bathrooms, finishing, handover_year,
--   down_payment_pct, installment_years, listing_kind, price_basis
--
-- Safety:
--   * INSERT ... ON DUPLICATE KEY UPDATE id = id  → re-run is a no-op
--   * UPDATE ... WHERE group_key IS NULL           → never steals an admin-placed field
--   * All field_type values are existing enum values in form_fields
-- ============================================================================


-- ── A. The new form fields ───────────────────────────────────────────────────

INSERT INTO form_fields (
  id, business_type_id, section_id,
  name, label, label_ar,
  field_type, help_text,
  searchable, is_comparable,
  field_scope, sort_order
) VALUES

  -- ── Project scope (sec_1_identity) ────────────────────────────────────────
  (
    'ff_re_total_unit_count',
    'real_estate', 'sec_1_identity',
    'total_unit_count',
    'Total number of units in the project',
    'إجمالي عدد الوحدات في المشروع',
    'number',
    'The full count across all phases. Helps buyers gauge the scale of the community.',
    1, 1, 'profile', 95
  ),

  -- ── Project scope (sec_3_facilities) ────────────────────────────────────
  (
    'ff_re_total_area',
    'real_estate', 'sec_3_facilities',
    'total_area_sqm',
    'Total project land area (m²)',
    'إجمالي مساحة أرض المشروع (م²)',
    'number',
    'Total land area of the compound measured in square metres from the project gate.',
    1, 1, 'profile', 5
  ),

  -- ── Malls & commercial within compound ───────────────────────────────────
  (
    'ff_re_internal_retail',
    'real_estate', 'sec_3_facilities',
    'internal_retail',
    'Malls, shops and commercial units inside the compound',
    'المولات والمحلات التجارية داخل المشروع',
    'textarea',
    'List the commercial facilities inside the gates: retail strips, mini-mall, pharmacy, supermarket.',
    0, 0, 'profile', 36
  ),

  -- ── Community services ────────────────────────────────────────────────────
  (
    'ff_re_community_services',
    'real_estate', 'sec_3_facilities',
    'community_services',
    'Schools, clinics, mosques and community services',
    'مدارس ومستشفيات ومساجد وخدمات المجتمع',
    'textarea',
    'Educational, medical and religious facilities either inside the compound or within walking distance.',
    0, 0, 'profile', 37
  ),

  -- ── Clubhouse & sports ────────────────────────────────────────────────────
  (
    'ff_re_clubhouse',
    'real_estate', 'sec_3_facilities',
    'clubhouse_features',
    'Clubhouse, sports and leisure facilities',
    'النادي الرياضي والمرافق الترفيهية',
    'textarea',
    'Pools, gym, padel courts, restaurants, spa — what actually exists rather than what is planned.',
    0, 0, 'profile', 38
  ),

  -- ── Phasing — investment section ────────────────────────────────────────
  (
    'ff_re_phase_count',
    'real_estate', 'sec_7_investment',
    'phase_count',
    'Number of phases in the masterplan',
    'عدد المراحل في المخطط العام',
    'number',
    'Total number of planned construction phases.',
    1, 1, 'profile', 22
  ),
  (
    'ff_re_current_phase',
    'real_estate', 'sec_7_investment',
    'current_phase',
    'Phase currently open for sale or reservation',
    'المرحلة المفتوحة للبيع أو الحجز حاليًا',
    'text',
    'e.g. "Phase 2 — units 200–450, delivery Q3 2027"',
    0, 0, 'profile', 23
  ),

  -- ── Buyer protection — investment section ───────────────────────────────
  (
    'ff_re_mortgage',
    'real_estate', 'sec_7_investment',
    'mortgage_availability',
    'Bank mortgage or financing options',
    'التمويل العقاري المصرفي',
    'text',
    'Which banks have approved this project for mortgage financing, and on what terms.',
    0, 0, 'profile', 62
  ),
  (
    'ff_re_roi_guarantee',
    'real_estate', 'sec_7_investment',
    'roi_guarantee',
    'Guaranteed rental yield or ROI (%)',
    'ضمان العائد الإيجاري أو الاستثماري (%)',
    'text',
    'If the developer guarantees a rental return for a fixed period, state the percentage and years.',
    0, 0, 'profile', 63
  ),
  (
    'ff_re_defects_liability',
    'real_estate', 'sec_7_investment',
    'defects_liability',
    'Defects and snagging liability period',
    'فترة ضمان العيوب الإنشائية',
    'text',
    'The period after handover during which the developer is responsible for structural defects.',
    0, 0, 'profile', 64
  ),

  -- ── Post-handover operations (sec_6_guardian) ───────────────────────────
  (
    'ff_re_hotel_program',
    'real_estate', 'sec_6_guardian',
    'hotel_program',
    'Hotel and rental management program',
    'برنامج الإدارة الفندقية والتأجير',
    'text',
    'Whether the developer or a hospitality partner manages short-term rentals on behalf of owners, and the revenue share.',
    0, 0, 'profile', 25
  ),

  -- ── Visual (sec_2_ambience) ──────────────────────────────────────────────
  (
    'ff_re_masterplan_image',
    'real_estate', 'sec_2_ambience',
    'masterplan_image',
    'Masterplan / site plan image',
    'صورة المخطط العام للمشروع',
    'image',
    'An overhead site-plan image showing plots, roads, amenities and phases.',
    0, 0, 'profile', 5
  )

ON DUPLICATE KEY UPDATE id = id;


-- ── B. Field groups for the new fields ──────────────────────────────────────

INSERT INTO field_groups (id, business_type_id, section_id, name, label, label_ar, help_text, sort_order, active)
VALUES
  -- Project scope panel in facilities
  ('fg_re_sec3_scope',
   'real_estate', 'sec_3_facilities', 'project_scope',
   'Project scale', 'حجم المشروع',
   'Land area and total unit count — the numbers that define the community.', 0, 1),

  -- Community amenities panel
  ('fg_re_sec3_amenities',
   'real_estate', 'sec_3_facilities', 'amenities',
   'On-site amenities', 'المرافق والخدمات داخل المشروع',
   'Everything built inside the gates beyond the units themselves.', 2, 1),

  -- Post-handover operations panel
  ('fg_re_sec6_posthover',
   'real_estate', 'sec_6_guardian', 'post_handover',
   'Post-handover operations', 'تشغيل المشروع بعد التسليم',
   'Hospitality and rental programs that run after keys are handed over.', 2, 1),

  -- Buyer protection panel in investment
  ('fg_re_sec7_buyer_protection',
   'real_estate', 'sec_7_investment', 'buyer_protection',
   'Buyer protections', 'ضمانات المشتري',
   'Financing options, yield guarantees and defects liability.', 3, 1),

  -- Phasing panel in investment
  ('fg_re_sec7_phasing',
   'real_estate', 'sec_7_investment', 'phasing',
   'Project phasing', 'مراحل المشروع',
   'How many phases the masterplan has and what is open now.', 1, 1)

ON DUPLICATE KEY UPDATE id = id;


-- ── C. Membership — link new fields to their groups ─────────────────────────

UPDATE form_fields
   SET group_key = 'project_scope'
 WHERE business_type_id = 'real_estate'
   AND section_id = 'sec_3_facilities'
   AND name IN ('total_area_sqm')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields
   SET group_key = 'amenities'
 WHERE business_type_id = 'real_estate'
   AND section_id = 'sec_3_facilities'
   AND name IN ('internal_retail', 'community_services', 'clubhouse_features')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields
   SET group_key = 'post_handover'
 WHERE business_type_id = 'real_estate'
   AND section_id = 'sec_6_guardian'
   AND name IN ('hotel_program')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields
   SET group_key = 'phasing'
 WHERE business_type_id = 'real_estate'
   AND section_id = 'sec_7_investment'
   AND name IN ('phase_count', 'current_phase')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields
   SET group_key = 'buyer_protection'
 WHERE business_type_id = 'real_estate'
   AND section_id = 'sec_7_investment'
   AND name IN ('mortgage_availability', 'roi_guarantee', 'defects_liability')
   AND (group_key IS NULL OR group_key = '');


-- ── D. Link total_unit_count to identity section grouping ───────────────────
-- Intentionally left ungrouped in identity (it will show as a standalone stat).
-- No group needed — it lives alongside the business name.


-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT id, section_id, name, label_ar, group_key
--   FROM form_fields
--  WHERE business_type_id = 'real_estate'
--  ORDER BY section_id, sort_order;
--
-- SELECT id, name, label_ar FROM field_groups
--  WHERE business_type_id = 'real_estate'
--  ORDER BY section_id, sort_order;

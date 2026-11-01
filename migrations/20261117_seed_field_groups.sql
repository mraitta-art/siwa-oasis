-- ============================================================================
-- 20261117_seed_field_groups.sql
--
-- The categorization layer, seeded with the questions that actually exist.
--
-- Every group below owns at least one real `form_fields` row today; none is an
-- empty shell invented for the future. Membership is set on the field, so the
-- group and its fields stay one fact rather than two that can drift.
--
-- Safety rules this file obeys:
--   * INSERT ... ON DUPLICATE KEY UPDATE id = id  → an admin's edit of a group's
--     wording or order is never overwritten by a re-run.
--   * group_key is written only WHERE group_key IS NULL OR = ''  → a field the
--     admin already placed in a category is never stolen into another one.
--   * label_ar is written only WHERE it is empty → an Arabic question that exists
--     is never replaced, and only the 28 fields that have none get one.
--   * The ownership options are appended only when the value is absent, so a
--     re-run adds nothing.
--
-- Idempotent: run it twice and the second run changes zero rows.
-- ============================================================================

-- ── 1. The categories themselves ─────────────────────────────────────────────
-- Scoped by (business_type_id, section_id, name) exactly like a field, which is
-- what lets them inherit through the SECTION_TEMPLATE -> parent -> child walk.

INSERT INTO field_groups (id, business_type_id, section_id, name, label, label_ar, help_text, sort_order, active) VALUES
  -- travel_agency · Identity
  ('fg_ta_sec1_identity', 'travel_agency', 'sec_1_identity', 'agency_identity', 'Business identity', 'هوية الشركة', 'Who the agency is, on one slide.', 1, 1),
  -- travel_agency · Facilities (the fleet is the facility here)
  ('fg_ta_sec3_fleet', 'travel_agency', 'sec_3_facilities', 'fleet', 'Fleet and vehicles', 'الأسطول والمركبات', 'What you travel in.', 1, 1),
  -- travel_agency · Experiences
  ('fg_ta_sec5_booking', 'travel_agency', 'sec_5_experiences', 'booking_terms', 'Booking and cancellation', 'شروط الحجز والإلغاء', 'The terms before the trip starts.', 1, 1),
  ('fg_ta_sec5_journey', 'travel_agency', 'sec_5_experiences', 'journey', 'Route and highlights', 'خط الرحلة ومحطاتها', 'What the journey itself is.', 2, 1),
  -- travel_agency · Guardian (guides)
  ('fg_ta_sec6_guides', 'travel_agency', 'sec_6_guardian', 'guides', 'Guides and certifications', 'المرشدون والشهادات', 'Who leads the group and what they hold.', 1, 1),
  -- travel_agency · Investment (pricing)
  ('fg_ta_sec7_pricing', 'travel_agency', 'sec_7_investment', 'pricing', 'Group rates and commissions', 'أسعار المجموعات والعمولات', 'Bulk pricing and what a partner earns.', 1, 1),
  -- travel_agency · Connector (live offers)
  ('fg_ta_sec8_offers', 'travel_agency', 'sec_8_connector', 'offers', 'Current offers', 'العروض والخصومات', 'A discount with an expiry is a promise with a date.', 1, 1),
  -- travel_agency · Marketplace media
  ('fg_ta_sec9_media', 'travel_agency', 'sec_9_marketplace_catalog', 'catalog_media', 'Vehicle and package photos', 'صور المركبات وبرامج الرحلة', 'The pictures a listing is judged by.', 1, 1),
  -- travel_agency · Trust
  ('fg_ta_sec10_safety', 'travel_agency', 'sec_10_testimonials_faqs', 'safety_credentials', 'License and safety', 'الرخصة والسلامة', 'The papers that make the trip insurable.', 1, 1),

  -- real_estate · Identity of the place
  ('fg_re_sec2_character', 'real_estate', 'sec_2_ambience', 'character', 'Character of the place', 'طابع المكان', 'What the development feels like.', 1, 1),
  -- real_estate · Facilities
  ('fg_re_sec3_sea', 'real_estate', 'sec_3_facilities', 'sea_and_access', 'Sea and facilities', 'البحر والمرافق', 'Distance to water and what is built.', 1, 1),
  -- real_estate · Operations
  ('fg_re_sec6_operations', 'real_estate', 'sec_6_guardian', 'operations', 'Management and security', 'الإدارة والأمن', 'Who runs it after handover.', 1, 1),
  -- real_estate · Money — the category the user asked for: the payment plan,
  -- delivery, resale and service charges, presented together on a slide.
  ('fg_re_sec7_financial', 'real_estate', 'sec_7_investment', 'financial_terms', 'Financial terms', 'الشروط المالية', 'Payment plan, delivery, charges and rights.', 1, 1),
  ('fg_re_sec7_project', 'real_estate', 'sec_7_investment', 'project_status', 'Project and developer', 'حالة المشروع والمطور', 'How far it is and who is building it.', 2, 1)
ON DUPLICATE KEY UPDATE id = id;

-- ── 2. Membership ────────────────────────────────────────────────────────────
-- One statement per category, and none of them touches a field that is already
-- grouped somewhere.

UPDATE form_fields SET group_key = 'agency_identity'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity'
   AND name IN ('description', 'trade_license', 'founded_year', 'website', 'email', 'social_links')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'fleet'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_3_facilities'
   AND name IN ('vehicle_types', 'vehicle_count', 'ac', '4wd')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'booking_terms'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences'
   AND name IN ('booking_required', 'advance_notice_days', 'cancellation_policy')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'journey'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences'
   AND name IN ('itinerary')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'guides'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_6_guardian'
   AND name IN ('guide_count', 'languages', 'certifications', 'guide_profiles')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'pricing'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_7_investment'
   AND name IN ('group_rates', 'agent_commission_pct')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'offers'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_8_connector'
   AND name IN ('discount_pct', 'promo_code', 'offer_expires')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'catalog_media'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_9_marketplace_catalog'
   AND name IN ('vehicle_photos', 'package_gallery')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'safety_credentials'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_10_testimonials_faqs'
   AND name IN ('license_number', 'insurance', 'safety_rating')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'character'
 WHERE business_type_id = 'real_estate' AND section_id = 'sec_2_ambience'
   AND name IN ('project_character')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'sea_and_access'
 WHERE business_type_id = 'real_estate' AND section_id = 'sec_3_facilities'
   AND name IN ('beach_access', 'distance_to_sea', 'facilities_notes')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'operations'
 WHERE business_type_id = 'real_estate' AND section_id = 'sec_6_guardian'
   AND name IN ('management_partner', 'security_model')
   AND (group_key IS NULL OR group_key = '');

-- `contact_preference` is deliberately left ungrouped: it is how the office reaches
-- the buyer, not something a visitor's slide should present.
UPDATE form_fields SET group_key = 'financial_terms'
 WHERE business_type_id = 'real_estate' AND section_id = 'sec_7_investment'
   AND name IN ('ownership_type', 'payment_plan_notes', 'delivery_provision', 'resale_rights', 'service_charge')
   AND (group_key IS NULL OR group_key = '');

UPDATE form_fields SET group_key = 'project_status'
 WHERE business_type_id = 'real_estate' AND section_id = 'sec_7_investment'
   AND name IN ('project_stage', 'developer_record')
   AND (group_key IS NULL OR group_key = '');

-- ── 3. The missing Arabic questions ──────────────────────────────────────────
-- Every one of these is a travel_agency definition written in English only, so an
-- Arabic minisite currently asks it in English. Filled only where empty.

UPDATE form_fields SET label_ar = 'وصف النشاط'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'description'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'السجل التجاري'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'trade_license'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'سنة التأسيس'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'founded_year'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'الموقع الإلكتروني'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'website'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'البريد الإلكتروني'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'email'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'روابط التواصل الاجتماعي'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_1_identity' AND name = 'social_links'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'أنواع المركبات'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_3_facilities' AND name = 'vehicle_types'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'عدد المركبات'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_3_facilities' AND name = 'vehicle_count'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'تكييف الهواء متوفر'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_3_facilities' AND name = 'ac'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'الدفع الرباعي متوفر'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_3_facilities' AND name = '4wd'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'الحجز مطلوب'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences' AND name = 'booking_required'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'أيام الإشعار المسبق'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences' AND name = 'advance_notice_days'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'سياسة الإلغاء'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences' AND name = 'cancellation_policy'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'خط السير وأبرز المحطات'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_5_experiences' AND name = 'itinerary'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'عدد المرشدين'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_6_guardian' AND name = 'guide_count'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'لغات المرشدين'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_6_guardian' AND name = 'languages'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'شهادات المرشدين'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_6_guardian' AND name = 'certifications'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'ملفات المرشدين'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_6_guardian' AND name = 'guide_profiles'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'أسعار المجموعات'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_7_investment' AND name = 'group_rates'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'نسبة عمولة الوكيل'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_7_investment' AND name = 'agent_commission_pct'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'نسبة الخصم'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_8_connector' AND name = 'discount_pct'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'رمز العرض'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_8_connector' AND name = 'promo_code'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'تاريخ انتهاء العرض'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_8_connector' AND name = 'offer_expires'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'صور المركبات'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_9_marketplace_catalog' AND name = 'vehicle_photos'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'معرض برامج الرحلة'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_9_marketplace_catalog' AND name = 'package_gallery'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

UPDATE form_fields SET label_ar = 'رقم الرخصة'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_10_testimonials_faqs' AND name = 'license_number'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'التأمين وتغطية السلامة'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_10_testimonials_faqs' AND name = 'insurance'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');
UPDATE form_fields SET label_ar = 'تقييم السلامة'
 WHERE business_type_id = 'travel_agency' AND section_id = 'sec_10_testimonials_faqs' AND name = 'safety_rating'
   AND (label_ar IS NULL OR TRIM(label_ar) = '');

-- ── 4. Timeshare is a legal shape of ownership, so it belongs in the options ──
-- `sec_7_investment.options` marks the ownership question as comparable, and the
-- `ownership_type` column list is the single place a buyer's legal position is
-- stated. Adding `timeshare` here (rather than a new field, and rather than
-- widening `units.listing_kind`, which answers a different question) keeps one
-- answer per question. Appended only when absent, so a re-run adds nothing.

UPDATE form_fields
   SET options = JSON_ARRAY_APPEND(options, '$', CAST('{"label":"Timeshare (shared ownership by week)","value":"timeshare"}' AS JSON))
 WHERE id = 'ff_elalamein_ownership_type'
   AND JSON_SEARCH(options, 'one', 'timeshare') IS NULL;

UPDATE form_fields
   SET options = JSON_ARRAY_APPEND(options, '$', CAST('{"label":"Right to use (no title deed)","value":"right_to_use"}' AS JSON))
 WHERE id = 'ff_elalamein_ownership_type'
   AND JSON_SEARCH(options, 'one', 'right_to_use') IS NULL;

-- El Alamein: the reference data a second marketplace needs before it can take
-- a listing.
--
-- Everything here is a definition, never an entry: the categories a developer or
-- broker can choose, the questions those categories ask, the one section this
-- market opens for itself, and the market flags that describe reality. No
-- compound, no unit and no business is invented below — an empty marketplace is
-- the honest starting point, and inventing supply in a shared live database would
-- put fake listings in front of real visitors.
--
-- Why each block exists:
--
-- 1. `markets.active` was inverted. Siwa's own launch note reads "Live." while
--    its flag said it was not, which made /siwa answer "Not found". El Alamein
--    is seeded and open for intake, so its note says that instead of "Dark".
--
-- 2. `minisite_templates` is queried for `active` and `is_default` in three
--    places — business creation's template fallback, the vendor template
--    resolver, and the studio's default lookup — and the table has neither
--    column. Every new listing with no template of its own hits that query, so
--    the drift is closed here rather than left to throw.
--
-- 2b. Same class of drift on `form_fields.version_type`: the field editor writes
--    it, the form reader keys a field by it, and only one seed route adds it
--    (conditionally, when that route is run). Creating a field from the admin
--    builder today fails on an unknown column.
--
-- 3. `sec_7_investment` is the section a real-estate listing lives in: the
--    payment plan narrative, the delivery provision, the developer. It has been
--    switched off platform-wide because turning it on would put an Investment
--    tab on every Siwa accommodation page. `options.markets` is the per-market
--    door instead (`src/lib/section-registry.ts`), so it opens for El Alamein
--    only and Siwa keeps exactly what it shows today.
--
-- 4. The typologies are tagged `market_id = 'el-alamein'`, which is the
--    predicate every intake read already applies: a category tagged for one
--    market is not offered in another, and a shared category stays NULL. The
--    parent is tagged too, so Siwa never shows an industry with no children in
--    it. Ras El Hekma reuses this same tree when it opens.
--
-- 5. The fields are attached to the parent, so each child inherits them instead
--    of carrying five copies that drift apart. They are prose and choices only:
--    a price, an area, a finishing grade or a handover year is a COLUMN ON
--    `units`, typed on the vendor inventory screen, and the form-field API
--    refuses those names for exactly that reason.

-- 1 ─ Market flags ────────────────────────────────────────────────────────────
UPDATE markets
   SET active = 1
 WHERE slug = 'siwa';

UPDATE markets
   SET launch_notes = 'Seeded: real-estate typologies, intake fields and the Investment section are live for this market; no compound or unit published yet. Revenue model realestate_lead, Arabic-first.'
 WHERE slug = 'el-alamein';

-- 2 ─ Columns the application already reads ───────────────────────────────────
ALTER TABLE minisite_templates ADD COLUMN IF NOT EXISTS active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE minisite_templates ADD COLUMN IF NOT EXISTS is_default TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS version_type ENUM('initial', 'latest') DEFAULT 'latest';

-- 3 ─ The section this market opens for itself ────────────────────────────────
-- The row carried no `options` before, so the literal loses nothing.
UPDATE sections
   SET active = 1,
       show_on_public = 1,
       options = '{"markets":["el-alamein"]}'
 WHERE id = 'sec_7_investment';

-- 4 ─ Categories ──────────────────────────────────────────────────────────────
INSERT INTO business_types (id, name, name_ar, icon, icon_color, description, is_parent, parent_id, sections, active, sort_order, market_id)
VALUES (
  'real_estate',
  'Real Estate & Developments',
  'العقار والمشروعات',
  'fas fa-building',
  '#0F4C81',
  'Compounds, apartments, villas and commercial units sold or rented on the North Coast. Prices, plans and handover dates are entered as inventory, not as text.',
  1, NULL,
  JSON_ARRAY('sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_6_guardian', 'sec_7_investment', 'sec_10_testimonials_faqs'),
  1, 15, 'el-alamein'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), icon = VALUES(icon), icon_color = VALUES(icon_color),
  description = VALUES(description), is_parent = 1, parent_id = NULL, sections = VALUES(sections),
  active = 1, sort_order = VALUES(sort_order), market_id = VALUES(market_id);

INSERT INTO business_types (id, name, name_ar, icon, icon_color, description, is_parent, parent_id, sections, active, sort_order, market_id)
VALUES
  (
    'gated_compound', 'Gated Compound', 'كمبوند سكني', 'fas fa-city', '#0F4C81',
    'A master-planned residential project. Its page speaks for the whole development; the units inside it are listed separately.',
    0, 'real_estate',
    JSON_ARRAY('sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_6_guardian', 'sec_7_investment', 'sec_10_testimonials_faqs'),
    1, 1, 'el-alamein'
  ),
  (
    'sea_view_apartment', 'Sea-View Apartment', 'شقة بإطلالة بحرية', 'fas fa-building', '#0F4C81',
    'An apartment sold or rented with the sea in front of it.',
    0, 'real_estate',
    JSON_ARRAY('sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_7_investment', 'sec_10_testimonials_faqs'),
    1, 2, 'el-alamein'
  ),
  (
    'villa_chalet', 'Villa & Chalet', 'فيلا وشاليه', 'fas fa-home', '#0F4C81',
    'A standalone house or chalet, usually inside a compound or on its own land.',
    0, 'real_estate',
    JSON_ARRAY('sec_1_identity', 'sec_2_ambience', 'sec_3_facilities', 'sec_7_investment', 'sec_10_testimonials_faqs'),
    1, 3, 'el-alamein'
  ),
  (
    'commercial_unit', 'Commercial Unit', 'وحدة تجارية', 'fas fa-store', '#0F4C81',
    'Retail space, office or clinic sold or rented for business use.',
    0, 'real_estate',
    JSON_ARRAY('sec_1_identity', 'sec_3_facilities', 'sec_6_guardian', 'sec_7_investment', 'sec_10_testimonials_faqs'),
    1, 4, 'el-alamein'
  ),
  (
    'brokerage_office', 'Real Estate Brokerage', 'مكتب وساطة عقارية', 'fas fa-handshake', '#0F4C81',
    'A broker who sells on behalf of developers and owners, and lists their own portfolio.',
    0, 'real_estate',
    JSON_ARRAY('sec_1_identity', 'sec_3_facilities', 'sec_6_guardian', 'sec_7_investment', 'sec_10_testimonials_faqs'),
    1, 5, 'el-alamein'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name), name_ar = VALUES(name_ar), icon = VALUES(icon), icon_color = VALUES(icon_color),
  description = VALUES(description), is_parent = 0, parent_id = VALUES(parent_id), sections = VALUES(sections),
  active = 1, sort_order = VALUES(sort_order), market_id = VALUES(market_id);

-- 5 ─ The questions the category asks ─────────────────────────────────────────
-- Written on the parent so every child inherits them.
INSERT INTO form_fields (id, business_type_id, section_id, name, label, label_ar, field_type, options, help_text, searchable, is_comparable, field_scope, sort_order)
VALUES
  ('ff_elalamein_ownership_type', 'real_estate', 'sec_7_investment', 'ownership_type', 'Ownership system', 'نظام التملك', 'select',
    JSON_ARRAY(
      JSON_OBJECT('value', 'freehold', 'label', 'Freehold'),
      JSON_OBJECT('value', 'inherited_lease', 'label', 'Inherited lease'),
      JSON_OBJECT('value', 'off_plan', 'label', 'Off-plan (contract in progress)')
    ),
    'What the buyer ends up owning. The numbers of the payment plan are entered as inventory, not here.', 1, 1, 'profile', 10),

  ('ff_elalamein_project_stage', 'real_estate', 'sec_7_investment', 'project_stage', 'Project stage', 'مرحلة المشروع', 'select',
    JSON_ARRAY(
      JSON_OBJECT('value', 'ready_to_move_in', 'label', 'Ready to move in'),
      JSON_OBJECT('value', 'under_construction', 'label', 'Under construction'),
      JSON_OBJECT('value', 'announced', 'label', 'Announced — booking open')
    ),
    'What a visitor is being offered today.', 1, 1, 'profile', 20),

  ('ff_elalamein_payment_plan_notes', 'real_estate', 'sec_7_investment', 'payment_plan_notes', 'Payment plan in words', 'خطة السداد بالوصف', 'textarea',
    NULL,
    'How the developer structures a plan, in prose. The down-payment percentage and the installment years belong to each unit.', 0, 0, 'profile', 30),

  ('ff_elalamein_delivery_provision', 'real_estate', 'sec_7_investment', 'delivery_provision', 'Delivery provision in the contract', 'بند التسليم في التعاقد', 'text',
    NULL,
    'What the contract says happens if delivery is late. The year itself is entered per unit.', 0, 0, 'profile', 40),

  ('ff_elalamein_developer_record', 'real_estate', 'sec_7_investment', 'developer_record', 'Developer track record', 'سجل المطوّر', 'textarea',
    NULL,
    'Projects delivered before, and what happened to them.', 0, 0, 'profile', 50),

  ('ff_elalamein_resale_rights', 'real_estate', 'sec_7_investment', 'resale_rights', 'Resale and rental rights', 'حق إعادة البيع والتأجير', 'text',
    NULL,
    'Whether the owner may resell or rent, and from what point.', 0, 0, 'profile', 60),

  ('ff_elalamein_service_charge', 'real_estate', 'sec_7_investment', 'service_charge', 'Maintenance and service charges', 'مصاريف الصيانة والخدمات', 'text',
    NULL,
    'How they are calculated and how often they are paid.', 0, 0, 'profile', 70),

  ('ff_elalamein_contact_preference', 'real_estate', 'sec_7_investment', 'contact_preference', 'How you would like to be contacted', 'طريقة التواصل المفضلة', 'select',
    JSON_ARRAY(
      JSON_OBJECT('value', 'whatsapp', 'label', 'WhatsApp'),
      JSON_OBJECT('value', 'phone', 'label', 'Phone call'),
      JSON_OBJECT('value', 'visit', 'label', 'A visit to the site')
    ),
    'This market converts on a conversation, not on a booking.', 0, 0, 'profile', 80),

  ('ff_elalamein_beach_access', 'real_estate', 'sec_3_facilities', 'beach_access', 'Beach access', 'الوصول إلى الشاطئ', 'select',
    JSON_ARRAY(
      JSON_OBJECT('value', 'private', 'label', 'Private beach'),
      JSON_OBJECT('value', 'direct', 'label', 'Direct access on foot'),
      JSON_OBJECT('value', 'shuttle', 'label', 'Shuttle to the beach')
    ),
    NULL, 1, 1, 'profile', 10),

  ('ff_elalamein_distance_to_sea', 'real_estate', 'sec_3_facilities', 'distance_to_sea', 'Distance to the sea (metres)', 'المسافة إلى البحر (متر)', 'number',
    NULL,
    'Measured from the project gate, as a visitor will walk it.', 1, 1, 'profile', 20),

  ('ff_elalamein_facilities_notes', 'real_estate', 'sec_3_facilities', 'facilities_notes', 'What is built here', 'المرافق داخل المشروع', 'textarea',
    NULL,
    'Pools, sports, retail, clinics — what actually exists rather than what is planned.', 0, 0, 'profile', 30),

  ('ff_elalamein_management_partner', 'real_estate', 'sec_6_guardian', 'management_partner', 'Operations and management company', 'شركة الإدارة والتشغيل', 'text',
    NULL,
    'Who runs the project after handover, and whether they are the developer.', 0, 0, 'profile', 10),

  ('ff_elalamein_security_model', 'real_estate', 'sec_6_guardian', 'security_model', 'Security model', 'نظام الأمن', 'text',
    NULL,
    'Gating, patrols, access control.', 0, 0, 'profile', 20),

  ('ff_elalamein_project_character', 'real_estate', 'sec_2_ambience', 'project_character', 'Character of the place', 'طابع المكان', 'textarea',
    NULL,
    'In the vendor''s own words: what it feels like to spend a day here.', 0, 0, 'profile', 10)
ON DUPLICATE KEY UPDATE
  business_type_id = VALUES(business_type_id), section_id = VALUES(section_id), label = VALUES(label),
  label_ar = VALUES(label_ar), field_type = VALUES(field_type), options = VALUES(options),
  help_text = VALUES(help_text), searchable = VALUES(searchable), is_comparable = VALUES(is_comparable),
  field_scope = VALUES(field_scope), sort_order = VALUES(sort_order);

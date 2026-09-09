import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS, CANONICAL_SECTIONS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

type Field = readonly [string, string, string, string, string];
type Child = { id: string; name: string; icon: string; color: string; order: number; fields: Field[] };

const COMMON_FIELDS: Field[] = [
  ['sec_1_identity', 'factory_name', 'Factory name', 'text', 'Public name and legal identity.'],
  ['sec_1_identity', 'factory_story', 'Factory story and mission', 'rich_text', 'History, ownership and production mission.'],
  ['sec_1_identity', 'factory_contact_location', 'Location and contact', 'textarea', 'Address, phone, email, website and map.'],
  ['sec_2_ambience', 'facility_character', 'Facility character', 'textarea', 'Site character, visitor experience and visual identity.'],
  ['sec_2_ambience', 'visitor_experience', 'Visitor experience', 'multiselect', 'Factory tour, tasting, education, retail or wholesale visit.'],
  ['sec_2_ambience', 'facility_gallery', 'Facility gallery', 'gallery', 'Factory, production line, products and team photos.'],
  ['sec_3_facilities', 'production_capacity', 'Production capacity', 'number', 'Daily, monthly or annual production capacity.'],
  ['sec_3_facilities', 'facility_assets', 'Facilities and equipment', 'multiselect', 'Production lines, warehouse, laboratory, cold storage and loading.'],
  ['sec_3_facilities', 'storage_and_logistics', 'Storage and logistics', 'textarea', 'Storage, loading, transport and distribution facilities.'],
  ['sec_4_gastronomy', 'product_categories', 'Product categories', 'multiselect', 'Product families and manufacturing services.'],
  ['sec_4_gastronomy', 'production_services', 'Production services', 'multiselect', 'Processing, packaging, private label and contract manufacturing.'],
  ['sec_4_gastronomy', 'product_quality', 'Product quality information', 'textarea', 'Specifications, ingredients, materials and quality controls.'],
  ['sec_5_experiences', 'factory_tours', 'Factory tours and experiences', 'textarea', 'Tours, demonstrations, tastings and education.'],
  ['sec_5_experiences', 'tour_schedule', 'Tour schedule', 'textarea', 'Dates, duration, capacity and booking requirements.'],
  ['sec_6_guardian', 'operating_hours', 'Operating hours', 'textarea', 'Production, visitor and seasonal operating hours.'],
  ['sec_6_guardian', 'quality_and_safety', 'Quality and safety standards', 'rich_text', 'Safety systems, traceability, hygiene and quality procedures.'],
  ['sec_6_guardian', 'certifications_and_licenses', 'Certifications and licenses', 'rich_text', 'Regulatory approvals, audits and certifications.'],
  ['sec_7_investment', 'investment_available', 'Investment available', 'boolean', 'Whether investment or expansion partnerships are available.'],
  ['sec_7_investment', 'partnership_details', 'Partnership details', 'textarea', 'Supplier, distributor, franchise and investment opportunities.'],
  ['sec_8_connector', 'pricing_and_offers', 'Pricing and offers', 'textarea', 'Wholesale prices, packages, discounts and seasonal offers.'],
  ['sec_8_connector', 'sales_contact', 'Sales and order contact', 'text', 'Sales, wholesale, WhatsApp, email or ordering URL.'],
  ['sec_9_marketplace_catalog', 'product_catalog', 'Product catalog', 'gallery', 'Repeatable products with specifications, prices and images.'],
  ['sec_9_marketplace_catalog', 'documents_and_specifications', 'Documents and specifications', 'text', 'Catalogs, certificates, technical sheets and brochures.'],
  ['sec_10_testimonials_faqs', 'customer_reviews', 'Customer and buyer reviews', 'rich_text', 'Customer, distributor and wholesale testimonials.'],
  ['sec_10_testimonials_faqs', 'factory_faqs', 'Factory FAQs', 'rich_text', 'Minimum orders, lead times, shipping, quality and compliance questions.'],
];

const CHILDREN: Child[] = [
  { id: 'date_factory', name: 'Date Processing Factory', icon: 'fas fa-seedling', color: '#b45309', order: 7.1, fields: [
    ['sec_4_gastronomy', 'date_varieties', 'Date varieties', 'multiselect', 'Date cultivars and grades processed.'],
    ['sec_3_facilities', 'processing_methods', 'Date processing methods', 'multiselect', 'Sorting, washing, drying, pressing and packing.'],
    ['sec_9_marketplace_catalog', 'date_packaging_sizes', 'Date packaging sizes', 'multiselect', 'Retail, food service, gift and export packaging.'],
  ] },
  { id: 'water_factory', name: 'Bottled Water Factory', icon: 'fas fa-tint', color: '#0284c7', order: 7.2, fields: [
    ['sec_4_gastronomy', 'water_source', 'Water source', 'text', 'Spring, well, municipal or purified source.'],
    ['sec_3_facilities', 'filtration_methods', 'Filtration methods', 'multiselect', 'RO, UV, ozone, carbon and mineral balancing.'],
    ['sec_6_guardian', 'water_testing_and_certification', 'Water testing and certification', 'rich_text', 'Laboratory testing, mineral profile and health certification.'],
  ] },
  { id: 'olive_processing_factory', name: 'Olive Processing Factory', icon: 'fas fa-leaf', color: '#16a34a', order: 7.3, fields: [
    ['sec_4_gastronomy', 'olive_product_types', 'Olive product types', 'multiselect', 'Table olives, oil, pickles and by-products.'],
    ['sec_3_facilities', 'pressing_and_storage', 'Pressing and storage', 'textarea', 'Pressing process, tanks, cold storage and harvest capacity.'],
    ['sec_9_marketplace_catalog', 'oil_grades_and_packaging', 'Oil grades and packaging', 'multiselect', 'Grades, bottle sizes and private-label options.'],
  ] },
  { id: 'food_manufacturing_factory', name: 'Food Manufacturing Factory', icon: 'fas fa-industry', color: '#ea580c', order: 7.4, fields: [
    ['sec_4_gastronomy', 'food_product_lines', 'Food product lines', 'multiselect', 'Prepared foods, preserves, snacks, bakery and private label.'],
    ['sec_6_guardian', 'food_safety_system', 'Food safety system', 'rich_text', 'HACCP, traceability, allergen and hygiene controls.'],
    ['sec_8_connector', 'minimum_order_and_lead_time', 'Minimum order and lead time', 'textarea', 'MOQ, production lead time and distribution terms.'],
  ] },
];

async function ensureField(typeId: string, field: Field, origin: string) {
  const [sectionId, name, label, fieldType, helpText] = field;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NULL, '{}', ?, 0, ?, 'latest')`,
    [`production_${typeId}_${name}`, typeId, sectionId, name, label, fieldType, helpText,
      JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }), origin]
  );
}

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    await execute(
      `INSERT IGNORE INTO business_types
        (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
       VALUES ('production_trade', 'Production & Trade', 'fas fa-industry', '#7c3aed', 1, NULL, ?, '[]', 1, 7)`,
      [JSON.stringify(CANONICAL_SECTION_IDS)]
    );
    await execute('UPDATE business_types SET name = ?, sections = ?, active = 1 WHERE id = ?', ['Production & Trade', JSON.stringify(CANONICAL_SECTION_IDS), 'production_trade']);

    for (const section of CANONICAL_SECTIONS) {
      if (!(await queryOne('SELECT id FROM sections WHERE id = ?', [section.id]))) {
        await execute(
          'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)',
          [section.id, section.name, section.icon, section.order]
        );
      }
    }

    for (const field of COMMON_FIELDS) await ensureField('production_trade', field, 'parent');
    for (const child of CHILDREN) {
      await execute(
        `INSERT IGNORE INTO business_types
          (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
         VALUES (?, ?, ?, ?, 0, 'production_trade', ?, '[]', 1, ?)`,
        [child.id, child.name, child.icon, child.color, JSON.stringify(CANONICAL_SECTION_IDS), child.order]
      );
      await execute('UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?', ['production_trade', JSON.stringify(CANONICAL_SECTION_IDS), child.id]);
      for (const field of child.fields) await ensureField(child.id, field, 'child');
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({ success: true, parent: 'production_trade', children: CHILDREN.map(child => child.id), commonFields: COMMON_FIELDS.length, childFields: CHILDREN.reduce((total, child) => total + child.fields.length, 0), sections: CANONICAL_SECTION_IDS });
  } catch (error: any) {
    console.error('[PRODUCTION TRADE SEED ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to seed Production & Trade blueprint' }, { status: 500 });
  }
}

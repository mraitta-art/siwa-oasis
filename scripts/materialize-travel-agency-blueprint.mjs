import mysql from 'mysql2/promise';
import { prodConfig } from './db-config.js';

const sectionIds = [
  'sec_1_identity',
  'sec_2_ambience',
  'sec_3_facilities',
  'sec_4_gastronomy',
  'sec_5_experiences',
  'sec_6_guardian',
  'sec_7_investment',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
];

const fields = [
  ['sec_1_identity', 'description', 'Business description', 'textarea', 1],
  ['sec_1_identity', 'trade_license', 'Trade license', 'text', 1],
  ['sec_1_identity', 'founded_year', 'Founded year', 'number', 0],
  ['sec_1_identity', 'website', 'Website', 'text', 0],
  ['sec_1_identity', 'email', 'Business email', 'text', 1],
  ['sec_1_identity', 'social_links', 'Social links', 'textarea', 0],
  ['sec_2_ambience', 'atmosphere', 'Travel style and atmosphere', 'text', 0],
  ['sec_2_ambience', 'target_audience', 'Target audience', 'text', 0],
  ['sec_3_facilities', 'vehicle_types', 'Vehicle types', 'text', 0],
  ['sec_3_facilities', 'vehicle_count', 'Vehicle count', 'number', 0],
  ['sec_3_facilities', 'ac', 'Air conditioning available', 'boolean', 0],
  ['sec_3_facilities', '4wd', '4WD available', 'boolean', 0],
  ['sec_4_gastronomy', 'included_meals', 'Included meals and refreshments', 'textarea', 0],
  ['sec_5_experiences', 'booking_required', 'Booking required', 'boolean', 1],
  ['sec_5_experiences', 'advance_notice_days', 'Advance notice days', 'number', 0],
  ['sec_5_experiences', 'cancellation_policy', 'Cancellation policy', 'textarea', 0],
  ['sec_5_experiences', 'itinerary', 'Itinerary and highlights', 'rich_text', 0],
  ['sec_6_guardian', 'guide_count', 'Guide count', 'number', 0],
  ['sec_6_guardian', 'languages', 'Guide languages', 'text', 0],
  ['sec_6_guardian', 'certifications', 'Guide certifications', 'textarea', 0],
  ['sec_6_guardian', 'guide_profiles', 'Guide profiles', 'textarea', 0],
  ['sec_7_investment', 'group_rates', 'Group rates', 'text', 0],
  ['sec_7_investment', 'agent_commission_pct', 'Agent commission percentage', 'number', 0],
  ['sec_8_connector', 'discount_pct', 'Discount percentage', 'number', 0],
  ['sec_8_connector', 'promo_code', 'Promo code', 'text', 0],
  ['sec_8_connector', 'offer_expires', 'Offer expiry date', 'text', 0],
  ['sec_9_marketplace_catalog', 'vehicle_photos', 'Vehicle photos', 'gallery', 0],
  ['sec_9_marketplace_catalog', 'package_gallery', 'Tour package gallery', 'gallery', 0],
  ['sec_10_testimonials_faqs', 'license_number', 'License number', 'text', 1],
  ['sec_10_testimonials_faqs', 'insurance', 'Insurance and safety cover', 'textarea', 0],
  ['sec_10_testimonials_faqs', 'safety_rating', 'Safety rating', 'number', 0],
];

const connection = await mysql.createConnection(prodConfig);

try {
  await connection.beginTransaction();

  await connection.query(
    `UPDATE sections SET active = 1, show_on_public = 1, show_on_minisite = 1 WHERE id IN (${sectionIds.map(() => '?').join(',')})`,
    sectionIds,
  );

  await connection.query(
    `UPDATE business_types SET sections = ?, own_sections = ? WHERE id = 'travel_agency'`,
    [JSON.stringify(sectionIds), JSON.stringify(sectionIds)],
  );

  for (const [index, [sectionId, name, label, fieldType, required]] of fields.entries()) {
    const fieldId = `travel_agency_${name}`.slice(0, 100);
    await connection.query(
      `INSERT IGNORE INTO form_fields
       (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, sort_order, section_origin, acl, validation)
       VALUES (?, 'travel_agency', ?, ?, ?, ?, ?, 1, 0, ?, 'own', ?, ?)`,
      [
        fieldId,
        sectionId,
        name,
        label,
        fieldType,
        required,
        index,
        JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }),
        JSON.stringify({}),
      ],
    );
  }

  await connection.commit();
  console.log(`TRAVEL_BLUEPRINT_COMPLETE: sections=${sectionIds.length}; fields=${fields.length}`);
} catch (error) {
  await connection.rollback();
  console.error(`TRAVEL_BLUEPRINT_FAILED:${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
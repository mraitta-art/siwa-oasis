import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

const FOOD_CHILDREN = [
  { id: 'restaurant', name: 'Standard Restaurant', icon: 'fas fa-utensils', color: '#f59e0b', order: 2.1 },
  { id: 'siwan_kitchen', name: 'Traditional Siwan Kitchen', icon: 'fas fa-utensils', color: '#D4AF37', order: 2.2 },
  { id: 'cafe_juice', name: 'Cafe & Juice Bar', icon: 'fas fa-mug-hot', color: '#f59e0b', order: 2.3 },
  { id: 'fine_dining', name: 'Fine Dining', icon: 'fas fa-concierge-bell', color: '#7c3aed', order: 2.4 },
  { id: 'street_food_stall', name: 'Street Food Stall', icon: 'fas fa-store', color: '#ef4444', order: 2.5 },
];

const COMMON_FIELDS = [
  ['sec_1_identity', 'business_name', 'Business name', 'text', 'Public name of the food and beverage business.'],
  ['sec_1_identity', 'business_description', 'Business description', 'rich_text', 'Short story and concept.'],
  ['sec_1_identity', 'contact_and_location', 'Contact and location details', 'textarea', 'Address, phone, email, map and website.'],
  ['sec_2_ambience', 'atmosphere', 'Atmosphere and style', 'textarea', 'Describe the feeling, design and audience.'],
  ['sec_2_ambience', 'seating_style', 'Seating style', 'multiselect', 'Indoor, outdoor, counter, private or communal seating.'],
  ['sec_2_ambience', 'ambience_gallery', 'Ambience gallery', 'gallery', 'Photos showing the interior and exterior.'],
  ['sec_3_facilities', 'capacity', 'Guest capacity', 'number', 'Maximum seating capacity.'],
  ['sec_3_facilities', 'facilities', 'Facilities and amenities', 'multiselect', 'Parking, Wi-Fi, accessibility, toilets and private rooms.'],
  ['sec_3_facilities', 'accessibility_notes', 'Accessibility notes', 'textarea', 'Access information for guests.'],
  ['sec_4_gastronomy', 'cuisine_types', 'Cuisine types', 'multiselect', 'Cuisine traditions and food styles.'],
  ['sec_4_gastronomy', 'price_range', 'Price range', 'select', 'Typical spend per guest.'],
  ['sec_4_gastronomy', 'dietary_options', 'Dietary options and allergens', 'multiselect', 'Vegetarian, vegan, halal, gluten-free and allergen information.'],
  ['sec_5_experiences', 'signature_experiences', 'Signature dining experiences', 'textarea', 'Tastings, events, sunset dining or special experiences.'],
  ['sec_5_experiences', 'experience_schedule', 'Experience schedule', 'textarea', 'Dates, times and booking requirements.'],
  ['sec_6_guardian', 'opening_hours', 'Opening hours', 'textarea', 'Regular and seasonal opening hours.'],
  ['sec_6_guardian', 'service_options', 'Service options', 'multiselect', 'Dine-in, takeaway, delivery, catering and reservations.'],
  ['sec_6_guardian', 'policies', 'Operating policies', 'rich_text', 'Reservation, cancellation, payment and hygiene policies.'],
  ['sec_7_investment', 'partnership_available', 'Partnership available', 'boolean', 'Whether partnerships or expansion are available.'],
  ['sec_7_investment', 'partnership_details', 'Partnership details', 'textarea', 'Investment, franchise or supplier partnership information.'],
  ['sec_8_connector', 'offers_and_promotions', 'Offers and promotions', 'textarea', 'Current offers, packages and discounts.'],
  ['sec_8_connector', 'booking_contact', 'Booking and order contact', 'text', 'Reservation, WhatsApp or ordering contact.'],
  ['sec_9_marketplace_catalog', 'menu_catalog', 'Menu and product catalog', 'gallery', 'Repeatable menu or product items with photos.'],
  ['sec_9_marketplace_catalog', 'downloadable_menu', 'Downloadable menu', 'text', 'Menu document URL.'],
  ['sec_10_testimonials_faqs', 'reviews', 'Reviews and testimonials', 'rich_text', 'Customer reviews and ratings.'],
  ['sec_10_testimonials_faqs', 'faqs', 'Frequently asked questions', 'rich_text', 'Common customer questions and answers.'],
] as const;

const CHILD_FIELDS: Record<string, Array<[string, string, string, string, string]>> = {
  restaurant: [
    ['sec_3_facilities', 'table_reservation_capacity', 'Table reservation capacity', 'number', 'Number of reservable tables.'],
    ['sec_4_gastronomy', 'menu_courses', 'Menu courses', 'multiselect', 'Starter, main course, dessert and tasting options.'],
    ['sec_6_guardian', 'reservation_required', 'Reservation required', 'boolean', 'Whether guests must reserve before arrival.'],
  ],
  siwan_kitchen: [
    ['sec_4_gastronomy', 'traditional_specialties', 'Traditional specialties', 'textarea', 'Local recipes and signature Siwan dishes.'],
    ['sec_5_experiences', 'cultural_dining_story', 'Cultural dining story', 'rich_text', 'The heritage and story behind the experience.'],
    ['sec_9_marketplace_catalog', 'local_ingredients', 'Local ingredients', 'multiselect', 'Locally sourced ingredients and producers.'],
  ],
  cafe_juice: [
    ['sec_4_gastronomy', 'coffee_and_juice_menu', 'Coffee and juice menu', 'gallery', 'Repeatable drinks, sizes and prices.'],
    ['sec_3_facilities', 'workspace_facilities', 'Workspace facilities', 'multiselect', 'Power outlets, tables, Wi-Fi and quiet zones.'],
    ['sec_8_connector', 'breakfast_and_combo_offers', 'Breakfast and combo offers', 'textarea', 'Breakfast, coffee and juice combinations.'],
  ],
  fine_dining: [
    ['sec_4_gastronomy', 'tasting_menu', 'Tasting menu', 'rich_text', 'Courses, pairings and chef notes.'],
    ['sec_4_gastronomy', 'wine_pairing', 'Wine or beverage pairing', 'textarea', 'Pairing options and service notes.'],
    ['sec_6_guardian', 'reservation_lead_time', 'Reservation lead time', 'text', 'Required notice for reservations.'],
  ],
  street_food_stall: [
    ['sec_4_gastronomy', 'quick_service_menu', 'Quick service menu', 'gallery', 'Fast menu items, prices and photos.'],
    ['sec_6_guardian', 'service_locations', 'Service locations', 'textarea', 'Regular locations and schedule.'],
    ['sec_8_connector', 'mobile_ordering_contact', 'Mobile ordering contact', 'text', 'Phone, WhatsApp or social ordering contact.'],
  ],
};

async function ensureType(id: string, name: string, icon: string, color: string, order: number) {
  await execute(
    `INSERT IGNORE INTO business_types
      (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
     VALUES (?, ?, ?, ?, 0, 'food', ?, '[]', 1, ?)`,
    [id, name, icon, color, JSON.stringify(CANONICAL_SECTION_IDS), order]
  );
  await execute(
    'UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?',
    ['food', JSON.stringify(CANONICAL_SECTION_IDS), id]
  );
}

async function ensureField(businessTypeId: string, field: readonly [string, string, string, string, string], origin: string) {
  const [sectionId, name, label, fieldType, helpText] = field;
  const id = `fb_${businessTypeId}_${name}`;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NULL, '{}', ?, 0, ?, 'latest')`,
    [
      id,
      businessTypeId,
      sectionId,
      name,
      label,
      fieldType,
      helpText,
      JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }),
      origin,
    ]
  );
}

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();

    await execute(
      `INSERT IGNORE INTO business_types
        (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
       VALUES ('food', 'Food & Beverage', 'fas fa-utensils', '#f59e0b', 1, NULL, ?, '[]', 1, 2)`,
      [JSON.stringify(CANONICAL_SECTION_IDS)]
    );
    await execute('UPDATE business_types SET sections = ?, active = 1 WHERE id = ?', [JSON.stringify(CANONICAL_SECTION_IDS), 'food']);

    for (const sectionId of CANONICAL_SECTION_IDS) {
      const section = await queryOne('SELECT id FROM sections WHERE id = ?', [sectionId]);
      if (!section) {
        await execute(
          'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)',
          [sectionId, sectionId.replace(/^sec_\d+_/, '').replace(/_/g, ' '), 'fa-layer-group', CANONICAL_SECTION_IDS.indexOf(sectionId) + 1]
        );
      }
    }

    for (const field of COMMON_FIELDS) await ensureField('food', field, 'parent');
    for (const child of FOOD_CHILDREN) {
      await ensureType(child.id, child.name, child.icon, child.color, child.order);
      for (const field of CHILD_FIELDS[child.id] || []) await ensureField(child.id, field, 'child');
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({
      success: true,
      parent: 'food',
      children: FOOD_CHILDREN.map(child => child.id),
      commonFields: COMMON_FIELDS.length,
      childFields: Object.values(CHILD_FIELDS).reduce((total, fields) => total + fields.length, 0),
      sections: CANONICAL_SECTION_IDS,
    });
  } catch (error: any) {
    console.error('[F&B SEED ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to seed food and beverage blueprint' }, { status: 500 });
  }
}

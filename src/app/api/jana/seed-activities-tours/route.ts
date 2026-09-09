import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS, CANONICAL_SECTIONS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

type Field = readonly [string, string, string, string, string];
type Child = { id: string; name: string; icon: string; color: string; order: number; fields: Field[] };

const CHILDREN: Child[] = [
  { id: 'safari_4x4', name: '4x4 Desert Safari', icon: 'fas fa-jeep', color: '#10b981', order: 3.1, fields: [
    ['sec_3_facilities', 'vehicle_specs', 'Safari vehicle specifications', 'textarea', 'Vehicle type, capacity, safety and desert equipment.'],
    ['sec_4_gastronomy', 'safari_route_options', 'Safari route options', 'multiselect', 'Dunes, lakes, springs, caves and heritage stops.'],
    ['sec_6_guardian', 'desert_safety_protocol', 'Desert safety protocol', 'rich_text', 'Convoy, communications, weather and emergency procedures.'],
  ] },
  { id: 'camel_trek', name: 'Camel Trekking', icon: 'fas fa-horse', color: '#f59e0b', order: 3.2, fields: [
    ['sec_3_facilities', 'camel_welfare', 'Camel welfare standards', 'rich_text', 'Animal welfare, rest, water and care standards.'],
    ['sec_4_gastronomy', 'trek_routes', 'Trek routes', 'multiselect', 'Palm groves, dunes, lakes, villages and sunset routes.'],
    ['sec_5_experiences', 'nomadic_experience', 'Nomadic experience', 'textarea', 'Tea, camp, storytelling and cultural activities.'],
  ] },
  { id: 'nature_tour', name: 'Nature & Bird Watching', icon: 'fas fa-binoculars', color: '#10b981', order: 3.3, fields: [
    ['sec_4_gastronomy', 'wildlife_focus', 'Wildlife focus', 'multiselect', 'Birds, palms, wetlands, desert plants and wildlife.'],
    ['sec_5_experiences', 'observation_program', 'Observation program', 'textarea', 'Best seasons, times, guides and observation points.'],
    ['sec_6_guardian', 'conservation_practices', 'Conservation practices', 'rich_text', 'Environmental protection and visitor guidelines.'],
  ] },
  { id: 'heritage_tour', name: 'Historical Heritage Tour', icon: 'fas fa-landmark', color: '#D4AF37', order: 3.4, fields: [
    ['sec_4_gastronomy', 'heritage_sites', 'Heritage sites', 'multiselect', 'Fortresses, temples, museums, tombs and historic villages.'],
    ['sec_5_experiences', 'storytelling_languages', 'Storytelling languages', 'multiselect', 'Languages available for the historical tour.'],
    ['sec_6_guardian', 'heritage_access_rules', 'Heritage access rules', 'rich_text', 'Permits, preservation rules and visitor conduct.'],
  ] },
];

const COMMON_FIELDS: Field[] = [
  ['sec_1_identity', 'activity_name', 'Activity or tour name', 'text', 'Public name of the activity provider.'],
  ['sec_1_identity', 'activity_description', 'Activity description', 'rich_text', 'What the activity offers and who it serves.'],
  ['sec_1_identity', 'operator_contact_location', 'Operator contact and location', 'textarea', 'Address, phone, email, website and map.'],
  ['sec_2_ambience', 'experience_style', 'Experience style', 'multiselect', 'Adventure, cultural, family, private, educational or nature.'],
  ['sec_2_ambience', 'setting_and_views', 'Setting and views', 'textarea', 'Landscape, scenery and atmosphere.'],
  ['sec_2_ambience', 'experience_gallery', 'Experience gallery', 'gallery', 'Vehicles, routes, guides and guest experience photos.'],
  ['sec_3_facilities', 'group_capacity', 'Group capacity', 'number', 'Maximum participants per departure.'],
  ['sec_3_facilities', 'equipment_included', 'Equipment included', 'multiselect', 'Transport, helmets, water, camping, safety and viewing equipment.'],
  ['sec_3_facilities', 'accessibility_requirements', 'Accessibility requirements', 'textarea', 'Mobility, age and physical requirements.'],
  ['sec_4_gastronomy', 'activity_types', 'Activity types', 'multiselect', 'Tours, safari, trekking, sightseeing, wildlife and learning.'],
  ['sec_4_gastronomy', 'route_and_duration', 'Route and duration', 'textarea', 'Route, distance, duration and difficulty.'],
  ['sec_4_gastronomy', 'included_services', 'Included services', 'textarea', 'Guide, transport, meals, permits and equipment included.'],
  ['sec_5_experiences', 'itinerary', 'Itinerary and highlights', 'rich_text', 'Schedule, stops and guest activities.'],
  ['sec_5_experiences', 'seasonal_availability', 'Seasonal availability', 'textarea', 'Best seasons, dates and departure times.'],
  ['sec_6_guardian', 'operating_hours', 'Operating hours', 'textarea', 'Availability and departure schedule.'],
  ['sec_6_guardian', 'safety_and_guide_standards', 'Safety and guide standards', 'rich_text', 'Guide qualifications, safety rules and emergency procedures.'],
  ['sec_6_guardian', 'booking_cancellation_policy', 'Booking and cancellation policy', 'rich_text', 'Lead time, cancellations, weather and no-show rules.'],
  ['sec_7_investment', 'partnership_available', 'Partnership available', 'boolean', 'Whether hotels, operators or agencies can partner.'],
  ['sec_7_investment', 'partnership_details', 'Partnership details', 'textarea', 'Referral, guide, fleet or expansion partnerships.'],
  ['sec_8_connector', 'rates_and_packages', 'Rates and packages', 'textarea', 'Private, group, family and seasonal pricing.'],
  ['sec_8_connector', 'booking_contact', 'Booking contact', 'text', 'Phone, WhatsApp, email or booking URL.'],
  ['sec_9_marketplace_catalog', 'tour_catalog', 'Tour and activity catalog', 'gallery', 'Repeatable tours with duration, price and photos.'],
  ['sec_9_marketplace_catalog', 'route_maps_and_documents', 'Route maps and documents', 'text', 'Maps, permits, brochures and downloadable documents.'],
  ['sec_10_testimonials_faqs', 'reviews', 'Reviews and testimonials', 'rich_text', 'Guest reviews and guide ratings.'],
  ['sec_10_testimonials_faqs', 'activity_faqs', 'Activity FAQs', 'rich_text', 'What to bring, age limits, safety and weather questions.'],
];

async function ensureField(typeId: string, field: Field, origin: string) {
  const [sectionId, name, label, fieldType, helpText] = field;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NULL, '{}', ?, 0, ?, 'latest')`,
    [`activities_${typeId}_${name}`, typeId, sectionId, name, label, fieldType, helpText,
      JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }), origin]
  );
}

export async function POST(_request: NextRequest) {
  try {
    await requireAdmin();
    await execute(
      `INSERT IGNORE INTO business_types
        (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
       VALUES ('adventure', 'Activities & Tours', 'fas fa-compass', '#10b981', 1, NULL, ?, '[]', 1, 3)`,
      [JSON.stringify(CANONICAL_SECTION_IDS)]
    );
    await execute(
      'UPDATE business_types SET name = ?, icon = ?, sections = ?, active = 1 WHERE id = ?',
      ['Activities & Tours', 'fas fa-compass', JSON.stringify(CANONICAL_SECTION_IDS), 'adventure']
    );

    for (const section of CANONICAL_SECTIONS) {
      const existing = await queryOne('SELECT id FROM sections WHERE id = ?', [section.id]);
      if (!existing) {
        await execute(
          'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)',
          [section.id, section.name, section.icon, section.order]
        );
      }
    }

    for (const field of COMMON_FIELDS) await ensureField('adventure', field, 'parent');
    for (const child of CHILDREN) {
      await execute(
        `INSERT IGNORE INTO business_types
          (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
         VALUES (?, ?, ?, ?, 0, 'adventure', ?, '[]', 1, ?)`,
        [child.id, child.name, child.icon, child.color, JSON.stringify(CANONICAL_SECTION_IDS), child.order]
      );
      await execute('UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?', ['adventure', JSON.stringify(CANONICAL_SECTION_IDS), child.id]);
      for (const field of child.fields) await ensureField(child.id, field, 'child');
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({
      success: true,
      parent: 'adventure',
      displayName: 'Activities & Tours',
      children: CHILDREN.map(child => child.id),
      commonFields: COMMON_FIELDS.length,
      childFields: CHILDREN.reduce((total, child) => total + child.fields.length, 0),
      sections: CANONICAL_SECTION_IDS,
    });
  } catch (error: any) {
    console.error('[ACTIVITIES TOURS SEED ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to seed Activities & Tours blueprint' }, { status: 500 });
  }
}

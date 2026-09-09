import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

const TRANSPORT_CHILDREN = [
  { id: 'tuk_tuk', name: 'Local Tuk-Tuk Service', icon: 'fas fa-motorcycle', color: '#f59e0b', order: 6.1 },
  { id: 'equipment_rental', name: 'Equipment Rental', icon: 'fas fa-tools', color: '#2c3e50', order: 6.2 },
  { id: 'private_transfer', name: 'Private Transfer', icon: 'fas fa-car', color: '#2563eb', order: 6.3 },
  { id: 'desert_transfer', name: 'Desert Transfer', icon: 'fas fa-truck-pickup', color: '#b45309', order: 6.4 },
];

const COMMON_FIELDS = [
  ['sec_1_identity', 'service_name', 'Transport service name', 'text', 'Public name of the transport provider.'],
  ['sec_1_identity', 'service_description', 'Service description', 'rich_text', 'What the service provides and who it serves.'],
  ['sec_1_identity', 'service_area', 'Service area', 'textarea', 'Cities, oasis areas and destinations served.'],
  ['sec_2_ambience', 'travel_style', 'Travel style', 'multiselect', 'Local, private, family, luxury, adventure or shared travel.'],
  ['sec_2_ambience', 'comfort_level', 'Comfort level', 'select', 'Basic, standard, premium or luxury.'],
  ['sec_2_ambience', 'vehicle_gallery', 'Vehicle and service gallery', 'gallery', 'Photos of vehicles, equipment and service experience.'],
  ['sec_3_facilities', 'passenger_capacity', 'Passenger capacity', 'number', 'Maximum passengers per vehicle or booking.'],
  ['sec_3_facilities', 'vehicle_features', 'Vehicle features', 'multiselect', 'Air conditioning, luggage space, child seats and accessibility.'],
  ['sec_3_facilities', 'equipment_available', 'Equipment available', 'multiselect', 'Safety, navigation, camping and travel equipment.'],
  ['sec_4_gastronomy', 'journey_services', 'Journey services', 'multiselect', 'Transfer, tour, delivery, rental or guided journey.'],
  ['sec_4_gastronomy', 'route_options', 'Route options', 'textarea', 'Common routes, stops and destination options.'],
  ['sec_4_gastronomy', 'included_in_service', 'Included in service', 'textarea', 'Driver, fuel, guide, permits, water or equipment included.'],
  ['sec_5_experiences', 'journey_experiences', 'Journey experiences', 'textarea', 'Scenic routes, safari, heritage and local travel experiences.'],
  ['sec_5_experiences', 'stops_and_activities', 'Stops and activities', 'textarea', 'Optional stops, activities and itinerary details.'],
  ['sec_6_guardian', 'operating_hours', 'Operating hours', 'textarea', 'Availability, pickup times and seasonal schedule.'],
  ['sec_6_guardian', 'safety_and_licenses', 'Safety and licenses', 'rich_text', 'Licenses, insurance, safety procedures and driver standards.'],
  ['sec_6_guardian', 'booking_policy', 'Booking and cancellation policy', 'rich_text', 'Lead time, cancellation, waiting and no-show rules.'],
  ['sec_7_investment', 'partnership_available', 'Partnership available', 'boolean', 'Whether hotels, tour operators or businesses can partner.'],
  ['sec_7_investment', 'partnership_details', 'Partnership details', 'textarea', 'Fleet expansion, supplier or operator partnership details.'],
  ['sec_8_connector', 'rates_and_packages', 'Rates and packages', 'textarea', 'One-way, return, hourly, daily and group rates.'],
  ['sec_8_connector', 'booking_contact', 'Booking contact', 'text', 'Phone, WhatsApp, email or booking URL.'],
  ['sec_9_marketplace_catalog', 'fleet_catalog', 'Fleet and equipment catalog', 'gallery', 'Repeatable vehicles or equipment with prices and specifications.'],
  ['sec_9_marketplace_catalog', 'documents_and_maps', 'Documents and route maps', 'text', 'Permits, brochures, route maps or downloadable documents.'],
  ['sec_10_testimonials_faqs', 'reviews', 'Reviews and testimonials', 'rich_text', 'Customer reviews and service ratings.'],
  ['sec_10_testimonials_faqs', 'faqs', 'Frequently asked questions', 'rich_text', 'Pickup, luggage, safety and booking questions.'],
] as const;

const CHILD_FIELDS: Record<string, Array<[string, string, string, string, string]>> = {
  tuk_tuk: [
    ['sec_3_facilities', 'tuk_tuk_capacity', 'Tuk-tuk seating capacity', 'number', 'Number of passengers per tuk-tuk.'],
    ['sec_4_gastronomy', 'local_route_services', 'Local route services', 'multiselect', 'Market, village, spring and short-distance routes.'],
    ['sec_8_connector', 'short_trip_rates', 'Short-trip rates', 'textarea', 'Local trip and waiting-time rates.'],
  ],
  equipment_rental: [
    ['sec_3_facilities', 'rental_categories', 'Rental categories', 'multiselect', 'Bicycles, scooters, camping, safari and safety equipment.'],
    ['sec_6_guardian', 'rental_requirements', 'Rental requirements', 'rich_text', 'Identification, deposit, license and return requirements.'],
    ['sec_9_marketplace_catalog', 'rental_inventory', 'Rental inventory', 'gallery', 'Repeatable equipment items, rates and availability.'],
  ],
  private_transfer: [
    ['sec_3_facilities', 'airport_transfer_capacity', 'Airport transfer capacity', 'number', 'Passengers and luggage supported per trip.'],
    ['sec_5_experiences', 'meet_and_greet', 'Meet and greet service', 'boolean', 'Whether arrival assistance is provided.'],
    ['sec_8_connector', 'airport_transfer_rates', 'Airport transfer rates', 'textarea', 'Airport, hotel and intercity transfer pricing.'],
  ],
  desert_transfer: [
    ['sec_3_facilities', 'desert_vehicle_specs', 'Desert vehicle specifications', 'textarea', 'Vehicle, tires, safety and communication equipment.'],
    ['sec_5_experiences', 'desert_route_permits', 'Desert route permits', 'multiselect', 'Permits and route areas available.'],
    ['sec_6_guardian', 'desert_safety_protocol', 'Desert safety protocol', 'rich_text', 'Convoy, emergency and weather procedures.'],
  ],
};

async function ensureType(child: typeof TRANSPORT_CHILDREN[number]) {
  await execute(
    `INSERT IGNORE INTO business_types
      (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
     VALUES (?, ?, ?, ?, 0, 'logistics', ?, '[]', 1, ?)`,
    [child.id, child.name, child.icon, child.color, JSON.stringify(CANONICAL_SECTION_IDS), child.order]
  );
  await execute(
    'UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?',
    ['logistics', JSON.stringify(CANONICAL_SECTION_IDS), child.id]
  );
}

async function ensureField(typeId: string, field: readonly [string, string, string, string, string], origin: string) {
  const [sectionId, name, label, fieldType, helpText] = field;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, ?, NULL, '{}', ?, 0, ?, 'latest')`,
    [
      `transport_${typeId}_${name}`,
      typeId,
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
       VALUES ('logistics', 'Logistics & Transportation', 'fas fa-truck-moving', '#2c3e50', 1, NULL, ?, '[]', 1, 6)`,
      [JSON.stringify(CANONICAL_SECTION_IDS)]
    );
    await execute('UPDATE business_types SET sections = ?, active = 1 WHERE id = ?', [JSON.stringify(CANONICAL_SECTION_IDS), 'logistics']);

    for (const sectionId of CANONICAL_SECTION_IDS) {
      const section = await queryOne('SELECT id FROM sections WHERE id = ?', [sectionId]);
      if (!section) {
        await execute(
          'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)',
          [sectionId, sectionId.replace(/^sec_\d+_/, '').replace(/_/g, ' '), 'fa-layer-group', CANONICAL_SECTION_IDS.indexOf(sectionId) + 1]
        );
      }
    }

    for (const field of COMMON_FIELDS) await ensureField('logistics', field, 'parent');
    for (const child of TRANSPORT_CHILDREN) {
      await ensureType(child);
      for (const field of CHILD_FIELDS[child.id] || []) await ensureField(child.id, field, 'child');
    }

    invalidateCache.businessTypes();
    invalidateCache.sections();
    invalidateCache.formFields();
    return NextResponse.json({
      success: true,
      parent: 'logistics',
      children: TRANSPORT_CHILDREN.map(child => child.id),
      commonFields: COMMON_FIELDS.length,
      childFields: Object.values(CHILD_FIELDS).reduce((total, fields) => total + fields.length, 0),
      sections: CANONICAL_SECTION_IDS,
    });
  } catch (error: any) {
    console.error('[TRANSPORT SEED ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to seed transportation blueprint' }, { status: 500 });
  }
}

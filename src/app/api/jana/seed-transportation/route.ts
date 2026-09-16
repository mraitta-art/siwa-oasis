import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CANONICAL_SECTION_IDS } from '@/lib/section-registry';
import { invalidateCache } from '@/lib/cache';

const TRANSPORT_CHILDREN = [
  { id: 'car_taxi', name: 'Car & Taxi Service', icon: 'fas fa-car', color: '#2563eb', order: 6.05 },
  { id: 'bus_minibus', name: 'Bus & Mini-Bus Service', icon: 'fas fa-bus', color: '#0891b2', order: 6.08 },
  { id: 'desert_4x4', name: '4x4 Desert Vehicle Service', icon: 'fas fa-truck-pickup', color: '#b45309', order: 6.09 },
  { id: 'tuk_tuk', name: 'Local Tuk-Tuk Service', icon: 'fas fa-motorcycle', color: '#f59e0b', order: 6.1 },
  { id: 'equipment_rental', name: 'Equipment Rental', icon: 'fas fa-tools', color: '#2c3e50', order: 6.2 },
  { id: 'private_transfer', name: 'Private Transfer', icon: 'fas fa-car', color: '#2563eb', order: 6.3 },
  { id: 'desert_transfer', name: 'Desert Transfer', icon: 'fas fa-truck-pickup', color: '#b45309', order: 6.4 },
];

const COMMON_FIELDS = [
  ['sec_1_identity', 'service_name', 'Transport service name', 'text', 'Public name of the transport provider.'],
  ['sec_1_identity', 'service_description', 'Service description', 'rich_text', 'What the service provides and who it serves.'],
  ['sec_1_identity', 'legal_company_name', 'Legal company name', 'text', 'Registered legal name of the transportation company.'],
  ['sec_1_identity', 'company_registration_number', 'Company registration number', 'text', 'Official business registration or tax number.'],
  ['sec_1_identity', 'company_license_number', 'Transport license number', 'text', 'Official transportation operating license.'],
  ['sec_1_identity', 'company_logo', 'Company logo', 'image', 'Primary company or operator logo.'],
  ['sec_1_identity', 'operator_scale', 'Operator scale', 'select', 'Individual operator, local fleet, or transportation company.'],
  ['sec_1_identity', 'service_area', 'Service area', 'textarea', 'Cities, oasis areas and destinations served.'],
  ['sec_1_identity', 'service_model', 'Service model', 'select', 'Scheduled, on-demand, private charter, shared ride or rental.'],
  ['sec_2_ambience', 'travel_style', 'Travel style', 'multiselect', 'Local, private, family, luxury, adventure or shared travel.'],
  ['sec_2_ambience', 'comfort_level', 'Comfort level', 'select', 'Basic, standard, premium or luxury.'],
  ['sec_2_ambience', 'vehicle_types', 'Vehicle types', 'checkbox_group', 'Cars, taxis, buses, 4x4 vehicles, tuk-tuks and rental equipment.'],
  ['sec_2_ambience', 'fleet_size', 'Fleet size', 'number', 'Number of active vehicles or equipment units.'],
  ['sec_2_ambience', 'fleet_availability', 'Fleet availability', 'select', 'Available now, advance booking, seasonal or limited availability.'],
  ['sec_2_ambience', 'vehicle_gallery', 'Vehicle and service gallery', 'gallery', 'Photos of vehicles, equipment and service experience.'],
  ['sec_3_facilities', 'passenger_capacity', 'Passenger capacity', 'number', 'Maximum passengers per vehicle or booking.'],
  ['sec_3_facilities', 'luggage_capacity', 'Luggage capacity', 'text', 'Number or size of bags supported per vehicle.'],
  ['sec_3_facilities', 'vehicle_features', 'Vehicle features', 'multiselect', 'Air conditioning, luggage space, child seats and accessibility.'],
  ['sec_3_facilities', 'accessibility_features', 'Accessibility features', 'multiselect', 'Wheelchair access, step-free entry, priority seating or assistance.'],
  ['sec_3_facilities', 'vehicle_condition', 'Vehicle condition', 'select', 'New, well maintained, standard or utility condition.'],
  ['sec_3_facilities', 'fuel_type', 'Fuel type', 'select', 'Petrol, diesel, electric, hybrid or other.'],
  ['sec_3_facilities', 'child_seats', 'Child seats available', 'boolean', 'Whether approved child seats can be provided.'],
  ['sec_3_facilities', 'equipment_available', 'Equipment available', 'multiselect', 'Safety, navigation, camping and travel equipment.'],
  ['sec_4_gastronomy', 'journey_services', 'Journey services', 'multiselect', 'Transfer, tour, delivery, rental or guided journey.'],
  ['sec_4_gastronomy', 'route_types', 'Route types', 'multiselect', 'Local, intercity, airport, desert, cross-country or guided routes.'],
  ['sec_4_gastronomy', 'pickup_options', 'Pickup options', 'multiselect', 'Hotel, airport, home, station, market or meeting-point pickup.'],
  ['sec_4_gastronomy', 'route_options', 'Route options', 'textarea', 'Common routes, stops and destination options.'],
  ['sec_4_gastronomy', 'included_in_service', 'Included in service', 'textarea', 'Driver, fuel, guide, permits, water or equipment included.'],
  ['sec_5_experiences', 'journey_experiences', 'Journey experiences', 'textarea', 'Scenic routes, safari, heritage and local travel experiences.'],
  ['sec_5_experiences', 'stops_and_activities', 'Stops and activities', 'textarea', 'Optional stops, activities and itinerary details.'],
  ['sec_6_guardian', 'operating_hours', 'Operating hours', 'textarea', 'Availability, pickup times and seasonal schedule.'],
  ['sec_6_guardian', 'safety_and_licenses', 'Safety and licenses', 'rich_text', 'Licenses, insurance, safety procedures and driver standards.'],
  ['sec_6_guardian', 'insurance_provider', 'Insurance provider', 'text', 'Vehicle or company insurance provider.'],
  ['sec_6_guardian', 'insurance_expiry', 'Insurance expiry date', 'date', 'Date the active insurance coverage expires.'],
  ['sec_6_guardian', 'vehicle_inspection_expiry', 'Vehicle inspection expiry', 'date', 'Date the latest vehicle inspection expires.'],
  ['sec_6_guardian', 'driver_requirements', 'Driver requirements', 'multiselect', 'Licensed, experienced, multilingual, trained or female driver available.'],
  ['sec_6_guardian', 'emergency_contact', 'Emergency contact', 'text', '24-hour emergency contact for active journeys.'],
  ['sec_6_guardian', 'booking_policy', 'Booking and cancellation policy', 'rich_text', 'Lead time, cancellation, waiting and no-show rules.'],
  ['sec_7_investment', 'partnership_available', 'Partnership available', 'boolean', 'Whether hotels, tour operators or businesses can partner.'],
  ['sec_7_investment', 'partnership_details', 'Partnership details', 'textarea', 'Fleet expansion, supplier or operator partnership details.'],
  ['sec_8_connector', 'rates_and_packages', 'Rates and packages', 'textarea', 'One-way, return, hourly, daily and group rates.'],
  ['sec_8_connector', 'pricing_model', 'Pricing model', 'multiselect', 'Per trip, per hour, per day, per passenger, per vehicle or package.'],
  ['sec_8_connector', 'base_price', 'Base price', 'number', 'Starting price for the primary service.'],
  ['sec_8_connector', 'price_currency', 'Price currency', 'select', 'Currency used for public rates.'],
  ['sec_8_connector', 'payment_methods', 'Payment methods', 'multiselect', 'Cash, bank transfer, card, mobile wallet or online payment.'],
  ['sec_8_connector', 'booking_contact', 'Booking contact', 'text', 'Phone, WhatsApp, email or booking URL.'],
  ['sec_9_marketplace_catalog', 'fleet_catalog', 'Fleet and equipment catalog', 'gallery', 'Repeatable vehicles or equipment with prices and specifications.'],
  ['sec_9_marketplace_catalog', 'documents_and_maps', 'Documents and route maps', 'text', 'Permits, brochures, route maps or downloadable documents.'],
  ['sec_10_testimonials_faqs', 'reviews', 'Reviews and testimonials', 'rich_text', 'Customer reviews and service ratings.'],
  ['sec_10_testimonials_faqs', 'faqs', 'Frequently asked questions', 'rich_text', 'Pickup, luggage, safety and booking questions.'],
] as const;

const TRANSPORT_OPTIONS: Record<string, string[]> = {
  operator_scale: ['Individual operator', 'Local fleet', 'Transportation company'],
  service_model: ['Scheduled service', 'On-demand', 'Private charter', 'Shared ride', 'Vehicle rental', 'Guided transfer', 'Delivery/logistics'],
  comfort_level: ['Basic', 'Standard', 'Premium', 'Luxury'],
  vehicle_types: ['Car / Taxi', 'Bus / Coach', 'Private Mini-Bus', '4x4 Desert Jeep', 'Local Tuk-Tuk', 'Pickup Truck', 'Bicycle/Scooter Rental', 'Motorbike'],
  fleet_availability: ['Available now', 'Advance booking', 'Seasonal', 'Limited availability'],
  vehicle_features: ['Air conditioning', 'Luggage space', 'Child seats', 'GPS', 'WiFi', 'Safety equipment', 'Spare tire', 'Wheelchair access'],
  accessibility_features: ['Wheelchair access', 'Step-free entry', 'Priority seating', 'Mobility assistance'],
  vehicle_condition: ['New', 'Well maintained', 'Standard', 'Utility condition'],
  fuel_type: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'],
  equipment_available: ['First aid kit', 'Navigation', 'Camping equipment', 'Communication radio', 'Water', 'Safety tools'],
  journey_services: ['Transfer', 'Tour', 'Delivery', 'Vehicle rental', 'Equipment rental', 'Guided journey', 'Airport pickup'],
  route_types: ['Local routes', 'Intercity routes', 'Airport transfers', 'Desert routes', 'Cross-country trips', 'Guided routes'],
  pickup_options: ['Hotel', 'Airport', 'Home', 'Station', 'Market', 'Meeting point'],
  driver_requirements: ['Licensed driver', 'Experienced driver', 'Multilingual driver', 'Female driver available', 'Desert-trained driver'],
  pricing_model: ['Per trip', 'Per hour', 'Per day', 'Per passenger', 'Per vehicle', 'Package rate'],
  price_currency: ['EGP', 'USD', 'EUR'],
  payment_methods: ['Cash', 'Bank transfer', 'Card', 'Mobile wallet', 'Online payment'],
};

const REQUIRED_FIELDS = new Set(['service_name', 'service_description', 'service_area', 'vehicle_types', 'passenger_capacity', 'journey_services', 'operating_hours', 'booking_contact']);

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
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, '{}', ?, 0, ?, 'latest')
     ON DUPLICATE KEY UPDATE label = VALUES(label), field_type = VALUES(field_type), required = VALUES(required), searchable = 1, options = VALUES(options), help_text = VALUES(help_text)`,
    [
      `transport_${typeId}_${name}`,
      typeId,
      sectionId,
      name,
      label,
      fieldType,
      REQUIRED_FIELDS.has(name) ? 1 : 0,
      helpText,
      TRANSPORT_OPTIONS[name] ? JSON.stringify(TRANSPORT_OPTIONS[name]) : null,
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

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

const LOGISTICS_SECTION_IDS = [
  'sec_1_identity',
  'sec_3_facilities',
  'sec_5_experiences',
  'sec_6_guardian',
  'sec_8_connector',
  'sec_9_marketplace_catalog',
  'sec_10_testimonials_faqs',
] as const;

const TRANSPORT_CHILDREN = [
  { id: 'car_taxi', name: 'Car & Taxi Service', icon: 'fas fa-car', color: '#2563eb', order: 6.05 },
  { id: 'bus_minibus', name: 'Bus & Mini-Bus Service', icon: 'fas fa-bus', color: '#0891b2', order: 6.08 },
  { id: 'desert_4x4', name: '4x4 Desert Vehicle Service', icon: 'fas fa-truck-pickup', color: '#b45309', order: 6.09 },
  { id: 'tuk_tuk', name: 'Local Tuk-Tuk Service', icon: 'fas fa-motorcycle', color: '#f59e0b', order: 6.1 },
  { id: 'equipment_rental', name: 'Equipment Rental', icon: 'fas fa-tools', color: '#2c3e50', order: 6.2 },
  { id: 'private_transfer', name: 'Private Transfer', icon: 'fas fa-car', color: '#2563eb', order: 6.3 },
  { id: 'desert_transfer', name: 'Desert Transfer', icon: 'fas fa-truck-pickup', color: '#b45309', order: 6.4 },
  { id: 'boat_transport', name: 'Boat & Water Transport', icon: 'fas fa-ship', color: '#0e7490', order: 6.5 },
  { id: 'freight_delivery', name: 'Freight & Delivery', icon: 'fas fa-truck', color: '#475569', order: 6.6 },
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
  ['sec_3_facilities', 'travel_style', 'Travel style', 'multiselect', 'Local, private, family, luxury, adventure or shared travel.'],
  ['sec_3_facilities', 'comfort_level', 'Comfort level', 'select', 'Basic, standard, premium or luxury.'],
  ['sec_3_facilities', 'vehicle_types', 'Vehicle types', 'checkbox_group', 'Cars, taxis, buses, 4x4 vehicles, tuk-tuks and rental equipment.'],
  ['sec_3_facilities', 'fleet_size', 'Fleet size', 'number', 'Number of active vehicles or equipment units.'],
  ['sec_6_guardian', 'fleet_availability', 'Fleet availability', 'select', 'Available now, advance booking, seasonal or limited availability.'],
  ['sec_9_marketplace_catalog', 'vehicle_gallery', 'Vehicle and service gallery', 'gallery', 'Photos of vehicles, equipment and service experience.'],
  ['sec_3_facilities', 'passenger_capacity', 'Passenger capacity', 'number', 'Maximum passengers per vehicle or booking.'],
  ['sec_3_facilities', 'luggage_capacity', 'Luggage capacity', 'text', 'Number or size of bags supported per vehicle.'],
  ['sec_3_facilities', 'vehicle_features', 'Vehicle features', 'multiselect', 'Air conditioning, luggage space, child seats and accessibility.'],
  ['sec_3_facilities', 'accessibility_features', 'Accessibility features', 'multiselect', 'Wheelchair access, step-free entry, priority seating or assistance.'],
  ['sec_3_facilities', 'vehicle_condition', 'Vehicle condition', 'select', 'New, well maintained, standard or utility condition.'],
  ['sec_3_facilities', 'fuel_type', 'Fuel type', 'select', 'Petrol, diesel, electric, hybrid or other.'],
  ['sec_3_facilities', 'child_seats', 'Child seats available', 'boolean', 'Whether approved child seats can be provided.'],
  ['sec_3_facilities', 'equipment_available', 'Equipment available', 'multiselect', 'Safety, navigation, camping and travel equipment.'],
  ['sec_5_experiences', 'journey_services', 'Journey services', 'multiselect', 'Transfer, tour, delivery, rental or guided journey.'],
  ['sec_5_experiences', 'route_types', 'Route types', 'multiselect', 'Local, intercity, airport, desert, cross-country or guided routes.'],
  ['sec_5_experiences', 'pickup_options', 'Pickup options', 'multiselect', 'Hotel, airport, home, station, market or meeting-point pickup.'],
  ['sec_5_experiences', 'route_options', 'Route options', 'textarea', 'Common routes, stops and destination options.'],
  ['sec_5_experiences', 'included_in_service', 'Included in service', 'textarea', 'Driver, fuel, guide, permits, water or equipment included.'],
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
  vehicle_types: ['Car / Taxi', 'Bus / Coach', 'Private Mini-Bus', '4x4 Desert Jeep', 'Local Tuk-Tuk', 'Pickup Truck', 'Motorbike', 'Bicycle / Scooter', 'Boat / Watercraft', 'Freight / Delivery'],
  fleet_availability: ['Available now', 'Advance booking', 'Seasonal', 'Limited availability'],
  vehicle_features: ['Air conditioning', 'Luggage space', 'Child seats', 'GPS', 'WiFi', 'Safety equipment', 'Spare tire', 'Wheelchair access'],
  accessibility_features: ['Wheelchair access', 'Step-free entry', 'Priority seating', 'Mobility assistance'],
  vehicle_condition: ['New', 'Well maintained', 'Standard', 'Utility condition'],
  fuel_type: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'],
  equipment_available: ['First aid kit', 'Navigation', 'Camping equipment', 'Communication radio', 'Water', 'Safety tools'],
  journey_services: ['Transfer', 'Tour', 'Delivery', 'Vehicle rental', 'Equipment rental', 'Guided journey', 'Airport pickup', 'Boat transport', 'Freight delivery'],
  route_types: ['Local routes', 'Intercity routes', 'Airport transfers', 'Desert routes', 'Water routes', 'Delivery routes', 'Cross-country trips', 'Guided routes'],
  pickup_options: ['Hotel', 'Airport', 'Home', 'Station', 'Market', 'Port', 'Meeting point'],
  driver_requirements: ['Licensed driver', 'Experienced driver', 'Multilingual driver', 'Female driver available', 'Desert-trained driver'],
  pricing_model: ['Per trip', 'Per hour', 'Per day', 'Per passenger', 'Per vehicle', 'Package rate'],
  price_currency: ['EGP', 'USD', 'EUR'],
  payment_methods: ['Cash', 'Bank transfer', 'Card', 'Mobile wallet', 'Online payment'],
  vessel_type: ['Motorboat', 'Sailboat', 'Felucca', 'Ferry', 'Other'],
  vessel_safety_equipment: ['Life jackets', 'First aid kit', 'Fire extinguisher', 'Radio', 'Emergency beacon'],
  freight_vehicle_class: ['Van', 'Pickup truck', 'Light truck', 'Heavy truck', 'Motorcycle courier', 'Other'],
  freight_cargo_types: ['General goods', 'Food', 'Fragile goods', 'Refrigerated goods', 'Documents', 'Equipment'],
};

const REQUIRED_FIELDS = new Set(['service_name', 'service_description', 'service_area', 'vehicle_types', 'passenger_capacity', 'journey_services', 'operating_hours', 'booking_contact']);

const CHILD_FIELDS: Record<string, Array<[string, string, string, string, string]>> = {
  car_taxi: [
    ['sec_3_facilities', 'vehicle_make', 'Vehicle make', 'text', 'Manufacturer or make of the taxi or car.'],
    ['sec_3_facilities', 'vehicle_model', 'Vehicle model', 'text', 'Model or trim of the taxi or car.'],
    ['sec_3_facilities', 'vehicle_model_year', 'Vehicle model year', 'number', 'Manufacture or model year.'],
    ['sec_3_facilities', 'vehicle_seats', 'Passenger seats', 'number', 'Passenger seats available, excluding the driver.'],
    ['sec_3_facilities', 'vehicle_luggage_capacity', 'Luggage capacity', 'text', 'Number or size of bags supported.'],
  ],
  bus_minibus: [
    ['sec_3_facilities', 'vehicle_make', 'Vehicle make', 'text', 'Manufacturer or make of the bus or minibus.'],
    ['sec_3_facilities', 'vehicle_model', 'Vehicle model', 'text', 'Model or trim of the bus or minibus.'],
    ['sec_3_facilities', 'vehicle_model_year', 'Vehicle model year', 'number', 'Manufacture or model year.'],
    ['sec_3_facilities', 'vehicle_seats', 'Passenger seats', 'number', 'Passenger seats available, excluding the driver.'],
    ['sec_3_facilities', 'vehicle_luggage_capacity', 'Luggage capacity', 'text', 'Number or size of bags supported.'],
  ],
  desert_4x4: [
    ['sec_3_facilities', 'vehicle_make', 'Vehicle make', 'text', 'Manufacturer or make of the 4x4 vehicle.'],
    ['sec_3_facilities', 'vehicle_model', 'Vehicle model', 'text', 'Model or trim of the 4x4 vehicle.'],
    ['sec_3_facilities', 'vehicle_model_year', 'Vehicle model year', 'number', 'Manufacture or model year.'],
    ['sec_3_facilities', 'vehicle_seats', 'Passenger seats', 'number', 'Passenger seats available, excluding the driver.'],
    ['sec_3_facilities', 'vehicle_luggage_capacity', 'Luggage capacity', 'text', 'Number or size of bags supported.'],
    ['sec_6_guardian', 'desert_safety_protocol', 'Desert safety protocol', 'rich_text', 'Convoy, emergency, communications, and weather procedures.'],
  ],
  tuk_tuk: [
    ['sec_3_facilities', 'tuk_tuk_capacity', 'Tuk-tuk seating capacity', 'number', 'Number of passengers per tuk-tuk.'],
    ['sec_5_experiences', 'local_route_services', 'Local route services', 'multiselect', 'Market, village, spring and short-distance routes.'],
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
  boat_transport: [
    ['sec_3_facilities', 'vessel_type', 'Vessel type', 'select', 'Type of boat or vessel.'],
    ['sec_3_facilities', 'vessel_make', 'Vessel make', 'text', 'Manufacturer or builder of the vessel.'],
    ['sec_3_facilities', 'vessel_model', 'Vessel model', 'text', 'Model or vessel name.'],
    ['sec_3_facilities', 'vessel_model_year', 'Vessel model year', 'number', 'Manufacture or model year.'],
    ['sec_3_facilities', 'vessel_passenger_capacity', 'Passenger capacity', 'number', 'Maximum permitted passengers.'],
    ['sec_5_experiences', 'water_routes', 'Water routes', 'textarea', 'Waterways, destinations, and operating areas served.'],
    ['sec_6_guardian', 'vessel_safety_equipment', 'Safety equipment', 'multiselect', 'Safety equipment available onboard.'],
    ['sec_6_guardian', 'vessel_license_permits', 'Vessel license and permits', 'textarea', 'License, inspection, and operating permit details.'],
  ],
  freight_delivery: [
    ['sec_3_facilities', 'freight_vehicle_class', 'Freight vehicle class', 'select', 'Vehicle or carrier class.'],
    ['sec_3_facilities', 'freight_load_capacity', 'Load capacity', 'text', 'Maximum load by weight or volume.'],
    ['sec_5_experiences', 'freight_cargo_types', 'Cargo types', 'multiselect', 'Types of goods accepted.'],
    ['sec_5_experiences', 'freight_delivery_area', 'Delivery area', 'textarea', 'Locations and distance covered for delivery.'],
    ['sec_6_guardian', 'freight_temperature_control', 'Temperature-controlled transport', 'boolean', 'Whether refrigerated or temperature-controlled transport is available.'],
  ],
};

async function ensureFormFieldVersionColumn() {
  const columns = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'form_fields' AND COLUMN_NAME = 'version_type'`
  );
  if (columns.length === 0) {
    await execute("ALTER TABLE form_fields ADD COLUMN version_type ENUM('initial', 'latest') DEFAULT 'latest'");
  }
}

async function ensureType(child: typeof TRANSPORT_CHILDREN[number]) {
  await execute(
    `INSERT IGNORE INTO business_types
      (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
     VALUES (?, ?, ?, ?, 0, 'logistics', ?, '[]', 1, ?)`,
    [child.id, child.name, child.icon, child.color, JSON.stringify(LOGISTICS_SECTION_IDS), child.order]
  );
  await execute(
    'UPDATE business_types SET parent_id = ?, sections = ?, active = 1 WHERE id = ?',
    ['logistics', JSON.stringify(LOGISTICS_SECTION_IDS), child.id]
  );
}

async function ensureField(typeId: string, field: readonly [string, string, string, string, string]) {
  const [sectionId, name, label, fieldType, helpText] = field;
  await execute(
    `INSERT IGNORE INTO form_fields
      (id, business_type_id, section_id, name, label, field_type, required, vendor_editable,
       searchable, help_text, options, validation, acl, sort_order, section_origin, version_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, '{}', ?, 0, ?, 'latest')
     ON DUPLICATE KEY UPDATE section_id = VALUES(section_id), label = VALUES(label), field_type = VALUES(field_type), required = VALUES(required), searchable = 1, options = VALUES(options), help_text = VALUES(help_text)`,
    [
      `tr_${createHash('md5').update(`${typeId}:${name}`).digest('hex').slice(0, 32)}`,
      typeId,
      sectionId,
      name,
      label,
      fieldType,
      REQUIRED_FIELDS.has(name) ? 1 : 0,
      helpText,
      TRANSPORT_OPTIONS[name] ? JSON.stringify(TRANSPORT_OPTIONS[name]) : null,
      JSON.stringify({ read: ['super_admin', 'content_admin', 'vendor', 'public'], write: ['super_admin', 'content_admin', 'vendor'] }),
      'own',
    ]
  );
}

export async function POST() {
  try {
    await requireAdmin();
    await ensureFormFieldVersionColumn();
    await execute(
      `INSERT IGNORE INTO business_types
        (id, name, icon, icon_color, is_parent, parent_id, sections, own_sections, active, sort_order)
       VALUES ('logistics', 'Logistics & Transportation', 'fas fa-truck-moving', '#2c3e50', 1, NULL, ?, '[]', 1, 6)`,
      [JSON.stringify(LOGISTICS_SECTION_IDS)]
    );
    await execute('UPDATE business_types SET sections = ?, active = 1 WHERE id = ?', [JSON.stringify(LOGISTICS_SECTION_IDS), 'logistics']);

    for (const [index, sectionId] of LOGISTICS_SECTION_IDS.entries()) {
      const section = await queryOne('SELECT id FROM sections WHERE id = ?', [sectionId]);
      if (!section) {
        await execute(
          'INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) VALUES (?, ?, ?, 0, 1, 1, 0, ?, 1)',
          [sectionId, sectionId.replace(/^sec_\d+_/, '').replace(/_/g, ' '), 'fa-layer-group', index + 1]
        );
      }
    }

    for (const field of COMMON_FIELDS) await ensureField('logistics', field);
    for (const child of TRANSPORT_CHILDREN) {
      await ensureType(child);
      for (const field of CHILD_FIELDS[child.id] || []) await ensureField(child.id, field);
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
      sections: LOGISTICS_SECTION_IDS,
    });
  } catch (error: unknown) {
    console.error('[TRANSPORT SEED ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to seed transportation blueprint';
    const status = /not authenticated/i.test(message) ? 401 : /admin access required/i.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

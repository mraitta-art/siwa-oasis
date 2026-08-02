const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const makeFieldId = (sectionId, fieldName) => 
  crypto.createHash('md5').update(`${sectionId}::${fieldName}`).digest('hex').substring(0, 24);

const JOURNEY_SECTIONS = [
  {
    id: 'room_types',
    name: 'Room Types & Lodging Details',
    icon: 'fa-bed',
    description: 'Lodging specifications, unit types, prices, and room amenities for travel accommodation plans.'
  },
  {
    id: 'menu',
    name: 'Dining & Culinary Offerings',
    icon: 'fa-utensils',
    description: 'Cuisine styles, average cost per cover, dietary rules, and reservations for journey planning.'
  },
  {
    id: 'transportation',
    name: 'Transport, Shuttles & Logistics',
    icon: 'fa-car-side',
    description: 'Transfer routes (Cairo/Alexandria), capacity, rates, and vehicles for journey itinerary planning.'
  },
  {
    id: 'activities',
    name: 'Tours, Activities & Adventures',
    icon: 'fa-mountain',
    description: 'Guided excursions, stargazing sessions, sandboarding, rates, group limits, and equipment.'
  }
];

const FIELDS_SPEC = {
  // 🏨 ACCOMMODATION
  room_types: [
    { name: 'room_types_list', label: 'Unit / Room Options', field_type: 'multiselect', required: 1, sort_order: 1, options: ['Standard Room', 'Eco-Lodge Dome', 'Luxury Tent', 'Glamping Pod', 'Family Suite', 'Private Villa'] },
    { name: 'base_price_usd', label: 'Base Rate Per Night (USD)', field_type: 'text', required: 1, sort_order: 2, help: 'Minimum starting price for booking.' },
    { name: 'max_capacity', label: 'Maximum Guest Capacity', field_type: 'text', required: 0, sort_order: 3, help: 'Total capacity of the property.' },
    { name: 'lodging_amenities', label: 'Key Amenities', field_type: 'multiselect', required: 0, sort_order: 4, options: ['Hot Springs Pool', 'Free High-Speed WiFi', 'Air Conditioning', 'Organic Breakfast Included', 'Dune views'] }
  ],
  // 🍽️ RESTAURANT / DINING
  menu: [
    { name: 'cuisine_types', label: 'Cuisines Served', field_type: 'multiselect', required: 1, sort_order: 1, options: ['Traditional Siwan', 'Bedouin Campfire Grill', 'Egyptian Classic', 'Organic Farm-to-Table', 'International'] },
    { name: 'avg_price_per_person', label: 'Average Price per Person (USD)', field_type: 'text', required: 1, sort_order: 2, help: 'Average cost of a standard meal.' },
    { name: 'sunset_dining', label: 'Sunset & Outdoor Seating', field_type: 'boolean', required: 0, sort_order: 3, help: 'Check if you offer sunset-view seating.' },
    { name: 'dietary_considerations', label: 'Dietary Options', field_type: 'multiselect', required: 0, sort_order: 4, options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal Only'] }
  ],
  // 🚗 LOGISTICS & TRANSPORT
  transportation: [
    { name: 'transfer_routes', label: 'Supported Transport Routes', field_type: 'multiselect', required: 1, sort_order: 1, options: ['Cairo ⇆ Siwa Transfer', 'Alexandria ⇆ Siwa Transfer', 'Matrouh ⇆ Siwa Transfer', 'Local Siwa Sightseeing Driver'] },
    { name: 'vehicle_types', label: 'Available Vehicles', field_type: 'multiselect', required: 1, sort_order: 2, options: ['4x4 Desert Jeep', 'Cozy Sedan', '14-Seater Mini-Bus', 'Traditional Donkey Cart'] },
    { name: 'transfer_rate_usd', label: 'Starting Rate (USD)', field_type: 'text', required: 1, sort_order: 3, help: 'Base price per trip or day.' },
    { name: 'driver_languages', label: 'Driver Languages Spoken', field_type: 'multiselect', required: 0, sort_order: 4, options: ['Arabic', 'English', 'French', 'Italian'] }
  ],
  // 🧭 ADVENTURE & ACTIVITIES
  activities: [
    { name: 'activity_duration', label: 'Average Excursion Duration', field_type: 'select', required: 1, sort_order: 1, options: ['1-2 Hours', 'Half-Day (4h)', 'Full-Day (8h)', 'Overnight Campout'] },
    { name: 'starting_rate_pax', label: 'Rate Per Guest (USD)', field_type: 'text', required: 1, sort_order: 2, help: 'Price starting from per person.' },
    { name: 'difficulty_rating', label: 'Physical Demand', field_type: 'select', required: 0, sort_order: 3, options: ['Easy (all ages)', 'Moderate', 'Strenuous'] },
    { name: 'gear_provided', label: 'Equipment Included', field_type: 'multiselect', required: 0, sort_order: 4, options: ['None', 'Sandboards', 'Guided Astronomy Telescopes', 'Camping Tents & Bedding'] }
  ]
};

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud') ? { rejectUnauthorized: false } : undefined
  });

  console.log("Connected to DB. Creating Journey Blocks and Forms...");

  // 1. Create or update sections
  for (const sec of JOURNEY_SECTIONS) {
    const [exists] = await connection.query('SELECT id FROM sections WHERE id = ?', [sec.id]);
    if (exists.length === 0) {
      await connection.query(
        `INSERT INTO sections (id, name, icon, description, is_universal, active, sort_order) 
         VALUES (?, ?, ?, ?, 0, 1, 80)`,
        [sec.id, sec.name, sec.icon, sec.description]
      );
      console.log(`+ Created Section: ${sec.name} (${sec.id})`);
    } else {
      await connection.query(
        `UPDATE sections SET name = ?, icon = ?, description = ? WHERE id = ?`,
        [sec.name, sec.icon, sec.description, sec.id]
      );
      console.log(`~ Updated Section: ${sec.name} (${sec.id})`);
    }
  }

  // 2. Create fields for sections
  for (const [sectionId, fields] of Object.entries(FIELDS_SPEC)) {
    for (const f of fields) {
      const fieldId = makeFieldId(sectionId, f.name);
      const [exists] = await connection.query('SELECT id FROM form_fields WHERE id = ?', [fieldId]);
      const optionsStr = f.options ? JSON.stringify(f.options) : null;
      const aclJson = JSON.stringify({
        read: ['super_admin', 'content_admin', 'vendor', 'public'],
        write: ['super_admin', 'content_admin', 'vendor']
      });

      if (exists.length === 0) {
        await connection.query(
          `INSERT INTO form_fields 
           (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, sort_order, help_text, options, section_origin, acl)
           VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, 'template', ?)`,
          [fieldId, sectionId, f.name, f.label, f.field_type, f.required, f.sort_order, f.help || null, optionsStr, aclJson]
        );
        console.log(`  + Created Field: ${f.name} in ${sectionId}`);
      } else {
        await connection.query(
          `UPDATE form_fields SET 
             label = ?, field_type = ?, required = ?, sort_order = ?, help_text = ?, options = ?
           WHERE id = ?`,
          [f.label, f.field_type, f.required, f.sort_order, f.help || null, optionsStr, fieldId]
        );
        console.log(`  ~ Updated Field: ${f.name} in ${sectionId}`);
      }
    }
  }

  await connection.end();
  console.log("Database migrations for journey form-builder sections finished successfully!");
}

main().catch(console.error);

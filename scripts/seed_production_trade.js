const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const makeFieldId = (sectionId, fieldName) => 
  crypto.createHash('md5').update(`${sectionId}::${fieldName}`).digest('hex').substring(0, 24);

const NEW_SECTIONS = [
  {
    id: 'wholesale_specs',
    name: 'Wholesale & Production Specifications',
    icon: 'fa-industry',
    description: 'Industrial capacity, export permissions, minimum order quantities (MOQ), and certifications for factories and processing plants.'
  },
  {
    id: 'product_trade_catalog',
    name: 'Product Trade & Commercial Catalog',
    icon: 'fa-boxes-packing',
    description: 'Final consumer products list, retail pricing, packaging options, and trading availability.'
  }
];

const FIELDS_SPEC = {
  // 🏭 PRODUCTION, AGRICULTURE & PROCESSING
  wholesale_specs: [
    { name: 'production_capacity', label: 'Production Capacity', field_type: 'text', required: 1, sort_order: 1, help: 'e.g. 10 Tons/Day or 5,000 Bottles/Hour.' },
    { name: 'moq', label: 'Minimum Order Quantity (MOQ)', field_type: 'text', required: 1, sort_order: 2, help: 'Minimum volume required for a wholesale order.' },
    { name: 'export_capabilities', label: 'International Export Registered', field_type: 'boolean', required: 0, sort_order: 3, help: 'Check if you have licenses to ship globally.' },
    { name: 'certifications', label: 'Industrial Certifications', field_type: 'multiselect', required: 0, sort_order: 4, options: ['ISO 22000 (Food Safety)', 'Organic Certified (COAE)', 'FDA Registered', 'Halal Certified', 'UNESCO Heritage Product'] },
    { name: 'raw_materials_origin', label: 'Raw Materials Origin', field_type: 'select', required: 0, sort_order: 5, options: ['100% Siwa Oasis Origin', 'Mixed Egyptian Origin', 'Imported Raw Materials'] }
  ],
  // 📦 WHOLESALE & RETAIL PRODUCT TRADE
  product_trade_catalog: [
    { name: 'trade_products_list', label: 'Key Trade Products Available', field_type: 'multiselect', required: 1, sort_order: 1, options: ['Siwa Dates (Premium Premium)', 'Extra Virgin Olive Oil', 'Mineral Bottled Water', 'Medicinal & Culinary Herbs', 'Refined Table Salt', 'Traditional Handicrafts'] },
    { name: 'retail_price_range', label: 'Retail Price Range', field_type: 'select', required: 0, sort_order: 2, options: ['Budget-Friendly', 'Standard / Competitive', 'Premium / Artisanal'] },
    { name: 'shipping_options', label: 'Domestic & Global Shipping', field_type: 'multiselect', required: 0, sort_order: 3, options: ['Local Pickup Only', 'Domestic Cargo Shipping', 'International Courier Shipping'] },
    { name: 'packaging_types', label: 'Standard Product Packaging', field_type: 'multiselect', required: 0, sort_order: 4, options: ['Eco-Friendly Glass Jars', 'Vacuum Sealed Bags', 'Bulk Wooden Cartons', 'Retail Cardboard Boxes'] }
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

  console.log("Connected to DB. Seeding Production/Agriculture and Trade sections...");

  // 1. Create or update sections
  for (const sec of NEW_SECTIONS) {
    const [exists] = await connection.query('SELECT id FROM sections WHERE id = ?', [sec.id]);
    if (exists.length === 0) {
      await connection.query(
        `INSERT INTO sections (id, name, icon, description, is_universal, active, sort_order) 
         VALUES (?, ?, ?, ?, 0, 1, 85)`,
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
  console.log("Production & Trade sections seeded successfully!");
}

main().catch(console.error);

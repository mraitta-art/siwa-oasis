import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to load env and run seed
async function runSeed(config, label) {
  console.log(`\n🔷 Seeding basic fields on ${label}...`);
  const pool = mysql.createPool({
    ...config,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    // 1. Fetch business typologies & locations for options
    const [types] = await pool.query('SELECT name FROM business_types WHERE parent_id IS NOT NULL ORDER BY name');
    const typeOptions = types.map((t) => t.name);

    const [locs] = await pool.query('SELECT name FROM locations ORDER BY name');
    const locOptions = locs.map((l) => l.name);

    // 2. Define the basic fields
    const fields = [
      // Main Common
      {
        id: 'basic_display_name',
        name: 'display_name',
        label: 'Official Business Name',
        field_type: 'text',
        placeholder: 'main_common',
        required: 1,
        sort_order: 1,
        help_text: 'The primary brand or name of the business.',
        options: null,
      },
      {
        id: 'basic_business_type',
        name: 'business_type',
        label: 'Business Typology',
        field_type: 'select',
        placeholder: 'main_common',
        required: 1,
        sort_order: 2,
        help_text: 'Choose the matching business archetype.',
        options: typeOptions.length > 0 ? typeOptions : ['Hotel', 'Restaurant', 'Eco Lodge', 'Cafe', 'Tour Guide'],
      },
      {
        id: 'basic_location_area',
        name: 'location_area',
        label: 'Location / Area',
        field_type: 'select',
        placeholder: 'main_common',
        required: 1,
        sort_order: 3,
        help_text: 'Choose the area of Siwa where the business is located.',
        options: locOptions.length > 0 ? locOptions : ['Shali Town', 'Dakrour Mountain', 'Fatnas Island', 'Salt Lakes', 'Oasis Center'],
      },
      {
        id: 'basic_description',
        name: 'description',
        label: 'Business Description',
        field_type: 'textarea',
        placeholder: 'main_common',
        required: 0,
        sort_order: 4,
        help_text: 'Provide a rich overview or teaser of what your business offers.',
        options: null,
      },
      {
        id: 'basic_logo',
        name: 'logo',
        label: 'Business Logo',
        field_type: 'gallery',
        placeholder: 'main_common',
        required: 0,
        sort_order: 5,
        help_text: 'Upload a branding logo for results listing and headers.',
        options: null,
      },
      // Secondary
      {
        id: 'basic_phone_number',
        name: 'phone_number',
        label: 'Primary Phone Number',
        field_type: 'phone',
        placeholder: 'secondary',
        required: 0,
        sort_order: 6,
        help_text: 'For direct calls and WhatsApp contacts.',
        options: null,
      },
      {
        id: 'basic_email_address',
        name: 'email_address',
        label: 'Email Address',
        field_type: 'email',
        placeholder: 'secondary',
        required: 0,
        sort_order: 7,
        help_text: 'Standard contact email for leads.',
        options: null,
      },
      {
        id: 'basic_website_url',
        name: 'website_url',
        label: 'Website URL',
        field_type: 'url',
        placeholder: 'secondary',
        required: 0,
        sort_order: 8,
        help_text: 'Link to official external website.',
        options: null,
      },
      {
        id: 'basic_instagram',
        name: 'instagram',
        label: 'Instagram Page Link',
        field_type: 'url',
        placeholder: 'secondary',
        required: 0,
        sort_order: 9,
        help_text: 'Link to official Instagram profile.',
        options: null,
      },
      {
        id: 'basic_facebook',
        name: 'facebook',
        label: 'Facebook Page Link',
        field_type: 'url',
        placeholder: 'secondary',
        required: 0,
        sort_order: 10,
        help_text: 'Link to official Facebook page.',
        options: null,
      },
    ];

    // 3. Insert/Replace fields
    let inserted = 0;
    for (const f of fields) {
      await pool.query(
        `INSERT INTO form_fields 
        (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, options, placeholder, sort_order, section_origin)
        VALUES (?, 'SECTION_TEMPLATE', 'basic', ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, 'template')
        ON DUPLICATE KEY UPDATE 
          label = VALUES(label),
          field_type = VALUES(field_type),
          required = VALUES(required),
          help_text = VALUES(help_text),
          options = VALUES(options),
          placeholder = VALUES(placeholder),
          sort_order = VALUES(sort_order)`,
        [
          f.id,
          f.name,
          f.label,
          f.field_type,
          f.required,
          f.help_text,
          f.options ? JSON.stringify(f.options) : null,
          f.placeholder,
          f.sort_order,
        ]
      );
      inserted++;
    }
    console.log(`  ✅ ${inserted} fields seeded/updated successfully!`);
  } catch (err) {
    console.error(`  ❌ Failed on ${label}:`, err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  // 1. LOCAL
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
  const localConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'siwa_oasis',
  };
  await runSeed(localConfig, 'LOCAL');

  // 2. PROD
  const prodConfig = {
    host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3iv5fPeLo2ze3jn.root',
    password: 'Dj2teUVtQyMYghF3',
    database: 'siwa_oasis',
    ssl: { rejectUnauthorized: false },
  };
  await runSeed(prodConfig, 'PRODUCTION');
}

main().catch(console.error);

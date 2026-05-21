const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'siwa_oasis'
  });

  console.log('🚀 Starting Offers & Packages Governance Migration...');

  try {
    // 0. Fix Schema for form_fields if needed
    console.log('🔧 Verifying form_fields schema...');
    try {
      await connection.execute('ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50) NOT NULL AFTER label');
      await connection.execute('ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS placeholder VARCHAR(255) AFTER field_type');
    } catch (e) {
      // Some versions of MySQL/MariaDB might not support ADD COLUMN IF NOT EXISTS
      console.log('Note: Schema update skipped or already applied.');
    }

    // 1. Create the Universal Section: 'offers_packages'
    const sectionId = 'offers_packages';
    await connection.execute(`
      INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, section_type, description, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon)
    `, [
      sectionId, 
      'Offers & Packages', 
      'fa-tags', 
      0, // not required
      1, // vendor editable
      1, // show on public
      1, // is universal
      'collection', 
      'Promote special discounts, seasonal packages, and exclusive deals.',
      90 // near the end
    ]);

    console.log('✅ Section "offers_packages" created.');

    // 2. Define the Form Fields for this section
    const fields = [
      { id: 'offer_title', label: 'Package Title', type: 'text', placeholder: 'e.g. Summer Desert Safari Package' },
      { id: 'offer_price', label: 'Offer Price (EGP)', type: 'number', placeholder: 'e.g. 2500' },
      { id: 'offer_discount', label: 'Discount %', type: 'number', placeholder: 'e.g. 20' },
      { id: 'offer_description', label: 'Short Description', type: 'textarea', placeholder: 'What is included in this package?' },
      { id: 'offer_inclusions', label: 'Inclusions', type: 'tags', placeholder: 'Safari, Dinner, Transport' },
      { id: 'offer_expiry', label: 'Valid Until', type: 'date', placeholder: '' },
      { id: 'offer_cta_link', label: 'Direct Booking Link (Optional)', type: 'url', placeholder: 'https://...' },
      { id: 'offer_image', label: 'Package Image', type: 'image', placeholder: '' }
    ];

    // Fetch all business types
    const [businessTypes] = await connection.execute('SELECT id FROM business_types');

    for (const bt of businessTypes) {
      for (const field of fields) {
        // use a unique ID for each business type's field
        const fieldId = `${bt.id}_${sectionId}_${field.id}`;
        await connection.execute(`
          INSERT INTO form_fields (id, business_type_id, section_id, name, label, field_type, placeholder, required)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE label=VALUES(label), field_type=VALUES(field_type)
        `, [
          fieldId,
          bt.id,
          sectionId,
          field.id, // using field.id as 'name'
          field.label,
          field.type, // wait, field_type is type
          field.placeholder,
          0
        ]);
      }
    }

    console.log(`✅ ${fields.length} form fields added to "offers_packages".`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
    console.log('🏁 Migration complete.');
  }
}

migrate();

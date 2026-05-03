/**
 * Check and Create Factory Fields
 * This script verifies factory fields exist and creates them if missing
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

async function checkAndCreateFactoryFields() {
  console.log('🔍 Checking Factory Fields...\n');
  console.log('='.repeat(80));

  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'siwa_oasis',
    });

    console.log('✅ Connected to database\n');

    // 1. Check if FACTORY business type exists
    console.log('1️⃣  Checking FACTORY business type...');
    const [types] = await connection.query(
      "SELECT id, name, is_parent FROM business_types WHERE id = 'FACTORY'"
    );
    
    if (types.length === 0) {
      console.log('   ❌ FACTORY type not found! Creating it...');
      await connection.execute(
        `INSERT INTO business_types (id, name, icon, icon_color, is_parent, parent_id, sections, sort_order) 
         VALUES ('FACTORY', 'Component Laboratory', 'fa-microchip', '#ef4444', TRUE, NULL, '[]', 100)`,
      );
      console.log('   ✅ Created FACTORY business type\n');
    } else {
      console.log(`   ✅ FACTORY exists: ${types[0].name}\n`);
    }

    // 2. Check if FACTORY section exists
    console.log('2️⃣  Checking FACTORY section...');
    const [sections] = await connection.query(
      "SELECT id, name FROM sections WHERE id = 'FACTORY'"
    );
    
    if (sections.length === 0) {
      console.log('   ❌ FACTORY section not found! Creating it...');
      await connection.execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_filterable, show_on_card, is_universal, sort_order) 
         VALUES ('FACTORY', 'Master Components', 'fa-cubes', FALSE, TRUE, FALSE, FALSE, FALSE, TRUE, 999)`,
      );
      console.log('   ✅ Created FACTORY section\n');
    } else {
      console.log(`   ✅ FACTORY section exists: ${sections[0].name}\n`);
    }

    // 3. Check existing factory fields
    console.log('3️⃣  Checking factory fields...');
    const [factoryFields] = await connection.query(
      "SELECT id, name, label, field_type FROM form_fields WHERE business_type_id = 'FACTORY' OR section_id = 'FACTORY'"
    );
    
    console.log(`   Found ${factoryFields.length} factory fields\n`);
    
    if (factoryFields.length > 0) {
      console.log('   Existing factory fields:');
      factoryFields.forEach(f => {
        console.log(`   • ${f.label} (${f.field_type})`);
      });
      console.log('\n');
    }

    // 4. Create example factory fields if none exist
    if (factoryFields.length === 0) {
      console.log('4️⃣  Creating example factory fields...\n');
      
      const factoryFieldsToCreate = [
        {
          id: 'factory_text_basic',
          name: 'text_basic',
          label: 'Basic Text Input',
          field_type: 'text',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: true,
          help_text: 'A reusable text input component',
          sort_order: 1
        },
        {
          id: 'factory_textarea_description',
          name: 'textarea_description',
          label: 'Description Textarea',
          field_type: 'textarea',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: false,
          searchable: true,
          help_text: 'A reusable long text component for descriptions',
          sort_order: 2
        },
        {
          id: 'factory_number_price',
          name: 'number_price',
          label: 'Price/Rate Number',
          field_type: 'number',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: true,
          help_text: 'A reusable number input for prices or rates',
          sort_order: 3
        },
        {
          id: 'factory_select_category',
          name: 'select_category',
          label: 'Category Dropdown',
          field_type: 'select',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: true,
          options: JSON.stringify(['Option 1', 'Option 2', 'Option 3']),
          help_text: 'A reusable dropdown selector',
          sort_order: 4
        },
        {
          id: 'factory_checkbox_boolean',
          name: 'checkbox_boolean',
          label: 'Boolean Toggle',
          field_type: 'checkbox',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: true,
          help_text: 'A reusable yes/no toggle',
          sort_order: 5
        },
        {
          id: 'factory_date_picker',
          name: 'date_picker',
          label: 'Date Picker',
          field_type: 'date',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: true,
          help_text: 'A reusable date/time selector',
          sort_order: 6
        },
        {
          id: 'factory_file_upload',
          name: 'file_upload',
          label: 'File Uploader',
          field_type: 'file_upload',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: false,
          searchable: false,
          help_text: 'A reusable file/document uploader',
          sort_order: 7
        },
        {
          id: 'factory_gallery_images',
          name: 'gallery_images',
          label: 'Image Gallery',
          field_type: 'gallery',
          section_id: 'FACTORY',
          business_type_id: 'FACTORY',
          required: false,
          vendor_editable: true,
          sortable: true,
          searchable: false,
          help_text: 'A reusable photo gallery component',
          sort_order: 8
        }
      ];

      for (const field of factoryFieldsToCreate) {
        try {
          await connection.execute(
            `INSERT INTO form_fields 
             (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, 
              sortable, searchable, help_text, options, validation, acl, default_value, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', '{"read":["super_admin","content_admin","vendor","public"],"write":["super_admin","content_admin","vendor"]}', NULL, ?)`,
            [
              field.id,
              field.business_type_id,
              field.section_id,
              field.name,
              field.label,
              field.field_type,
              field.required,
              field.vendor_editable,
              field.sortable,
              field.searchable,
              field.help_text,
              field.options || null,
              field.sort_order
            ]
          );
          console.log(`   ✅ Created: ${field.label}`);
        } catch (e) {
          console.log(`   ⚠️  Skipped (may exist): ${field.label}`);
        }
      }
      
      console.log('\n✅ Factory fields created successfully!\n');
    }

    // 5. Final verification
    console.log('5️⃣  Final verification...');
    const [finalCount] = await connection.query(
      "SELECT COUNT(*) as count FROM form_fields WHERE business_type_id = 'FACTORY' OR section_id = 'FACTORY'"
    );
    
    console.log(`   📊 Total factory fields: ${finalCount[0].count}\n`);

    if (finalCount[0].count > 0) {
      const [allFactoryFields] = await connection.query(
        "SELECT id, label, field_type, sort_order FROM form_fields WHERE business_type_id = 'FACTORY' OR section_id = 'FACTORY' ORDER BY sort_order"
      );
      
      console.log('📋 All Factory Fields:');
      console.log('='.repeat(80));
      allFactoryFields.forEach(f => {
        console.log(`   ${String(f.sort_order).padStart(2)}. ${f.label.padEnd(30)} (${f.field_type.padEnd(15)}) [${f.id}]`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DONE! Factory fields are now ready.');
    console.log('\n👉 Next steps:');
    console.log('   1. Refresh your browser (Ctrl+Shift+R)');
    console.log('   2. Go to /admin/governance');
    console.log('   3. Click FACTORY tab');
    console.log('   4. You should see the master components!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndCreateFactoryFields();

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  const step = 'Initializing Migration';
  try {
    console.log('🏁 --- STARTING SECTION ARCHITECTURE MIGRATION ---');
    
    const results = [];

    // 1. Update Sections Table
    const sectionQueries = [
      "ALTER TABLE sections ADD COLUMN IF NOT EXISTS section_type ENUM('general', 'additional', 'universal') DEFAULT 'general' AFTER is_universal",
      "ALTER TABLE sections ADD COLUMN IF NOT EXISTS description TEXT AFTER section_type",
      "ALTER TABLE sections ADD COLUMN IF NOT EXISTS inheritance_rules JSON DEFAULT NULL AFTER description",
      "ALTER TABLE sections ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0 AFTER inheritance_rules",
      "ALTER TABLE sections ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0 AFTER display_order",
      "UPDATE sections SET section_type = 'universal' WHERE is_universal = 1",
      "UPDATE sections SET section_type = 'general' WHERE is_universal = 0"
    ];

    for (const q of sectionQueries) {
      try {
        await execute(q);
        results.push({ query: q.substring(0, 50) + '...', status: 'success' });
      } catch (e: any) {
        // Ignore "Duplicate column name" errors as they are expected if run twice
        if (e.message.includes('Duplicate column name')) {
          results.push({ query: q.substring(0, 50) + '...', status: 'already_exists' });
        } else {
          results.push({ query: q.substring(0, 50) + '...', status: 'error', error: e.message });
        }
      }
    }

    // 2. Update Form Fields Table
    const fieldQueries = [
      "ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS section_origin ENUM('inherited', 'own', 'template') DEFAULT 'own' AFTER field_type",
      "ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS required_feature VARCHAR(100) DEFAULT NULL AFTER sort_order",
      "UPDATE form_fields SET section_origin = 'template' WHERE business_type_id = 'SECTION_TEMPLATE'"
    ];

    for (const q of fieldQueries) {
      try {
        await execute(q);
        results.push({ query: q.substring(0, 50) + '...', status: 'success' });
      } catch (e: any) {
        if (e.message.includes('Duplicate column name')) {
          results.push({ query: q.substring(0, 50) + '...', status: 'already_exists' });
        } else {
          results.push({ query: q.substring(0, 50) + '...', status: 'error', error: e.message });
        }
      }
    }

    // 3. Materialize Structural Fields for ALL Sections
    const [allSections] = await execute('SELECT id FROM sections') as any[];
    const structuralFields = [
      { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'checkbox', order: -3, help: 'Toggle this to promote to homepage.' },
      { name: 'section_news', label: 'Carousel Cinematic Teaser (Mini-Blog)', type: 'textarea', order: -2, help: 'Short text for carousel captions.' },
      { name: 'section_gallery', label: 'Section Gallery (Serialized Captions)', type: 'gallery', order: -1, help: 'Section photos with captions.' },
      { name: 'section_blog', label: 'Master Section Story (Rich Text)', type: 'rich_text', order: 1, help: 'Full rich-text story for this section.' }
    ];

    for (const section of allSections) {
      for (const field of structuralFields) {
        try {
          const fid = `auto_${section.id}_${field.name}`;
          await execute(
            `INSERT IGNORE INTO form_fields 
            (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, required_feature, acl, validation)
            VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 0, ?, ?, 'template', 'hero_automation', ?, ?)`,
            [
              fid, section.id, field.name, field.label, field.type, field.help, field.order,
              JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
              JSON.stringify({})
            ]
          );
          results.push({ query: `Materialize ${field.name} for ${section.id}`, status: 'success' });
        } catch (e: any) {
          results.push({ query: `Materialize ${field.name} for ${section.id}`, status: 'error', error: e.message });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Section Architecture Migration & Field Materialization Completed', 
      details: results 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, step, error: err.message }, { status: 500 });
  }
}

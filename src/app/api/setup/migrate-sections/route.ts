import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const step = 'Initializing Migration';
  try {
    console.log('🏁 --- STARTING SECTION ARCHITECTURE MIGRATION ---');
    
    const results = [];

    // HELPER to run queries safely
    const safeExecute = async (label: string, sql: string, params: any[] = []) => {
      try {
        await execute(sql, params);
        results.push({ label, status: 'success' });
      } catch (e: any) {
        if (e.message.includes('Duplicate column name') || e.message.includes('already exists')) {
          results.push({ label, status: 'already_done' });
        } else {
          results.push({ label, status: 'error', error: e.message });
        }
      }
    };

    // 1. Hard-Fix Sections Table Columns
    await safeExecute('Add active column', 'ALTER TABLE sections ADD active BOOLEAN DEFAULT TRUE');
    await safeExecute('Add section_type column', "ALTER TABLE sections ADD section_type ENUM('general', 'additional', 'universal', 'hidden') DEFAULT 'general'");
    await safeExecute('Add description column', 'ALTER TABLE sections ADD description TEXT');
    await safeExecute('Add inheritance_rules column', 'ALTER TABLE sections ADD inheritance_rules JSON DEFAULT NULL');
    await safeExecute('Add display_order column', 'ALTER TABLE sections ADD display_order INT DEFAULT 0');
    await safeExecute('Add sort_order column', 'ALTER TABLE sections ADD sort_order INT DEFAULT 0');
    
    // 2. Ensure Correct Data Types (In case they were created as strings before)
    await safeExecute('Fix section_type type', "ALTER TABLE sections MODIFY COLUMN section_type ENUM('general', 'additional', 'universal', 'hidden') DEFAULT 'general'");

    // 3. Update existing data
    await safeExecute('Sync universal type', "UPDATE sections SET section_type = 'universal' WHERE is_universal = 1");
    await safeExecute('Sync general type', "UPDATE sections SET section_type = 'general' WHERE is_universal = 0 AND (section_type IS NULL OR section_type = '')");

    // 4. Fix Form Fields Table
    await safeExecute('Add section_origin column', "ALTER TABLE form_fields ADD section_origin ENUM('inherited', 'own', 'template') DEFAULT 'own'");
    await safeExecute('Add required_feature column', "ALTER TABLE form_fields ADD required_feature VARCHAR(100) DEFAULT NULL");
    await safeExecute('Sync template origin', "UPDATE form_fields SET section_origin = 'template' WHERE business_type_id = 'SECTION_TEMPLATE'");

    // 5. Materialize Structural Fields
    let sections: any[] = [];
    try {
      sections = await query('SELECT id FROM sections');
      console.log(`Found ${sections.length} sections for materialization.`);
    } catch (e: any) {
      results.push({ label: 'Fetch sections', status: 'error', error: e.message });
    }

    const structuralFields = [
      { name: 'feature_on_main', label: 'FEATURE ON MAIN WEBSITE', type: 'checkbox', order: -3, help: 'Toggle this to promote to homepage.' },
      { name: 'section_news', label: 'Carousel Cinematic Teaser (Mini-Blog)', type: 'textarea', order: -2, help: 'Short text for carousel captions.' },
      { name: 'section_gallery', label: 'Section Gallery (Serialized Captions)', type: 'gallery', order: -1, help: 'Section photos with captions.' },
      { name: 'section_blog', label: 'Master Section Story (Rich Text)', type: 'rich_text', order: 1, help: 'Full rich-text story for this section.' }
    ];

    if (sections && sections.length > 0) {
      for (const section of sections) {
        for (const field of structuralFields) {
          const fid = `auto_${section.id}_${field.name}`;
          await safeExecute(
            `Materialize ${field.name} for ${section.id}`,
            `INSERT IGNORE INTO form_fields 
            (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, required_feature, acl, validation)
            VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 0, ?, ?, 'template', 'hero_automation', ?, ?)`,
            [
              fid, section.id, field.name, field.label, field.type, field.help, field.order,
              JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] }),
              JSON.stringify({})
            ]
          );
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Bulletproof Migration Completed', 
      details: results 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, step, error: err.message }, { status: 500 });
  }
}

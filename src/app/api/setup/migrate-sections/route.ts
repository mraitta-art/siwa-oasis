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

    return NextResponse.json({ 
      success: true, 
      message: 'Section Architecture Migration Completed', 
      details: results 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, step, error: err.message }, { status: 500 });
  }
}

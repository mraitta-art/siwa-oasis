import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    console.log("🛠️  Initiating 8-Chapter Architecture Migration via API...");

    // 1. CLEAR OLD DATA
    await execute("DELETE FROM form_fields WHERE section_id IN (SELECT id FROM sections)");
    await execute("DELETE FROM sections");

    // 1.5 ENSURE VITAL TYPOLOGIES EXIST
    await execute(
      "INSERT IGNORE INTO business_types (id, name, is_parent, active) VALUES ('SECTION_TEMPLATE', 'System Template', 0, 1)"
    );

    // 2. DEFINE THE 8 GOLDEN CHAPTERS
    const chapters = [
      { id: 'sec_1_identity',     name: 'General Identity',           icon: 'fa-landmark',        order: 1 },
      { id: 'sec_2_ambience',     name: 'Ambience & Style',           icon: 'fa-sun',             order: 2 },
      { id: 'sec_3_services',     name: 'Core Services',              icon: 'fa-hotel',           order: 3 },
      { id: 'sec_4_facilities',   name: 'Facilities & Amenities',     icon: 'fa-swimming-pool',   order: 4 },
      { id: 'sec_5_connectivity', name: 'Connectivity & Contacts',    icon: 'fa-wifi',            order: 5 },
      { id: 'sec_6_geographic',   name: 'Geographic Intelligence',    icon: 'fa-map-marked-alt',  order: 6 },
      { id: 'sec_7_investment',   name: 'Investment & Growth',        icon: 'fa-chart-line',      order: 7 },
      { id: 'sec_8_rates_offers', name: 'Rates, Discounts & Offers',  icon: 'fa-tags',            order: 8 },
    ];

    // 3. INJECT SECTIONS
    for (const c of chapters) {
      await execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) 
         VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)`,
        [c.id, c.name, c.icon, c.order]
      );

      // 4. INJECT UNIVERSAL DNA
      const dna = [
        { name: 'section_gallery', label: 'CINEMATIC GALLERY',    type: 'gallery',   order: 1, help: 'High-res photos for carousel slides.' },
        { name: 'section_blog',    label: 'NARRATIVE BLOG (RICH)', type: 'rich_text', order: 2, help: 'The deep story for this chapter.' },
        { name: 'feature_on_main', label: 'PROMOTE TO HOME',      type: 'boolean',   order: 3, help: 'Show this chapter on the main landing page.' }
      ];

      for (const field of dna) {
        const fid = `auto_${c.id}_${field.name}`;
        await execute(
          `INSERT INTO form_fields 
          (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, required_feature, acl)
          VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 0, ?, ?, 'template', 'hero_automation', ?)`,
          [
            fid, c.id, field.name, field.label, field.type, field.help, field.order,
            JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] })
          ]
        );
      }
    }

    // 5. UPDATE BUSINESS TYPES
    const sectionIds = chapters.map(c => c.id);
    await execute(
      "UPDATE business_types SET sections = ?",
      [JSON.stringify(sectionIds)]
    );

    invalidateCache.sections();
    invalidateCache.formFields();

    return NextResponse.json({ success: true, message: 'Architecture stabilized with 8 Chapters.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

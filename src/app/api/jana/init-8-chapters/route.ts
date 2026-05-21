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

    // 2. DEFINE THE 8 GOLDEN CHAPTERS (Refined Strategy)
    const chapters = [
      { id: 'sec_1_identity',    name: 'Identity & Heritage',     icon: 'fa-landmark',        order: 1 },
      { id: 'sec_2_ambience',    name: 'Design & Ambience',       icon: 'fa-sun',             order: 2 },
      { id: 'sec_3_facilities',  name: 'Infrastructure & Pools',  icon: 'fa-swimming-pool',   order: 3 },
      { id: 'sec_4_gastronomy',  name: 'Culinary Craft',          icon: 'fa-utensils',        order: 4 },
      { id: 'sec_5_experiences', name: 'Experiences & Programs',  icon: 'fa-hiking',          order: 5 },
      { id: 'sec_6_guardian',    name: 'Sustainability DNA',      icon: 'fa-leaf',            order: 6 },
      { id: 'sec_7_investment',  name: 'Business & Investment',   icon: 'fa-chart-line',      order: 7 },
      { id: 'sec_8_connector',   name: 'Rates, Offers & Access',  icon: 'fa-tags',            order: 8 },
    ];

    // 3. INJECT SECTIONS
    for (const c of chapters) {
      await execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active) 
         VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)`,
        [c.id, c.name, c.icon, c.order]
      );

      // 4. INJECT UNIVERSAL DNA (Every chapter gets a Gallery and Blog)
      const dna = [
        { name: 'section_gallery', label: 'CINEMATIC GALLERY',    type: 'gallery',   order: 1, help: 'High-res photos for carousel slides.' },
        { name: 'section_blog',    label: 'NARRATIVE BLOG (RICH)', type: 'rich_text', order: 2, help: 'The deep story for this chapter.' },
      ];

      for (const field of dna) {
        const fid = `auto_${c.id}_${field.name}`;
        await execute(
          `INSERT INTO form_fields 
          (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, acl)
          VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 1, ?, ?, 'template', ?)`,
          [
            fid, c.id, field.name, field.label, field.type, field.help, field.order,
            JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] })
          ]
        );
      }
    }

    // 5. INJECT SPECIALIZED STRATEGIC FIELDS
    const strategicFields = [
      // Chapter 2: Ambience (Interior/Exterior)
      { sid: 'sec_2_ambience', id: 'ext_design', label: 'EXTERIOR ARCHITECTURE', type: 'text', help: 'Describe the Kershef/Stone facade.' },
      { sid: 'sec_2_ambience', id: 'int_design', label: 'INTERIOR VIBE',         type: 'text', help: 'Describe the salt-brick walls or palm ceilings.' },
      
      // Chapter 3: Facilities (Pools)
      { sid: 'sec_3_facilities', id: 'pool_count', label: 'NATURAL POOLS',     type: 'number', help: 'Number of springs or pools.' },
      { sid: 'sec_3_facilities', id: 'spa_services', label: 'WELLNESS / SPA',  type: 'text',   help: 'Details of salt caves or massage rooms.' },
      
      // Chapter 4: Gastronomy (Restaurant)
      { sid: 'sec_4_gastronomy', id: 'on_site_dining', label: 'RESTAURANT NAME', type: 'text', help: 'Name of the in-house dining spot.' },
      { sid: 'sec_4_gastronomy', id: 'menu_highlights', label: 'CUISINE FOCUS',  type: 'text', help: 'e.g., Traditional Siwan, Vegan, Farm-to-Table.' },
      
      // Chapter 5: Experiences (Tour Programs)
      { sid: 'sec_5_experiences', id: 'tour_programs', label: 'TOUR ITINERARIES', type: 'rich_text', help: 'Describe full programs and schedules.' },
      { sid: 'sec_5_experiences', id: 'daily_activities', label: 'DAILY RITUALS', type: 'text',      help: 'Yoga, Sunset walks, Fire-pit nights.' },
      
      // Chapter 7: Investment (Time-share)
      { sid: 'sec_7_investment', id: 'investment_opps', label: 'INVESTMENT OFFERS', type: 'text', help: 'Details of shares for sale or development deals.' },
      { sid: 'sec_7_investment', id: 'timeshare_details', label: 'TIME-SHARE MODEL', type: 'text', help: 'Describe fractional ownership options.' },
    ];

    for (const f of strategicFields) {
      await execute(
        `INSERT INTO form_fields 
        (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, acl)
        VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 1, ?, 10, 'custom', ?)`,
        [
          `strat_${f.id}`, f.sid, f.id, f.label, f.type, f.help,
          JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] })
        ]
      );
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

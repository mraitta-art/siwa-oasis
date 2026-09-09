import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CANONICAL_SECTIONS } from '@/lib/section-registry';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    console.log("🛠️  Initiating 10-Chapter Architecture Migration via API...");

    // 0. UPGRADE TABLES & TIERS
    try {
      await execute("ALTER TABLE form_fields MODIFY COLUMN id VARCHAR(100) NOT NULL");
      await execute("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS admin_overrides JSON DEFAULT NULL");
    } catch (e) {
      console.log("DDL column alter skipped/existing");
    }

    const tiers = [
      { id: 'free', allowed: ["sec_1_identity","sec_2_ambience"] },
      { id: 'basic', allowed: ["sec_1_identity","sec_2_ambience","sec_3_facilities","sec_4_gastronomy","sec_5_experiences","sec_6_guardian"] },
      { id: 'premium', allowed: ["sec_1_identity","sec_2_ambience","sec_3_facilities","sec_4_gastronomy","sec_5_experiences","sec_6_guardian","sec_7_investment","sec_8_connector","sec_9_marketplace_catalog","sec_10_testimonials_faqs"] },
      { id: 'gold', allowed: ["sec_1_identity","sec_2_ambience","sec_3_facilities","sec_4_gastronomy","sec_5_experiences","sec_6_guardian","sec_7_investment","sec_8_connector","sec_9_marketplace_catalog","sec_10_testimonials_faqs"] },
      { id: 'vip', allowed: ["sec_1_identity","sec_2_ambience","sec_3_facilities","sec_4_gastronomy","sec_5_experiences","sec_6_guardian","sec_7_investment","sec_8_connector","sec_9_marketplace_catalog","sec_10_testimonials_faqs"] }
    ];

    for (const t of tiers) {
      const tierRow = await queryOne<any>("SELECT features FROM subscription_tiers WHERE id = ?", [t.id]);
      if (tierRow) {
        let features = typeof tierRow.features === 'string' ? JSON.parse(tierRow.features) : tierRow.features || {};
        delete features.allowedSections;
        delete features.allowed_public_sections;
        await execute("UPDATE subscription_tiers SET features = ? WHERE id = ?", [JSON.stringify(features), t.id]);
      }
    }

    // Ensure the template type exists without deleting existing sections or fields.
    await execute(
      "INSERT IGNORE INTO business_types (id, name, is_parent, active) VALUES ('SECTION_TEMPLATE', 'System Template', 0, 1)"
    );

    // Materialize the canonical registry additively. Existing rows and fields survive reruns.
    for (const c of CANONICAL_SECTIONS) {
      await execute(
        `INSERT INTO sections (id, name, icon, required, vendor_editable, show_on_public, is_universal, display_order, active)
         VALUES (?, ?, ?, 1, 1, 1, 1, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), display_order = VALUES(display_order), active = 1`,
        [c.id, c.name, c.icon, c.order]
      );

      // Every canonical section gets the shared gallery/story fields once.
      const dna = [
        { name: 'section_gallery', label: 'CINEMATIC GALLERY',    type: 'gallery',   order: 1, help: 'High-res photos for carousel slides.' },
        { name: 'section_blog',    label: 'NARRATIVE BLOG (RICH)', type: 'rich_text', order: 2, help: 'The deep story for this chapter.' },
      ];

      for (const field of dna) {
        const fid = `auto_${c.id}_${field.name}`;
        await execute(
          `INSERT IGNORE INTO form_fields 
          (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, acl)
          VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 1, ?, ?, 'template', ?)`,
          [
            fid, c.id, field.name, field.label, field.type, field.help, field.order,
            JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] })
          ]
        );
      }
    }

    // Add specialized fields once; existing customizations are left untouched.
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

      // Chapter 9: Marketplace & Products Catalog
      { sid: 'sec_9_marketplace_catalog', id: 'product_list', label: 'PRODUCT LIST (JSON)', type: 'rich_text', help: 'List products: Name, Price, Description, Image, Story.' },
      { sid: 'sec_9_marketplace_catalog', id: 'shipping_available', label: 'SHIPPING AVAILABLE', type: 'boolean', help: 'Toggle shipping inside/outside Egypt.' },

      // Chapter 10: Testimonials & FAQs
      { sid: 'sec_10_testimonials_faqs', id: 'testimonials', label: 'TESTIMONIALS (RICH)', type: 'rich_text', help: 'Customer quotes and ratings.' },
      { sid: 'sec_10_testimonials_faqs', id: 'faqs',         label: 'FREQUENT QUESTIONS',   type: 'rich_text', help: 'Questions and answers.' }
    ];

    for (const f of strategicFields) {
      await execute(
        `INSERT IGNORE INTO form_fields 
        (id, business_type_id, section_id, name, label, field_type, required, vendor_editable, searchable, help_text, sort_order, section_origin, acl)
        VALUES (?, 'SECTION_TEMPLATE', ?, ?, ?, ?, 0, 1, 1, ?, 10, 'custom', ?)`,
        [
          `strat_${f.id}`, f.sid, f.id, f.label, f.type, f.help,
          JSON.stringify({ read: ['super_admin','content_admin','vendor','public'], write: ['super_admin','content_admin','vendor'] })
        ]
      );
    }

    invalidateCache.sections();
    invalidateCache.formFields();

    return NextResponse.json({ success: true, message: 'Architecture stabilized with 10 Chapters.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

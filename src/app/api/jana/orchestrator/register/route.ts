import { NextRequest, NextResponse } from 'next/server';
import { execute, transaction } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { 
      businessName, 
      typeId, 
      vendorId, 
      fields, // [{name, dynamic}]
      businessData, // {fieldName: value}
      siteId // website_main or website_...
    } = body;

    if (!businessName || !typeId) {
      return NextResponse.json({ error: 'Business name and type required' }, { status: 400 });
    }
    // Defensive defaults + validation
    const fieldsArr = Array.isArray(fields) ? fields : [];
    const businessDataObj = businessData && typeof businessData === 'object' ? businessData : {};
    const finalSiteId = siteId || 'website_main';

    const businessId = crypto.randomUUID();

    // Use a transaction to ensure partial inserts don't leave the DB in a bad state
    await transaction(async (conn) => {
      await conn.query(
        `INSERT INTO businesses (id, name, type_id, vendor_id, custom_data, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [businessId, businessName, typeId, vendorId || null, JSON.stringify(businessDataObj)]
      );

      // Inject Hybrid Fields into Form Architect (if any)
      for (const field of fieldsArr) {
        if (!field || !field.name) continue; // skip invalid entries
        const fieldId = crypto.randomUUID();
        const varName = String(field.name).toLowerCase().replace(/\s+/g, '_').slice(0, 100);
        const label = String(field.name).slice(0, 255);
        const vendorEditable = !!field.dynamic;

        await conn.query(
          `INSERT IGNORE INTO form_fields (id, business_type_id, section_id, name, label, field_type, vendor_editable)
           VALUES (?, ?, ?, ?, ?, 'text', ?)`,
          [fieldId, typeId, 'basic', varName, label, vendorEditable]
        );
      }

      // Generate the 4-page shell in Orchestrator
      const pages = [
        { slug: 'index', title: 'Home Page' },
        { slug: 'services', title: 'Our Services' },
        { slug: 'gallery', title: 'Photo Gallery' },
        { slug: 'contact', title: 'Contact & Regulation' }
      ];

      for (const page of pages) {
        const pageId = crypto.randomUUID();
        await conn.query(
          `INSERT IGNORE INTO orchestrator_pages (id, site_id, slug, title, components)
           VALUES (?, ?, ?, ?, ?)`,
          [pageId, finalSiteId, page.slug, page.title, JSON.stringify([])]
        );
      }

      await conn.query('INSERT INTO activity_log (message, user_email) VALUES (?, ?)',
        [`Orchestration Successful: ${businessName} onboarded with 4 pages and hybrid fields.`, user.email]
      );
    });

    return NextResponse.json({ success: true, businessId });
  } catch (e: any) { 
    // Provide actionable messages for common problems
    const msg = e?.message || String(e);
    if (msg.includes('ER_BAD_FIELD_ERROR') || msg.includes('ER_NO_SUCH_TABLE')) {
      return NextResponse.json({ error: 'Database schema mismatch: ' + msg }, { status: 500 });
    }
    if (msg.includes('Not authenticated') || msg.includes('Admin access required')) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 }); 
  }
}

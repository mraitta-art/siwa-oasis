import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
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

    const businessId = crypto.randomUUID();

    // 1. Create the Business in Registry
    await execute(
      `INSERT INTO businesses (id, name, type_id, vendor_id, custom_data, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [businessId, businessName, typeId, vendorId || null, JSON.stringify(businessData)]
    );

    // 2. Inject Hybrid Fields into Form Architect
    for (const field of fields) {
       const fieldId = crypto.randomUUID();
       // Check if exists first to avoid UK error
       await execute(
         `INSERT IGNORE INTO form_fields (id, business_type_id, section_id, name, label, field_type, vendor_editable)
          VALUES (?, ?, ?, ?, ?, 'text', ?)`,
         [fieldId, typeId, 'basic', field.name.toLowerCase().replace(/\s+/g,'_'), field.name, field.dynamic]
       );
    }

    // 3. Generate the 4-page shell in Orchestrator
    const pages = [
      { slug: 'index', title: 'Home Page' },
      { slug: 'services', title: 'Our Services' },
      { slug: 'gallery', title: 'Photo Gallery' },
      { slug: 'contact', title: 'Contact & Regulation' }
    ];

    for (const page of pages) {
       const pageId = crypto.randomUUID();
       await execute(
         `INSERT IGNORE INTO orchestrator_pages (id, site_id, slug, title, components)
          VALUES (?, ?, ?, ?, ?)`,
         [pageId, siteId, page.slug, page.title, JSON.stringify([])]
       );
    }

    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', 
      [`Orchestration Successful: ${businessName} onboarded with 4 pages and hybrid fields.`, user.email]
    );

    return NextResponse.json({ success: true, businessId });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

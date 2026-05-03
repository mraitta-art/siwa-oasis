import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const COMPONENT_REQUIREMENTS: Record<string, string[]> = {
  carousel: ['title', 'subtitle', 'backgroundImage'],
  blog: ['blog_section_id'],
  services: ['service_category_id', 'service_display_limit'],
  testimonials: ['testimonial_source_id'],
  cta_banner: ['title', 'cta_label', 'cta_link'],
  gallery: ['gallery_id', 'layout_mode']
};

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { components, business_type_id } = body;

    if (!components || !business_type_id) {
       return NextResponse.json({ error: 'components and business_type_id required' }, { status: 400 });
    }

    // Load available form fields for this type
    const formFields = await query(
      'SELECT name FROM form_fields WHERE business_type_id = ?',
      [business_type_id]
    ) as any[];

    const fieldNames = new Set(formFields.map(f => f.name));
    const alarms: any[] = [];

    components.forEach((comp: any) => {
       const reqs = COMPONENT_REQUIREMENTS[comp.type] || [];
       const missing = reqs.filter(r => !fieldNames.has(r));
       
       if (missing.length > 0) {
         alarms.push({
           compId: comp.id,
           compType: comp.type,
           message: `Missing Data Governance: The fields [${missing.join(', ')}] are not defined in the Form Architect for typology '${business_type_id}'.`,
           missingFields: missing
         });
       }
    });

    return NextResponse.json({
      integrity: alarms.length === 0,
      alarms: alarms,
      scanTime: new Date().toISOString()
    });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

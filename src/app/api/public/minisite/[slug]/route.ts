import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { MINISITE_LAYOUT_KEY } from '@/lib/minisite-layout';

export const dynamic = 'force-dynamic';

function parseJson(value: unknown, fallback: any = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await queryOne<any>(
      `SELECT b.*
       FROM businesses b
       WHERE b.slug = ? OR b.id = ?
       LIMIT 1`,
      [slug, slug]
    );
    if (!business) return NextResponse.json({ layout: null });
    const businessType = business.type_id
      ? await queryOne<{ name: string }>(
          'SELECT name FROM business_types WHERE id = ?',
          [business.type_id]
        )
      : null;

    const published = await queryOne<any>(
      `SELECT layout FROM minisite_vendor_handoffs
       WHERE business_id = ? AND status = 'published'
       ORDER BY revision DESC
       LIMIT 1`,
      [business.id]
    );
    let layout = parseJson(published?.layout, null);

    if (!layout || !Array.isArray(layout.components)) {
      const legacy = await queryOne<any>(
        'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
        [MINISITE_LAYOUT_KEY(business.slug || business.id)]
      );
      layout = parseJson(legacy?.config, null);
    }

    const [gallery, blogs, products] = await Promise.all([
      query<any>(
        `SELECT id, url, caption, is_hero
         FROM vendor_gallery
         WHERE business_id = ? AND approval_status = 'approved' AND show_on_minisite = 1
         ORDER BY is_hero DESC, id DESC`,
        [business.id]
      ),
      query<any>(
        `SELECT id, title, content, excerpt, cover_image
         FROM section_blogs
         WHERE business_id = ? AND status = 'published' AND show_on_minisite = 1
         ORDER BY published_at DESC`,
        [business.id]
      ),
      query<any>(
        `SELECT id, title, price, duration, image_url, category, description, is_featured
         FROM tour_products
         WHERE (vendor_business_id = ? OR vendor_business_id IS NULL) AND is_active = 1
         ORDER BY is_featured DESC, created_at DESC`,
        [business.id]
      ),
    ]);

    const hasCustomLayout = Array.isArray(layout?.components) && layout.components.length > 0;
    const publicLayout = {
      mode: layout?.mode === 'untied' ? 'untied' as const : 'replace' as const,
      components: hasCustomLayout
        ? layout.components
        : [
            { id: 'hero_1', type: 'vendor_hero', order: 0, props: {} },
            { id: 'gallery_1', type: 'vendor_gallery', order: 1, props: {} },
            { id: 'services_1', type: 'vendor_services', order: 2, props: {} },
            { id: 'cta_1', type: 'cta_section', order: 3, props: {} },
          ],
      site_settings: layout?.site_settings || {},
    };

    return NextResponse.json({
      layout: publicLayout,
      layoutSource: hasCustomLayout ? 'published' : 'generated',
      business: {
        id: business.id,
        slug: business.slug || business.id,
        name: business.name,
        type_id: String(business.type_id || ''),
        type_name: businessType?.name || '',
        custom_data: parseJson(business.custom_data),
        gallery,
        blogs,
        tourProducts: products,
        vendorPhone: business.vendor_phone || business.phone || '',
      },
    });
  } catch (error: any) {
    console.error('[public/minisite]', error);
    return NextResponse.json({ error: 'Unable to load published minisite' }, { status: 500 });
  }
}

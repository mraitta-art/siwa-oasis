import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const prefix = businessId ? `website_business_${businessId}_` : '';
    const results = await query(
      businessId
        ? 'SELECT type FROM website_configs WHERE type LIKE ? ORDER BY type ASC'
        : 'SELECT type, config FROM website_configs WHERE type LIKE "website_%" OR type LIKE "website_search_%" ORDER BY type ASC',
      businessId ? [`${prefix}website_%`] : []
    );

    if (!businessId) {
      return NextResponse.json(results.map((record: any) => {
        const type = String(record.type || '');
        const isSearch = type.startsWith('website_search_');
        const slug = type.replace(/^website_search_/, '').replace(/^website_/, '');
        let config: any = record.config || {};
        if (typeof config === 'string') {
          try { config = JSON.parse(config); } catch { config = {}; }
        }

        const components = [
          ...(Array.isArray(config.header_components) ? config.header_components : []),
          ...(Array.isArray(config.body_components) ? config.body_components : []),
          ...(Array.isArray(config.footer_components) ? config.footer_components : []),
        ];
        const heroCarousel = components.find((component: any) => component?.type === 'hero_carousel');
        const configuredSiteId = heroCarousel?.props?.carousel_id || heroCarousel?.props?.carouselName;
        const siteId = typeof configuredSiteId === 'string' && configuredSiteId.trim()
          ? configuredSiteId.trim()
          : slug === 'main' ? 'discovery' : `${slug}_hero`;

        return {
          type,
          slug,
          isSearch,
          siteId,
          publicPath: config.public_path || config.site_settings?.public_path || null,
          title: config.site_settings?.site_name || slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
        };
      }));
    }

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/jana/search-pages/[id]
 * Get search page by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;

    // Try to find by slug first, then by id
    let page = await query(
      'SELECT * FROM search_pages WHERE slug = ? OR id = ? LIMIT 1',
      [identifier, identifier]
    );

    if (page.length === 0) {
      return NextResponse.json({ error: 'Search page not found' }, { status: 404 });
    }

    const p = page[0];
    return NextResponse.json({
      ...p,
      components: typeof p.components === 'string' ? JSON.parse(p.components) : p.components || [],
      layout_settings: typeof p.layout_settings === 'string' ? JSON.parse(p.layout_settings) : p.layout_settings || {}
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

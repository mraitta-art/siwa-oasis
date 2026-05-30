import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/jana/search-pages
 * List all search pages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');

    let sql = 'SELECT * FROM search_pages';
    const params: any[] = [];

    if (published === 'true') {
      sql += ' WHERE is_published = 1';
    } else if (published === 'false') {
      sql += ' WHERE is_published = 0';
    }

    sql += ' ORDER BY created_at DESC';

    const pages = await query(sql, params);

    return NextResponse.json(
      pages.map((p: any) => ({
        ...p,
        components: typeof p.components === 'string' ? JSON.parse(p.components) : p.components || [],
        layout_settings: typeof p.layout_settings === 'string' ? JSON.parse(p.layout_settings) : p.layout_settings || {}
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/jana/search-pages
 * Create new search page
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const {
      slug,
      title,
      description = '',
      search_engine_id = null,
      hero_enabled = true,
      hero_carousel_id = 'discovery',
      hero_height_vh = 85,
      hero_autoplay = true,
      components = [],
      layout_settings = {},
      is_published = true,
      custom_seo_title = '',
      custom_seo_description = ''
    } = body;

    // Validation
    if (!slug || !title) {
      return NextResponse.json(
        { error: 'slug and title are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();

    await execute(
      `INSERT INTO search_pages (
        id, slug, title, description, search_engine_id,
        hero_enabled, hero_carousel_id, hero_height_vh, hero_autoplay,
        components, layout_settings, is_published,
        custom_seo_title, custom_seo_description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, slug, title, description, search_engine_id,
        hero_enabled, hero_carousel_id, hero_height_vh, hero_autoplay,
        JSON.stringify(components), JSON.stringify(layout_settings), is_published,
        custom_seo_title, custom_seo_description, user.email
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      message: `Search page '${title}' created`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/jana/search-pages
 * Update search page
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Build dynamic UPDATE query
    const allowed = [
      'title', 'description', 'search_engine_id',
      'hero_enabled', 'hero_carousel_id', 'hero_height_vh', 'hero_autoplay',
      'components', 'layout_settings', 'is_published', 'is_visible',
      'show_breadcrumb', 'custom_seo_title', 'custom_seo_description'
    ];

    const fields: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(
          typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]
        );
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await execute(
      `UPDATE search_pages SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      success: true,
      message: 'Search page updated'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/jana/search-pages
 * Delete search page
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const page = await query('SELECT * FROM search_pages WHERE id = ?', [id]);

    if (page.length === 0) {
      return NextResponse.json({ error: 'Search page not found' }, { status: 404 });
    }

    await execute('DELETE FROM search_pages WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: `Search page '${page[0].title}' deleted`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Page Builder API - Pages Endpoint
 * POST /api/jana/page-builder/pages - Create new page
 * GET /api/jana/page-builder/pages - Get all pages
 * PUT /api/jana/page-builder/pages/:id - Update page
 * DELETE /api/jana/page-builder/pages/:id - Delete page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPageLayout, getAllPages } from '@/lib/jana/page-builder-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, description, siteType } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    if (siteType === 'mini-site') {
      return NextResponse.json(
        {
          error:
            'Cannot create pages for mini-sites directly. Use templates instead.',
        },
        { status: 400 }
      );
    }

    const page = await createPageLayout(
      { title, slug, siteType: 'main-site' }
    );

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const siteType = request.nextUrl.searchParams.get('siteType') || 'main-site';
    const pages = await getAllPages();

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

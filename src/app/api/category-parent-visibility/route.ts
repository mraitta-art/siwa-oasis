import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'category_parent_visibility';

// Default parent visibility rules for sectors/pages
export const DEFAULT_PAGE_PARENT_VISIBILITY: Record<string, string[]> = {
  'siwa-products': ['food', 'crafts', 'agriculture_industry'],
  'siwa-stay': ['accommodation'],
  'siwa-go': ['adventure', 'logistics'],
  'siwa-retreats': ['wellness'],
  'siwa-society': ['arts_culture', 'education_research', 'events_entertainment', 'media_content', 'services_professional'],
  'siwa-invest': ['investment_parent'],
  'accommodations': ['accommodation'],
  'activities': ['adventure'],
  'restaurants': ['food'],
  'food-beverage': ['food'],
  'transportation': ['logistics'],
  'crafts-wellness': ['crafts', 'wellness'],
  'production-trade': ['agriculture_industry'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('page');

    const results = await query<any>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [CONFIG_KEY]
    );

    let savedConfig: Record<string, string[]> = {};
    if (results.length > 0 && results[0]?.config) {
      savedConfig = typeof results[0].config === 'string'
        ? JSON.parse(results[0].config)
        : results[0].config;
    }

    const merged = { ...DEFAULT_PAGE_PARENT_VISIBILITY, ...savedConfig };

    if (pageId) {
      return NextResponse.json({
        page: pageId,
        visible_parents: merged[pageId] || DEFAULT_PAGE_PARENT_VISIBILITY[pageId] || [],
      });
    }

    return NextResponse.json({
      config: merged,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch visibility configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { page, visible_parents } = body;

    if (!page || !Array.isArray(visible_parents)) {
      return NextResponse.json(
        { error: 'Invalid payload. "page" string and "visible_parents" array are required.' },
        { status: 400 }
      );
    }

    const results = await query<any>(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [CONFIG_KEY]
    );

    let currentConfig: Record<string, string[]> = { ...DEFAULT_PAGE_PARENT_VISIBILITY };
    if (results.length > 0 && results[0]?.config) {
      const parsed = typeof results[0].config === 'string'
        ? JSON.parse(results[0].config)
        : results[0].config;
      currentConfig = { ...currentConfig, ...parsed };
    }

    currentConfig[page] = visible_parents;

    await execute(
      'INSERT INTO website_configs (type, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = VALUES(config)',
      [CONFIG_KEY, JSON.stringify(currentConfig)]
    );

    return NextResponse.json({
      success: true,
      page,
      visible_parents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update visibility configuration' },
      { status: 500 }
    );
  }
}

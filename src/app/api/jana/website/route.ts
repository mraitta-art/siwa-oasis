import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getWebsiteTemplate, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'main';
    const configId = `website_${type}`;

    const results = await query(
      'SELECT config FROM website_configs WHERE type = ? LIMIT 1',
      [configId]
    );

    if (results.length === 0) {
      return NextResponse.json([]);
    }

    const config = typeof results[0].config === 'string'
      ? JSON.parse(results[0].config)
      : results[0].config;

    return NextResponse.json([{ id: configId, ...config }]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, header_components = [], body_components = [], footer_components = [], site_settings = {} } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const config = JSON.stringify({ header_components, body_components, footer_components, site_settings });

    await execute(
      `INSERT INTO website_configs (type, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [id, config]
    );

    invalidateCache.websiteSettings();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  // Use POST logic for simplicity since it has ON DUPLICATE KEY
  return POST(request);
}

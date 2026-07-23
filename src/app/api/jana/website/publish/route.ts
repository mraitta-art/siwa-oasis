import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, draftId } = body;

    if (!id || !draftId) {
      return NextResponse.json({ error: 'id and draftId are required' }, { status: 400 });
    }

    const draftRows = await query('SELECT config FROM website_configs WHERE type = ? LIMIT 1', [draftId]);
    if (draftRows.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const config = draftRows[0].config;
    await execute(
      `INSERT INTO website_configs (type, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = VALUES(config)`,
      [id, typeof config === 'string' ? config : JSON.stringify(config)]
    );

    invalidateCache.websiteSettings();
    return NextResponse.json({ success: true, published: id, fromDraft: draftId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

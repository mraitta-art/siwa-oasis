import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Public access for dynamic home page rendering
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const pages = await query(
      'SELECT * FROM orchestrator_pages WHERE site_id = ? ORDER BY created_at',
      [siteId]
    );

    return NextResponse.json(pages.map((p: any) => ({
      ...p,
      components: typeof p.components === 'string' ? JSON.parse(p.components) : p.components || [],
      settings: typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings || {}
    })));
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { site_id, slug, title, components = [], settings = {}, search_engine_id = null, card_policy_id = null } = body;

    if (!site_id || !slug || !title) {
      return NextResponse.json({ error: 'site_id, slug, and title required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO orchestrator_pages (id, site_id, slug, title, components, settings, search_engine_id, card_policy_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, site_id, slug, title, JSON.stringify(components), JSON.stringify(settings), search_engine_id, card_policy_id]
    );

    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', 
      [`Page added to orchestrator: ${title} (${slug}) for ${site_id}`, user.email]
    );

    return NextResponse.json({ id, slug, title }, { status: 201 });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, title, components, settings, search_engine_id, card_policy_id, is_published } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title=?'); params.push(title); }
    if (components !== undefined) { updates.push('components=?'); params.push(JSON.stringify(components)); }
    if (settings !== undefined) { updates.push('settings=?'); params.push(JSON.stringify(settings)); }
    if (search_engine_id !== undefined) { updates.push('search_engine_id=?'); params.push(search_engine_id); }
    if (card_policy_id !== undefined) { updates.push('card_policy_id=?'); params.push(card_policy_id); }
    if (is_published !== undefined) { updates.push('is_published=?'); params.push(is_published); }

    if (updates.length > 0) {
      params.push(id);
      await execute(`UPDATE orchestrator_pages SET ${updates.join(',')} WHERE id=?`, params);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await execute('DELETE FROM orchestrator_pages WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

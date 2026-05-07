import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateSearchEngine } from '@/lib/governance/search-validator';

export async function GET() {
  try {
    await requireAdmin();
    const engines = await query('SELECT * FROM search_engines ORDER BY name');
    
    // Enrich with validation reports
    const enriched = await Promise.all(engines.map(async (e: any) => {
      const allowed_fields = typeof e.allowed_fields === 'string' ? JSON.parse(e.allowed_fields) : e.allowed_fields || [];
      const validation = await validateSearchEngine(allowed_fields);
      
      return {
        ...e,
        allowed_fields,
        filters: typeof e.filters === 'string' ? JSON.parse(e.filters) : e.filters || [],
        validation
      };
    }));

    return NextResponse.json(enriched);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, allowed_fields = [], filters = [], active = true } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    await execute(
      `INSERT INTO search_engines (id, name, allowed_fields, filters, active) VALUES (?, ?, ?, ?, ?)`,
      [id, name, JSON.stringify(allowed_fields), JSON.stringify(filters), active]
    );
    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [`Search engine added: ${name}`, user.email]);
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, allowed_fields, filters, active } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name=?'); params.push(name); }
    if (allowed_fields !== undefined) { updates.push('allowed_fields=?'); params.push(JSON.stringify(allowed_fields)); }
    if (filters !== undefined) { updates.push('filters=?'); params.push(JSON.stringify(filters)); }
    if (active !== undefined) { updates.push('active=?'); params.push(active); }

    if (updates.length > 0) {
      params.push(id);
      await execute(`UPDATE search_engines SET ${updates.join(',')} WHERE id=?`, params);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await execute('DELETE FROM search_engines WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

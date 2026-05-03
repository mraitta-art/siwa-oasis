import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const expressions = await query('SELECT * FROM custom_expressions ORDER BY name');
    return NextResponse.json(expressions.map((e: any) => ({
      ...e,
      options: typeof e.options === 'string' ? JSON.parse(e.options) : e.options || [],
    })));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, type, options = [], searchable = true } = body;
    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    await execute(
      `INSERT INTO custom_expressions (id, name, type, options, searchable) VALUES (?, ?, ?, ?, ?)`,
      [id, name, type || 'select', JSON.stringify(options), searchable !== false]
    );
    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [`Expression added: ${name}`, user.email]);
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, type, options, searchable } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await execute(
      `UPDATE custom_expressions SET name=?, type=?, options=?, searchable=? WHERE id=?`,
      [name, type, JSON.stringify(options || []), searchable, id]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await execute('DELETE FROM custom_expressions WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

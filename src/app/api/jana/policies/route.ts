import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const policies = await query('SELECT * FROM search_policies ORDER BY name');
    return NextResponse.json(policies.map((p: any) => ({
      ...p,
      allowed_fields: typeof p.allowed_fields === 'string' ? JSON.parse(p.allowed_fields) : p.allowed_fields || [],
    })));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, description, role, allowed_fields = [] } = body;
    if (!id || !name || !role) return NextResponse.json({ error: 'ID, Name, and Role required' }, { status: 400 });

    await execute(
      `INSERT INTO search_policies (id, name, description, role, allowed_fields) VALUES (?, ?, ?, ?, ?)`,
      [id, name, description || '', role, JSON.stringify(allowed_fields)]
    );
    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [`Visibility policy added: ${name}`, user.email]);
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, name, description, role, allowed_fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name=?'); params.push(name); }
    if (description !== undefined) { updates.push('description=?'); params.push(description); }
    if (role !== undefined) { updates.push('role=?'); params.push(role); }
    if (allowed_fields !== undefined) { updates.push('allowed_fields=?'); params.push(JSON.stringify(allowed_fields)); }

    if (updates.length > 0) {
      params.push(id);
      await execute(`UPDATE search_policies SET ${updates.join(',')} WHERE id=?`, params);
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
    await execute('DELETE FROM search_policies WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

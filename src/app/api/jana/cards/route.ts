import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const cards = await query('SELECT * FROM card_templates ORDER BY business_type_id');
    return NextResponse.json(cards.map((c: any) => ({
      ...c,
      visible_fields: typeof c.visible_fields === 'string' ? JSON.parse(c.visible_fields) : c.visible_fields || [],
    })));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, business_type_id, layout, visible_fields = [], policy_id } = body;
    if (!id || !business_type_id) return NextResponse.json({ error: 'ID and Business Type ID required' }, { status: 400 });

    await execute(
      `INSERT INTO card_templates (id, business_type_id, layout, visible_fields, policy_id) VALUES (?, ?, ?, ?, ?)`,
      [id, business_type_id, layout || 'standard', JSON.stringify(visible_fields), policy_id || null]
    );
    await execute('INSERT INTO activity_log (message, user_email) VALUES (?, ?)', [`Card template added: ${business_type_id}`, user.email]);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { id, layout, visible_fields, policy_id } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = [];
    const params = [];
    if (layout !== undefined) { updates.push('layout=?'); params.push(layout); }
    if (visible_fields !== undefined) { updates.push('visible_fields=?'); params.push(JSON.stringify(visible_fields)); }
    if (policy_id !== undefined) { updates.push('policy_id=?'); params.push(policy_id); }

    if (updates.length > 0) {
      params.push(id);
      await execute(`UPDATE card_templates SET ${updates.join(',')} WHERE id=?`, params);
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
    await execute('DELETE FROM card_templates WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

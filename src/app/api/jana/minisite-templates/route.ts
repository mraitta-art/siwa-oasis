import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');

    let query = 'SELECT * FROM minisite_templates ORDER BY created_at DESC';
    const params: any[] = [];

    if (category_id) {
      query = 'SELECT * FROM minisite_templates WHERE category_id = ? ORDER BY created_at DESC';
      params.push(category_id);
    }

    const templates = await execute(query, params);
    return NextResponse.json(templates);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, category_id, tier, components, settings } = body;

    if (!id || !name) return NextResponse.json({ error: 'ID and Name required' }, { status: 400 });

    await execute(
      `INSERT INTO minisite_templates (id, name, category_id, tier, components, settings) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, category_id || null, tier || 'free', JSON.stringify(components || []), JSON.stringify(settings || {})]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
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

    await execute('DELETE FROM minisite_templates WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

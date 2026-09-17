import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import pool from '@/lib/db';

async function getTemplate(id: string) {
  const [rows] = await pool.execute('SELECT * FROM minisite_templates WHERE id = ?', [id]);
  return (rows as any[])[0];
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await getTemplate(id);
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    const body = await req.json();
    let existingComponents: any[] = [];
    let settings: any = {};
    try { existingComponents = typeof existing.components === 'string' ? JSON.parse(existing.components || '[]') : (existing.components || []); } catch {}
    try { settings = typeof existing.settings === 'string' ? JSON.parse(existing.settings || '{}') : (existing.settings || {}); } catch {}
    const nextSettings = {
      ...settings,
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.allowComponentReorder !== undefined ? { allowComponentReorder: body.allowComponentReorder } : {}),
      ...(body.allowStyleCustomization !== undefined ? { allowStyleCustomization: body.allowStyleCustomization } : {}),
    };
    await pool.execute(
      'UPDATE minisite_templates SET name = ?, tier = ?, components = ?, settings = ? WHERE id = ?',
      [body.name || existing.name, body.tier || existing.tier || 'free', JSON.stringify(body.components || existingComponents), JSON.stringify(nextSettings), id]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await getTemplate(id);
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    await pool.execute('DELETE FROM minisite_templates WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
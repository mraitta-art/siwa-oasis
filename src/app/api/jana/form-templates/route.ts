import { NextRequest, NextResponse } from 'next/server';
import { execute, query, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function parse(value: unknown, fallback: any = []) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}

async function ensureAdmin() {
  await requireAdmin();
}

export async function GET() {
  try {
    await ensureAdmin();
    const templates = await query(`
      SELECT ft.*, bt.name AS type_name
      FROM form_templates ft
      LEFT JOIN business_types bt ON bt.id = ft.type_id
      ORDER BY ft.name
    `) as any[];
    const assignments = await query(`
      SELECT fts.form_template_id, fts.section_id, fts.required, fts.sort_order, s.name AS section_name
      FROM form_template_sections fts
      LEFT JOIN sections s ON s.id = fts.section_id
      ORDER BY fts.form_template_id, fts.sort_order
    `) as any[];
    return NextResponse.json(templates.map(template => ({
      ...template,
      sections: assignments.filter(item => item.form_template_id === template.id),
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAdmin();
    const body = await request.json();
    const id = String(body.id || '').trim();
    const name = String(body.name || '').trim();
    const typeId = body.type_id || null;
    const sections = parse(body.sections, []);
    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    if (!Array.isArray(sections)) return NextResponse.json({ error: 'Sections must be an array' }, { status: 400 });

    await execute(`
      INSERT INTO form_templates (id, name, purpose, type_id, status, version, is_default, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), purpose=VALUES(purpose), type_id=VALUES(type_id), status=VALUES(status), version=VALUES(version), is_default=VALUES(is_default), description=VALUES(description)
    `, [id, name, body.purpose || 'onboarding', typeId, body.status || 'draft', Number(body.version) || 1, body.is_default ? 1 : 0, body.description || null]);

    await execute('DELETE FROM form_template_sections WHERE form_template_id = ?', [id]);
    for (const [index, item] of sections.entries()) {
      if (!item?.section_id) continue;
      await execute(`INSERT INTO form_template_sections (form_template_id, section_id, required, sort_order) VALUES (?, ?, ?, ?)`, [id, item.section_id, item.required ? 1 : 0, Number(item.sort_order ?? index)]);
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureAdmin();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const used = await queryOne('SELECT COUNT(*) AS count FROM minisite_templates WHERE recommended_form_template_id = ?', [id]) as any;
    if (Number(used?.count) > 0) return NextResponse.json({ error: 'This form template is assigned to a minisite template. Remove that assignment first.' }, { status: 409 });
    await execute('DELETE FROM form_templates WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

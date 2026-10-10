import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(`
      SELECT t.id AS template_id, t.category, t.label AS template_label, t.description AS template_description,
             f.id AS field_id, f.name, f.label, f.field_type, f.required, f.options, f.validation, f.applies_to, f.publicly_visible, f.display_order, f.active
      FROM vendor_service_templates t
      LEFT JOIN vendor_service_template_fields f ON f.template_id = t.id
      ORDER BY t.category, f.display_order, f.name`);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load service templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const templateId = String(body.template_id || '').trim();
    if (!templateId || !body.category || !body.label || !body.name || !body.field_type) {
      return NextResponse.json({ error: 'template_id, category, label, name, and field_type are required' }, { status: 400 });
    }
    const validFieldTypes = ['text', 'textarea', 'number', 'date', 'email', 'url', 'select', 'multiselect', 'boolean', 'checkbox'];
    if (!validFieldTypes.includes(body.field_type)) {
      return NextResponse.json({ error: 'Unsupported service field type' }, { status: 400 });
    }
    const appliesTo = body.applies_to && typeof body.applies_to === 'object' && body.applies_to.field && Array.isArray(body.applies_to.values)
      ? body.applies_to
      : null;
    const publiclyVisible = body.publicly_visible !== false;
    await execute(
      `INSERT INTO vendor_service_templates (id, category, label, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category), label = VALUES(label), description = VALUES(description), active = TRUE`,
      [templateId, body.category, body.template_label || body.label, body.template_description || null]
    );
    await execute(
      `INSERT INTO vendor_service_template_fields (id, template_id, name, label, field_type, required, options, validation, applies_to, publicly_visible, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), field_type = VALUES(field_type), required = VALUES(required), options = VALUES(options), validation = VALUES(validation), applies_to = VALUES(applies_to), publicly_visible = VALUES(publicly_visible), display_order = VALUES(display_order), active = TRUE`,
      [randomUUID(), templateId, body.name, body.label, body.field_type, body.required ? 1 : 0, JSON.stringify(body.options || []), JSON.stringify(body.validation || {}), appliesTo ? JSON.stringify(appliesTo) : null, publiclyVisible ? 1 : 0, Number(body.display_order) || 0]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save service template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template_id');
    const name = searchParams.get('name');
    if (!templateId || !name) return NextResponse.json({ error: 'template_id and name are required' }, { status: 400 });
    await execute(
      'UPDATE vendor_service_template_fields SET active = FALSE WHERE template_id = ? AND name = ?',
      [templateId, name]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to deactivate service field' }, { status: 500 });
  }
}
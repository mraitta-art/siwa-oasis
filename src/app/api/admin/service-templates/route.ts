import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    await requireAdmin();
    const rows = await query(`
      SELECT t.id AS template_id, t.category, t.label AS template_label, t.description AS template_description,
             f.id AS field_id, f.name, f.label, f.field_type, f.required, f.options, f.validation, f.display_order
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
    await execute(
      `INSERT INTO vendor_service_templates (id, category, label, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category), label = VALUES(label), description = VALUES(description), active = TRUE`,
      [templateId, body.category, body.template_label || body.label, body.template_description || null]
    );
    await execute(
      `INSERT INTO vendor_service_template_fields (id, template_id, name, label, field_type, required, options, validation, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), field_type = VALUES(field_type), required = VALUES(required), options = VALUES(options), validation = VALUES(validation), display_order = VALUES(display_order), active = TRUE`,
      [randomUUID(), templateId, body.name, body.label, body.field_type, body.required ? 1 : 0, JSON.stringify(body.options || []), JSON.stringify(body.validation || {}), Number(body.display_order) || 0]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save service template' }, { status: 500 });
  }
}
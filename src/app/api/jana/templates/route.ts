import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * MINISITE TEMPLATES API
 * Manages minisite templates stored in `minisite_templates` table.
 * Schema: id, name, category_id (parent type), tier, components (JSON), settings (JSON)
 */

// GET: Load all minisite templates, joined with their parent business type name
export async function GET(request: NextRequest) {
  try {
    const results = await query(`
      SELECT mt.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color
      FROM minisite_templates mt
      LEFT JOIN business_types bt ON mt.category_id = bt.id
      ORDER BY bt.name, mt.name
    `);
    // Normalize for frontend: map DB columns to expected interface
    const normalized = (results as any[]).map(t => ({
      ...t,
      type_id: t.category_id,
      level: t.tier,
      layout: typeof t.components === 'string' ? JSON.parse(t.components) : t.components || [],
      features: typeof t.settings === 'string' ? JSON.parse(t.settings) : t.settings || {},
    }));
    return NextResponse.json(normalized);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create or update minisite template — category_id (parent) is optional for universal templates
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, type_id, level, description, layout, features } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    // Map frontend fields to DB columns
    const category_id = type_id || null;
    const tier = level || 'basic';
    const components = JSON.stringify(layout || []);
    const settings = JSON.stringify({ ...(features || {}), description: description || '' });

    await execute(`
      INSERT INTO minisite_templates (id, name, category_id, tier, components, settings)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      category_id = VALUES(category_id),
      tier = VALUES(tier),
      components = VALUES(components),
      settings = VALUES(settings)
    `, [id, name, category_id, tier, components, settings]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete minisite template
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

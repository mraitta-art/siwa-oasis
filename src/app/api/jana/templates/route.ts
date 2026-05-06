import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET: Load all templates, joined with their parent business type name
export async function GET(request: NextRequest) {
  try {
    const results = await query(`
      SELECT wt.*, bt.name as type_name, bt.icon as type_icon, bt.icon_color as type_icon_color
      FROM website_templates wt
      LEFT JOIN business_types bt ON wt.type_id = bt.id
      ORDER BY bt.name, wt.name
    `);
    return NextResponse.json(results);
  } catch (e: any) {
    // Auto-heal: create table if it doesn't exist
    if (e.message.includes("doesn't exist")) {
      await execute(`
        CREATE TABLE website_templates (
          id VARCHAR(100) PRIMARY KEY,
          type_id VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          level VARCHAR(50) DEFAULT 'standard',
          description TEXT,
          layout JSON,
          features JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (type_id) REFERENCES business_types(id) ON DELETE CASCADE
        )
      `);
      return NextResponse.json([]);
    }
    // Auto-heal: add type_id column if it's missing from an older installation
    if (e.message.includes("Unknown column 'wt.type_id'") || e.message.includes("type_id")) {
      await execute(`ALTER TABLE website_templates ADD COLUMN IF NOT EXISTS type_id VARCHAR(100) DEFAULT NULL`);
      const results = await query('SELECT * FROM website_templates ORDER BY name');
      return NextResponse.json(results);
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create or update template — type_id (parent) is REQUIRED
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, type_id, level, description, layout, features } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }
    if (!type_id) {
      return NextResponse.json({ error: 'A parent Business Type must be assigned. Templates cannot be standalone.' }, { status: 400 });
    }

    await execute(`
      INSERT INTO website_templates (id, type_id, name, level, description, layout, features)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      type_id = VALUES(type_id),
      name = VALUES(name),
      level = VALUES(level),
      description = VALUES(description),
      layout = VALUES(layout),
      features = VALUES(features)
    `, [id, type_id, name, level || 'standard', description, JSON.stringify(layout || []), JSON.stringify(features || {})]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete template
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await execute('DELETE FROM website_templates WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

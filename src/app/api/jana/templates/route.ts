import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET: Load all templates
export async function GET(request: NextRequest) {
  try {
    const results = await query('SELECT * FROM website_templates ORDER BY name');
    return NextResponse.json(results);
  } catch (e: any) {
    // If table doesn't exist, create it (Auto-healing)
    if (e.message.includes("doesn't exist")) {
      await execute(`
        CREATE TABLE website_templates (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          layout JSON,
          features JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create or update template
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, name, description, layout, features } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    await execute(`
      INSERT INTO website_templates (id, name, description, layout, features)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      layout = VALUES(layout),
      features = VALUES(features)
    `, [id, name, description, JSON.stringify(layout || []), JSON.stringify(features || {})]);

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

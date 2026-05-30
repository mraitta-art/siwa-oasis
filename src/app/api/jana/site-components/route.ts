import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/jana/site-components
 * List all registered components with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const enabled = searchParams.get('enabled');
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    // Get single component by ID
    if (id) {
      const [component] = await query('SELECT * FROM site_components WHERE id = ?', [id]);
      if (!component) {
        return NextResponse.json({ error: 'Component not found' }, { status: 404 });
      }
      return NextResponse.json(component);
    }

    // Build filter query
    let sql = 'SELECT * FROM site_components WHERE 1=1';
    const params: any[] = [];

    if (zone) {
      sql += ' AND zone = ?';
      params.push(zone);
    }

    if (enabled !== null) {
      sql += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY sort_order ASC, name ASC';

    const components = await query(sql, params);
    return NextResponse.json(components);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/jana/site-components
 * Register a new component
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const user = await requireAdmin();

    const body = await request.json();
    const {
      key,
      name,
      description,
      icon,
      zone,
      category,
      manager_url,
      default_props,
      required_props,
      min_version,
      sort_order
    } = body;

    if (!key || !name || !zone) {
      return NextResponse.json(
        { error: 'key, name, and zone are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();

    await execute(
      `INSERT INTO site_components (id, \`key\`, name, description, icon, zone, category, manager_url, default_props, required_props, min_version, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        key,
        name,
        description || null,
        icon || null,
        zone,
        category || null,
        manager_url || null,
        default_props ? JSON.stringify(default_props) : null,
        required_props ? JSON.stringify(required_props) : null,
        min_version || null,
        sort_order || 999,
        user.id
      ]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/jana/site-components
 * Update component properties
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build dynamic update query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const val = updates[f];
      if (f === 'default_props' || f === 'required_props') {
        return typeof val === 'string' ? val : JSON.stringify(val);
      }
      return val;
    });
    values.push(id);

    await execute(
      `UPDATE site_components SET ${setClauses} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/jana/site-components
 * Delete a component registration
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await execute('DELETE FROM site_components WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

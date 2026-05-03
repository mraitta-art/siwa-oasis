import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: List all components in library
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    const components = await query(
      `SELECT * FROM component_library 
       ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    return NextResponse.json(components);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create new component
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      name,
      type,
      category,
      config,
      thumbnail,
      description,
      is_global = true
    } = body;

    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Name, type, and config are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO component_library 
       (name, type, category, config, thumbnail, description, is_global)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, category || 'general', JSON.stringify(config), thumbnail || null, description || '', is_global]
    );

    // Log creation
    await query(
      `INSERT INTO component_usage_log (component_library_id, action)
       VALUES (?, 'created')`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Component saved to library'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

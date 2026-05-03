import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: Get single component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const component = await query(
      'SELECT * FROM component_library WHERE id = ?',
      [params.id]
    );

    if (component.length === 0) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    return NextResponse.json(component[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update component
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, category, config, thumbnail, description, is_global, is_active } = body;

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      values.push(category);
    }
    if (config !== undefined) {
      fields.push('config = ?');
      values.push(JSON.stringify(config));
    }
    if (thumbnail !== undefined) {
      fields.push('thumbnail = ?');
      values.push(thumbnail);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (is_global !== undefined) {
      fields.push('is_global = ?');
      values.push(is_global);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id);

    await query(
      `UPDATE component_library SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    // Log update
    await query(
      `INSERT INTO component_usage_log (component_library_id, action)
       VALUES (?, 'updated')`,
      [params.id]
    );

    return NextResponse.json({ success: true, message: 'Component updated' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete component
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    await query('DELETE FROM component_library WHERE id = ?', [params.id]);

    return NextResponse.json({ success: true, message: 'Component deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visibleOnly') === 'true';

    let query = 'SELECT * FROM page_experience_categories';
    if (visibleOnly) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY display_order ASC';

    const categories = await db.query(query);
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('GET /api/jana/experience-categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, subtitle, icon, image_url, color, link, display_order } = body;

    if (!id || !title || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      INSERT INTO page_experience_categories (id, title, subtitle, icon, image_url, color, link, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        icon = VALUES(icon),
        image_url = VALUES(image_url),
        color = VALUES(color),
        link = VALUES(link),
        display_order = VALUES(display_order)
    `;

    await db.query(query, [id, title, subtitle, icon, image_url, color, link, display_order || 0]);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/jana/experience-categories:', error);
    return NextResponse.json({ error: 'Failed to create/update category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_visible, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    }

    const updates = [];
    const params = [];

    if (typeof is_visible === 'boolean') {
      updates.push('is_visible = ?');
      params.push(is_visible);
    }

    if (typeof display_order === 'number') {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    params.push(id);
    const query = `UPDATE page_experience_categories SET ${updates.join(', ')} WHERE id = ?`;

    await db.query(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/jana/experience-categories:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    }

    await db.query('DELETE FROM page_experience_categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/jana/experience-categories:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

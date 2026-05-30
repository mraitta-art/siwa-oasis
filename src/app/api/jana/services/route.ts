import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visibleOnly') === 'true';

    let query = 'SELECT * FROM page_services';
    if (visibleOnly) {
      query += ' WHERE is_visible = 1';
    }
    query += ' ORDER BY display_order ASC';

    const services = await db.query(query);
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error('GET /api/jana/services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, tagline, icon, color, image_url, search_link, display_order } = body;

    if (!id || !name || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      INSERT INTO page_services (id, name, tagline, icon, color, image_url, search_link, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        tagline = VALUES(tagline),
        icon = VALUES(icon),
        color = VALUES(color),
        image_url = VALUES(image_url),
        search_link = VALUES(search_link),
        display_order = VALUES(display_order)
    `;

    await db.query(query, [id, name, tagline, icon, color, image_url, search_link, display_order || 0]);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/jana/services:', error);
    return NextResponse.json({ error: 'Failed to create/update service' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_visible, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
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
    const query = `UPDATE page_services SET ${updates.join(', ')} WHERE id = ?`;

    await db.query(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/jana/services:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    await db.query('DELETE FROM page_services WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/jana/services:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}

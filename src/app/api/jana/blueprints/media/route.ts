import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/jana/blueprints/media?business_id=X&chapter=cuisine
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const chapter = searchParams.get('chapter');
    if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

    let sql = 'SELECT * FROM business_media WHERE business_id = ?';
    const params: any[] = [businessId];
    if (chapter) { sql += ' AND chapter = ?'; params.push(chapter); }
    sql += ' ORDER BY uploaded_at DESC';

    const media = await query(sql, params);
    return NextResponse.json(media);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/jana/blueprints/media — upload a media record (Cloudinary URL already obtained client-side)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { business_id, chapter, url, public_id, type = 'image', caption } = body;
    if (!business_id || !chapter || !url) {
      return NextResponse.json({ error: 'business_id, chapter, url required' }, { status: 400 });
    }

    const id = uuidv4();
    await execute(
      `INSERT INTO business_media (id, business_id, chapter, url, public_id, type, caption) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, business_id, chapter, url, public_id || null, type, caption || null]
    );

    return NextResponse.json({ id, url }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/jana/blueprints/media — update caption
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, caption } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await execute('UPDATE business_media SET caption = ? WHERE id = ?', [caption || null, id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/jana/blueprints/media?id=X
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Get public_id for Cloudinary deletion (client handles actual Cloudinary delete)
    const [media] = await query<{ public_id: string | null }>(
      'SELECT public_id FROM business_media WHERE id = ?', [id]
    );

    await execute('DELETE FROM business_media WHERE id = ?', [id]);
    return NextResponse.json({ success: true, public_id: (media as any)?.public_id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

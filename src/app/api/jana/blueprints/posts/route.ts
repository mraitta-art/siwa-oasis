import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/jana/blueprints/posts?business_id=X
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

    const posts = await query(
      'SELECT * FROM business_posts WHERE business_id = ? ORDER BY created_at DESC',
      [businessId]
    );
    return NextResponse.json(posts);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/jana/blueprints/posts — create post
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { business_id, title, body: postBody, cover_url, category, published } = body;
    if (!business_id || !title) return NextResponse.json({ error: 'business_id and title required' }, { status: 400 });

    const id = uuidv4();
    await execute(
      `INSERT INTO business_posts (id, business_id, title, body, cover_url, category, published) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, business_id, title, postBody || null, cover_url || null, category || null, published ? 1 : 0]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/jana/blueprints/posts — update post
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, title, body: postBody, cover_url, category, published } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await execute(
      `UPDATE business_posts SET title=?, body=?, cover_url=?, category=?, published=?, updated_at=NOW() WHERE id=?`,
      [title, postBody || null, cover_url || null, category || null, published ? 1 : 0, id]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/jana/blueprints/posts?id=X
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await execute('DELETE FROM business_posts WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

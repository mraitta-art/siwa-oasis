import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const categories = await query(
      'SELECT id, name, slug, description, color, icon, parent_id, sort_order, post_count FROM blog_categories ORDER BY sort_order, name'
    );
    return NextResponse.json(categories || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      name,
      slug,
      description,
      color,
      icon,
      parent_id,
      sort_order
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const categorySlug = normalizeSlug(slug || name);

    await query(
      `INSERT INTO blog_categories (name, slug, description, color, icon, parent_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        categorySlug,
        description || '',
        color || '#3B82F6',
        icon || 'fas fa-folder',
        parent_id || null,
        sort_order || 0
      ]
    );

    return NextResponse.json({ success: true, message: 'Category created' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      id,
      name,
      slug,
      description,
      color,
      icon,
      parent_id,
      sort_order
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Category id and name are required' }, { status: 400 });
    }

    const categorySlug = normalizeSlug(slug || name);

    await query(
      `UPDATE blog_categories
       SET name = ?, slug = ?, description = ?, color = ?, icon = ?, parent_id = ?, sort_order = ?
       WHERE id = ?`,
      [
        name,
        categorySlug,
        description || '',
        color || '#3B82F6',
        icon || 'fas fa-folder',
        parent_id || null,
        sort_order || 0,
        id
      ]
    );

    return NextResponse.json({ success: true, message: 'Category updated' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    // Clear category references on posts before deleting the category
    await query('UPDATE blog_posts SET category_id = NULL WHERE category_id = ?', [id]);
    await query('DELETE FROM blog_categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Category removed' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

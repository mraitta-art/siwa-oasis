import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: Get a single blog post by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const posts = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              u.display_name as author_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u ON p.author_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!posts || (posts as any[]).length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = (posts as any[])[0];

    // Get tags
    const tags = await query(
      `SELECT t.* FROM blog_tags t
       JOIN blog_post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [id]
    );
    post.tags = tags;

    return NextResponse.json({ post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: Update a blog post by id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      author_id,
      category_id,
      status,
      published_at,
      meta_title,
      meta_description,
      meta_keywords,
      tags = []
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Calculate reading time
    const wordCount = content.split(/\s+/).length;
    const reading_time = Math.ceil(wordCount / 200);

    // Update post
    await query(
      `UPDATE blog_posts
       SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?,
           author_id = ?, category_id = ?, status = ?, published_at = ?,
           meta_title = ?, meta_description = ?, meta_keywords = ?, reading_time = ?
       WHERE id = ?`,
      [
        title,
        slug,
        excerpt || '',
        content,
        featured_image || null,
        author_id || null,
        category_id || null,
        status || 'draft',
        published_at || null,
        meta_title || title,
        meta_description || excerpt,
        meta_keywords || '',
        reading_time,
        id
      ]
    );

    // Handle tags (delete all and re-add)
    await query('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);

    if (tags.length > 0) {
      for (const tagName of tags) {
        let tag = await query('SELECT id FROM blog_tags WHERE name = ?', [tagName]);
        if ((tag as any[]).length === 0) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          await query('INSERT INTO blog_tags (name, slug) VALUES (?, ?)', [tagName, tagSlug]);
          tag = await query('SELECT id FROM blog_tags WHERE slug = ?', [tagSlug]);
        }
        await query(
          'INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
          [id, (tag as any[])[0].id]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Blog post updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove a blog post by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Check post exists
    const existing = await query('SELECT id, category_id FROM blog_posts WHERE id = ?', [id]);
    if (!existing || (existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = (existing as any[])[0];

    // Delete post-tag relationships first
    await query('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);

    // Delete the post
    await query('DELETE FROM blog_posts WHERE id = ?', [id]);

    // Update category post count if applicable
    if (post.category_id) {
      await query(
        'UPDATE blog_categories SET post_count = GREATEST(post_count - 1, 0) WHERE id = ?',
        [post.category_id]
      );
    }

    return NextResponse.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

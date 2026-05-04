import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: List all blog posts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params: any[] = [];

    if (status !== 'all') {
      whereClause += ' WHERE p.status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += whereClause ? ' AND p.category_id = ?' : ' WHERE p.category_id = ?';
      params.push(category);
    }

    // Get posts
    const posts = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, 
              u.display_name as author_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u ON p.author_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM blog_posts p ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get tags for each post
    for (const post of posts) {
      const tags = await query(
        `SELECT t.* FROM blog_tags t 
         JOIN blog_post_tags pt ON t.id = pt.tag_id 
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags;
    }

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create new blog post
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
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

    // Calculate reading time (approx 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const reading_time = Math.ceil(wordCount / 200);

    // Insert post
    const result = await query(
      `INSERT INTO blog_posts 
       (title, slug, excerpt, content, featured_image, author_id, category_id, 
        status, published_at, meta_title, meta_description, meta_keywords, reading_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        reading_time
      ]
    );

    const postId = (result as any).insertId;

    // Add tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        // Find or create tag
        let tag = await query('SELECT id FROM blog_tags WHERE name = ?', [tagName]);
        
        if (tag.length === 0) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          await query(
            'INSERT INTO blog_tags (name, slug) VALUES (?, ?)',
            [tagName, tagSlug]
          );
          tag = await query('SELECT id FROM blog_tags WHERE slug = ?', [tagSlug]);
        }

        // Link tag to post
        await query(
          'INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tag[0].id]
        );

        // Update tag usage count
        await query(
          'UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = ?',
          [tag[0].id]
        );
      }
    }

    // Update category post count
    if (category_id) {
      await query(
        'UPDATE blog_categories SET post_count = post_count + 1 WHERE id = ?',
        [category_id]
      );
    }

    return NextResponse.json({
      success: true,
      id: postId,
      message: 'Blog post created successfully'
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

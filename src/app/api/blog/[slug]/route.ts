import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch a single published blog post by slug (public - no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch the post by slug — only published posts for public access
    const posts = await query(
      `SELECT p.*,
              c.name  AS category_name,
              c.slug  AS category_slug,
              c.color AS category_color,
              u.display_name AS author_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u        ON p.author_id    = u.id
       WHERE p.slug = ? AND p.status = 'published'
       LIMIT 1`,
      [slug]
    );

    if (!posts || (posts as any[]).length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = (posts as any[])[0];

    // Increment view count (fire-and-forget — don't block the response)
    query('UPDATE blog_posts SET views = views + 1 WHERE id = ?', [post.id]).catch(() => {});

    // Fetch tags for this post
    const tags = await query(
      `SELECT t.id, t.name, t.slug
       FROM blog_tags t
       JOIN blog_post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [post.id]
    );
    post.tags = tags || [];

    // Fetch related posts (same category, excluding this one, max 3)
    const related = await query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image,
              p.reading_time, p.published_at,
              c.name AS category_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       WHERE p.status = 'published'
         AND p.id != ?
         AND p.category_id = ?
       ORDER BY p.published_at DESC
       LIMIT 3`,
      [post.id, post.category_id]
    );

    return NextResponse.json({ post, related: related || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

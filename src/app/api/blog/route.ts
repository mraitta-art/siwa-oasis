import { NextRequest, NextResponse } from 'next/server';
import { query as safeQuery } from '@/lib/db';

// GET: List published blog posts for public viewing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const location = searchParams.get('location');
    if (location && (!location.startsWith('/') || location.startsWith('//'))) {
      return NextResponse.json({ error: 'Invalid blog page location' }, { status: 400 });
    }
    const locationFilter = location
      ? location === '/blog'
        ? ` AND p.target_type IN ('mainsite', 'landing_page')
            AND (p.target_page_slug = ? OR (p.target_type = 'mainsite' AND p.target_page_slug IS NULL))`
        : ` AND p.target_type IN ('mainsite', 'landing_page') AND p.target_page_slug = ?`
      : '';
    const locationParams = location ? [location] : [];

    // Get published posts
    const posts = await safeQuery(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              u.display_name as author_name
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u ON p.author_id = u.id
       WHERE p.status = 'published'${locationFilter}
       ORDER BY p.published_at DESC
       LIMIT ? OFFSET ?`,
      [...locationParams, limit, offset]
    );

    // Get total count
    const countResult: any = await safeQuery(
      `SELECT COUNT(*) as total FROM blog_posts p WHERE p.status = 'published'${locationFilter}`,
      locationParams
    );
    const total = countResult[0]?.total || 0;

    // Get tags for each post
    for (const post of posts) {
      const tags: any = await safeQuery(
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

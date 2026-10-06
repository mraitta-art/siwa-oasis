import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, execute } from '@/lib/db';

async function syncToBusinessSection(
  businessId: string,
  sectionId: string,
  blogData: { title: string; content: string; excerpt?: string; featured_image?: string }
) {
  try {
    // 1. Update businesses custom_data
    const rows = await query<any>(`SELECT id, custom_data FROM businesses WHERE id = ?`, [businessId]);
    if (rows && rows.length > 0) {
      let cd = rows[0].custom_data;
      if (typeof cd === 'string') {
        try {
          cd = JSON.parse(cd);
        } catch {
          cd = {};
        }
      } else if (!cd || typeof cd !== 'object') {
        cd = {};
      }
      if (!cd[sectionId]) cd[sectionId] = {};
      cd[sectionId].section_blog = blogData.content;
      cd[sectionId].section_blog_title = blogData.title;
      if (blogData.excerpt) cd[sectionId].description = blogData.excerpt;

      await execute(`UPDATE businesses SET custom_data = ?, updated_at = NOW() WHERE id = ?`, [
        JSON.stringify(cd),
        businessId,
      ]);
    }

    // 2. Also upsert in section_blogs table
    const existing = await query<any>(
      `SELECT id FROM section_blogs WHERE business_id = ? AND section_id = ?`,
      [businessId, sectionId]
    );
    if (existing && existing.length > 0) {
      await execute(
        `UPDATE section_blogs 
         SET title = ?, content = ?, excerpt = ?, featured_image_url = ?, status = 'published', show_on_minisite = 1, updated_at = NOW()
         WHERE id = ?`,
        [blogData.title, blogData.content, blogData.excerpt || '', blogData.featured_image || null, existing[0].id]
      );
    } else {
      const slug =
        blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'section-story';
      await execute(
        `INSERT INTO section_blogs (section_id, business_id, title, slug, content, excerpt, featured_image_url, status, show_on_minisite, approved_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, 1)`,
        [sectionId, businessId, blogData.title, slug, blogData.content, blogData.excerpt || '', blogData.featured_image || null]
      );
    }
  } catch (err) {
    console.error('syncToBusinessSection error:', err);
  }
}

// GET: List all blog posts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');
    const targetType = searchParams.get('target_type');
    const businessId = searchParams.get('business_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let conditions: string[] = [];
    let params: any[] = [];

    if (status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('p.category_id = ?');
      params.push(category);
    }

    if (targetType) {
      conditions.push('p.target_type = ?');
      params.push(targetType);
    }

    if (businessId) {
      conditions.push('p.target_business_id = ?');
      params.push(businessId);
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    // Get posts
    const posts = await query<any>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, 
              u.display_name as author_name,
              b.name as target_business_name, b.slug as target_business_slug
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u ON p.author_id = u.id
       LEFT JOIN businesses b ON p.target_business_id = b.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query<any>(
      `SELECT COUNT(*) as total FROM blog_posts p ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get tags for each post
    for (const post of posts) {
      const tags = await query<any>(
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
        pages: Math.ceil(total / limit),
      },
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
      tags = [],
      target_type = 'mainsite',
      target_business_id = null,
      target_section_id = null,
      target_template_id = null,
      target_page_slug = null,
      target_meta = null,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    // Calculate reading time (approx 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const reading_time = Math.ceil(wordCount / 200);

    // Insert post
    const result = await query<any>(
      `INSERT INTO blog_posts 
       (title, slug, excerpt, content, featured_image, author_id, category_id, 
        status, published_at, meta_title, meta_description, meta_keywords, reading_time,
        target_type, target_business_id, target_section_id, target_template_id, target_page_slug, target_meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        excerpt || '',
        content,
        featured_image || null,
        author_id || null,
        category_id || null,
        status || 'draft',
        published_at || (status === 'published' ? new Date() : null),
        meta_title || title,
        meta_description || excerpt || '',
        meta_keywords || '',
        reading_time,
        target_type,
        target_business_id,
        target_section_id,
        target_template_id,
        target_page_slug,
        target_meta ? JSON.stringify(target_meta) : null,
      ]
    );

    const postId = (result as any)?.insertId;

    // Add tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        let tag = await query<any>('SELECT id FROM blog_tags WHERE name = ?', [tagName]);

        if (tag.length === 0) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          await query('INSERT INTO blog_tags (name, slug) VALUES (?, ?)', [tagName, tagSlug]);
          tag = await query<any>('SELECT id FROM blog_tags WHERE slug = ?', [tagSlug]);
        }

        if (tag[0]?.id) {
          await query('INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tag[0].id]);
          await query('UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = ?', [tag[0].id]);
        }
      }
    }

    // If target is a business section, sync directly to the business data
    if (target_type === 'business_section' && target_business_id && target_section_id) {
      await syncToBusinessSection(target_business_id, target_section_id, {
        title,
        content,
        excerpt,
        featured_image,
      });
    }

    return NextResponse.json({
      success: true,
      id: postId,
      message: 'Blog post created successfully',
    });
  } catch (e: any) {
    console.error('Create blog post error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

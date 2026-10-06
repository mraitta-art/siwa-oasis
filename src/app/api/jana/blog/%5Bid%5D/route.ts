import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, execute } from '@/lib/db';

async function syncToBusinessSection(
  businessId: string,
  sectionId: string,
  blogData: { title: string; content: string; excerpt?: string; featured_image?: string }
) {
  try {
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

// GET: Get a single blog post by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const posts = await query<any>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              u.display_name as author_name,
              b.name as target_business_name, b.slug as target_business_slug
       FROM blog_posts p
       LEFT JOIN blog_categories c ON p.category_id = c.id
       LEFT JOIN profiles u ON p.author_id = u.id
       LEFT JOIN businesses b ON p.target_business_id = b.id
       WHERE p.id = ?`,
      [id]
    );

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Get tags
    const tags = await query<any>(
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

    const wordCount = content.split(/\s+/).length;
    const reading_time = Math.ceil(wordCount / 200);

    // Update post
    await execute(
      `UPDATE blog_posts
       SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?,
           author_id = ?, category_id = ?, status = ?, published_at = ?,
           meta_title = ?, meta_description = ?, meta_keywords = ?, reading_time = ?,
           target_type = ?, target_business_id = ?, target_section_id = ?, target_template_id = ?,
           target_page_slug = ?, target_meta = ?, updated_at = NOW()
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
        id,
      ]
    );

    // Update tags
    await execute('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);
    if (tags.length > 0) {
      for (const tagName of tags) {
        let tag = await query<any>('SELECT id FROM blog_tags WHERE name = ?', [tagName]);

        if (tag.length === 0) {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          await query('INSERT INTO blog_tags (name, slug) VALUES (?, ?)', [tagName, tagSlug]);
          tag = await query<any>('SELECT id FROM blog_tags WHERE slug = ?', [tagSlug]);
        }

        if (tag[0]?.id) {
          await query('INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)', [id, tag[0].id]);
        }
      }
    }

    // Sync to section if target is a business section
    if (target_type === 'business_section' && target_business_id && target_section_id) {
      await syncToBusinessSection(target_business_id, target_section_id, {
        title,
        content,
        excerpt,
        featured_image,
      });
    }

    return NextResponse.json({ success: true, message: 'Post updated successfully' });
  } catch (e: any) {
    console.error('Update post error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Delete a blog post by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await execute('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);
    await execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

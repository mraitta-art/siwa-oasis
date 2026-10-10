import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { findBusinessSectionBlogConflict, syncBusinessSectionBlogContent } from '@/lib/blog-distribution';
import { execute, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const sectionId = searchParams.get('section_id');
    const language = searchParams.get('language') || 'en';
    const excludePostId = searchParams.get('exclude_post_id') || undefined;
    const excludeSectionBlogId = searchParams.get('exclude_section_blog_id') || undefined;

    if (!businessId || !sectionId) {
      return NextResponse.json({ error: 'Business and section are required' }, { status: 400 });
    }

    if (!['en', 'ar'].includes(language)) {
      return NextResponse.json({ error: 'Unsupported blog language' }, { status: 400 });
    }

    const conflict = await findBusinessSectionBlogConflict(
      businessId,
      sectionId,
      language,
      excludePostId,
      excludeSectionBlogId,
    );
    return NextResponse.json({ available: !conflict, conflict });
  } catch (error) {
    console.error('Failed to check business section blog availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to check section blog availability' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      blog_id: blogId,
      business_id: businessId,
      section_id: sectionId,
      title,
      content,
      excerpt,
      language = 'en',
      add_to_section_content: addToSectionContent = false,
    } = body;
    if (!blogId || !businessId || !sectionId || !title || !content) {
      return NextResponse.json({ error: 'Blog, business, section, title, and content are required' }, { status: 400 });
    }
    if (!['en', 'ar'].includes(language)) {
      return NextResponse.json({ error: 'Unsupported blog language' }, { status: 400 });
    }

    const rows = await query<{ id: string }>(
      'SELECT id FROM section_blogs WHERE id = ? AND business_id = ? AND section_id = ? LIMIT 1',
      [blogId, businessId, sectionId],
    );
    if (!rows[0]) return NextResponse.json({ error: 'Section blog not found' }, { status: 404 });
    const conflict = await findBusinessSectionBlogConflict(businessId, sectionId, language, undefined, blogId);
    if (conflict) {
      return NextResponse.json({
        error: `Another ${language === 'ar' ? 'Arabic' : 'English'} blog already exists for this section: "${conflict.title}".`,
        conflict,
      }, { status: 409 });
    }

    await execute(
      `UPDATE section_blogs
       SET title = ?, content = ?, excerpt = ?, status = 'published',
           language = ?, published_at = COALESCE(published_at, NOW()), updated_at = NOW()
       WHERE id = ? AND business_id = ? AND section_id = ?`,
      [title, content, excerpt || '', language, blogId, businessId, sectionId],
    );
    if (addToSectionContent) {
      await syncBusinessSectionBlogContent(businessId, sectionId, language, { title, content, excerpt });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update section blog:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update section blog' },
      { status: 500 },
    );
  }
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionId: string; blogId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId, blogId } = await params;
    const { title, content, excerpt, show_on_main, show_on_minisite } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
    }

    // Retrieve original post to verify ownership
    const [original] = await db.query(
      'SELECT business_id, status FROM section_blogs WHERE id = ?',
      [blogId]
    );

    if (!original || (original as any[]).length === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const post = (original as any[])[0];
    if (post.business_id !== user.businessId) {
      return NextResponse.json({ error: 'Unauthorized to modify this blog post' }, { status: 403 });
    }

    // Check if title changed to update slug
    let slugUpdate = '';
    const paramsList = [title, content, excerpt || content.substring(0, 160)];
    
    // Check curation policy to decide status update
    const [secRows] = await db.query(
      'SELECT curation_policy, auto_publish_blogs FROM sections WHERE id = ?',
      [sectionId]
    );
    const section = (secRows as any[])?.[0];
    const status = section?.auto_publish_blogs ? 'published' : 'pending_approval';
    const publishedAt = section?.auto_publish_blogs ? new Date() : null;

    const updateQuery = `
      UPDATE section_blogs
      SET title = ?, content = ?, excerpt = ?, status = ?, published_at = ?, show_on_main = ?, show_on_minisite = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    paramsList.push(status, publishedAt, show_on_main !== false, show_on_minisite !== false, blogId);

    await db.query(updateQuery, paramsList);

    return NextResponse.json({
      success: true,
      status,
      message: status === 'published' ? '✅ Updated & Published!' : '⏳ Updated & Submitted for approval'
    });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sectionId: string; blogId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blogId } = await params;

    // Verify ownership
    const [original] = await db.query(
      'SELECT business_id FROM section_blogs WHERE id = ?',
      [blogId]
    );

    if (!original || (original as any[]).length === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const post = (original as any[])[0];
    if (post.business_id !== user.businessId) {
      return NextResponse.json({ error: 'Unauthorized to delete this blog post' }, { status: 403 });
    }

    await db.query('DELETE FROM section_blogs WHERE id = ?', [blogId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}

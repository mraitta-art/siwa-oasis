import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, approval_notes } = await request.json();

    if (!status || !['published', 'rejected'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const query = `
      UPDATE section_blogs
      SET 
        status = ?,
        approval_notes = ?,
        published_at = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const publishedAt = status === 'published' ? new Date() : null;

    await db.query(query, [status, approval_notes || '', publishedAt, id]);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update blog error:', error);
    return Response.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { approval_status, is_hero } = await request.json();

    let query = `UPDATE vendor_gallery SET `;
    const updates: string[] = [];
    const values: any[] = [];

    if (approval_status) {
      updates.push('approval_status = ?');
      values.push(approval_status);
    }

    if (is_hero !== undefined) {
      updates.push('is_hero = ?');
      values.push(is_hero ? 1 : 0);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    query += updates.join(', ') + ` WHERE id = ?`;
    values.push(id);

    await db.query(query, values);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update image error:', error);
    return Response.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Update hero status
    const query = `
      UPDATE vendor_gallery
      SET is_hero = TRUE, updated_at = NOW()
      WHERE id = ? AND vendor_id = ?
    `;

    await db.query(query, [id, user.id]);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Hero update error:', error);
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete image
    const query = `
      DELETE FROM vendor_gallery
      WHERE id = ? AND vendor_id = ?
    `;

    await db.query(query, [id, user.id]);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

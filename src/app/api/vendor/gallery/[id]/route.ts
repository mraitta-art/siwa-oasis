import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (body.caption !== undefined) {
      updates.push('caption = ?');
      values.push(body.caption);
    }
    
    if (body.is_hero !== undefined) {
      updates.push('is_hero = ?');
      values.push(body.is_hero ? 1 : 0);
    }

    if (body.show_on_main !== undefined) {
      updates.push('show_on_main = ?');
      values.push(body.show_on_main ? 1 : 0);
    }

    if (body.show_on_minisite !== undefined) {
      updates.push('show_on_minisite = ?');
      values.push(body.show_on_minisite ? 1 : 0);
    }

    if (body.placement !== undefined) {
      updates.push('placement = ?');
      values.push(body.placement);
    }

    if (body.section_id !== undefined) {
      updates.push('section_id = ?');
      values.push(body.section_id);
    }

    if (body.slide_data !== undefined) {
      updates.push('slide_data = ?');
      values.push(typeof body.slide_data === 'string'
        ? body.slide_data
        : JSON.stringify(body.slide_data));
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    
    const query = `
      UPDATE vendor_gallery
      SET ${updates.join(', ')}
      WHERE id = ? AND vendor_id = ?
    `;

    values.push(id, user.id);

    await db.query(query, values);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Gallery item update error:', error);
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

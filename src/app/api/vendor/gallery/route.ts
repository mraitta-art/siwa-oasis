import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor's gallery items
    const query = `
      SELECT 
        id,
        url,
        caption,
        is_hero,
        created_at as uploadedAt
      FROM vendor_gallery
      WHERE vendor_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const items = await db.query(query, [user.id]);
    return Response.json(items || []);
  } catch (error) {
    console.error('Get gallery error:', error);
    return Response.json({ error: 'Failed to load gallery' }, { status: 500 });
  }
}

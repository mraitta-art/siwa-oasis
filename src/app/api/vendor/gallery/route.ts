import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section');

    let query = `
      SELECT 
        id,
        url,
        caption,
        is_hero,
        show_on_main,
        show_on_minisite,
        approval_status,
        created_at as uploadedAt
      FROM vendor_gallery
      WHERE vendor_id = ?
    `;

    const params: any[] = [user.id];

    if (sectionId) {
      query += ` AND section_id = ?`;
      params.push(sectionId);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const items = await db.query(query, params);
    return Response.json(items || []);
  } catch (error) {
    console.error('Get gallery error:', error);
    return Response.json({ error: 'Failed to load gallery' }, { status: 500 });
  }
}

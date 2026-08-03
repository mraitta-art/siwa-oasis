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
        g.id,
        g.url,
        g.caption,
        g.is_hero,
        g.section_id,
        s.name as section_name,
        g.show_on_main,
        g.show_on_minisite,
        g.approval_status,
        g.created_at as uploadedAt
      FROM vendor_gallery g
      LEFT JOIN sections s ON g.section_id = s.id
      WHERE g.vendor_id = ?
    `;

    const params: any[] = [user.id];

    if (sectionId) {
      query += ` AND g.section_id = ?`;
      params.push(sectionId);
    }

    query += ` ORDER BY g.created_at DESC LIMIT 100`;

    const items = await db.query(query, params);
    return Response.json(items || []);
  } catch (error) {
    console.error('Get gallery error:', error);
    return Response.json({ error: 'Failed to load gallery' }, { status: 500 });
  }
}

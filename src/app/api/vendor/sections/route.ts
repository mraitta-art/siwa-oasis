import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor's sections
    const query = `
      SELECT 
        s.id,
        s.name,
        s.icon
      FROM sections s
      WHERE s.show_on_public = TRUE
      ORDER BY s.name
      LIMIT 50
    `;

    const sections = await db.query(query);
    return Response.json(sections || []);
  } catch (error) {
    console.error('Get sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

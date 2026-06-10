import { db } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT id, name
      FROM sections
      WHERE show_on_public = TRUE
      ORDER BY name
      LIMIT 100
    `;

    const sections = await db.query(query);
    return Response.json(sections || []);
  } catch (error) {
    console.error('Get sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

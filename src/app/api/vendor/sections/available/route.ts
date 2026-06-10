import { db } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT DISTINCT s.id, s.name
      FROM sections s
      INNER JOIN section_components sc ON s.id = sc.section_id
      WHERE s.show_on_public = TRUE
      ORDER BY s.name
    `;

    const sections = await db.query(query);
    return Response.json(sections || []);
  } catch (error) {
    console.error('Get available sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

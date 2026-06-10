import { db } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT id, name, icon, description, category
      FROM component_templates
      ORDER BY category, name
    `;

    const templates = await db.query(query);
    return Response.json(templates || []);
  } catch (error) {
    console.error('Get templates error:', error);
    return Response.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

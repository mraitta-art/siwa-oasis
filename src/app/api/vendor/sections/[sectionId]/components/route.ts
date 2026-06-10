import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    const query = `
      SELECT id, component_type, label, is_required, is_repeatable, max_items, config
      FROM section_components
      WHERE section_id = ?
      ORDER BY display_order
    `;

    const components = await db.query(query, [sectionId]);
    return Response.json(components || []);
  } catch (error) {
    console.error('Get components error:', error);
    return Response.json({ error: 'Failed to load components' }, { status: 500 });
  }
}

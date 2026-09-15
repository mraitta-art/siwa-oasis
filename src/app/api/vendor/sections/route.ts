import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { filterCoreSectionsForBusinessType, resolveSectionId } from '@/lib/section-registry';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.businessId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.query('SELECT type_id FROM businesses WHERE id = ?', [user.businessId]) as any[];
    const businessTypeId = business[0]?.type_id || null;

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

    const sections = await db.query(query) as any[];
    const allowedSet = new Set(filterCoreSectionsForBusinessType(businessTypeId, sections.map(section => section.id)));
    const filtered = (sections || []).filter((section: any) => allowedSet.has(resolveSectionId(String(section.id || ''))));

    return Response.json(filtered || []);
  } catch (error) {
    console.error('Get sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

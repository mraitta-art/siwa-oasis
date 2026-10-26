import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { filterCoreSectionsForBusinessType, resolveSectionId, sectionAppliesToMarket } from '@/lib/section-registry';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.businessId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.query('SELECT type_id, market_id FROM businesses WHERE id = ?', [user.businessId]) as any[];
    const businessTypeId = business[0]?.type_id || null;

    // Get vendor's sections
    const query = `
      SELECT 
        s.id,
        s.name,
        s.icon,
        s.options
      FROM sections s
      WHERE s.show_on_public = TRUE
      ORDER BY s.name
      LIMIT 50
    `;

    const sections = await db.query(query) as any[];
    const allowedSet = new Set(filterCoreSectionsForBusinessType(businessTypeId, sections.map(section => section.id))
      // A section a market switched on for itself only is not offered to a vendor
      // standing in another market.
      .filter((id: string) => sectionAppliesToMarket(sections.find(section => section.id === id), business[0]?.market_id)));
    const filtered = (sections || []).filter((section: any) => allowedSet.has(resolveSectionId(String(section.id || ''))));

    return Response.json(filtered || []);
  } catch (error) {
    console.error('Get sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

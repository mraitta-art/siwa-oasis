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

    const query = `
      SELECT 
        s.id as section_id,
        s.name as section_name,
        s.has_miniblog,
        s.has_gallery,
        s.gallery_enabled,
        s.miniblog_enabled,
        s.curation_policy,
        s.vendor_permissions,
        s.content_instructions,
        COUNT(DISTINCT CASE WHEN sb.status = 'published' THEN sb.id END) as published_blogs,
        COUNT(DISTINCT CASE WHEN sb.status = 'draft' THEN sb.id END) as draft_blogs,
        COUNT(DISTINCT CASE WHEN vg.approval_status = 'approved' THEN vg.id END) as approved_images,
        COUNT(DISTINCT CASE WHEN vg.approval_status = 'pending' THEN vg.id END) as pending_approval_images
      FROM sections s
      LEFT JOIN section_blogs sb ON s.id = sb.section_id
      LEFT JOIN vendor_gallery vg ON s.id = vg.section_id
      WHERE s.show_on_public = TRUE AND s.show_on_minisite = TRUE
      GROUP BY s.id
      ORDER BY s.name
    `;

    const sections = await db.query(query) as any[];
    const allowedSet = new Set(filterCoreSectionsForBusinessType(businessTypeId, sections.map(section => section.section_id || section.id)));
    const filtered = (sections || []).filter((section: any) => {
      const sectionId = section.section_id || section.id || '';
      return allowedSet.has(resolveSectionId(String(sectionId)));
    });

    return Response.json(filtered);
  } catch (error) {
    console.error('Get sections error:', error);
    return Response.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

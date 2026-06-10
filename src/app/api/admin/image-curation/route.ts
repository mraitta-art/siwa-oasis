import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const section = searchParams.get('section');

    let query = `
      SELECT 
        vg.id,
        vg.vendor_id,
        vg.section_id,
        vg.url,
        vg.caption,
        vg.approval_status,
        vg.is_hero,
        vg.created_at as uploaded_at,
        s.name as section_name,
        b.name as business_name,
        b.vendor_id as vendor_name
      FROM vendor_gallery vg
      JOIN sections s ON vg.section_id = s.id
      LEFT JOIN businesses b ON b.custom_data LIKE CONCAT('%', vg.section_id, '%')
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND vg.approval_status = ?`;
      params.push(status);
    }

    if (section) {
      query += ` AND vg.section_id = ?`;
      params.push(section);
    }

    query += ` ORDER BY vg.created_at DESC LIMIT 100`;

    const images = await db.query(query, params);
    return Response.json(images || []);
  } catch (error) {
    console.error('Get images error:', error);
    return Response.json({ error: 'Failed to load images' }, { status: 500 });
  }
}

import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_approval';

    let query = `
      SELECT 
        sb.id,
        sb.title,
        sb.content,
        sb.excerpt,
        s.name as section_name,
        b.name as business_name,
        sb.status,
        sb.created_at
      FROM section_blogs sb
      JOIN sections s ON sb.section_id = s.id
      LEFT JOIN businesses b ON sb.business_id = b.id
    `;

    const params = [];

    if (status !== 'all') {
      query += ` WHERE sb.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY sb.created_at DESC LIMIT 100`;

    const blogs = await db.query(query, params);
    return Response.json(blogs || []);
  } catch (error) {
    console.error('Get blogs error:', error);
    return Response.json({ error: 'Failed to load blogs' }, { status: 500 });
  }
}

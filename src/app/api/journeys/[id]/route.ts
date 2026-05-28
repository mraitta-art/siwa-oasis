import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/journeys/[id] - Get a single journey with its offers
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const journeys = await query(
      `SELECT * FROM journey_requests WHERE id = ?`,
      [id]
    ) as any[];

    if (!journeys.length) {
      return NextResponse.json({ success: false, error: 'Journey not found' }, { status: 404 });
    }

    const offers = await query(
      `SELECT 
        o.*,
        b.name AS business_name,
        b.slug AS business_slug,
        b.tier AS business_tier,
        JSON_UNQUOTE(JSON_EXTRACT(b.custom_data, '$.business_info.business_logo')) AS business_logo
       FROM journey_offers o
       LEFT JOIN businesses b ON o.business_id = b.id
       WHERE o.journey_id = ?
       ORDER BY o.created_at DESC`,
      [id]
    ) as any[];

    return NextResponse.json({ success: true, journey: journeys[0], offers });
  } catch (error: any) {
    console.error('GET /api/journeys/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/journeys/[id] - Update journey status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!['open', 'in_review', 'closed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await query(`UPDATE journey_requests SET status = ? WHERE id = ?`, [status, id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

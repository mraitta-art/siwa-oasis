import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all requests
    const requests = await query(
      `SELECT * FROM journey_requests ORDER BY created_at DESC`
    ) as any[];

    if (requests.length === 0) {
      return NextResponse.json({ success: true, requests: [] });
    }

    // Get the IDs to fetch offers
    const requestIds = requests.map(r => r.id);

    // Fetch all offers for these requests
    const placeholders = requestIds.map(() => '?').join(',');
    const offers = await query(
      `SELECT jo.*, b.name as business_name, b.type as business_type 
       FROM journey_offers jo
       JOIN businesses b ON jo.business_id = b.id
       WHERE jo.journey_id IN (${placeholders})
       ORDER BY jo.created_at DESC`,
      [...requestIds]
    ) as any[];

    // Map offers to their respective requests
    const mappedRequests = requests.map(req => {
      return {
        ...req,
        offers: offers.filter(o => o.journey_id === req.id)
      };
    });

    return NextResponse.json({ success: true, requests: mappedRequests });

  } catch (error: any) {
    console.error('GET /api/jana/requests error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

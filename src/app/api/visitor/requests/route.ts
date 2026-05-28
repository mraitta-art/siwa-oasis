import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Fetch all requests for this phone number
    const requests = await query(
      `SELECT * FROM journey_requests WHERE customer_phone = ? ORDER BY created_at DESC`,
      [phone]
    ) as any[];

    if (requests.length === 0) {
      return NextResponse.json({ success: true, requests: [] });
    }

    // Get the IDs to fetch offers
    const requestIds = requests.map(r => r.id);

    // Fetch offers for these requests
    const placeholders = requestIds.map(() => '?').join(',');
    const offers = await query(
      `SELECT jo.*, b.name as business_name, b.type as business_type 
       FROM journey_offers jo
       JOIN businesses b ON jo.business_id = b.id
       WHERE jo.journey_id IN (${placeholders}) AND jo.admin_approved_offer = TRUE
       ORDER BY jo.created_at DESC`,
      [...requestIds]
    ) as any[];

    // Map offers to their respective requests
    const mappedRequests = requests.map(req => {
      // Hide contact info from visitor if the match hasn't been finalized
      const safeOffers = offers.filter(o => o.journey_id === req.id).map(o => {
        if (!o.admin_approved_match) {
          return {
            ...o,
            contact_phone: null,
            contact_email: null
          };
        }
        return o;
      });

      return {
        ...req,
        offers: safeOffers
      };
    });

    return NextResponse.json({ success: true, requests: mappedRequests });

  } catch (error: any) {
    console.error('GET /api/visitor/requests error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

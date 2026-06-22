import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status');

    // Mock vendor request queue
    const queue = [
      {
        id: 'queue_001',
        journey_request_id: 'req_001',
        vendor_id: 'vendor_001',
        business_id: 'siwa_paradise_hotel',
        match_score: 95,
        reason_for_match: 'Luxury accommodation with spa - perfect match',
        vendor_status: 'new',
        opened_by_vendor: false,
        priority_position: 1,
        request: {
          title: 'Desert Wellness Escape',
          duration_days: 3,
          budget_usd_max: 500,
          requested_items: [
            'luxury accommodation with spa',
            'authentic restaurant',
            'wellness experience'
          ]
        },
        created_at: new Date('2026-01-16T10:00:00')
      },
      {
        id: 'queue_002',
        journey_request_id: 'req_001',
        vendor_id: 'vendor_001',
        business_id: 'cleopatra_restaurant',
        match_score: 88,
        reason_for_match: 'Traditional restaurant - matches culinary preference',
        vendor_status: 'viewed',
        opened_by_vendor: true,
        priority_position: 2,
        request: {
          title: 'Desert Wellness Escape',
          duration_days: 3,
          budget_usd_max: 500,
          requested_items: [
            'luxury accommodation with spa',
            'authentic restaurant',
            'wellness experience'
          ]
        },
        created_at: new Date('2026-01-16T10:00:00')
      },
      {
        id: 'queue_003',
        journey_request_id: 'req_002',
        vendor_id: 'vendor_002',
        business_id: 'dunes_photography_tours',
        match_score: 92,
        reason_for_match: 'Photography tour provider - excellent match',
        vendor_status: 'interested',
        opened_by_vendor: true,
        priority_position: 1,
        vendor_proposed_price: 450,
        request: {
          title: 'Adventure Photography Journey',
          duration_days: 5,
          budget_usd_max: 1200,
          requested_items: [
            'photography tours',
            'dunes',
            'wildlife viewing'
          ]
        },
        created_at: new Date('2026-01-16T11:30:00')
      }
    ];

    let filtered = queue;

    if (vendorId) {
      filtered = filtered.filter(q => q.vendor_id === vendorId);
    }

    if (status) {
      filtered = filtered.filter(q => q.vendor_status === status);
    }

    // Sort by priority
    filtered = filtered.sort((a, b) => (a.priority_position || 999) - (b.priority_position || 999));

    return NextResponse.json({
      success: true,
      count: filtered.length,
      queue: filtered
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch request queue' },
      { status: 500 }
    );
  }
}

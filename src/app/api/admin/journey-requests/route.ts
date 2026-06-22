import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const policyId = searchParams.get('policy_id');

    // Mock data - in production, query database
    const requests = [
      {
        id: 'req_001',
        visitor_name: 'Ahmed Hassan',
        visitor_email: 'ahmed@example.com',
        title: 'Desert Wellness Escape',
        duration_days: 3,
        budget_usd_max: 500,
        vibe: 'wellness',
        status: 'approved',
        approval_decision: 'auto_approved',
        matched_policy_id: 'policy_001',
        interested_vendor_count: 3,
        created_at: new Date('2026-01-15')
      },
      {
        id: 'req_002',
        visitor_name: 'Sarah Smith',
        visitor_email: 'sarah@example.com',
        title: 'Adventure Photography Journey',
        duration_days: 5,
        budget_usd_max: 1200,
        vibe: 'adventure',
        status: 'under_review',
        approval_decision: 'pending',
        matched_policy_id: 'policy_002',
        interested_vendor_count: 0,
        created_at: new Date('2026-01-16')
      },
      {
        id: 'req_003',
        visitor_name: 'Mohamed Ali',
        visitor_email: 'mohamed@example.com',
        title: 'Culinary Discovery',
        duration_days: 2,
        budget_usd_max: 400,
        vibe: 'culinary',
        status: 'vendor_quoted',
        approval_decision: 'admin_approved',
        matched_policy_id: 'policy_001',
        interested_vendor_count: 2,
        created_at: new Date('2026-01-14')
      }
    ];

    let filtered = requests;

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    if (policyId) {
      filtered = filtered.filter(r => r.matched_policy_id === policyId);
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      requests: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch journey requests' },
      { status: 500 }
    );
  }
}

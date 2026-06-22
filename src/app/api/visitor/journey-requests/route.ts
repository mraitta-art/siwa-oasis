import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.visitor_email || !body.title || !body.description) {
      return NextResponse.json(
        { error: 'visitor_email, title, and description are required' },
        { status: 400 }
      );
    }

    // Determine which policy this request matches
    const requestType = body.request_type || 'custom_request';
    const duration = body.duration_days || 3;
    const itemCount = (body.requested_items || []).length;
    const budget = body.budget_usd_max || 0;

    // Simple policy matching logic
    let matchedPolicyId = 'policy_001'; // Default to Quick Custom Journeys
    let shouldAutoApprove = false;

    if (itemCount <= 5 && duration <= 7 && budget <= 500) {
      matchedPolicyId = 'policy_001';
      shouldAutoApprove = true;
    } else if (duration > 7 || budget > 500) {
      matchedPolicyId = 'policy_002';
      shouldAutoApprove = false;
    }

    // Generate request ID
    const requestId = Math.random().toString(36).substring(7);

    return NextResponse.json({
      success: true,
      id: requestId,
      request: {
        id: requestId,
        ...body,
        matched_policy_id: matchedPolicyId,
        status: shouldAutoApprove ? 'approved' : 'under_review',
        approval_decision: shouldAutoApprove ? 'auto_approved' : 'pending',
        created_at: new Date()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create journey request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const visitorId = searchParams.get('visitor_id');

    // Mock response
    const requests = [
      {
        id: 'req_001',
        visitor_email: 'visitor@example.com',
        visitor_name: 'Ahmed',
        title: 'Siwa Wellness Escape',
        description: 'Looking for spa, desert, and authentic food',
        duration_days: 3,
        budget_usd_max: 450,
        vibe: 'wellness',
        status: 'approved',
        created_at: new Date()
      },
      {
        id: 'req_002',
        visitor_email: 'adventure@example.com',
        visitor_name: 'Sarah',
        title: 'Adventure & Photography',
        description: 'Dunes, lakes, wildlife photography',
        duration_days: 5,
        budget_usd_max: 800,
        vibe: 'adventure',
        status: 'under_review',
        created_at: new Date()
      }
    ];

    let filtered = requests;
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (visitorId) {
      filtered = filtered.filter(r => r.visitor_email === visitorId);
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      requests: filtered
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch journey requests' },
      { status: 500 }
    );
  }
}

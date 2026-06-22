import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.policy_name) {
      return NextResponse.json(
        { error: 'policy_name is required' },
        { status: 400 }
      );
    }

    // Insert policy
    const query = `
      INSERT INTO admin_journey_policies (
        policy_name, description, request_type, approval_required,
        auto_approve_enabled, auto_approve_rule, approval_workflow,
        vendor_notification_enabled, auto_assign_to_vendor, assignment_rule,
        max_items_allowed, max_days_allowed, featured_boost_price,
        vendor_commission_percent, created_by_admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Note: In production, use actual database connection
    // For now, return mock response
    const policyId = Math.random().toString(36).substring(7);

    return NextResponse.json({
      success: true,
      id: policyId,
      policy: {
        id: policyId,
        ...body,
        created_at: new Date()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');
    const requestType = searchParams.get('request_type');

    // Mock response - in production, query database
    const policies = [
      {
        id: 'policy_001',
        policy_name: 'Quick Custom Journeys',
        request_type: 'custom_request',
        approval_required: false,
        auto_approve_enabled: true,
        max_items_allowed: 5,
        max_days_allowed: 7,
        featured_boost_price: null,
        vendor_commission_percent: 15,
        is_active: true,
        is_default: true
      },
      {
        id: 'policy_002',
        policy_name: 'Premium Custom Journeys',
        request_type: 'custom_request',
        approval_required: true,
        auto_approve_enabled: false,
        max_items_allowed: 20,
        max_days_allowed: 14,
        featured_boost_price: 99.99,
        vendor_commission_percent: 20,
        is_active: true,
        is_default: false
      }
    ];

    let filtered = policies;
    if (isActive) {
      filtered = filtered.filter(p => p.is_active === (isActive === 'true'));
    }
    if (requestType) {
      filtered = filtered.filter(p => p.request_type === requestType);
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      policies: filtered
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

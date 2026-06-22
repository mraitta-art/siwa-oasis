import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mock response - in production, fetch from database
    const requestId = params.id;

    const journeyRequest = {
      id: requestId,
      visitor_email: 'visitor@example.com',
      visitor_name: 'Ahmed Hassan',
      visitor_phone: '+20 123 456 7890',
      title: 'Desert Wellness Escape',
      description: 'Looking for relaxation, spa, and authentic dining',
      duration_days: 3,
      budget_usd_min: 300,
      budget_usd_max: 500,
      vibe: 'wellness',
      pace: 'slow',
      requested_items: [
        { business_type: 'accommodation', child_type: 'luxury_hotel', preferences: 'with spa' },
        { business_type: 'restaurant', child_type: 'restaurant', preferences: 'traditional food' },
        { business_type: 'wellness', child_type: 'spa', preferences: 'sand bath' }
      ],
      status: 'under_review',
      approval_decision: 'pending',
      created_at: new Date(),
      approvals: [
        {
          stage: 'initial_review',
          approver_type: 'system',
          decision: 'approved',
          reason: 'Auto-matched to Quick Custom Journeys policy'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      request: journeyRequest
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch journey request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const requestId = params.id;

    // In production, update database
    return NextResponse.json({
      success: true,
      message: 'Journey request updated',
      id: requestId,
      updates: {
        ...body,
        updated_at: new Date()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update journey request' },
      { status: 500 }
    );
  }
}

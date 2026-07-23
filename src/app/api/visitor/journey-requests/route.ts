import { NextRequest, NextResponse } from 'next/server';
import { listJourneyRequests, createJourneyRequest, updateJourneyRequest } from './store';

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

    const savedRequest = createJourneyRequest({
      ...body,
      request_type: body.request_type || 'custom_request',
      matched_policy_id: body.matched_policy_id || 'policy_001',
      status: body.selected_offer ? 'awaiting_penetration' : 'under_review',
      approval_decision: body.selected_offer ? 'selected_offer_attached' : 'pending',
      interested_vendors: 0
    });

    return NextResponse.json({
      success: true,
      id: savedRequest.id,
      request: savedRequest
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

    const requests = listJourneyRequests();
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = body.id;

    if (!requestId) {
      return NextResponse.json({ error: 'Request id is required' }, { status: 400 });
    }

    const updated = updateJourneyRequest(requestId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Journey request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: updated
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update journey request' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { findJourneyRequestById, updateJourneyRequest } from '../store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestData = findJourneyRequestById(id);

    if (!requestData) {
      return NextResponse.json({ error: 'Journey request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: requestData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch journey request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = updateJourneyRequest(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Journey request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update journey request' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await query(
      `UPDATE journey_offers SET visitor_accepted = TRUE WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH /api/visitor/offers/[id]/accept error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

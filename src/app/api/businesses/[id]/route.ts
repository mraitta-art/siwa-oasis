import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const biz = await queryOne(`
      SELECT b.*, t.features as tier_features 
      FROM businesses b
      LEFT JOIN subscription_tiers t ON b.subscription_tier = t.id
      WHERE b.id = ?
    `, [id]);
    if (!biz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    // Parse JSON
    return NextResponse.json({
      ...biz,
      custom_data: typeof biz.custom_data === 'string' ? JSON.parse(biz.custom_data) : biz.custom_data || {},
      draft_data: typeof biz.draft_data === 'string' ? JSON.parse(biz.draft_data) : biz.draft_data || {},
      tier_features: typeof biz.tier_features === 'string' ? JSON.parse(biz.tier_features) : biz.tier_features || {},
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    
    // Check ownership if vendor
    if (user.role === 'vendor' && user.businessId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { custom_data, draft_data, ...fields } = body;
    const sets: string[] = [];
    const dbParams: any[] = [];

    // Fields allowed for update
    const allowed = ['name', 'status', 'published', 'approved_by_vendor', 'location_id', 'subscription_tier'];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        dbParams.push(fields[key]);
      }
    }

    if (custom_data) { sets.push('custom_data = ?'); dbParams.push(JSON.stringify(custom_data)); }
    if (draft_data) { sets.push('draft_data = ?'); dbParams.push(JSON.stringify(draft_data)); }

    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    dbParams.push(id);
    await execute(`UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, dbParams);

    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

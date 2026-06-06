import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/jana/blueprints/pins?business_id=X
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

    const pins = await query(
      'SELECT * FROM business_media WHERE business_id = ? AND is_pinned = 1 ORDER BY pin_order ASC',
      [businessId]
    );
    return NextResponse.json(pins);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/jana/blueprints/pins — toggle pin or reorder
// Body: { action: 'toggle', id, business_id } OR { action: 'reorder', items: [{id, pin_order}] }
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.action === 'toggle') {
      const { id, business_id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const [media] = await query<any>('SELECT is_pinned, business_id FROM business_media WHERE id = ?', [id]);
      if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

      const newPinned = !media.is_pinned;
      if (newPinned) {
        // Get next pin_order
        const [maxRow] = await query<any>(
          'SELECT MAX(pin_order) as max_order FROM business_media WHERE business_id = ? AND is_pinned = 1',
          [media.business_id]
        );
        const nextOrder = (maxRow?.max_order ?? -1) + 1;
        await execute('UPDATE business_media SET is_pinned = 1, pin_order = ? WHERE id = ?', [nextOrder, id]);
      } else {
        await execute('UPDATE business_media SET is_pinned = 0, pin_order = 0 WHERE id = ?', [id]);
      }
      return NextResponse.json({ success: true, is_pinned: newPinned });
    }

    if (body.action === 'reorder') {
      const { items } = body as { items: { id: string; pin_order: number }[] };
      if (!Array.isArray(items)) return NextResponse.json({ error: 'items array required' }, { status: 400 });

      for (const item of items) {
        await execute('UPDATE business_media SET pin_order = ? WHERE id = ?', [item.pin_order, item.id]);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action must be toggle or reorder' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

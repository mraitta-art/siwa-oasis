import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COMMERCIAL_ITEMS } from '@/lib/commercial-catalog';
import { getSavedCustomLinks, saveCustomLinks, getEnrichedCommercialItems } from '@/lib/commercial-links-store';
import { CardCustomLink } from '@/lib/commercial-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const enrichedItems = getEnrichedCommercialItems(DEFAULT_COMMERCIAL_ITEMS);
    const linksMap = getSavedCustomLinks();

    return NextResponse.json({
      success: true,
      items: enrichedItems,
      links_map: linksMap
    });
  } catch (error: any) {
    console.error('API Error in GET /api/admin/commercial-links:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch commercial links' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, custom_links, full_map } = body;

    const currentMap = getSavedCustomLinks();

    if (full_map && typeof full_map === 'object') {
      const ok = saveCustomLinks(full_map);
      if (!ok) throw new Error('Failed to write full map to disk');
      return NextResponse.json({ success: true, message: 'All custom links saved successfully', links_map: full_map });
    }

    if (!item_id) {
      return NextResponse.json(
        { success: false, error: 'item_id is required' },
        { status: 400 }
      );
    }

    currentMap[item_id] = custom_links || [];
    const ok = saveCustomLinks(currentMap);
    if (!ok) throw new Error('Failed to write item links to disk');

    return NextResponse.json({
      success: true,
      message: `Custom links updated for ${item_id}`,
      item_id,
      custom_links: currentMap[item_id]
    });
  } catch (error: any) {
    console.error('API Error in POST /api/admin/commercial-links:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update commercial links' },
      { status: 500 }
    );
  }
}

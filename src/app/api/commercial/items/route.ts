import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COMMERCIAL_ITEMS } from '@/lib/commercial-catalog';
import { CommercialItem, SectorType, CommercialKind } from '@/lib/commercial-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector') as SectorType | 'all' | null;
    const kind = searchParams.get('kind') as CommercialKind | 'all' | null;
    const businessId = searchParams.get('business_id');
    const businessSlug = searchParams.get('business_slug');

    let items: CommercialItem[] = [...DEFAULT_COMMERCIAL_ITEMS];

    // Filter by sector if provided
    if (sector && sector !== 'all') {
      items = items.filter(item => item.sector === sector);
    }

    // Filter by kind (package / discount / offer / direct)
    if (kind && kind !== 'all') {
      items = items.filter(item => item.kind === kind);
    }

    // Filter by specific business if in Minisite / Vendor mode
    if (businessId) {
      items = items.filter(item => item.business_id === businessId);
    } else if (businessSlug) {
      items = items.filter(item => item.business_slug === businessSlug);
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      items,
    });
  } catch (error: any) {
    console.error('Failed to fetch commercial items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

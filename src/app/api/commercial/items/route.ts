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

    const vibe = searchParams.get('vibe');
    const setting = searchParams.get('setting') || searchParams.get('setting_location');
    const view = searchParams.get('view') || searchParams.get('view_type');
    const vehicle = searchParams.get('vehicle') || searchParams.get('vehicle_type');
    const treatment = searchParams.get('treatment') || searchParams.get('treatment_type');
    const q = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();

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

    // Filter by Vibe Tag
    if (vibe && vibe !== 'all') {
      items = items.filter(item => 
        Array.isArray(item.vibe_tags) && 
        item.vibe_tags.some(t => t.toLowerCase() === vibe.toLowerCase())
      );
    }

    // Filter by Setting Location (on_lake, dune, oasis_palms, citadel, spring)
    if (setting && setting !== 'all') {
      items = items.filter(item => 
        item.setting_location?.toLowerCase() === setting.toLowerCase()
      );
    }

    // Filter by View Type
    if (view && view !== 'all') {
      items = items.filter(item => 
        item.view_type?.toLowerCase().includes(view.toLowerCase())
      );
    }

    // Filter by Vehicle Type (4x4, bus, buggy)
    if (vehicle && vehicle !== 'all') {
      items = items.filter(item => 
        item.vehicle_type?.toLowerCase().includes(vehicle.toLowerCase())
      );
    }

    // Filter by text search query across title, desc, and vibes
    if (q) {
      items = items.filter(item => 
        (item.title_en && item.title_en.toLowerCase().includes(q)) ||
        (item.title_ar && item.title_ar.includes(q)) ||
        (item.desc_en && item.desc_en.toLowerCase().includes(q)) ||
        (item.business_name && item.business_name.toLowerCase().includes(q)) ||
        (item.view_type && item.view_type.toLowerCase().includes(q)) ||
        (Array.isArray(item.vibe_tags) && item.vibe_tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      available_vibes: Array.from(new Set(items.flatMap(it => it.vibe_tags || []))),
      available_settings: Array.from(new Set(items.map(it => it.setting_location).filter(Boolean))),
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

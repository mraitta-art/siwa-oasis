import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { AdminDataError } from '@/lib/markets-admin';
import { describeMarketPlaces } from '@/lib/geo-admin';

export const dynamic = 'force-dynamic';

/**
 * The places inside one market, for a listing's PLACE picker.
 *
 * `places` is what a listing may be filed at; switched-off rows come back too,
 * flagged `active: false`, so the form can offer to turn one on instead of
 * sending the admin to the geography screen. `city` and `childTypes` are the
 * parent and the levels a new place may take.
 *
 * Admin-only for the same reason as `/api/jana/locations`: geography is the
 * level above the storefront, and a visitor only ever needs the path of the
 * page they are already on.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const market = String(request.nextUrl.searchParams.get('market') || '').trim().toLowerCase();
    if (!market) {
      return NextResponse.json({ error: 'market is required' }, { status: 400 });
    }
    return NextResponse.json(await describeMarketPlaces(market));
  } catch (error: any) {
    if (error instanceof AdminDataError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error?.message || 'Unexpected error';
    if (/not authenticated|admin access required/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

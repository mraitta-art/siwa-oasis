import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import {
  getBusinessNearbyLandmarks,
  parseCustomData,
  readBusinessCoordinates,
} from '@/lib/google-places';

/**
 * Public, read-only neighbourhood highlights for a minisite's map. Returns the
 * cached Arabic + English landmark set for a business's own coordinates (or
 * refreshes it when stale). It exposes only public place data about the area —
 * never the vendor's profile, contact details, or custom_data — so it is safe to
 * call from the client without an auth gate.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  const empty = { ar: [], en: [] };
  if (!id) return NextResponse.json(empty);

  try {
    const business = await queryOne<any>(
      'SELECT id, custom_data FROM businesses WHERE id = ? LIMIT 1',
      [id]
    );
    if (!business) return NextResponse.json(empty);

    const customData = parseCustomData(business.custom_data);
    const coords = readBusinessCoordinates(business.custom_data);
    const bundle = await getBusinessNearbyLandmarks(business.id, customData, coords);
    return NextResponse.json(bundle);
  } catch {
    return NextResponse.json(empty);
  }
}
